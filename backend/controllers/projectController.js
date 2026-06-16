const Project = require('../models/Project');

// @desc    Get all projects (feed) — optional ?skill= filter
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res, next) => {
  try {
    const { skill, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (skill) filter.skillsNeeded = { $in: [skill] };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('creator', 'name email avatar skills')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      projects,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'creator',
      'name email avatar bio skills'
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Protected
const createProject = async (req, res, next) => {
  try {
    const { title, description, skillsNeeded, maxTeamSize } = req.body;

    const project = await Project.create({
      title,
      description,
      skillsNeeded,
      maxTeamSize,
      creator: req.user._id,
    });

    const populated = await project.populate('creator', 'name email avatar');
    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a project (creator only)
// @route   PUT /api/projects/:id
// @access  Protected
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Ownership check
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized — only the creator can update this project',
      });
    }

    const allowedFields = ['title', 'description', 'skillsNeeded', 'maxTeamSize', 'status'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('creator', 'name email avatar');

    res.status(200).json({ success: true, project: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a project (creator only)
// @route   DELETE /api/projects/:id
// @access  Protected
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized — only the creator can delete this project',
      });
    }

    await project.deleteOne();
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all projects created by a specific user
// @route   GET /api/projects/user/:userId
// @access  Public
const getProjectsByUser = async (req, res, next) => {
  try {
    const projects = await Project.find({ creator: req.params.userId })
      .populate('creator', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByUser,
};
