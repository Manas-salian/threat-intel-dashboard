const Indicator = require('../models/Indicator');
const AuditLog = require('../models/AuditLog');

// Get all indicators with pagination and filters
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, minConfidence, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) filter.type = type;
    if (minConfidence) filter.confidence_score = { $gte: parseFloat(minConfidence) };
    if (search) {
      filter.$or = [
        { value: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const [indicators, total] = await Promise.all([
      Indicator.find(filter).sort({ last_seen: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Indicator.countDocuments(filter)
    ]);

    res.json({
      indicators,
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

// Get single indicator by ID
exports.getById = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('sources', 'name url reliability_score')
      .populate('actors', 'name origin_country')
      .populate('campaigns', 'name severity')
      .lean();

    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    res.json(indicator);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new indicator
exports.create = async (req, res) => {
  try {
    const { type, value, first_seen, last_seen, confidence_score, description } = req.body;

    const existing = await Indicator.findOne({ type, value });
    if (existing) {
      return res.status(400).json({ error: 'Indicator already exists' });
    }

    const indicator = await Indicator.create({
      type,
      value,
      first_seen: first_seen || new Date(),
      last_seen: last_seen || new Date(),
      confidence_score,
      description
    });

    await AuditLog.create({
      action_type: 'CREATE',
      entity_type: 'indicator',
      entity_id: indicator._id,
      details: `New ${type} indicator added: ${value}`
    });

    res.status(201).json({
      _id: indicator._id,
      message: 'Indicator created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update indicator
exports.update = async (req, res) => {
  try {
    const { type, value, first_seen, last_seen, confidence_score, description } = req.body;

    const indicator = await Indicator.findByIdAndUpdate(
      req.params.id,
      { type, value, first_seen, last_seen, confidence_score, description },
      { new: true, runValidators: true }
    );

    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }

    res.json({ message: 'Indicator updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete indicator
exports.delete = async (req, res) => {
  try {
    const indicator = await Indicator.findByIdAndDelete(req.params.id);
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    res.json({ message: 'Indicator deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators by type
exports.getByType = async (req, res) => {
  try {
    const indicators = await Indicator.find({ type: req.params.type })
      .sort({ last_seen: -1 })
      .lean();
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators by confidence score range
exports.getByConfidence = async (req, res) => {
  try {
    const { min, max } = req.params;
    const indicators = await Indicator.find({
      confidence_score: { $gte: parseFloat(min), $lte: parseFloat(max) }
    }).sort({ confidence_score: -1 }).lean();

    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get actors associated with an indicator
exports.getActors = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('actors')
      .lean();

    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
    res.json(indicator.actors || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns associated with an indicator
exports.getCampaigns = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('campaigns')
      .lean();

    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
    res.json(indicator.campaigns || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sources for an indicator
exports.getSources = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('sources')
      .lean();

    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
    res.json(indicator.sources || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk ingest indicators from JSON
exports.bulkIngest = async (req, res) => {
  try {
    const { indicators, sourceId } = req.body;

    if (!Array.isArray(indicators) || indicators.length === 0) {
      return res.status(400).json({ error: 'indicators must be a non-empty array' });
    }

    let inserted = 0;
    let skipped = 0;
    let errors = [];

    for (const item of indicators) {
      try {
        const { type, value, confidence_score, description } = item;

        const existing = await Indicator.findOne({ type: type?.toLowerCase(), value });

        if (existing) {
          // Update last_seen and confidence if better
          const updates = { last_seen: new Date() };
          if (confidence_score && confidence_score > existing.confidence_score) {
            updates.confidence_score = confidence_score;
          }
          if (description) updates.description = description;
          if (sourceId && !existing.sources.includes(sourceId)) {
            updates.$addToSet = { sources: sourceId };
          }
          await Indicator.findByIdAndUpdate(existing._id, updates);
          skipped++;
          continue;
        }

        const newIndicator = await Indicator.create({
          type: type?.toLowerCase(),
          value,
          confidence_score: confidence_score || 0.5,
          description: description || '',
          sources: sourceId ? [sourceId] : []
        });

        inserted++;
      } catch (err) {
        errors.push(`Error processing ${item.value}: ${err.message}`);
        skipped++;
      }
    }

    res.json({
      message: 'Bulk ingest completed',
      inserted,
      skipped,
      total: indicators.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
