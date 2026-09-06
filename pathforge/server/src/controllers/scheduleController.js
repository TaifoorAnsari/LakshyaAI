/**
 * Schedule Controller
 * 
 * Exposes study plan operations:
 * - GET /api/v1/schedule: Fetch active study plan
 * - POST /api/v1/schedule/generate: Generate or regenerate timetable
 * - PATCH /api/v1/schedule/sessions/:sessionId: Update status/notes
 * - GET /api/v1/schedule/today: Today's scheduled study sessions
 * - GET /api/v1/schedule/export.ics: Download iCalendar file
 */

const StudySchedule = require('../models/StudySchedule');
const UserRoadmap = require('../models/UserRoadmap');
const { generateStudySchedule, generateICalendarData } = require('../services/schedulerService');
const { recordActivity } = require('../services/gamificationService');

/**
 * GET /api/v1/schedule
 */
async function getSchedule(req, res, next) {
  try {
    const userId = req.user._id;
    const roadmap = await UserRoadmap.findOne({
      userId,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });
    if (!roadmap) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active roadmap found.',
      });
    }

    let schedule = await StudySchedule.findOne({ userId, roadmapId: roadmap._id });
    if (!schedule) {
      // Auto-generate initial schedule based on user's onboarding preferences if available
      schedule = await generateStudySchedule(userId, {
        weeklyHours: req.user.onboarding?.hoursPerWeek || 10,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        schedule,
        roadmap: {
          _id: roadmap._id,
          title: roadmap.title,
          category: roadmap.category,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/schedule/generate
 */
async function generateSchedule(req, res, next) {
  try {
    const userId = req.user._id;
    const { weeklyHours, preferredDays, dailyStartTime, sessionDurationMinutes } = req.body;

    const schedule = await generateStudySchedule(userId, {
      weeklyHours,
      preferredDays,
      dailyStartTime,
      sessionDurationMinutes,
    });

    return res.status(200).json({
      success: true,
      data: schedule,
      message: 'Study schedule generated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/schedule/today
 */
async function getTodaySessions(req, res, next) {
  try {
    const userId = req.user._id;
    const roadmap = await UserRoadmap.findOne({
      userId,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });
    if (!roadmap) {
      return res.status(200).json({
        success: true,
        data: { sessions: [], activeMilestone: null },
      });
    }

    const schedule = await StudySchedule.findOne({ userId, roadmapId: roadmap._id });
    if (!schedule) {
      return res.status(200).json({
        success: true,
        data: { sessions: [], activeMilestone: null },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = schedule.sessions.filter((s) => {
      const d = new Date(s.scheduledDate);
      return d >= today && d < tomorrow;
    });

    // Also get currently active milestone in the roadmap for easy context
    const activeMilestone = (roadmap.nodes || []).find((m) => m.status === 'in_progress') || null;

    return res.status(200).json({
      success: true,
      data: {
        sessions: todaySessions,
        activeMilestone,
        preferences: schedule.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/schedule/sessions/:sessionId
 */
async function updateSession(req, res, next) {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;
    const { status, notes } = req.body;

    const schedule = await StudySchedule.findOne({ userId, 'sessions._id': sessionId });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    const session = schedule.sessions.id(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    if (status) {
      session.status = status;
      if (status === 'completed') {
        session.completedAt = new Date();
        // Trigger activity streak and habit recording
        await recordActivity(userId, 'DAILY_STUDY');
      }
    }

    if (notes !== undefined) {
      session.notes = notes;
    }

    await schedule.save();

    return res.status(200).json({
      success: true,
      data: session,
      message: 'Study session updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/schedule/export.ics
 */
async function exportICalendar(req, res, next) {
  try {
    const userId = req.user._id;
    const roadmap = await UserRoadmap.findOne({
      userId,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });
    if (!roadmap) {
      return res.status(404).send('No active roadmap found.');
    }

    const schedule = await StudySchedule.findOne({ userId, roadmapId: roadmap._id });
    if (!schedule) {
      return res.status(404).send('No study schedule found.');
    }

    const icsString = generateICalendarData(schedule, roadmap.title);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pathforge-schedule-${roadmap.category || 'study'}.ics"`);
    return res.status(200).send(icsString);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSchedule,
  generateSchedule,
  getTodaySessions,
  updateSession,
  exportICalendar,
};
