
import admin from 'firebase-admin';

/**
 * Middleware to verify Firebase ID token.
 * If the token is valid, it attaches the decoded user object to the request.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const isAuthenticated = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token.' });
  }

  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid or expired token.' });
  }
};

export default isAuthenticated;
