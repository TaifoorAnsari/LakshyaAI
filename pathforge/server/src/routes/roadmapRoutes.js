/**
 * Roadmap Generation Routes
 * 
 * Endpoints:
 * - POST /api/v1/roadmaps/generate
 * - GET  /api/v1/roadmaps/generate/status/:jobId
 */

const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { generateRoadmap, getGenerationStatus } = require('../controllers/roadmapController');

const router = express.Router();

/**
 * POST /api/v1/roadmaps/generate
 * Generates a roadmap via cluster match (<5ms) or dispatches to Gemini background queue.
 */
router.post('/generate', optionalAuth, generateRoadmap);

/**
 * GET /api/v1/roadmaps/generate/status/:jobId
 * Polls status of a background generation job.
 */
router.get('/generate/status/:jobId', optionalAuth, getGenerationStatus);

module.exports = router;
