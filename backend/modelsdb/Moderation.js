const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType: String,  
  reason: String,
  targetType: String,  
  targetId: { type: mongoose.Schema.Types.ObjectId }, 
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Moderation', moderationSchema);
