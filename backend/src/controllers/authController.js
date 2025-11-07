import admin from 'firebase-admin';
import { db } from '../config/firebaseConfig.js';

export const handleSignup = async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    await db.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
    });

    res.status(201).json({ uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleLogin = async (req, res) => {
    const { idToken } = req.body;
    try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        res.cookie('session', sessionCookie, options);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

export const handleLogout = (req, res) => {
    res.clearCookie('session');
    res.status(200).json({ status: 'success' });
};
