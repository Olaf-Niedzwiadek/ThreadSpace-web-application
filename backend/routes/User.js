// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../modelsdb/User');
const Post = require('../modelsdb/Post'); 
const auth = require('../middleware/auth');

// Route to create a new user 
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) { 
      return res.status(400).json({ error: 'Username already exists. Please choose another.' });
    }
    res.status(400).json({ error: 'Failed to create user' });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Route to get spaces a specific user is a member of 
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

router.get('/:userId/posts', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ msg: 'Not authorized to view these posts' });
        }

        const posts = await Post.find({ authorId: req.params.userId })
            .sort({ createdAt: -1 }); 

        res.json(posts);
    } catch (err) {
        console.error("Error fetching user posts:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
