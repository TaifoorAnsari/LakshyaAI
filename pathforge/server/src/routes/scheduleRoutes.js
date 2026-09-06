/**
 * Schedule Routes
 * 
 * Mounted under /api/v1/schedule
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getSchedule,
  generateSchedule,
  getTodaySessions,
  updateSession,
  exportICalendar,
} = require('../controllers/scheduleController');

const router = express.Router();

// All schedule endpoints require student authentication
router.use(authenticate);

router.get('/', getSchedule);
router.post('/generate', generateSchedule);
router.get('/today', getTodaySessions);
router.patch('/sessions/:sessionId', updateSession);
router.get('/export.ics', exportICalendar);

module.exports = router;
