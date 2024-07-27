const express = require('express');
const Task = require('../models/Todo');
const router = express.Router();


router.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Server error' }); // Ensure JSON response
    }
});

router.post('/tasks', async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    res.json(task);
});

router.put('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const newTaskText = req.body.text;
    const newTaskDate = req.body.date;
    const newTaskPriority = req.body.priority;
    const newTaskCompleted = req.body.completed;  // Added this line to handle completion status

    console.log(`Updating task with ID: ${taskId} to text: ${newTaskText}, date: ${newTaskDate}, priority: ${newTaskPriority}, completed: ${newTaskCompleted}`);
    try {
        const task = await Task.findById(taskId);
        if (task) {
            task.text = newTaskText;
            task.date = newTaskDate;
            task.priority = newTaskPriority;
            task.completed = newTaskCompleted;  // Added this line to handle completion status
            await task.save();
            res.json(task);
        } else {
            res.status(404).send('Task not found');
        }
    } catch (error) {
        console.error(error);
        res.status(400).send('Invalid ID');
    }
});

router.delete('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    console.log(`Deleting task with ID: ${taskId}`);
    try {
        await Task.findByIdAndDelete(taskId);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(400).send('Invalid ID');
    }
});

module.exports = router;