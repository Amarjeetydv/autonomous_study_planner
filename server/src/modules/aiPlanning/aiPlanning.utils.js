const compactObject = (value) => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [key, currentValue]) => {
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      accumulator[key] = currentValue;
    }

    return accumulator;
  }, {});
};

const normalizeIdList = (items = []) =>
  Array.from(
    new Set(
      items
        .map((item) => (typeof item === 'object' && item !== null ? item._id || item.id || item.subjectId : item))
        .filter(Boolean)
        .map((item) => String(item))
    )
  );

const buildGoalSnapshot = (goal = {}, subjectDocs = [], progressDocs = []) => ({
  goal: compactObject({
    id: goal._id || goal.id,
    title: goal.title,
    goalType: goal.goalType,
    targetDate: goal.targetDate,
    currentLevel: goal.currentLevel,
    dailyStudyHours: goal.dailyStudyHours,
    weeklyStudyDays: goal.weeklyStudyDays,
    preferredStudyTime: goal.preferredStudyTime,
    preferredSessionLengthMinutes: goal.preferredSessionLengthMinutes,
    difficultyPreference: goal.difficultyPreference,
    learningStyle: goal.learningStyle,
    targetScore: goal.targetScore,
    motivation: goal.motivation,
    timezone: goal.timezone,
    language: goal.language,
    status: goal.status,
  }),
  subjects: subjectDocs.map((subject) => compactObject({ id: subject._id || subject.id, name: subject.name, code: subject.code, category: subject.category })),
  progress: progressDocs.map((progress) =>
    compactObject({
      id: progress._id || progress.id,
      completionRate: progress.completionRate,
      streakCount: progress.streakCount,
      studyHours: progress.studyHours,
      tasksCompleted: progress.tasksCompleted,
      tasksMissed: progress.tasksMissed,
      quizScoreAverage: progress.quizScoreAverage,
      snapshotDate: progress.snapshotDate,
    })
  ),
});

const buildPlanMetadata = ({ promptVersions = {}, stageUsage = {}, tokenUsage = {}, model, temperature, retries, streamed = false, safetySettings = {} } = {}) => ({
  provider: 'gemini',
  model,
  temperature,
  retries,
  streamed,
  promptVersions,
  stageUsage,
  tokenUsage,
  safetySettings,
});

module.exports = {
  compactObject,
  normalizeIdList,
  buildGoalSnapshot,
  buildPlanMetadata,
};
