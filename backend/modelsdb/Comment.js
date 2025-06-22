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


CommentSchema.virtual('upvoteCount').get(function() {
    return this.votes ? this.votes.filter(vote => vote.type === 'upvote').length : 0;
});

CommentSchema.virtual('downvoteCount').get(function() {
    return this.votes ? this.votes.filter(vote => vote.type === 'downvote').length : 0;
});

CommentSchema.pre(/^find/, function(next) {
    this.populate('authorId', 'username profilePicture') 
        .populate({
            path: 'votes.userId', 
            select: 'username'
        })
        .populate({ 
            path: 'replies',
            populate: [
                { path: 'authorId', select: 'username profilePicture' },
                { path: 'votes.userId', select: 'username' },
            ]
        });
    next();
});

module.exports = mongoose.model('Comment', CommentSchema);
