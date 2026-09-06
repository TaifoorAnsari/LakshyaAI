/**
 * Scheduler Service
 * 
 * Provides:
 * 1. Intelligent study timetable generation from active roadmap milestones
 *    and student's weekly study budget / preferred days.
 * 2. RFC 5545 iCalendar (.ics) export generator for Google Calendar, Apple Calendar, Outlook.
 */

const UserRoadmap = require('../models/UserRoadmap');
const StudySchedule = require('../models/StudySchedule');

/**
 * Generate (or regenerate) a structured study plan for a user's active roadmap.
 * 
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} preferences - { weeklyHours, preferredDays, dailyStartTime, sessionDurationMinutes }
 * @returns {Promise<object>} The created or updated StudySchedule document
 */
async function generateStudySchedule(userId, preferences = {}) {
  // 1. Fetch active roadmap
  const roadmap = await UserRoadmap.findOne({
    userId,
    status: { $in: ['in_progress', 'completed'] },
  }).sort({ lastAccessedAt: -1, updatedAt: -1 });

  if (!roadmap) {
    const error = new Error('No active roadmap found. Please create or activate a roadmap first.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Normalize preferences with defaults
  const weeklyHours = Math.max(1, Math.min(60, Number(preferences.weeklyHours) || 10));
  const preferredDays = Array.isArray(preferences.preferredDays) && preferences.preferredDays.length > 0
    ? preferences.preferredDays.map(Number).filter((d) => d >= 0 && d <= 6)
    : [1, 2, 3, 4, 5]; // Default Mon - Fri
  const dailyStartTime = preferences.dailyStartTime || '18:00';
  const sessionDurationMinutes = Math.max(15, Math.min(180, Number(preferences.sessionDurationMinutes) || 60));

  // Compute end time string
  const [startHour, startMin] = dailyStartTime.split(':').map(Number);
  const endMinutesTotal = (startHour * 60 + startMin + sessionDurationMinutes) % (24 * 60);
  const endHour = Math.floor(endMinutesTotal / 60);
  const endMin = endMinutesTotal % 60;
  const dailyEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  // 3. Filter uncompleted milestones (or in-progress milestones)
  const remainingMilestones = (roadmap.nodes || [])
    .filter((m) => m.status !== 'completed')
    .sort((a, b) => a.order - b.order);

  if (remainingMilestones.length === 0) {
    // All milestones already completed, schedule is empty or finished
    let existing = await StudySchedule.findOne({ userId, roadmapId: roadmap._id });
    if (!existing) {
      existing = await StudySchedule.create({
        userId,
        roadmapId: roadmap._id,
        preferences: { weeklyHours, preferredDays, dailyStartTime, sessionDurationMinutes },
        sessions: [],
      });
    }
    return existing;
  }

  // 4. Generate day slots starting from today
  const sessions = [];
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Distribute milestone hours into discrete sessions
  let dayOffset = 0;
  let safetyCounter = 0;
  const maxDaysToProject = 365;

  for (const milestone of remainingMilestones) {
    const estimatedHours = milestone.estimatedHours || 5;
    // How many sessions of sessionDurationMinutes needed for this milestone?
    const hoursPerSession = sessionDurationMinutes / 60;
    const sessionsNeeded = Math.max(1, Math.ceil(estimatedHours / hoursPerSession));

    for (let s = 1; s <= sessionsNeeded; s++) {
      // Find the next available preferred day
      while (safetyCounter < maxDaysToProject) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const dayOfWeek = checkDate.getDay();

        if (preferredDays.includes(dayOfWeek)) {
          // Found a study day!
          const scheduledDate = new Date(checkDate);
          
          sessions.push({
            milestoneId: milestone._id,
            milestoneTitle: milestone.title,
            milestoneOrder: milestone.order,
            scheduledDate,
            startTime: dailyStartTime,
            endTime: dailyEndTime,
            durationMinutes: sessionDurationMinutes,
            topicsCovered: [
              `Part ${s} of ${sessionsNeeded}: ${milestone.title}`,
            ],
            status: 'scheduled',
            notes: milestone.description ? milestone.description.slice(0, 200) : '',
          });

          dayOffset++;
          safetyCounter++;
          break;
        }

        dayOffset++;
        safetyCounter++;
      }
    }
  }

  // 5. Save or update StudySchedule in DB
  const updatedSchedule = await StudySchedule.findOneAndUpdate(
    { userId, roadmapId: roadmap._id },
    {
      userId,
      roadmapId: roadmap._id,
      preferences: {
        weeklyHours,
        preferredDays,
        dailyStartTime,
        sessionDurationMinutes,
      },
      sessions,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return updatedSchedule;
}

/**
 * Generate RFC 5545 compliant iCalendar string (.ics) from study sessions.
 * 
 * @param {object} schedule - The StudySchedule document
 * @param {string} roadmapTitle - Name of the roadmap
 * @returns {string} Clean RFC 5545 .ics text
 */
function generateICalendarData(schedule, roadmapTitle = 'PathForge Learning Path') {
  const formatICSDate = (date, timeStr) => {
    const d = new Date(date);
    const [hours, minutes] = (timeStr || '18:00').split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);

    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());

    return `${y}${m}${day}T${h}${min}${s}Z`;
  };

  const now = new Date();
  const dtStamp = formatICSDate(now, '00:00');

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PathForge//Learning Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:PathForge - ${roadmapTitle}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const session of schedule.sessions || []) {
    const dtStart = formatICSDate(session.scheduledDate, session.startTime);
    const dtEnd = formatICSDate(session.scheduledDate, session.endTime);
    const uid = `${session._id || Math.random().toString(36).slice(2)}@pathforge.app`;
    const summary = `[PathForge] Milestone #${session.milestoneOrder}: ${session.milestoneTitle}`;
    const description = `Scheduled study session for ${session.milestoneTitle}.\\nDuration: ${session.durationMinutes} minutes.\\nTopics: ${(session.topicsCovered || []).join(', ')}`;

    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Your PathForge study block starts in 15 minutes!',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

module.exports = {
  generateStudySchedule,
  generateICalendarData,
};
