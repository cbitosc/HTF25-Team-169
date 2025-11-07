import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase only if it hasn't been initialized
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully with service account.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
} else {
  console.log('Using existing Firebase Admin SDK initialization.');
}

export const db = admin.firestore();
export const auth = admin.auth();
export const rtdb = admin.database();
