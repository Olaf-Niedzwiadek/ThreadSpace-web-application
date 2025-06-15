const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
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
        _id: false
    }],
    // --- ADD THIS FIELD ---
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
    // --- END ADDITION ---
});

// Add virtuals for upvoteCount, downvoteCount, and total voteCount
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

// IMPORTANT: Keep the pre-find middleware for populating author and votes
postSchema.pre(/^find/, function(next) {
    this.populate('authorId', 'username profilePicture')
        .populate('spaceId', 'name')
        .populate({
            path: 'comments',
            populate: {
                path: 'authorId',
                select: 'username profilePicture'
            }
        })
        .populate({
            path: 'comments', // Populate replies for each comment
            populate: {
                path: 'replies', // Name of the field in Comment schema for replies
                populate: {
                    path: 'authorId',
                    select: 'username profilePicture'
                }
            }
        });
    next();
});

// Ensure virtuals are included when converting to JSON/Object
postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);