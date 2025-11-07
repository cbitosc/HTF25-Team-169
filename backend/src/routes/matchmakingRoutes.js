// backend/src/routes/matchmakingRoutes.js

import express from 'express';
import isAuthenticated from '../controllers/authMiddleware.js';
import { handleGetRankedCollaborators, handleSearchCollaborators } from '../controllers/matchmakingController.js';

const router = express.Router();

router.get('/collaborators', isAuthenticated, handleGetRankedCollaborators);

router.get('/search', isAuthenticated, handleSearchCollaborators);

export default router;