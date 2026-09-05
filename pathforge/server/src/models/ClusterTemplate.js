/**
 * ClusterTemplate Mongoose Model
 * 
 * Represents a pre-curated or promoted learning roadmap template.
 * Served directly to students upon matching free-text goals to eliminate
 * AI latency and token costs.
 */

const mongoose = require('mongoose');
const { roadmapNodeSchema } = require('./schemas/RoadmapNodeSchema');

const clusterTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    normalizedKeywords: {
      type: [String],
      default: [],
      index: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    nodes: {
      type: [roadmapNodeSchema],
      default: [],
      validate: [
        (val) => Array.isArray(val) && val.length >= 1,
        'Cluster template must have at least one roadmap node',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'pending_review', 'rejected'],
      default: 'active',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      enum: ['seed', 'admin', 'promoted_from_gemini'],
      default: 'seed',
    },
  },
  {
    timestamps: true,
  }
);

// Text index for text search capabilities
clusterTemplateSchema.index({
  title: 'text',
  normalizedKeywords: 'text',
});

const ClusterTemplate = mongoose.model('ClusterTemplate', clusterTemplateSchema);

module.exports = ClusterTemplate;
