/**
 * RoadmapNode Mongoose Subdocument Schema
 * 
 * Reusable schema defining a milestone node in a learning path.
 * Used by both:
 * 1. ClusterTemplate (pre-curated seed templates)
 * 2. UserRoadmap (personalized user-cloned roadmaps with progress state)
 */

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'article', 'doc', 'course'],
      default: 'doc',
    },
  },
  { _id: true }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length >= 2,
        'Quiz question must have at least 2 options',
      ],
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const roadmapNodeSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedHours: {
      type: Number,
      required: true,
      min: 1,
      default: 5,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    quizQuestions: {
      type: [quizQuestionSchema],
      default: [],
    },
  },
  { _id: true }
);

module.exports = {
  roadmapNodeSchema,
  resourceSchema,
  quizQuestionSchema,
};
