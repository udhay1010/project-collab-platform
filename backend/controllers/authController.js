const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Send token response
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills,
      bio: user.bio,
      avatar: user.avatar,
    },
  });
};

// desc    Register new user
// route   POST /api/auth/register
// access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, skills, bio } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({ name, email, password, skills, bio });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// desc    Login user
// route   POST /api/auth/login
// access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's select:false on the model)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// desc    Get currently logged-in user
// route   GET /api/auth/me
// access  Protected
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by protect middleware
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
