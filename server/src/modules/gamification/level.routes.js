const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const {
  getUserLevelController,
  recalculateLevelController,
} = require('./gamification.controller');

const router = express.Router();

const levelAccess = [protect, authorizeRoles('Student', 'Admin')];

router.get('/', ...levelAccess, getUserLevelController);
router.post('/recalculate', ...levelAccess, recalculateLevelController);

module.exports = router;
