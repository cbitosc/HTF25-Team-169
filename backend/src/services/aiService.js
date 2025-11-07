// backend/src/services/aiService.js

// Import all exports into the 'MistralPkg' object
import * as MistralPkg from "@mistralai/mistralai";

// 1. Resolve the constructor. The actual class name is 'Mistral'.
// This checks the imported object for the 'Mistral' property, 
// or falls back to the entire imported object (which sometimes works).
const ClientConstructor = MistralPkg.Mistral || MistralPkg.default || MistralPkg;

// 2. Initialize the Mistral client with the resolved constructor
const mistralClient = new ClientConstructor({ 
    apiKey: process.env.MISTRAL_API_KEY || "YOUR_MISTRAL_API_KEY_HERE"
});

const EMBEDDING_MODEL = 'mistral-embed';

/**
 * Creates a single text block from a user profile for semantic comparison.
 */
export const createEmbeddingText = (userProfile) => {
    const skillsKnown = userProfile.skillsKnown ? userProfile.skillsKnown.join(', ') : '';
    const skillsToLearn = userProfile.skillsToLearn ? userProfile.skillsToLearn.join(', ') : '';
    const bio = userProfile.bio || 'No bio provided.';
    const qualification = userProfile.qualification || 'No qualification listed.';
    
    // Concatenate all rich data into a descriptive document for the LLM
    return `Can Teach: ${skillsKnown}. Wants to Learn: ${skillsToLearn}. Bio: ${bio}. Qualification: ${qualification}.`;
};

/**
 * Calls the Mistral API to generate a vector embedding for a batch of texts.
 * @param {string[]} inputTexts - An array of text strings to embed.
 * @returns {Promise<number[][]>} - A promise that resolves to an array of embedding vectors.
 */
export async function getEmbeddings(inputTexts) {
    if (!process.env.MISTRAL_API_KEY) {
        console.error("MISTRAL_API_KEY is not set. Cannot run semantic matching.");
        // Fallback for continuity if API key is missing
        return inputTexts.map(() => Array(1024).fill(Math.random() * 0.1)); 
    }
    
    try {
        const response = await mistralClient.embeddings.create({
            model: EMBEDDING_MODEL,
            inputs: inputTexts,
        });

        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error("Error generating Mistral embeddings:", error.message);
        // Fallback: Return empty or mock data on API error
        return inputTexts.map(() => Array(1024).fill(0)); 
    }
}

/**
 * Calculates the Cosine Similarity between two vectors.
 * @returns {number} The similarity score (0.0 to 1.0).
 */
export function calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}