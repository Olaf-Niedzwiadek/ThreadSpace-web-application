const express = require('express');
const router = express.Router();
const Space = require('../modelsdb/Space');

router.post('/', async (req, res) => {
  try {
    const space = new Space(req.body);
    await space.save();
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
