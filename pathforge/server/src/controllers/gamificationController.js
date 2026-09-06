/**
 * Gamification Controller
 * 
 * Provides endpoints for:
 * - Student gamification stats (XP, level progress, streak, freeze shields)
 * - Achievement badge catalog with live earned/locked status
 * - Global student leaderboard with rank calculations
 * - Streak freeze management
 */

const User = require('../models/User');
const Badge = require('../models/Badge');
const { calculateLevel } = require('../services/gamificationService');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/v1/gamification/stats
 * Returns live gamification stats for the authenticated student
 */
const getStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name xp level currentStreak longestStreak lastActivityDate badges timezone'
    );

    if (!user) {
      return next(new AppError('User not found', 404, 'ERR_NOT_FOUND'));
    }

    const levelProgression = calculateLevel(user.xp || 0);

    res.status(200).json({
      success: true,
      data: {
        xp: user.xp || 0,
        level: user.level || 1,
        levelProgression,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastActivityDate: user.lastActivityDate,
        totalBadgesEarned: user.badges?.length || 0,
        timezone: user.timezone || 'UTC',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/gamification/badges
 * Returns the entire badge catalog with earned status for this student
 */
const getBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('badges');
    const allBadges = await Badge.find({}).sort({ xpReward: 1 });

    const earnedMap = new Map();
    if (user?.badges) {
      for (const b of user.badges) {
        earnedMap.set(b.badgeId.toString(), b.earnedAt);
      }
    }

    const badgesWithStatus = allBadges.map((badge) => {
      const earnedAt = earnedMap.get(badge._id.toString()) || null;
      return {
        _id: badge._id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        criteriaDescription: badge.criteriaDescription,
        isEarned: !!earnedAt,
        earnedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalBadges: badgesWithStatus.length,
        earnedCount: earnedMap.size,
        badges: badgesWithStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/gamification/leaderboard
 * Returns top learners ranked by total XP with user's current rank
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));

    // Fetch all learners who made an account
    const allUsers = await User.find({})
      .select('name avatarUrl xp level currentStreak badges createdAt')
      .sort({ xp: -1, currentStreak: -1, createdAt: 1 })
      .limit(limit)
      .lean();

    const leaderboard = allUsers.map((u, index) => ({
      rank: index + 1,
      _id: u._id.toString(),
      name: u.name,
      avatarUrl: u.avatarUrl || '',
      xp: u.xp || 0,
      level: u.level || 1,
      currentStreak: u.currentStreak || 0,
      badgeCount: u.badges?.length || 0,
    }));

    // Find authenticated user's current rank
    const currentUser = await User.findById(req.user._id).select('xp');
    const higherXpCount = await User.countDocuments({
      xp: { $gt: currentUser?.xp || 0 },
    });
    const userRank = higherXpCount + 1;

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        currentUserRank: {
          rank: userRank,
          xp: currentUser?.xp || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getBadges,
  getLeaderboard,
};
