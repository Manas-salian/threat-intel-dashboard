const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  url: {
    type: String,
    default: ''
  },
  reliability_score: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Source', sourceSchema);
