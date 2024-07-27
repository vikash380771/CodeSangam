let tasks = [];
let isAddingTask = false; // Flag to prevent multiple submissions

// Fetch tasks from the server and render them
async function fetchTasks() {
    console.log('Fetching tasks from the server...');
    try {
        const response = await fetch('http://localhost:5000/api/todo/tasks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Expected JSON, but got: " + contentType);
        }
        tasks = await response.json();
        console.log('Fetched tasks:', tasks);
        renderTasks(); // Render tasks after fetching
    } catch (error) {
        console.error("Fetch tasks failed:", error);
    }
}

// Add a new task or update an existing one
async function addTask() {
    if (isAddingTask) return; // Prevent multiple submissions

    isAddingTask = true; // Set flag to prevent multiple submissions

    console.log('addTask function called');
    const taskInput = document.getElementById('new-task');
    const taskDate = document.getElementById('task-date');
    const taskPriority = document.getElementById('task-priority');
    const taskText = taskInput.value.trim();
    const editTaskId = document.getElementById('edit-task-id').value;

    console.log('Task details:', { taskText, taskDate: taskDate.value, taskPriority: taskPriority.value, editTaskId });

    try {
        if (editTaskId) {
            // Update existing task
            const updatedTask = { text: taskText, date: taskDate.value, priority: taskPriority.value };
            await updateTask(editTaskId, updatedTask);
        } else if (taskText) {
            // Check for duplicates
            const existingTask = tasks.find(task => task.text === taskText && task.date === taskDate.value && task.priority === taskPriority.value);
            if (existingTask) {
                alert('This task already exists!');
                return;
            }

            // Add new task
            const response = await fetch('http://localhost:5000/api/todo/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: taskText, date: taskDate.value, priority: taskPriority.value, completed: false })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new TypeError("Expected JSON, but got: " + contentType);
            }
            const task = await response.json();
            console.log('Task added:', task);
            tasks.push(task);
            resetInputFields();
            renderTasks();
        }
    } catch (error) {
        console.error("Add task failed:", error);
    } finally {
        isAddingTask = false; // Reset flag after task is added or updated
    }
}

// Update an existing task
async function updateTask(taskId, updatedTask) {
    console.log('Updating task:', { taskId, updatedTask });
    try {
        const response = await fetch(`http://localhost:5000/api/todo/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Expected JSON, but got: " + contentType);
        }
        const task = await response.json();
        console.log('Task updated:', task);
        const taskIndex = tasks.findIndex(task => task._id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = task;
            resetInputFields();
            renderTasks();
        } else {
            console.error("Task not found in local array");
        }
    } catch (error) {
        console.error("Update task failed:", error);
    }
}

// Delete a task
async function deleteTask(taskId) {
    console.log('Deleting task with ID:', taskId);
    try {
        const response = await fetch(`http://localhost:5000/api/todo/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (response.status === 204) {
            tasks = tasks.filter(task => task._id !== taskId);
            console.log('Task deleted:', taskId);
            renderTasks();
        } else {
            console.error('Failed to delete task', response);
        }
    } catch (error) {
        console.error("Delete task failed:", error);
    }
}

// Toggle task completion status
async function toggleTaskCompletion(taskId) {
    console.log('Toggling completion for task ID:', taskId);
    try {
        const taskIndex = tasks.findIndex(task => task._id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            task.completed = !task.completed;
            await updateTask(taskId, task);
            alert(`Task "${task.text}" marked as ${task.completed ? 'completed' : 'incomplete'}.`);
            renderTasks();
        } else {
            console.error("Task not found in local array");
        }
    } catch (error) {
        console.error("Toggle task completion failed:", error);
    }
}

// Render tasks to the DOM
function renderTasks() {
    console.log('Rendering tasks...');
    const taskList = document.getElementById('task-list');
    const filter = document.getElementById('filter').value;
    const sort = document.getElementById('sort').value;
    taskList.innerHTML = '';

    let filteredTasks = tasks.filter(task => {
        if (filter === 'completed') return task.completed;
        if (filter === 'incomplete') return !task.completed;
        return true;
    });

    if (sort === 'date') {
        filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'priority') {
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3 };
        filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTaskCompletion('${task._id}')">
            <span>${task.text} - ${task.date} - ${task.priority}</span>
            <div class="task-item-actions">
                <button onclick="editTask('${task._id}')">Edit</button>
                <button onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Filter tasks based on the selected filter
function filterTasks() {
    console.log('Filtering tasks...');
    renderTasks();
}

// Sort tasks based on the selected sort criteria
function sortTasks() {
    console.log('Sorting tasks...');
    renderTasks();
}

// Set up task for editing
function editTask(taskId) {
    console.log('Editing task with ID:', taskId);
    const task = tasks.find(task => task._id === taskId);
    if (task) {
        document.getElementById('new-task').value = task.text;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('edit-task-id').value = taskId;
        document.getElementById('add-task-btn').style.display = 'none';
        document.getElementById('save-task-btn').style.display = 'inline-block';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    } else {
        console.error("Task not found for editing");
    }
}

// Save edited task
function saveEditedTask() {
    console.log('Saving edited task...');
    const taskId = document.getElementById('edit-task-id').value;
    const taskText = document.getElementById('new-task').value.trim();
    const taskDate = document.getElementById('task-date').value;
    const taskPriority = document.getElementById('task-priority').value;
    const updatedTask = { text: taskText, date: taskDate, priority: taskPriority };
    updateTask(taskId, updatedTask);
}

// Cancel task editing
function cancelEdit() {
    console.log('Cancelling edit...');
    resetInputFields();
}

// Reset input fields
function resetInputFields() {
    document.getElementById('new-task').value = '';
    document.getElementById('task-date').value = '';
    document.getElementById('task-priority').value = 'low';
    document.getElementById('edit-task-id').value = '';
    document.getElementById('add-task-btn').style.display = 'inline-block';
    document.getElementById('save-task-btn').style.display = 'none';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

// Notify user about task due dates
function notifyUser(task) {
    console.log('Notifying user about task due date:', task);
    if (Notification.permission === 'granted') {
        new Notification(`Task Reminder: ${task.text}`, {
            body: `Due Date: ${task.date}`,
            icon: 'logo.png'
        });
    }
}

// Check and notify about due dates
function checkDueDates() {
    console.log('Checking due dates...');
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
        if (task.date === today && !task.completed) {
            notifyUser(task);
        }
    });
}

// Example function to fetch user details
async function fetchUserDetails() {
    console.log('Fetching user details...');
    try {
        const response = await fetch('http://localhost:5000/api/auth/user');
        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }
        const user = await response.json();
        localStorage.setItem('username', user.name);
        displayUsername();
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

// Function to display the username on the page
function displayUsername() {
    const username = localStorage.getItem('username');
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = `Welcome, ${username}`;
    }
}

// Document loaded event
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    fetchTasks(); // Fetch tasks and initialize UI elements
    fetchUserDetails(); // Fetch user details and display username
    setInterval(checkDueDates, 60 * 60 * 1000); // Check every hour

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        alert('Logged out');
        // Redirect to the login page
        window.location.href = '/home'; // Adjust the path based on your app's routing
    });

    // Event listeners for buttons
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('save-task-btn').addEventListener('click', saveEditedTask);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEdit);
});
