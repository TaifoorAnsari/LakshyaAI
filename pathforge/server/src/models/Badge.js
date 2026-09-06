/**
 * Badge Mongoose Model
 * 
 * Represents an achievement badge in the PathForge gamification system.
 * Badges are cataloged globally and awarded dynamically to students
 * upon reaching study milestones, streaks, or special accomplishments.
 */

const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Badge code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Badge name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Badge description is required'],
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: 'Award', // Lucide icon identifier
    },
    category: {
      type: String,
      required: true,
      enum: ['milestone', 'streak', 'quiz', 'mastery', 'special'],
      default: 'milestone',
      index: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    xpReward: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    criteriaDescription: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
