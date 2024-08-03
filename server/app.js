const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Bodyparser middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB Config
const db = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
    .connect(db)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Define routes to serve static HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'home.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'home.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'signup.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'signin.html'));
});

app.get('/todo', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'todo.html'));
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api/todo', require('./routes/todo'));

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
