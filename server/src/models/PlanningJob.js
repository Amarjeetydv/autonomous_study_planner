const mongoose = require('mongoose');

const planningJobSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    currentStage: { type: String, default: '' },
    completedStages: [{ type: String }],
    progressPercentage: { type: Number, default: 0 },
    startTime: { type: Date },
    endTime: { type: Date },
    errorMessage: { type: String, default: '' },
    resultPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIPlans' },
  },
  { timestamps: true, collection: 'PlanningJobs' }
);

module.exports = mongoose.model('PlanningJobs', planningJobSchema);
