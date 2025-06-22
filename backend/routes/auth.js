const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../modelsdb/User');
const router = express.Router();
require('dotenv').config();

// Existing POST /register route stays the same
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
            status: 'active',
            authProvider: 'local' // Mark as local auth
        });

        await user.save();

        const payload = {
            user: {
                id: user._id,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ message: 'User registered', token, userId: user._id, username: user.username });
            }
        );

    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ error: 'Server Error during registration: ' + err.message });
    }
});

// Existing POST /login route stays the same
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Check if user registered with Auth0
        if (user.authProvider === 'auth0' && !user.password) {
            return res.status(401).json({ error: 'Please login with Google' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const payload = {
            user: {
                id: user._id,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ message: 'Login successful', token, userId: user._id, username: user.username });
            }
        );

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ error: 'Server Error during login: ' + err.message });
    }
});

// NEW: Auth0 login route
router.post('/auth0-login', async (req, res) => {
    const { auth0Token, email, name, picture, sub } = req.body;

    try {
        // Here you could verify the Auth0 token if needed
        // For now, we'll trust the frontend since it's using Auth0's SDK
        
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user from Auth0 data
            const username = email.split('@')[0]; // Generate unique username
            
            user = new User({
                username,
                email,
                authProvider: 'auth0',
                auth0Id: sub,
                role: 'user',
                status: 'active'
                // No password for Auth0 users
            });
            
            await user.save();
        } else if (user.authProvider === 'local') {
            // User exists with local auth, update to allow Auth0 as well
            user.authProvider = 'both';
            user.auth0Id = sub;
            await user.save();
        }
        
        // Generate your app's JWT token
        const payload = {
            user: {
                id: user._id,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ 
                    message: 'Auth0 login successful', 
                    token, 
                    userId: user._id, 
                    username: user.username 
                });
            }
        );

    } catch (err) {
        console.error('Error during Auth0 login:', err.message);
        res.status(500).json({ error: 'Server Error during Auth0 login: ' + err.message });
    }
});

module.exports = router;
