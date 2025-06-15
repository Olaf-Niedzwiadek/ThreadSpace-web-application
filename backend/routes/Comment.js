// routes/Comment.js
const express = require('express');
const router = express.Router();
const Comment = require('../modelsdb/Comment');
const Post = require('../modelsdb/Post'); // You'll need Post model to check post existence
const User = require('../modelsdb/User'); // And User model to check author existence (though auth does this)
const auth = require('../middleware/auth');

// --- COMMENT ROUTES ---

// Route 1: Create a new top-level comment on a post
// POST /api/comments/:postId
router.post('/:postId', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const authorId = req.user.id;
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ error: 'Comment body is required.' });
        }

        const post = await Post.findById(postId); // Get the post document
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const newComment = new Comment({
            postId,
            authorId,
            body,
            status: 'published',
            votes: [],
            createdAt: new Date()
        });

        await newComment.save();

        // --- IMPORTANT: ADD THE COMMENT ID TO THE POST'S COMMENTS ARRAY ---
        post.comments.push(newComment._id); // Add the ID to the post's comments array
        await post.save(); // Save the updated post document
        // --- END IMPORTANT ---

        // Fetch the newly created comment with populated authorId for response
        const createdPopulatedComment = await Comment.findById(newComment._id);

        res.status(201).json(createdPopulatedComment);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Failed to create comment. ' + err.message });
    }
});

// Route 2: Create a subcomment (reply) to an existing comment
// POST /api/comments/:postId/:parentCommentId
// routes/Comment.js
// ... (imports and other routes)

// Route 2: Create a subcomment (reply) to an existing comment
// POST /api/comments/:postId/:parentCommentId
router.post('/:postId/:parentCommentId', auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const parentCommentId = req.params.parentCommentId;
        const authorId = req.user.id;
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ error: 'Comment body is required.' });
        }

        const postExists = await Post.findById(postId);
        if (!postExists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Check if parent comment exists and belongs to the same post
        const parentComment = await Comment.findOne({ _id: parentCommentId, postId: postId });
        if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found or does not belong to this post.' });
        }

        // Ensure only one level of nesting (parentCommentId of the parent should be null)
        // If you want multi-level, you'd change this logic to check parentComment.parentCommentId
        if (parentComment.parentCommentId !== null) {
            return res.status(400).json({ error: 'Cannot reply to a subcomment. Only one level of nesting is allowed.' });
        }

        const newComment = new Comment({
            postId,
            authorId,
            body,
            parentCommentId, // This links it as a subcomment
            status: 'published',
            votes: [],
            createdAt: new Date()
        });

        await newComment.save();

        // --- IMPORTANT: ADD THE REPLY ID TO THE PARENT COMMENT'S REPLIES ARRAY ---
        parentComment.replies.push(newComment._id); // Add the ID to the parent comment's replies array
        await parentComment.save(); // Save the updated parent comment document
        // --- END IMPORTANT ---

        const createdPopulatedComment = await Comment.findById(newComment._id);

        res.status(201).json(createdPopulatedComment);
    } catch (err) {
        console.error('Error creating subcomment:', err);
        res.status(500).json({ error: 'Failed to create subcomment. ' + err.message });
    }
});

// Route 3: Get all comments for a specific post (including subcomments)
// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        const postExists = await Post.findById(postId);
        if (!postExists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Find all comments for the post, ordered by creation date
        // The pre-find hook will handle population of authorId and votes.userId
        const comments = await Comment.find({ postId, status: 'published' }).sort({ createdAt: 1 });

        // You might want to structure these comments for easier rendering on the frontend.
        // For example, group subcomments under their parent comments.
        const topLevelComments = comments.filter(comment => comment.parentCommentId === null);
        const subComments = comments.filter(comment => comment.parentCommentId !== null);

        const structuredComments = topLevelComments.map(tLc => {
            return {
                ...tLc.toObject(), // Convert Mongoose document to plain object
                replies: subComments.filter(sC => sC.parentCommentId.toString() === tLc._id.toString())
                                     .sort((a, b) => a.createdAt - b.createdAt) // Sort replies
            };
        });

        res.status(200).json(structuredComments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments. ' + err.message });
    }
});

// Route 4: Delete a comment (and its subcomments)
// DELETE /api/comments/:commentId
router.delete('/:commentId', auth, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        const commentToDelete = await Comment.findById(commentId);

        if (!commentToDelete) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        // Check if the authenticated user is the author of the comment
        if (commentToDelete.authorId._id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this comment.' });
        }

        // If it's a top-level comment, delete it and all its direct subcomments
        if (commentToDelete.parentCommentId === null) {
            await Comment.deleteMany({ parentCommentId: commentToDelete._id }); // Delete all replies
            await Comment.findByIdAndDelete(commentId); // Delete the top-level comment itself
            res.status(200).json({ message: 'Comment and its replies deleted successfully.' });
        } else {
            // If it's a subcomment, just delete itself
            await Comment.findByIdAndDelete(commentId);
            res.status(200).json({ message: 'Subcomment deleted successfully.' });
        }
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment. ' + err.message });
    }
});

// Route 5: Upvote a comment
// PUT /api/comments/:commentId/upvote
router.put('/:commentId/upvote', auth, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        let comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Prevent author from voting on their own comment
        if (comment.authorId._id.toString() === userId.toString()) {
            return res.status(403).json({ error: 'You cannot vote on your own comment.' });
        }

        const userVoteIndex = comment.votes.findIndex(
            (vote) => vote.userId && vote.userId._id.toString() === userId.toString()
        );

        if (userVoteIndex !== -1) {
            const existingVote = comment.votes[userVoteIndex];
            if (existingVote.type === 'upvote') {
                comment.votes.splice(userVoteIndex, 1); // Un-upvote
            } else {
                existingVote.type = 'upvote'; // Change from downvote to upvote
            }
        } else {
            comment.votes.push({ userId: userId, type: 'upvote' }); // Add new upvote
        }

        await comment.save();

        // Fetch the updated comment to ensure virtuals are calculated and everything is populated
        const updatedPopulatedComment = await Comment.findById(comment._id);

        res.json({ message: 'Comment vote updated', comment: updatedPopulatedComment });
    } catch (err) {
        console.error('Error upvoting comment:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// Route 6: Downvote a comment
// PUT /api/comments/:commentId/downvote
router.put('/:commentId/downvote', auth, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        let comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Prevent author from voting on their own comment
        if (comment.authorId._id.toString() === userId.toString()) {
            return res.status(403).json({ error: 'You cannot vote on your own comment.' });
        }

        const userVoteIndex = comment.votes.findIndex(
            (vote) => vote.userId && vote.userId._id.toString() === userId.toString()
        );

        if (userVoteIndex !== -1) {
            const existingVote = comment.votes[userVoteIndex];
            if (existingVote.type === 'downvote') {
                comment.votes.splice(userVoteIndex, 1); // Un-downvote
            } else {
                existingVote.type = 'downvote'; // Change from upvote to downvote
            }
        } else {
            comment.votes.push({ userId: userId, type: 'downvote' }); // Add new downvote
        }

        await comment.save();

        // Fetch the updated comment to ensure virtuals are calculated and everything is populated
        const updatedPopulatedComment = await Comment.findById(comment._id);

        res.json({ message: 'Comment vote updated', comment: updatedPopulatedComment });
    } catch (err) {
        console.error('Error downvoting comment:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

module.exports = router;