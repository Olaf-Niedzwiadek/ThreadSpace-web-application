const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../modelsdb/User');
const router = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(409).json({ error: 'User with specified email already exists' });
  }
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    password: hashed,
    role: 'user',
    status: 'active'
  });

  await user.save();
  res.status(201).json({ message: 'User registered', userId: user._id });
});



// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.status(200).json({ message: 'Login successful', userId: user._id, username: user.username });
});
module.exports = router;
