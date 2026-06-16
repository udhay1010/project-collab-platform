const Application = require('../models/Application');
const Project = require('../models/Project');

// desc    Apply to a project
// route   POST /api/applications
// access  Protected
const applyToProject = async (req, res, next) => {
  try {
    const { projectId, message } = req.body;

    // Check project exists and is open
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (project.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This project is no longer accepting applications' });
    }

    // Prevent creator from applying to their own project
    if (project.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own project',
      });
    }

    // Check for duplicate application (also caught by unique index as fallback)
    const existing = await Application.findOne({
      applicant: req.user._id,
      project: projectId,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this project',
      });
    }

    const application = await Application.create({
      applicant: req.user._id,
      project: projectId,
      message,
    });

    const populated = await application.populate([
      { path: 'applicant', select: 'name email skills avatar' },
      { path: 'project', select: 'title skillsNeeded' },
    ]);

    res.status(201).json({ success: true, application: populated });
  } catch (err) {
    next(err);
  }
};

// desc    Get all applications submitted by the logged-in user
// route   GET /api/applications/mine
// access  Protected
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('project', 'title description skillsNeeded status creator')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

// desc    Withdraw an application (applicant only, only if pending)
// route   DELETE /api/applications/:id
// access  Protected
const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Only the applicant can withdraw
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application',
      });
    }

    // Can only withdraw if still pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw an application that has been ${application.status}`,
      });
    }

    await application.deleteOne();
    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { applyToProject, getMyApplications, withdrawApplication };
