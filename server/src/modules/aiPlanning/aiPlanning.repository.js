const AIPlan = require('../../models/AIPlan');

const createPlan = async (planData) => AIPlan.create(planData);

const findPlanById = async (planId) => AIPlan.findById(planId).lean();

const deletePlanById = async (planId) => AIPlan.findByIdAndDelete(planId).lean();

const listPlans = async ({ query = {}, sort = { generatedAt: -1 }, skip = 0, limit = 10 } = {}) => {
  const [totalItems, items] = await Promise.all([
    AIPlan.countDocuments(query),
    AIPlan.find(query).sort(sort).skip(skip).limit(limit).lean(),
  ]);

  return { totalItems, items };
};

module.exports = {
  createPlan,
  findPlanById,
  deletePlanById,
  listPlans,
};
