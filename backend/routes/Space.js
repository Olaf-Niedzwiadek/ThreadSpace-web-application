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

//route for leaving a space
router.post('/leave', async (req, res) => {
  const { userId, spaceId } = req.body;
  
  try {
    if (!userId || !spaceId) {
      return res.status(400).json({ error: 'User ID and Space ID are required' });
    }
    
    const userUpdate = await User.findByIdAndUpdate(
      userId, 
      { $pull: { spaces: spaceId } },
      { new: true }
    );
    
    const spaceUpdate = await Space.findByIdAndUpdate(
      spaceId, 
      { $pull: { members: userId } },
      { new: true }
    );
    
    if (!userUpdate || !spaceUpdate) {
      return res.status(404).json({ error: 'User or Space not found' });
    }
    
    res.status(200).json({ 
      message: 'Successfully left the space',
      user: userUpdate,
      space: spaceUpdate
    });
    
  } catch (err) {
    console.error('Error leaving space:', err);
    res.status(500).json({ error: 'Failed to leave space' });
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

router.get('/:id', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate('creatorId', 'username') 
      .lean(); 

    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json(space);
  } catch (err) {
    console.error('Failed to fetch space:', err);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate('members', 'username email')
      .lean();
    
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    
    res.json(space.members);
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/:id/remove-member', async (req, res) => {
  const { memberId, creatorId } = req.body;
  const spaceId = req.params.id;
  
  try {
    const space = await Space.findById(spaceId);
    
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    
    if (space.creatorId.toString() !== creatorId) {
      return res.status(403).json({ error: 'Only the space creator can remove members' });
    }
    
    if (memberId === creatorId) {
      return res.status(400).json({ error: 'Cannot remove the creator from the space' });
    }
    
    await Space.findByIdAndUpdate(
      spaceId,
      { $pull: { members: memberId } }
    );
    
    await User.findByIdAndUpdate(
      memberId,
      { $pull: { spaces: spaceId } }
    );
    
    res.status(200).json({ message: 'Member removed successfully' });
    
  } catch (err) {
    console.error('Failed to remove member:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});




