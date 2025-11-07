import express from 'express';
import isAuthenticated from '../controllers/authMiddleware.js';
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
} from '../controllers/taskController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task for the authenticated user
 * @access  Private
 */
router.post('/', isAuthenticated, handleCreateTask);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks belonging to the authenticated user
 * @access  Private
 */
router.get('/', isAuthenticated, handleGetTasks);

/**
 * @route   PATCH /api/v1/tasks/:id
 * @desc    Update a specific task (e.g., mark as complete, change title)
 * @access  Private
 */
router.patch('/:id', isAuthenticated, handleUpdateTask);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a specific task
 * @access  Private
 */
router.delete('/:id', isAuthenticated, handleDeleteTask);

export default router;