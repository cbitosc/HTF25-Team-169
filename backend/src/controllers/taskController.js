import * as TaskService from '../services/taskService.js';

export const handleCreateTask = (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is a required field.' });
    }

    const newTask = TaskService.createTask({ title, description }, req.user.uid);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error in handleCreateTask:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const handleGetTasks = (req, res) => {
  try {
    const userTasks = TaskService.getTasksByUserId(req.user.uid);
    res.status(200).json(userTasks);
  } catch (error) {
    console.error('Error in handleGetTasks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const handleUpdateTask = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isCompleted } = req.body;

    // First, check if the task exists and belongs to the user
    const existingTasks = TaskService.getTasksByUserId(req.user.uid);
    const taskToUpdate = existingTasks.find((task) => task.id === id);

    if (!taskToUpdate) {
      return res.status(404).json({ message: 'Task not found or you do not have permission.' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (isCompleted !== undefined) updates.isCompleted = isCompleted;

    const updatedTask = TaskService.updateTask(id, updates);
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error in handleUpdateTask:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const handleDeleteTask = (req, res) => {
  try {
    const { id } = req.params;

    // Security Check: Ensure the user owns this task before deleting
    const existingTasks = TaskService.getTasksByUserId(req.user.uid);
    const taskToDelete = existingTasks.find((task) => task.id === id);

    if (!taskToDelete) {
      // Even if not found, return 204 to prevent leaking information
      // about which IDs exist.
      return res.status(204).send();
    }

    TaskService.deleteTask(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in handleDeleteTask:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};