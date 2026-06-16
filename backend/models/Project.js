const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    skillsNeeded: {
      type: [String],
      required: [true, 'At least one skill is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Provide at least one skill needed',
      },
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: [2, 'Team size must be at least 2'],
      max: [20, 'Team size cannot exceed 20'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

// Index for skill-based filtering
ProjectSchema.index({ skillsNeeded: 1 });
ProjectSchema.index({ creator: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
