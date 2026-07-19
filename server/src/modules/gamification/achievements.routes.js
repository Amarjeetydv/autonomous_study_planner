const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const {
  listAchievementsController,
  listUserAchievementsController,
} = require('./gamification.controller');

const router = express.Router();

const achAccess = [protect, authorizeRoles('Student', 'Admin')];

router.get('/', ...achAccess, listAchievementsController);
router.get('/unlocked', ...achAccess, listUserAchievementsController);

module.exports = router;
