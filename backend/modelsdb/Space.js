const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
  name: String,
  description: String,
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Space', spaceSchema);
