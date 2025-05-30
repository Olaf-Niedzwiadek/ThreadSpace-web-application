const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType: String,  // e.g. "removePost", "banUser"
  reason: String,
  targetType: String,  // e.g. "post", "comment", "user"
  targetId: { type: mongoose.Schema.Types.ObjectId }, // reference varies by type
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Moderation', moderationSchema);
