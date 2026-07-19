const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    action: { type: String, required: true }, // e.g. 'USER_SUSPEND', 'CURRICULUM_CREATE', 'ROLE_CHANGE'
    entity: { type: String, required: true }, // e.g. 'User', 'Subject', 'Topic'
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true, collection: 'AdminAuditLogs' }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
