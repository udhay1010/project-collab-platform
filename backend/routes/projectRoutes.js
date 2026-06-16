const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByUser,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { projectRules, validate } = require('../middleware/validators');

// GET /api/projects          — feed (public), supports ?skill= and ?page= ?limit=
// POST /api/projects         — create project (protected)
router
  .route('/')
  .get(getProjects)
  .post(protect, projectRules, validate, createProject);

// GET /api/projects/user/:userId  — all projects by a user
router.get('/user/:userId', getProjectsByUser);

// GET /api/projects/:id       — single project (public)
// PUT /api/projects/:id       — update project (creator only)
// DELETE /api/projects/:id    — delete project (creator only)
router
  .route('/:id')
  .get(getProjectById)
  .put(protect, projectRules, validate, updateProject)
  .delete(protect, deleteProject);

module.exports = router;
