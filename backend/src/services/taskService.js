import { v4 as uuidv4 } from 'uuid';

// In-memory array to act as a database.
let tasks = [];

/**
 * Creates a new task and adds it to the in-memory store.
 * @param {object} taskData - The data for the new task (e.g., { title, description }).
 * @param {string} userId - The ID of the user creating the task.
 * @returns {object} The newly created task object.
 */
export const createTask = (taskData, userId) => {
  const { title, description } = taskData;
  const newTask = {
    id: uuidv4(),
    userId,
    title,
    description: description || '',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  console.log(`Task created: ${newTask.id} for user: ${userId}`);
  return newTask;
};

/**
 * Retrieves all tasks for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Array<object>} A list of tasks belonging to the user.
 */
export const getTasksByUserId = (userId) => {
  return tasks.filter((task) => task.userId === userId);
};

/**
 * Updates an existing task.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} updates - The fields to update (e.g., { title, isCompleted }).
 * @returns {object | null} The updated task object, or null if not found.
 */
export const updateTask = (taskId, updates) => {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  console.log(`Task updated: ${taskId}`);
  return tasks[taskIndex];
};

/**
 * Deletes a task.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {boolean} True if deleted, false if not found.
 */
export const deleteTask = (taskId) => {
  const initialLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== taskId);
  const wasDeleted = tasks.length < initialLength;
  if (wasDeleted) console.log(`Task deleted: ${taskId}`);
  return wasDeleted;
};