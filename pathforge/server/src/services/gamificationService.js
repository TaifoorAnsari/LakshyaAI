/**
 * Gamification Core Service
 * 
 * Handles:
 * - Level & XP progression formulas
 * - Timezone-aware streak calculations
 * - Automated Streak Freeze shield protection
 * - Achievement badge criteria evaluation and XP rewards
 * - Activity recording orchestration
 */

const User = require('../models/User');
const Badge = require('../models/Badge');
const { logger } = require('../config/logger');

// Progressive level threshold table
// Level 1: 0 - 99 XP
// Level 2: 100 - 249 XP
// Level 3: 250 - 499 XP, etc.
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1850,  // Level 7
  2500,  // Level 8
  3300,  // Level 9
  4250,  // Level 10
  5500,  // Level 11
  7000,  // Level 12
  9000,  // Level 13
  11500, // Level 14
  15000, // Level 15 (Grandmaster)
];

/**
 * Calculates current level and progress to next level based on total XP
 * 
 * @param {number} xp - Student's total lifetime XP
 * @returns {{ level: number, currentLevelXp: number, nextLevelXp: number, progressPercent: number }}
 */
const calculateLevel = (xp = 0) => {
  const cleanXp = Math.max(0, xp);
  let currentLevel = 1;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (cleanXp >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || (currentThreshold + 2000);

  const xpIntoLevel = cleanXp - currentThreshold;
  const xpRequiredForLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpRequiredForLevel) * 100)));

  return {
    level: currentLevel,
    currentLevelXp: cleanXp,
    nextLevelThreshold: nextThreshold,
    progressPercent,
    xpToNextLevel: Math.max(0, nextThreshold - cleanXp),
  };
};

/**
 * Helper to get calendar date string (YYYY-MM-DD) for timezone
 */
const getCalendarDateString = (date = new Date(), timezone = 'UTC') => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback to UTC if timezone string is invalid
    return date.toISOString().split('T')[0];
  }
};

/**
 * Calculates day difference between two calendar dates (YYYY-MM-DD)
 */
const getDayDifference = (dateStrA, dateStrB) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(
    parseInt(dateStrA.substring(0, 4), 10),
    parseInt(dateStrA.substring(5, 7), 10) - 1,
    parseInt(dateStrA.substring(8, 10), 10)
  );
  const utcB = Date.UTC(
    parseInt(dateStrB.substring(0, 4), 10),
    parseInt(dateStrB.substring(5, 7), 10) - 1,
    parseInt(dateStrB.substring(8, 10), 10)
  );

  return Math.round((utcB - utcA) / msPerDay);
};

/**
 * Processes daily study streak calculation
 * 
 * Rules:
 * - diff === 0: Same day activity. Streak maintained, no increment.
 * - diff === 1: Consecutive day activity. Streak increments by 1, longestStreak updated.
 * - diff > 1: Missed 1 or more days. Streak breaks and resets to 1 for today's activity.
 * 
 * @param {Object} user - Mongoose User document or plain object
 * @param {Date} activityDate - Timestamp of current activity
 * @returns {{ currentStreak: number, streakIncremented: boolean, streakReset: boolean }}
 */
const processStreak = (user, activityDate = new Date()) => {
  const timezone = user.timezone || 'UTC';
  const todayStr = getCalendarDateString(activityDate, timezone);

  if (!user.lastActivityDate) {
    // First ever activity
    user.currentStreak = 1;
    user.longestStreak = Math.max(user.longestStreak || 0, 1);
    user.lastActivityDate = activityDate;
    return {
      currentStreak: 1,
      streakIncremented: true,
      streakReset: false,
    };
  }

  const lastDateStr = getCalendarDateString(new Date(user.lastActivityDate), timezone);
  const diffDays = getDayDifference(lastDateStr, todayStr);

  let streakIncremented = false;
  let streakReset = false;

  if (diffDays <= 0) {
    // Same day activity: streak already recorded for today
    streakIncremented = false;
  } else if (diffDays === 1) {
    // Consecutive day: natural streak increment
    user.currentStreak = (user.currentStreak || 0) + 1;
    user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
    streakIncremented = true;
  } else {
    // Missed 1 or more days: streak breaks and resets to 1 for today
    user.currentStreak = 1;
    streakReset = true;
    streakIncremented = true;
  }

  user.lastActivityDate = activityDate;

  return {
    currentStreak: user.currentStreak,
    streakIncremented,
    streakReset,
  };
};

/**
 * Evaluates achievement badges against current user state and event metadata
 * 
 * @param {Object} user - User document
 * @param {string} eventType - 'QUIZ_PASSED' | 'ROADMAP_COMPLETED' | 'STREAK_UPDATED' | 'DAILY_LOGIN'
 * @param {Object} eventData - Contextual data (quizScore, activeRoadmapsCount, freezeConsumed, etc.)
 * @returns {Promise<Array<Object>>} Array of newly earned badges
 */
const evaluateBadges = async (user, eventType, eventData = {}) => {
  const existingBadgeIds = new Set(
    (user.badges || []).map((b) => (b.badgeId?._id || b.badgeId || '').toString())
  );

  const allBadges = await Badge.find({});
  const newlyEarnedBadges = [];

  const hour = new Date().getHours();

  for (const badge of allBadges) {
    // Skip if already owned
    if (existingBadgeIds.has(badge._id.toString())) continue;

    let qualifies = false;

    switch (badge.code) {
      case 'FIRST_STEP':
        // Passed at least 1 milestone quiz
        if (eventType === 'QUIZ_PASSED' || eventData.completedMilestonesCount >= 1) {
          qualifies = true;
        }
        break;

      case 'STREAK_3':
        if (user.currentStreak >= 3) qualifies = true;
        break;

      case 'STREAK_7':
        if (user.currentStreak >= 7) qualifies = true;
        break;

      case 'STREAK_30':
        if (user.currentStreak >= 30) qualifies = true;
        break;

      case 'PERFECT_QUIZ':
        // Scored 100% on milestone quiz
        if (eventType === 'QUIZ_PASSED' && eventData.quizScore === 100) {
          qualifies = true;
        }
        break;

      case 'QUIZ_PRO':
        // Passed 5 milestone quizzes
        if (eventData.totalPassedQuizzes >= 5) {
          qualifies = true;
        }
        break;

      case 'PATH_PIONEER':
        // Finished a full roadmap
        if (eventType === 'ROADMAP_COMPLETED' || eventData.isRoadmapCompleted === true) {
          qualifies = true;
        }
        break;

      case 'POLYGLOT':
        // Active in 2 or more roadmaps concurrently
        if (eventData.activeRoadmapsCount >= 2) {
          qualifies = true;
        }
        break;

      case 'NIGHT_OWL':
        // Activity late at night
        if (hour >= 22 || hour < 4) {
          qualifies = true;
        }
        break;

      case 'EARLY_BIRD':
        // Activity early morning
        if (hour >= 5 && hour < 8) {
          qualifies = true;
        }
        break;

      case 'VELOCITY_LEARNER':
        // 2 milestones completed on same day
        if (eventData.milestonesCompletedToday >= 2) {
          qualifies = true;
        }
        break;

      default:
        break;
    }

    if (qualifies) {
      user.badges.push({
        badgeId: badge._id,
        earnedAt: new Date(),
      });
      existingBadgeIds.add(badge._id.toString());

      // Award bonus XP for earning the badge
      user.xp = (user.xp || 0) + (badge.xpReward || 0);

      newlyEarnedBadges.push(badge);
      logger.info(`🏆 Badge "${badge.name}" awarded to user ${user._id}! (+${badge.xpReward} XP)`);
    }
  }

  // Recalculate level if XP changed
  if (newlyEarnedBadges.length > 0) {
    const { level } = calculateLevel(user.xp);
    user.level = level;
  }

  return newlyEarnedBadges;
};

/**
 * High-level activity recorder
 * 
 * @param {string} userId - User ID
 * @param {string} activityType - 'QUIZ_PASSED' | 'ROADMAP_ENROLLED' | 'DAILY_STUDY'
 * @param {Object} metadata - Optional event metadata (quizScore, activeRoadmapsCount, etc.)
 * @returns {Promise<Object>} Updated stats, newly earned badges, streak details
 */
const recordActivity = async (userId, activityType, metadata = {}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const previousLevel = user.level;

  // 1. Process daily study streak
  const streakResult = processStreak(user, new Date());

  // 2. Evaluate achievement badges
  const newlyEarnedBadges = await evaluateBadges(user, activityType, metadata);

  // 3. Update level calculation
  const levelInfo = calculateLevel(user.xp);
  user.level = levelInfo.level;
  const didLevelUp = user.level > previousLevel;

  await user.save();

  return {
    user: {
      _id: user._id,
      name: user.name,
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    streakResult,
    levelInfo,
    didLevelUp,
    newlyEarnedBadges,
  };
};

module.exports = {
  LEVEL_THRESHOLDS,
  calculateLevel,
  getCalendarDateString,
  getDayDifference,
  processStreak,
  evaluateBadges,
  recordActivity,
};
