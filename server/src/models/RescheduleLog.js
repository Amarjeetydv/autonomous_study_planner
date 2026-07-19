const mongoose = require('mongoose');

const rescheduleLogSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true },
    triggerEvent: { 
      type: String, 
      enum: ['task_missed', 'task_skipped', 'goal_updated', 'manual', 'exam_date_changed'], 
      required: true 
    },
    changes: [
      {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTasks' },
        title: { type: String, required: true },
        oldDate: { type: Date, required: true },
        newDate: { type: Date, required: true },
        reason: { type: String, default: 'Workload optimization and priority balancing' },
      }
    ],
    status: { 
      type: String, 
      enum: ['preview', 'applied', 'rejected'], 
      default: 'preview',
      index: true 
    },
    appliedAt: { type: Date, default: null },
    algorithmVersion: { type: String, default: 'ASP-V1.0' },
  },
  { timestamps: true, collection: 'RescheduleLogs' }
);

module.exports = mongoose.model('RescheduleLogs', rescheduleLogSchema);
