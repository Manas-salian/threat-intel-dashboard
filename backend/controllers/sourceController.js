const Source = require('../models/Source');
const Indicator = require('../models/Indicator');

// Get all sources
exports.getAll = async (req, res) => {
  try {
    const sources = await Source.find().sort({ name: 1 }).lean();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single source by ID
exports.getById = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new source
exports.create = async (req, res) => {
  try {
    const { name, url, reliability_score } = req.body;
    const source = await Source.create({ name, url, reliability_score });

    res.status(201).json({
      _id: source._id,
      message: 'Source created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update source
exports.update = async (req, res) => {
  try {
    const { name, url, reliability_score } = req.body;

    const source = await Source.findByIdAndUpdate(
      req.params.id,
      { name, url, reliability_score },
      { new: true, runValidators: true }
    );

    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json({ message: 'Source updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete source
exports.delete = async (req, res) => {
  try {
    const source = await Source.findByIdAndDelete(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });

    // Remove source references from indicators
    await Indicator.updateMany(
      { sources: req.params.id },
      { $pull: { sources: req.params.id } }
    );

    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators from a source
exports.getIndicators = async (req, res) => {
  try {
    const indicators = await Indicator.find({ sources: req.params.id })
      .sort({ last_seen: -1 })
      .lean();
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
