const express = require('express');
const router = express.Router();
const Indicator = require('../models/Indicator');

// Check Indicator
router.post('/check', async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const indicator = await Indicator.findOne({ value })
      .populate('actors', 'name')
      .populate('campaigns', 'name')
      .lean();

    if (indicator) {
      res.json({
        found: true,
        data: {
          _id: indicator._id,
          value: indicator.value,
          type: indicator.type,
          confidence_score: indicator.confidence_score,
          first_seen: indicator.first_seen,
          last_seen: indicator.last_seen,
          actors: indicator.actors?.map(a => a.name).join(', ') || null,
          campaigns: indicator.campaigns?.map(c => c.name).join(', ') || null
        }
      });
    } else {
      res.json({ found: false, message: 'Indicator not found in database' });
    }
  } catch (err) {
    console.error('Error checking indicator:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
