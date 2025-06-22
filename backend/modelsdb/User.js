const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    minlength: 6
  },
  authProvider: {
    type: String,
    enum: ['local', 'auth0', 'both'],
    default: 'local'
  },
  auth0Id: {
    type: String,
    sparse: true 
  },
  sessionId: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active'
  },
  spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
