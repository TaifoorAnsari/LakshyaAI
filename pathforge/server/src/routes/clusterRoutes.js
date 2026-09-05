/**
 * Cluster Routes
 * 
 * Endpoints to view available roadmaps and test the cluster matching engine:
 * - GET  /api/v1/clusters
 * - GET  /api/v1/clusters/:id
 * - POST /api/v1/clusters/match
 */

const express = require('express');
const ClusterTemplate = require('../models/ClusterTemplate');
const { findClusterMatch } = require('../services/roadmapEngine/clusterMatcher');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/clusters
 * Returns catalog of all active templates grouped by category
 */
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { status: 'active' };
    if (category) filter.category = category;

    const templates = await ClusterTemplate.find(filter)
      .select('title category normalizedKeywords nodes status usageCount')
      .lean();

    // Map summary metadata
    const catalog = templates.map((t) => ({
      id: t._id,
      title: t.title,
      category: t.category,
      keywords: t.normalizedKeywords,
      nodeCount: t.nodes?.length || 0,
      totalEstimatedHours: t.nodes?.reduce((sum, n) => sum + (n.estimatedHours || 0), 0) || 0,
      usageCount: t.usageCount,
    }));

    res.status(200).json({
      success: true,
      data: {
        total: catalog.length,
        clusters: catalog,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/clusters/:id
 * Returns single roadmap template with full nodes and quiz questions
 */
router.get('/:id', async (req, res, next) => {
  try {
    const template = await ClusterTemplate.findById(req.params.id).lean();
    if (!template) {
      return next(new AppError('Cluster template not found', 404, 'ERR_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        cluster: template,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/clusters/match
 * Evaluates a user query against the cluster matching engine (keyword + embedding)
 */
router.post('/match', async (req, res, next) => {
  try {
    const { goalText } = req.body;
    if (!goalText) {
      return next(new AppError('goalText is required', 400, 'ERR_VALIDATION'));
    }

    const startTime = Date.now();
    const result = await findClusterMatch(goalText);
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data: {
        query: goalText,
        normalizedQuery: result.normalizedQuery,
        matched: !!result.match,
        confidence: result.confidence,
        method: result.method,
        latencyMs,
        matchedTemplate: result.match
          ? {
              id: result.match._id,
              title: result.match.title,
              category: result.match.category,
              nodeCount: result.match.nodes?.length || 0,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
