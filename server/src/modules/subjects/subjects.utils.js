const buildSubjectView = (subject) => {
  const plain = typeof subject.toObject === 'function' ? subject.toObject() : { ...subject };

  return {
    ...plain,
    id: plain._id.toString(),
    difficultyLevel: plain.difficulty,
  };
};

const buildTopicView = (topic) => {
  const plain = typeof topic.toObject === 'function' ? topic.toObject() : { ...topic };

  return {
    ...plain,
    id: plain._id.toString(),
  };
};

const buildSubtopicView = (subtopic) => {
  const plain = typeof subtopic.toObject === 'function' ? subtopic.toObject() : { ...subtopic };

  return {
    ...plain,
    id: plain._id.toString(),
  };
};

const parseBooleanValue = (value) => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
};

module.exports = {
  buildSubjectView,
  buildTopicView,
  buildSubtopicView,
  parseBooleanValue,
};
