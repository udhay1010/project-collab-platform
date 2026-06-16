const { body, validationResult } = require('express-validator');

// Run validation result check — call after validation rules
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validation rules ──────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── User validation rules ──────────────────────────────────────────
const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('bio')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Bio cannot exceed 300 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
];

// ── Project validation rules ───────────────────────────────────────
const projectRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('skillsNeeded')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('maxTeamSize')
    .optional()
    .isInt({ min: 2, max: 20 })
    .withMessage('Team size must be between 2 and 20'),
];

// ── Application validation rules ───────────────────────────────────
const applicationRules = [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
];

// ── Status update validation ───────────────────────────────────────
const statusRules = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be accepted or rejected'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  updateProfileRules,
  projectRules,
  applicationRules,
  statusRules,
};
