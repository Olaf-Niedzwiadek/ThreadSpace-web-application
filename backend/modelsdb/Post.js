const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: String,
  body: String,
  imageUrl: String,
  postType: String,  // e.g. "text", "image"
  status: String,    // e.g. "published", "removed"
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space' },
  upvotes: Number,
  downvotes: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
