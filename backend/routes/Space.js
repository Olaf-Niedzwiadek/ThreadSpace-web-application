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
    
    console.log('Search request:', { query, userId }); // Debug log
   
    if (!query || query.trim().length === 0) {
      console.log('Empty query, returning empty array');
      return res.json([]);
    }
   
    // Build search conditions
    const searchConditions = {
      name: { $regex: query.trim(), $options: 'i' } // Case-insensitive name search only
    };
    
    console.log('Search conditions:', JSON.stringify(searchConditions, null, 2)); // Debug log
   
    const spaces = await Space.find(searchConditions)
      .populate('creatorId', 'username email')
      .populate('members', 'username')
      .limit(20) // Limit results to 20 for performance
      .sort({ createdAt: -1 }) // Show newest first
      .lean(); // Use lean() for better performance
    
    console.log(`Found ${spaces.length} spaces`); // Debug log
   
    res.json(spaces);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search spaces' });
  }
});
