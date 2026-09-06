/**
 * Gamification Express Routes
 * 
 * Exposes:
 * - GET  /api/v1/gamification/stats       (authenticated)
 * - GET  /api/v1/gamification/badges      (authenticated)
 * - GET  /api/v1/gamification/leaderboard (authenticated)
 * - POST /api/v1/gamification/freeze/claim (authenticated)
 */

const express = require('express');
const {
  getStats,
  getBadges,
  getLeaderboard,
} = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All gamification endpoints require active session authentication
router.use(authenticate);

router.get('/stats', getStats);
router.get('/badges', getBadges);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
