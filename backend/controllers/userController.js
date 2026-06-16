const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update own user profile
// @route   PUT /api/users/:id
// @access  Protected
const updateUserProfile = async (req, res, next) => {
  try {
    // Only allow users to update their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile',
      });
    }

    const allowedFields = ['name', 'bio', 'skills', 'avatar'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (for admin / search purposes)
// @route   GET /api/users
// @access  Public
const getAllUsers = async (req, res, next) => {
  try {
    const { skill } = req.query;
    const filter = skill ? { skills: { $in: [skill] } } : {};
    const users = await User.find(filter).select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserProfile, updateUserProfile, getAllUsers };
