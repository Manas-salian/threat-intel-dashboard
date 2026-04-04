const ThreatActor = require('../models/ThreatActor');
const Indicator = require('../models/Indicator');

// Get all threat actors
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [actors, total] = await Promise.all([
      ThreatActor.find(filter).sort({ last_seen: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      ThreatActor.countDocuments(filter)
    ]);

    res.json({
      actors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single actor by ID
exports.getById = async (req, res) => {
  try {
    const actor = await ThreatActor.findById(req.params.id).lean();
    if (!actor) return res.status(404).json({ error: 'Actor not found' });
    res.json(actor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new actor
exports.create = async (req, res) => {
  try {
    const { name, description, first_seen, last_seen, origin_country, tactics } = req.body;

    const actor = await ThreatActor.create({
      name, description, first_seen, last_seen, origin_country,
      tactics: tactics || []
    });

    res.status(201).json({
      _id: actor._id,
      message: 'Threat actor created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update actor
exports.update = async (req, res) => {
  try {
    const { name, description, first_seen, last_seen, origin_country, tactics } = req.body;

    const actor = await ThreatActor.findByIdAndUpdate(
      req.params.id,
      { name, description, first_seen, last_seen, origin_country, tactics },
      { new: true, runValidators: true }
    );

    if (!actor) return res.status(404).json({ error: 'Actor not found' });
    res.json({ message: 'Threat actor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete actor
exports.delete = async (req, res) => {
  try {
    const actor = await ThreatActor.findByIdAndDelete(req.params.id);
    if (!actor) return res.status(404).json({ error: 'Actor not found' });

    // Remove actor references from indicators
    await Indicator.updateMany(
      { actors: req.params.id },
      { $pull: { actors: req.params.id } }
    );

    res.json({ message: 'Threat actor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators associated with an actor
exports.getIndicators = async (req, res) => {
  try {
    const indicators = await Indicator.find({ actors: req.params.id })
      .sort({ last_seen: -1 })
      .lean();
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns associated with an actor
exports.getCampaigns = async (req, res) => {
  try {
    const indicators = await Indicator.find({ actors: req.params.id })
      .populate('campaigns')
      .lean();

    // Extract unique campaigns from all linked indicators
    const campaignMap = new Map();
    for (const ind of indicators) {
      for (const campaign of (ind.campaigns || [])) {
        if (campaign?._id) campaignMap.set(campaign._id.toString(), campaign);
      }
    }
    res.json(Array.from(campaignMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get actor profile with statistics
exports.getProfile = async (req, res) => {
  try {
    const actor = await ThreatActor.findById(req.params.id).lean();
    if (!actor) return res.status(404).json({ error: 'Actor not found' });

    const indicatorCount = await Indicator.countDocuments({ actors: req.params.id });

    const campaignIds = await Indicator.distinct('campaigns', { actors: req.params.id });

    res.json({
      ...actor,
      indicator_count: indicatorCount,
      campaign_count: campaignIds.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
