const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['IPv4', 'IPv6', 'domain', 'URL', 'hash', 'email', 'other'],
    index: true
  },
  confidence_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  first_seen: {
    type: Date,
    default: Date.now
  },
  last_seen: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  sources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source'
  }],
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThreatActor'
  }],
  campaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index — same value+type can't appear twice
indicatorSchema.index({ value: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Indicator', indicatorSchema);
