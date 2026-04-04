const Indicator = require('../models/Indicator');
const ThreatActor = require('../models/ThreatActor');
const Campaign = require('../models/Campaign');

// Find campaigns associated with an indicator value
exports.getCampaignsByIndicator = async (req, res) => {
  try {
    const indicators = await Indicator.find({ value: req.params.value })
      .populate('campaigns')
      .lean();

    const campaignMap = new Map();
    for (const ind of indicators) {
      for (const c of (ind.campaigns || [])) {
        if (c?._id) campaignMap.set(c._id.toString(), c);
      }
    }
    res.json(Array.from(campaignMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find actors using a specific indicator
exports.getActorsByIndicator = async (req, res) => {
  try {
    const indicators = await Indicator.find({ value: req.params.value })
      .populate('actors')
      .lean();

    const actorMap = new Map();
    for (const ind of indicators) {
      for (const a of (ind.actors || [])) {
        if (a?._id) actorMap.set(a._id.toString(), a);
      }
    }
    res.json(Array.from(actorMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find related indicators (share same actors or campaigns)
exports.getRelatedIndicators = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id).lean();
    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });

    const relatedFilter = {
      _id: { $ne: indicator._id },
      $or: []
    };

    if (indicator.actors?.length > 0) {
      relatedFilter.$or.push({ actors: { $in: indicator.actors } });
    }
    if (indicator.campaigns?.length > 0) {
      relatedFilter.$or.push({ campaigns: { $in: indicator.campaigns } });
    }

    if (relatedFilter.$or.length === 0) {
      return res.json([]);
    }

    const related = await Indicator.find(relatedFilter).limit(20).lean();
    res.json(related);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find actor overlap between campaigns
exports.getActorOverlap = async (req, res) => {
  try {
    // Get all campaigns and their actors via indicators
    const campaigns = await Campaign.find().lean();
    const campaignActors = new Map();

    for (const campaign of campaigns) {
      const actors = await Indicator.distinct('actors', { campaigns: campaign._id });
      campaignActors.set(campaign._id.toString(), {
        id: campaign._id,
        name: campaign.name,
        actors: actors.map(a => a.toString())
      });
    }

    // Find overlapping actors between campaigns
    const overlaps = [];
    const entries = Array.from(campaignActors.values());

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const common = entries[i].actors.filter(a => entries[j].actors.includes(a));
        if (common.length > 0) {
          overlaps.push({
            campaign1_id: entries[i].id,
            campaign1_name: entries[i].name,
            campaign2_id: entries[j].id,
            campaign2_name: entries[j].name,
            common_actors: common.length
          });
        }
      }
    }

    res.json(overlaps.sort((a, b) => b.common_actors - a.common_actors).slice(0, 50));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get complete threat context for an indicator
exports.getThreatContext = async (req, res) => {
  try {
    const indicator = await Indicator.findById(req.params.id)
      .populate('actors')
      .populate('campaigns')
      .populate('sources')
      .lean();

    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });

    // Find related indicators
    const relatedFilter = { _id: { $ne: indicator._id }, $or: [] };
    if (indicator.actors?.length > 0) {
      relatedFilter.$or.push({ actors: { $in: indicator.actors.map(a => a._id) } });
    }
    if (indicator.campaigns?.length > 0) {
      relatedFilter.$or.push({ campaigns: { $in: indicator.campaigns.map(c => c._id) } });
    }

    const related = relatedFilter.$or.length > 0
      ? await Indicator.find(relatedFilter).limit(10).lean()
      : [];

    res.json({
      indicator,
      actors: indicator.actors || [],
      campaigns: indicator.campaigns || [],
      sources: indicator.sources || [],
      related_indicators: related
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
