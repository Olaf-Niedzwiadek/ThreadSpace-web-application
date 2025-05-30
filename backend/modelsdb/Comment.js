const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  body: String,
  status: String,
  upvotes: Number,
  downvotes: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
