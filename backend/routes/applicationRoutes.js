const express = require('express');
const router = express.Router();
const {
  applyToProject,
  getMyApplications,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { applicationRules, validate } = require('../middleware/validators');

// All application routes are protected
router.use(protect);

// POST /api/applications       — apply to a project
// GET  /api/applications/mine  — get my applications
router.post('/', applicationRules, validate, applyToProject);
router.get('/mine', getMyApplications);

// DELETE /api/applications/:id — withdraw application
router.delete('/:id', withdrawApplication);

module.exports = router;
