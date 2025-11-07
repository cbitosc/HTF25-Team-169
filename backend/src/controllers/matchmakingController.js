// backend/src/controllers/matchmakingController.js

import { db } from '../config/firebaseConfig.js';
import { findRankedMatches, findRankedMatchesByQuery } from '../services/matchmakingService.js'; 
import isAuthenticated from './authMiddleware.js';

export const handleGetRankedCollaborators = async (req, res) => {
  try {
    const currentUserId = req.user.uid; 
    
    // 1. Fetch all user documents using Firebase Admin SDK syntax
    const usersCollection = await db.collection("users").get();
    const allUsers = usersCollection.docs.map(doc => ({ userId: doc.id, ...doc.data() }));

    const currentUser = allUsers.find(user => user.userId === currentUserId);
    const collaborators = allUsers.filter(user => user.userId !== currentUserId);

    if (!currentUser) {
        // Fallback for newly signed-up users before profile setup
        // We still need a profile to generate a vector, so this is critical.
        return res.status(404).json({ message: 'User profile not fully initialized. Please complete your profile first.' });
    }

    // 2. Generate and Rank Matches using the Mistral-powered service
    const rankedCollaborators = await findRankedMatches(currentUser, collaborators); // <-- AWAIT THE ASYNC FUNCTION

    // 3. Respond with the ranked list
    res.status(200).json(rankedCollaborators);

  } catch (error) {
    console.error('Error in handleGetRankedCollaborators:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const handleSearchCollaborators = async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    // Fetch all users to search through using Firebase Admin SDK syntax
    const usersCollection = await db.collection("users").get();
    const allUsers = usersCollection.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
    const collaborators = allUsers.filter(user => user.userId !== currentUserId);

    // Use the new service function to perform a semantic search
    const searchResults = await findRankedMatchesByQuery(searchQuery, collaborators);

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error in handleSearchCollaborators:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};