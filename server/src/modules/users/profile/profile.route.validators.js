const { body } = require('express-validator');
const { PROFILE_VISIBILITY } = require('./profile.constants');

const visibilityValidator = [
  body('profileVisibility')
    .exists({ checkFalsy: true })
    .withMessage('Profile visibility is required')
    .isIn([PROFILE_VISIBILITY.PUBLIC, PROFILE_VISIBILITY.PRIVATE])
    .withMessage('Invalid profile visibility value'),
];

const profilePictureValidator = [];

module.exports = {
  visibilityValidator,
  profilePictureValidator,
};
