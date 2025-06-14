// routes/Post.js (Simplified)
const express = require('express');
const router = express.Router();
const Post = require('../modelsdb/Post');
const User = require('../modelsdb/User');
const Space = require('../modelsdb/Space');
const auth = require('../middleware/auth');

// Route 1: Create a new post
router.post('/', auth, async (req, res) => {
    try {
        const authorId = req.user.id;
        const { title, body, imageUrl, postType, spaceId } = req.body;

        if (!title || !spaceId) {
            return res.status(400).json({ error: 'Title and spaceId are required to create a post.' });
        }

        const authorExists = await User.findById(authorId);
        if (!authorExists) {
            return res.status(404).json({ error: 'Author not found.' });
        }
        const spaceExists = await Space.findById(spaceId);
        if (!spaceExists) {
            return res.status(404).json({ error: 'Space not found.' });
        }

        const newPost = new Post({
            title,
            body,
            imageUrl,
            postType: postType || (imageUrl ? 'image' : 'text'),
            status: 'published',
            authorId,
            spaceId,
            votes: [],
            createdAt: new Date()
        });

        await newPost.save();

        await User.findByIdAndUpdate(
            authorId,
            { $push: { posts: newPost._id } },
            { new: true, useFindAndModify: false }
        );

        // Because of the pre-find middleware, newPost is already populated after save.
        // But doing a findById after save ensures all virtuals are computed before sending.
        const createdPopulatedPost = await Post.findById(newPost._id); // This will trigger the pre-find populate
        res.status(201).json(createdPopulatedPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post. ' + err.message });
    }
});

// Route 2: Get all posts for a specific space, ordered chronologically
router.get('/space/:spaceId', async (req, res) => {
    try {
        const { spaceId } = req.params;

        const spaceExists = await Space.findById(spaceId);
        if (!spaceExists) {
            return res.status(404).json({ error: 'Space not found.' });
        }

        // The pre-find middleware in Post model will handle all population
        const posts = await Post.find({ spaceId }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Error fetching posts for space:', err);
        res.status(500).json({ error: 'Failed to fetch posts for space. ' + err.message });
    }
});

// Route 3: Get a single post by ID
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        // The pre-find middleware in Post model will handle all population
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.status(200).json(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ error: 'Failed to fetch post. ' + err.message });
    }
});

// Route 5 (Optional: Delete a post)
router.delete('/:postId', auth, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (post.authorId.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this post.' });
        }

        await Post.findByIdAndDelete(postId);

        await User.findByIdAndUpdate(
            post.authorId,
            { $pull: { posts: post._id } },
            { new: true, useFindAndModify: false }
        );

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post. ' + err.message });
    }
});

// NEW: Upvote Post Route
router.put('/:id/upvote', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        let post = await Post.findById(postId); // This will already be populated due to pre-find hook

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userVoteIndex = post.votes.findIndex(
            (vote) => vote.userId && vote.userId._id && vote.userId._id.toString() === userId // Check for populated userId._id
        );

        if (userVoteIndex !== -1) {
            const existingVote = post.votes[userVoteIndex];

            if (existingVote.type === 'upvote') {
                post.votes.splice(userVoteIndex, 1); // Un-upvote
            } else {
                existingVote.type = 'upvote'; // Change from downvote to upvote
            }
        } else {
            post.votes.push({ userId: userId, type: 'upvote' }); // Add new upvote
        }

        await post.save(); // Save changes to the document

        // After save, refetch the post to ensure virtuals are calculated and everything is populated
        // (though pre-save hooks usually handle some of this, an explicit find after save is safest for frontend responses)
        const updatedPopulatedPost = await Post.findById(post._id); // Triggers pre-find populate
        res.json({ message: 'Vote updated', post: updatedPopulatedPost });
    } catch (err) {
        console.error('Error upvoting post:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// NEW: Downvote Post Route
router.put('/:id/downvote', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        let post = await Post.findById(postId); // This will already be populated due to pre-find hook

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userVoteIndex = post.votes.findIndex(
            (vote) => vote.userId && vote.userId._id && vote.userId._id.toString() === userId // Check for populated userId._id
        );

        if (userVoteIndex !== -1) {
            const existingVote = post.votes[userVoteIndex];

            if (existingVote.type === 'downvote') {
                post.votes.splice(userVoteIndex, 1); // Un-downvote
            } else {
                existingVote.type = 'downvote'; // Change from upvote to downvote
            }
        } else {
            post.votes.push({ userId: userId, type: 'downvote' }); // Add new downvote
        }

        await post.save(); // Save changes to the document

        // After save, refetch the post to ensure virtuals are calculated and everything is populated
        const updatedPopulatedPost = await Post.findById(post._id); // Triggers pre-find populate
        res.json({ message: 'Vote updated', post: updatedPopulatedPost });
    } catch (err) {
        console.error('Error downvoting post:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

module.exports = router;