const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent a user from applying to the same project twice
ApplicationSchema.index({ applicant: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
