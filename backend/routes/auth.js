const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const User = require('../modelsdb/User');
const router = express.Router();
require('dotenv').config(); // Ensure dotenv is loaded for JWT_SECRET

// POST /register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
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

        // Generate JWT for new user
        const payload = {
            user: {
                id: user._id, // This ID will be available as req.user.id in protected routes
                username: user.username // Optionally add username to token payload
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                // Send the token, userId, and username back to the client
                res.status(201).json({ message: 'User registered', token, userId: user._id, username: user.username });
            }
        );

    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ error: 'Server Error during registration: ' + err.message });
    }
});


// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        // User is authenticated, now generate JWT
        const payload = {
            user: {
                id: user._id, // This ID will be available as req.user.id in protected routes
                username: user.username // Optionally add username to token payload
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Your secret from .env
            { expiresIn: '1h' }, // Token expiration (e.g., 1 hour)
            (err, token) => {
                if (err) throw err;
                // Send the token along with userId and username
                res.status(200).json({ message: 'Login successful', token, userId: user._id, username: user.username });
            }
        );

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ error: 'Server Error during login: ' + err.message });
    }
});

module.exports = router;
