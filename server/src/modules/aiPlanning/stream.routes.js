const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const { subscribeToJobStreamController } = require('./sse.controller');
const { jobIdParamValidator } = require('./aiPlanning.validators');

const router = express.Router();

const sseAccess = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];

router.get('/job/:jobId/stream', ...sseAccess, jobIdParamValidator, validateRequest, subscribeToJobStreamController);

module.exports = router;
