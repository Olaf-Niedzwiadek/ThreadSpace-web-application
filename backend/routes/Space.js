const express = require('express');
const router = express.Router();
const Space = require('../modelsdb/Space');
const User = require('../modelsdb/User');

router.post('/', async (req, res) => {
  try {
    const space = new Space(req.body);
    await space.save();

    space.members.push(space.creatorId);
    await space.save();
    
    await User.findByIdAndUpdate(
      space.creatorId, 
      { $addToSet: { spaces: space._id } }
    );

    res.status(201).json(space);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create space' });
  }
});

router.get('/', async (req, res) => {
  try {
    const spaces = await Space.find()
      .populate('creatorId', 'username email')
      .populate('moderators', 'username email');

    res.json(spaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

module.exports = router;


router.post('/join', async (req, res) => {
  const { userId, spaceId } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { $addToSet: { spaces: spaceId } });
    await Space.findByIdAndUpdate(spaceId, { $addToSet: { members: userId } });
    res.status(200).json({ message: 'User added to space' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join space' });
  }
});



router.get('/search', async (req, res) => {
  try {
    const { query, userId } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    
    // Find spaces that match the search query (case-insensitive)
    // and exclude spaces the user is already a member of
    const searchConditions = {
      name: { $regex: query, $options: 'i' } // Case-insensitive search
    };
    
    // If userId is provided, exclude spaces where user is already a member
    if (userId) {
      searchConditions.members = { $ne: userId };
    }
    
    const spaces = await Space.find(searchConditions)
      .populate('creatorId', 'username email')
      .populate('members', 'username')
      .limit(20) // Limit results to 20 for performance
      .sort({ createdAt: -1 }); // Show newest first
    
    res.json(spaces);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search spaces' });
  }
});