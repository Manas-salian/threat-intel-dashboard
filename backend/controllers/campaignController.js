const Campaign = require('../models/Campaign');
const Indicator = require('../models/Indicator');

// Get all campaigns
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort({ start_date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Campaign.countDocuments(filter)
    ]);

    res.json({
      campaigns,
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

// Get single campaign by ID
exports.getById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new campaign
exports.create = async (req, res) => {
  try {
    const { name, start_date, end_date, description, severity } = req.body;

    const campaign = await Campaign.create({
      name, start_date, end_date, description, severity
    });

    res.status(201).json({
      _id: campaign._id,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update campaign
exports.update = async (req, res) => {
  try {
    const { name, start_date, end_date, description, severity } = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { name, start_date, end_date, description, severity },
      { new: true, runValidators: true }
    );

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete campaign
exports.delete = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Remove campaign references from indicators
    await Indicator.updateMany(
      { campaigns: req.params.id },
      { $pull: { campaigns: req.params.id } }
    );

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators in a campaign
exports.getIndicators = async (req, res) => {
  try {
    const indicators = await Indicator.find({ campaigns: req.params.id })
      .sort({ last_seen: -1 })
      .lean();
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns by severity
exports.getBySeverity = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ severity: req.params.severity })
      .sort({ start_date: -1 })
      .lean();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active campaigns
exports.getActive = async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      start_date: { $lte: now },
      $or: [
        { end_date: null },
        { end_date: { $gte: now } }
      ]
    }).sort({ start_date: -1 }).lean();

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
