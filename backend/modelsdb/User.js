const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure usernames are unique
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { // Consider making this required and unique too if you use it for login
    type: String,
    trim: true,
    lowercase: true
  },
  password: { // hashed password
    type: String,
    required: true, // Password should be required
    minlength: 6 // Minimum length for security
  },
  sessionId: String, // You might not need this if using JWT stateless auth
  role: {
    type: String, // e.g. "admin", "user"
    enum: ['user', 'admin'], // Enforce specific roles
    default: 'user'
  },
  status: {
    type: String, // e.g. "active", "banned"
    enum: ['active', 'banned'],
    default: 'active'
  },
  spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
  // NEW: Array to store ObjectIds of posts created by this user
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now }
});

// IMPORTANT: You should add a pre-save hook here for password hashing
// Example (assuming you use bcryptjs):
/*
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
*/


module.exports = mongoose.model('User', userSchema);
