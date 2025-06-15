const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Link to parent comment
    status: { type: String, enum: ['published', 'pending', 'deleted'], default: 'published' },
    createdAt: { type: Date, default: Date.now },
    votes: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            type: { type: String, enum: ['upvote', 'downvote'] }
        }
    ],
    // A new field to store replies to THIS comment
    replies: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// Virtual for vote counts (if you have these)
CommentSchema.virtual('upvoteCount').get(function() {
    return this.votes ? this.votes.filter(vote => vote.type === 'upvote').length : 0;
});

CommentSchema.virtual('downvoteCount').get(function() {
    return this.votes ? this.votes.filter(vote => vote.type === 'downvote').length : 0;
});

// Pre-find hook for Comment to populate authorId and votes.userId for comments and their replies
CommentSchema.pre(/^find/, function(next) {
    this.populate('authorId', 'username profilePicture') // Populate author of the comment
        .populate({
            path: 'votes.userId', // Populate userId within the votes array
            select: 'username'
        })
        .populate({ // Populate nested replies recursively
            path: 'replies',
            populate: [
                { path: 'authorId', select: 'username profilePicture' },
                { path: 'votes.userId', select: 'username' },
                // If you want more levels of replies, you might need a recursive population plugin or careful manual population.
                // For now, let's assume one level of replies (comment -> reply)
            ]
        });
    next();
});

module.exports = mongoose.model('Comment', CommentSchema);
