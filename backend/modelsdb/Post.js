// modelsdb/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // It's good practice to mark essential fields as required
        trim: true,
        maxlength: 120
    },
    body: {
        type: String,
        maxlength: 2000
    },
    imageUrl: {
        type: String,
        trim: true
    },
    postType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    status: {
        type: String,
        enum: ['published', 'removed'],
        default: 'published'
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    spaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    votes: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['upvote', 'downvote'], required: true },
        _id: false // Prevents Mongoose from creating an _id for subdocuments in this array
    }]
});

// Add virtuals for upvoteCount, downvoteCount, and total voteCount
// These are not stored in the DB but computed on the fly based on the 'votes' array
postSchema.virtual('upvoteCount').get(function() {
    if (!this.votes) return 0;
    return this.votes.filter(vote => vote.type === 'upvote').length;
});

postSchema.virtual('downvoteCount').get(function() {
    if (!this.votes) return 0;
    return this.votes.filter(vote => vote.type === 'downvote').length;
});

postSchema.virtual('voteCount').get(function() {
    return this.upvoteCount - this.downvoteCount;
});

// IMPORTANT: Add pre-find middleware to populate author username AND votes.userId
// This ensures that when you fetch posts (including the updated post after a vote),
// the author's username and the user IDs within the votes array are included.
postSchema.pre(/^find/, function(next) {
    this.populate('authorId', 'username'); // Populate the author's username
    this.populate({
        path: 'votes.userId', // Populate the userId field within each vote object
        select: 'username'     // Select only the username for the user who voted
    });
    next();
});

// Ensure virtuals are included when converting to JSON/Object
// This makes sure 'upvoteCount', 'downvoteCount', 'voteCount' are returned
postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);