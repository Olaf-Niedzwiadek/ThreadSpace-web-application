// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../modelsdb/User');
const Post = require('../modelsdb/Post'); // <--- NEW: Import Post model
const auth = require('../middleware/auth');

// Route to create a new user (unchanged)
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) { // Duplicate key error (e.g., username already exists)
      return res.status(400).json({ error: 'Username already exists. Please choose another.' });
    }
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// Route to get all users (unchanged, typically not used by frontend directly)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Route to get spaces a specific user is a member of (unchanged)
router.get('/:userId/spaces', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('spaces');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user.spaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user spaces' });
  }
});

// ADJUSTED: Route to get all posts by a specific user
// The base path for this router in index.js is '/User', so this route becomes /User/:userId/posts
router.get('/:userId/posts', auth, async (req, res) => {
    try {
        // Ensure the authenticated user is requesting their own posts
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ msg: 'Not authorized to view these posts' });
        }

        // The Post model's pre-find hook handles population of authorId and spaceId automatically
        const posts = await Post.find({ authorId: req.params.userId })
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json(posts);
    } catch (err) {
        console.error("Error fetching user posts:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
