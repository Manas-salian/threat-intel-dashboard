const mongoose = require('mongoose');

const threatActorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  first_seen: {
    type: Date
  },
  last_seen: {
    type: Date
  },
  origin_country: {
    type: String,
    default: 'Unknown'
  },
  tactics: [{
    type: String
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ThreatActor', threatActorSchema);
