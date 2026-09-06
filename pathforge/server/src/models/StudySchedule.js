/**
 * StudySchedule Mongoose Model
 * 
 * Represents a student's structured study timetable tailored to their active roadmap:
 * - Links to the User and active UserRoadmap
 * - Captures student's availability preferences (preferred days, start time, session duration)
 * - Holds generated study sessions linked to specific roadmap milestones
 */

const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    milestoneTitle: {
      type: String,
      required: true,
      trim: true,
    },
    milestoneOrder: {
      type: Number,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // e.g. "18:00"
      default: '18:00',
    },
    endTime: {
      type: String, // e.g. "19:00"
      default: '19:00',
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 360,
    },
    topicsCovered: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxLength: 1000,
    },
  },
  { _id: true }
);

const studyScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserRoadmap',
      required: true,
      index: true,
    },
    preferences: {
      weeklyHours: {
        type: Number,
        default: 10,
        min: 1,
        max: 60,
      },
      preferredDays: {
        type: [Number], // 0 = Sunday, 1 = Monday, ... 6 = Saturday
        default: [1, 2, 3, 4, 5], // Monday through Friday by default
      },
      dailyStartTime: {
        type: String,
        default: '18:00',
      },
      sessionDurationMinutes: {
        type: Number,
        default: 60,
        min: 15,
        max: 180,
      },
    },
    sessions: {
      type: [studySessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user schedules
studyScheduleSchema.index({ userId: 1, roadmapId: 1 });

const StudySchedule = mongoose.model('StudySchedule', studyScheduleSchema);

module.exports = StudySchedule;
