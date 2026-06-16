const Application = require('../models/Application');
const Project = require('../models/Project');

// @desc    Get all applicants for a project (creator only)
// @route   GET /api/dashboard/:projectId
// @access  Protected
const getApplicants = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only creator can view dashboard
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized — only the project creator can view this dashboard',
      });
    }

    const applications = await Application.find({ project: req.params.projectId })
      .populate('applicant', 'name email skills bio avatar')
      .sort({ createdAt: -1 });

    // Group by status for convenience
    const summary = {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };

    res.status(200).json({
      success: true,
      project: { _id: project._id, title: project.title, status: project.status },
      summary,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept or reject an applicant (creator only)
// @route   PATCH /api/dashboard/:appId/status
// @access  Protected
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.appId).populate(
      'project',
      'creator title'
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify the logged-in user is the project creator
    if (application.project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized — only the project creator can update application status',
      });
    }

    application.status = status;
    await application.save();

    const populated = await application.populate(
      'applicant',
      'name email skills avatar'
    );

    res.status(200).json({ success: true, application: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get summary of all projects created by logged-in user with applicant counts
// @route   GET /api/dashboard
// @access  Protected
const getCreatorDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ creator: req.user._id }).sort({ createdAt: -1 });

    // For each project, get application counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const counts = await Application.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const countMap = { pending: 0, accepted: 0, rejected: 0 };
        counts.forEach(({ _id, count }) => { countMap[_id] = count; });

        return {
          ...project.toObject(),
          applicationCounts: countMap,
          totalApplications: Object.values(countMap).reduce((a, b) => a + b, 0),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projects.length,
      projects: projectsWithCounts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getApplicants, updateApplicationStatus, getCreatorDashboard };
