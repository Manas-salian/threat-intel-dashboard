const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action_type: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'INGEST']
  },
  entity_type: {
    type: String,
    required: true
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// TTL index — auto-delete logs older than 90 days
auditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
