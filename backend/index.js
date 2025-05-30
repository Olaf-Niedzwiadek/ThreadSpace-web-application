const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import User model
const User = require('./modelsdb/User'); // Adjust the path if needed

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/threadspace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Root route
app.get('/', (req, res) => res.send('ThreadSpace API is running'));

// 🧪 POST /users — Create a new user
app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    console.log(`✅ New user created: ${user.username}`);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// 🔍 GET /users — Fetch all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
