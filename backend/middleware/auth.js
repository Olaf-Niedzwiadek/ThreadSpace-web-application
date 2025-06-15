// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token'); // Assuming the token is sent in 'x-auth-token' header

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // Replace 'yourJwtSecret' with your actual secret from .env or config
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information (e.g., userId) to the request object
    // Assuming decoded.user contains { id: userId } as set during login/registration token creation
    req.user = decoded.user;
    next(); // Continue to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};