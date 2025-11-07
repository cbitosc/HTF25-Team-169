// backend/src/services/matchmakingService.js

import { 
    getEmbeddings, 
    calculateCosineSimilarity, 
    createEmbeddingText 
} from './aiService.js';

// Define the weights for the Hybrid Matchmaking Algorithm
const W_SEMANTIC = 0.7; // Higher weight for semantic match
const W_AGE = 0.15;
const W_REPUTATION = 0.15;
const MAX_AGE_DIFF = 15; // Max age difference considered 'acceptable' for scoring

/**
 * The Hybrid Matchmaking Algorithm incorporating Mistral Embeddings.
 * @param {object} currentUser - The profile of the authenticated user (requester).
 * @param {object[]} collaborators - All other user profiles.
 * @returns {Promise<object[]>} The ranked list of collaborators with matchScore.
 */
export const findRankedMatches = async (currentUser, collaborators) => {
    // 1. Prepare texts for embedding
    const textsToEmbed = [
        createEmbeddingText(currentUser), // Current user's text is always the first element
        ...collaborators.map(createEmbeddingText),
    ];

    // 2. Get embeddings for all users in a single API call
    const embeddings = await getEmbeddings(textsToEmbed);
    
    const currentUserVector = embeddings[0];
    const collaboratorVectors = embeddings.slice(1);
    
    const rankedMatches = [];

    // 3. Calculate Hybrid Score for each collaborator
    for (let i = 0; i < collaborators.length; i++) {
        const collab = collaborators[i];
        const collabVector = collaboratorVectors[i];

        // Skip if collaborator data is incomplete for semantic matching, but keep them in the list
        if (!collabVector) {
            rankedMatches.push({ ...collab, matchScore: 0 });
            continue;
        }

        // --- A. Semantic Score (70% Weight) ---
        const semanticScore = calculateCosineSimilarity(currentUserVector, collabVector);
        
        // --- B. Quantitative Scores (30% Total Weight) ---
        
        // Age Score (15% Weight)
        const ageDiff = Math.abs((parseInt(currentUser.age) || 25) - (parseInt(collab.age) || 25));
        // Score is 1.0 if ageDiff is 0, 0.0 if ageDiff >= MAX_AGE_DIFF
        const ageScore = Math.max(0, 1 - (ageDiff / MAX_AGE_DIFF)); 

        // Reputation Score (15% Weight)
        const reputationScore = (collab.rating || 0) / 5; // Normalize rating from 0-5 to 0-1

        // --- C. Final Hybrid Score ---
        const totalScore = 
            (semanticScore * W_SEMANTIC) + 
            (ageScore * W_AGE) + 
            (reputationScore * W_REPUTATION);

        rankedMatches.push({
            ...collab,
            // Convert score to a percentage and round it
            matchScore: parseFloat((totalScore * 100).toFixed(2)), 
        });
    }

    // 4. Rank by score (descending)
    rankedMatches.sort((a, b) => b.matchScore - a.matchScore);
    return rankedMatches;
};

/**
 * Performs a semantic search for collaborators based on a text query.
 * @param {string} query - The search query from the user.
 * @param {object[]} collaborators - All user profiles to search through.
 * @returns {Promise<object[]>} The ranked list of collaborators based on the query.
 */
export const findRankedMatchesByQuery = async (query, collaborators) => {
    // 1. Prepare texts for embedding: the query is first, followed by all collaborators.
    const textsToEmbed = [
        `Search query: ${query}`, // Add context for the embedding model
        ...collaborators.map(createEmbeddingText),
    ];

    // 2. Get embeddings for the query and all users in a single API call.
    const embeddings = await getEmbeddings(textsToEmbed);
    
    const queryVector = embeddings[0];
    const collaboratorVectors = embeddings.slice(1);

    if (!queryVector) {
        console.error("Could not generate embedding for the search query.");
        return [];
    }

    // 3. Calculate similarity score for each collaborator against the query.
    const rankedMatches = collaborators.map((collab, i) => {
        const semanticScore = calculateCosineSimilarity(queryVector, collaboratorVectors[i]);
        return { ...collab, matchScore: parseFloat((semanticScore * 100).toFixed(2)) };
    }).filter(collab => collab.matchScore > 10); // Filter out very low-relevance results

    // 4. Rank by score (descending) and return.
    return rankedMatches.sort((a, b) => b.matchScore - a.matchScore);
};