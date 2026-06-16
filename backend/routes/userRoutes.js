const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { updateProfileRules, validate } = require('../middleware/validators');

// GET /api/users  — list all users (optional ?skill= filter)
router.get('/', getAllUsers);

// GET /api/users/:id  — public profile
router.get('/:id', getUserProfile);

// PUT /api/users/:id  — update own profile (protected)
router.put('/:id', protect, updateProfileRules, validate, updateUserProfile);

module.exports = router;
