// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../modelsdb/User');

router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
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

router.get('/:userId/spaces', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('spaces');
    res.json(user.spaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user spaces' });
  }
});



module.exports = router;
