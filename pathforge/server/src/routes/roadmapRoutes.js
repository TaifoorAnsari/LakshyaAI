/**
 * Roadmap Routes
 * 
 * Endpoints:
 * - POST  /api/v1/roadmaps/generate              (optionalAuth)
 * - GET   /api/v1/roadmaps/generate/status/:jobId (optionalAuth)
 * - POST  /api/v1/roadmaps/enroll                (authenticate)
 * - GET   /api/v1/roadmaps/my                    (authenticate)
 * - GET   /api/v1/roadmaps/:id                   (authenticate)
 * - PATCH /api/v1/roadmaps/:id/nodes/:nodeId     (authenticate)
 * - POST  /api/v1/roadmaps/:id/nodes/:nodeId/quiz (authenticate)
 */

const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  generateRoadmap,
  getGenerationStatus,
  enrollInRoadmap,
  getMyRoadmap,
  getRoadmapById,
  updateNodeProgress,
  submitNodeQuiz,
  selectRoadmap,
  deleteRoadmap,
} = require('../controllers/roadmapController');

const router = express.Router();

/**
 * Generation Endpoints
 */
router.post('/generate', optionalAuth, generateRoadmap);
router.get('/generate/status/:jobId', optionalAuth, getGenerationStatus);

/**
 * Student Personal Roadmap & Milestone Progress Endpoints
 */
router.post('/enroll', authenticate, enrollInRoadmap);
router.get('/my', authenticate, getMyRoadmap);
router.get('/:id', authenticate, getRoadmapById);
router.post('/:id/select', authenticate, selectRoadmap);
router.delete('/:id', authenticate, deleteRoadmap);
router.patch('/:id/nodes/:nodeId', authenticate, updateNodeProgress);
router.post('/:id/nodes/:nodeId/quiz', authenticate, submitNodeQuiz);

module.exports = router;
