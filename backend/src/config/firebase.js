import admin from 'firebase-admin';
import { db, auth } from './firebaseConfig.js';

/**
 * Re-exports initialized Firebase services.
 * Firebase initialization is handled in firebaseConfig.js
 */
export function initializeFirebase() {
  if (admin.apps.length > 0) {
    console.log('Using existing Firebase Admin SDK initialization.');
    return { db, auth };
  } else {
    throw new Error('Firebase Admin SDK not initialized. Ensure firebaseConfig.js is imported first.');
  }
}