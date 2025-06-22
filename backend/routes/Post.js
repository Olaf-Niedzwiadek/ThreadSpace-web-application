// routes/Post.js
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

        const createdPopulatedPost = await Post.findById(newPost._id);

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

// NEW: Route to update a post (edit)
router.put('/:postId', auth, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; 
        const { body, imageUrl } = req.body; 

        let post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        if (post.authorId._id.toString() !== userId) { // Compare ObjectId to string
            return res.status(403).json({ error: 'Not authorized to edit this post.' });
        }

        // Update post fields
        if (body !== undefined) post.body = body;
        if (imageUrl !== undefined) post.imageUrl = imageUrl;
        // Update postType based on imageUrl if it changes
        post.postType = post.imageUrl ? 'image' : 'text';

        await post.save();
        const updatedPopulatedPost = await Post.findById(post._id);

        res.status(200).json(updatedPopulatedPost);
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ error: 'Failed to update post. ' + err.message });
    }
});

// Route 5: Delete a post
router.delete('/:postId', auth, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // First, get the post without populating to check authorization
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Check if user is the post author
        const isAuthor = post.authorId.toString() === userId;
        
        // To check if user is space creator, we need to fetch the space
        let isSpaceCreator = false;
        if (post.spaceId) {
            const space = await Space.findById(post.spaceId);
            if (space && space.creatorId) {
                isSpaceCreator = space.creatorId.toString() === userId;
            }
        }

        if (!isAuthor && !isSpaceCreator) {
            return res.status(403).json({ error: 'Not authorized to delete this post.' });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        // Remove post reference from user's posts array
        await User.findByIdAndUpdate(
            post.authorId,
            { $pull: { posts: postId } },
            { new: true }
        );

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post. ' + err.message });
    }
});

// Upvote Post Route
router.put('/:id/upvote', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        let post = await Post.findById(postId); // Pre-find hook will populate authorId and votes.userId

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Prevent author from voting on their own post
        if (post.authorId._id.toString() === userId.toString()) { // Compare ObjectId to string
            return res.status(403).json({ error: 'You cannot vote on your own post.' });
        }

        // Find existing vote by the user
        const userVoteIndex = post.votes.findIndex(
            (vote) => vote.userId && vote.userId._id.toString() === userId.toString() // Correctly check populated userId._id
        );

        if (userVoteIndex !== -1) {
            const existingVote = post.votes[userVoteIndex];

            if (existingVote.type === 'upvote') {
                post.votes.splice(userVoteIndex, 1); // Un-upvote: remove the vote
            } else {
                existingVote.type = 'upvote'; // Change from downvote to upvote
            }
        } else {
            post.votes.push({ userId: userId, type: 'upvote' }); // Add new upvote
        }

        await post.save(); 

        const updatedPopulatedPost = await Post.findById(post._id);

        res.json({ message: 'Vote updated', post: updatedPopulatedPost });
    } catch (err) {
        console.error('Error upvoting post:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// Downvote Post Route
router.put('/:id/downvote', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        let post = await Post.findById(postId); // Pre-find hook will populate authorId and votes.userId

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Prevent author from voting on their own post
        if (post.authorId._id.toString() === userId.toString()) { // Compare ObjectId to string
            return res.status(403).json({ error: 'You cannot vote on your own post.' });
        }

        // Find existing vote by the user
        const userVoteIndex = post.votes.findIndex(
            (vote) => vote.userId && vote.userId._id.toString() === userId.toString() // Correctly check populated userId._id
        );

        if (userVoteIndex !== -1) {
            const existingVote = post.votes[userVoteIndex];

            if (existingVote.type === 'downvote') {
                post.votes.splice(userVoteIndex, 1); // Un-downvote: remove the vote
            } else {
                existingVote.type = 'downvote'; // Change from upvote to downvote
            }
        } else {
            post.votes.push({ userId: userId, type: 'downvote' }); // Add new downvote
        }

        await post.save(); // Save changes to the document

        const updatedPopulatedPost = await Post.findById(post._id);

        res.json({ message: 'Vote updated', post: updatedPopulatedPost });
    } catch (err) {
        console.error('Error downvoting post:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

router.get('/feed/:userId/today', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure the authenticated user is requesting their own feed
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Not authorized to view this feed.' });
        }

        // 1. Find the user and populate their 'spaces' to get the space IDs they are a member of
        const user = await User.findById(userId).populate('spaces');

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Extract the IDs of the spaces the user is a member of
        const memberSpaceIds = user.spaces.map(space => space._id);

        if (memberSpaceIds.length === 0) {
            return res.status(200).json([]); // Return empty array if user is not in any spaces
        }

        // 2. Define the start and end of "today" for the query
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); 

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); 

        const feedPosts = await Post.find({
            spaceId: { $in: memberSpaceIds },
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        }).sort({ createdAt: 1 }); // 1 for ascending (oldest first), -1 for descending (newest first)

        res.status(200).json(feedPosts);
    } catch (err) {
        console.error('Error fetching feed posts:', err);
        res.status(500).json({ error: 'Failed to fetch feed posts. ' + err.message });
    }
});



module.exports = router;