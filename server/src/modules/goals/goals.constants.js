const GOAL_TYPES = ['GATE', 'CAT', 'UPSC', 'PLACEMENT', 'SEMESTER_EXAM', 'SKILL_LEARNING', 'CUSTOM'];
const CURRENT_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PREFERRED_STUDY_TIMES = ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'];
const DIFFICULTY_PREFERENCES = ['Beginner', 'Intermediate', 'Advanced', 'Mixed'];
const LEARNING_STYLES = ['Visual', 'Reading', 'Hands-on', 'Video', 'Text', 'Mixed'];
const REMINDER_MODES = ['In-App', 'Email', 'Push', 'SMS', 'Mixed'];
const REMINDER_FREQUENCIES = ['Daily', 'Weekdays', 'Custom'];
const GOAL_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

module.exports = {
  GOAL_TYPES,
  CURRENT_LEVELS,
  PREFERRED_STUDY_TIMES,
  DIFFICULTY_PREFERENCES,
  LEARNING_STYLES,
  REMINDER_MODES,
  REMINDER_FREQUENCIES,
  GOAL_STATUS,
};
