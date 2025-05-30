const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // hashed password
  sessionId: String,
  role: String,      // e.g. "admin", "user"
  status: String,    // e.g. "active", "banned"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
