const express = require('express');
const router = express.Router();
const {
  getApplicants,
  updateApplicationStatus,
  getCreatorDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { statusRules, validate } = require('../middleware/validators');

// All dashboard routes are protected
router.use(protect);

// GET /api/dashboard              — summary of all creator's projects with counts
router.get('/', getCreatorDashboard);

// GET /api/dashboard/:projectId   — all applicants for a specific project
router.get('/:projectId', getApplicants);

// PATCH /api/dashboard/:appId/status — accept or reject an applicant
router.patch('/:appId/status', statusRules, validate, updateApplicationStatus);

module.exports = router;
