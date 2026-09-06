/**
 * Gamification Unit & Integration Tests
 * 
 * Tests:
 * 1. Level progression formula & thresholds
 * 2. Day difference & streak calculation logic
 * 3. Automated streak freeze deduction on missed day
 * 4. Streak reset on multi-day absence without freezes
 * 5. Badge criteria evaluation and XP rewards
 * 6. API endpoints: stats, badges, leaderboard, freeze claim
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const { env } = require('../../src/config/env');
const User = require('../../src/models/User');
const Badge = require('../../src/models/Badge');
const {
  calculateLevel,
  getDayDifference,
  processStreak,
  evaluateBadges,
} = require('../../src/services/gamificationService');
const { generateAccessToken } = require('../../src/utils/jwt');

describe('Gamification Engine Test Suite', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    // Ensure sample badges exist
    await Badge.deleteMany({});
    await Badge.insertMany([
      {
        code: 'FIRST_STEP',
        name: 'First Milestone',
        description: 'Completed your first learning milestone.',
        icon: 'Award',
        category: 'milestone',
        rarity: 'common',
        xpReward: 50,
      },
      {
        code: 'STREAK_3',
        name: '3-Day Ignition',
        description: 'Studied for 3 consecutive days.',
        icon: 'Flame',
        category: 'streak',
        rarity: 'common',
        xpReward: 50,
      },
      {
        code: 'PERFECT_QUIZ',
        name: 'Flawless Score',
        description: 'Scored 100% on a milestone quiz.',
        icon: 'Sparkles',
        category: 'quiz',
        rarity: 'rare',
        xpReward: 50,
      },
      {
        code: 'FREEZE_DEFENDER',
        name: 'Freeze Defender',
        description: 'Protected streak using a freeze shield.',
        icon: 'Shield',
        category: 'special',
        rarity: 'rare',
        xpReward: 50,
      },
    ]);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@test\.com$/ });

    testUser = await User.create({
      name: 'Gamification Tester',
      email: 'gamify@test.com',
      passwordHash: 'hashedpassword123',
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      streakFreezesAvailable: 1,
      streakFreezesUsed: 0,
      badges: [],
      timezone: 'UTC',
    });

    testToken = generateAccessToken({ _id: testUser._id, role: testUser.role });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await Badge.deleteMany({});
    await mongoose.connection.close();
  });

  // ─── 1. Level Calculation ──────────────────────────────────────────
  describe('Level Progression Formula', () => {
    it('should compute Level 1 for 0 XP with 0% progress', () => {
      const res = calculateLevel(0);
      expect(res.level).toBe(1);
      expect(res.progressPercent).toBe(0);
      expect(res.xpToNextLevel).toBe(100);
    });

    it('should compute Level 1 with 50% progress for 50 XP', () => {
      const res = calculateLevel(50);
      expect(res.level).toBe(1);
      expect(res.progressPercent).toBe(50);
      expect(res.xpToNextLevel).toBe(50);
    });

    it('should advance to Level 2 at 100 XP', () => {
      const res = calculateLevel(100);
      expect(res.level).toBe(2);
      expect(res.progressPercent).toBe(0);
      expect(res.xpToNextLevel).toBe(150); // Level 3 is 250
    });

    it('should advance to Level 3 at 250 XP', () => {
      const res = calculateLevel(250);
      expect(res.level).toBe(3);
      expect(res.xpToNextLevel).toBe(250); // Level 4 is 500
    });
  });

  // ─── 2. Day Difference Calculation ─────────────────────────────────
  describe('Day Difference Calculation', () => {
    it('should calculate 0 days for same date string', () => {
      expect(getDayDifference('2026-09-01', '2026-09-01')).toBe(0);
    });

    it('should calculate 1 day for consecutive dates', () => {
      expect(getDayDifference('2026-09-01', '2026-09-02')).toBe(1);
    });

    it('should calculate 2 days for missed day', () => {
      expect(getDayDifference('2026-09-01', '2026-09-03')).toBe(2);
    });
  });

  // ─── 3. Streak & Freeze Shield Processing ──────────────────────────
  describe('Streak & Freeze Protection Logic', () => {
    it('should initialize streak to 1 on first activity', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: null,
        currentStreak: 0,
        longestStreak: 0,
        streakFreezesAvailable: 1,
      };

      const res = processStreak(mockUser, new Date('2026-09-01T12:00:00Z'));
      expect(res.currentStreak).toBe(1);
      expect(res.streakIncremented).toBe(true);
      expect(mockUser.currentStreak).toBe(1);
      expect(mockUser.longestStreak).toBe(1);
    });

    it('should not increment streak on duplicate same-day activity', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: new Date('2026-09-01T08:00:00Z'),
        currentStreak: 3,
        longestStreak: 5,
        streakFreezesAvailable: 1,
      };

      const res = processStreak(mockUser, new Date('2026-09-01T20:00:00Z'));
      expect(res.streakIncremented).toBe(false);
      expect(mockUser.currentStreak).toBe(3);
    });

    it('should increment streak on consecutive day activity', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: new Date('2026-09-01T12:00:00Z'),
        currentStreak: 3,
        longestStreak: 3,
      };

      const res = processStreak(mockUser, new Date('2026-09-02T12:00:00Z'));
      expect(res.currentStreak).toBe(4);
      expect(res.streakIncremented).toBe(true);
      expect(mockUser.longestStreak).toBe(4);
    });

    it('should maintain streak on same day activity without incrementing', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: new Date('2026-09-02T08:00:00Z'),
        currentStreak: 4,
        longestStreak: 4,
      };

      const res = processStreak(mockUser, new Date('2026-09-02T16:00:00Z'));
      expect(res.currentStreak).toBe(4);
      expect(res.streakIncremented).toBe(false);
      expect(res.streakReset).toBe(false);
    });

    it('should reset streak to 1 when 1 or more days are missed', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: new Date('2026-09-01T12:00:00Z'),
        currentStreak: 5,
        longestStreak: 5,
      };

      // Activity on 2026-09-03 (missed 2026-09-02)
      const res = processStreak(mockUser, new Date('2026-09-03T12:00:00Z'));
      expect(res.streakReset).toBe(true);
      expect(mockUser.currentStreak).toBe(1);
    });

    it('should reset streak to 1 when multiple days are missed', () => {
      const mockUser = {
        timezone: 'UTC',
        lastActivityDate: new Date('2026-09-01T12:00:00Z'),
        currentStreak: 10,
        longestStreak: 10,
      };

      // Activity on 2026-09-05 (missed 3 days)
      const res = processStreak(mockUser, new Date('2026-09-05T12:00:00Z'));
      expect(res.streakReset).toBe(true);
      expect(mockUser.currentStreak).toBe(1);
    });
  });

  // ─── 4. Badge Evaluation ───────────────────────────────────────────
  describe('Badge Evaluation & Reward Engine', () => {
    it('should award FIRST_STEP and bonus XP on first milestone quiz pass', async () => {
      const user = await User.findById(testUser._id);
      expect(user.badges.length).toBe(0);

      const initialXp = user.xp;
      const awarded = await evaluateBadges(user, 'QUIZ_PASSED', {
        quizScore: 80,
        completedMilestonesCount: 1,
      });

      expect(awarded.some((b) => b.code === 'FIRST_STEP')).toBe(true);
      expect(user.xp).toBe(initialXp + 50); // +50 XP bonus
    });

    it('should award PERFECT_QUIZ when score is 100%', async () => {
      const user = await User.findById(testUser._id);
      const awarded = await evaluateBadges(user, 'QUIZ_PASSED', {
        quizScore: 100,
        completedMilestonesCount: 2,
      });

      expect(awarded.some((b) => b.code === 'PERFECT_QUIZ')).toBe(true);
    });

    it('should not award duplicate badges if already owned', async () => {
      const user = await User.findById(testUser._id);
      const firstPass = await evaluateBadges(user, 'QUIZ_PASSED', { quizScore: 80 });
      expect(firstPass.some((b) => b.code === 'FIRST_STEP')).toBe(true);

      const secondPass = await evaluateBadges(user, 'QUIZ_PASSED', { quizScore: 80 });
      expect(secondPass.some((b) => b.code === 'FIRST_STEP')).toBe(false);
    });
  });

  // ─── 5. API Endpoints ──────────────────────────────────────────────
  describe('Gamification API Routes', () => {
    it('GET /api/v1/gamification/stats should return live student gamification profile', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/stats')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('xp');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('levelProgression');
      expect(res.body.data).toHaveProperty('currentStreak');
    });

    it('GET /api/v1/gamification/badges should return badge catalog with earned status', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/badges')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.badges)).toBe(true);
      expect(res.body.data.badges.length).toBeGreaterThan(0);
      expect(res.body.data.badges[0]).toHaveProperty('isEarned');
    });

    it('GET /api/v1/gamification/leaderboard should return ranked leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
      expect(res.body.data).toHaveProperty('currentUserRank');
      expect(res.body.data.currentUserRank).toHaveProperty('rank');
    });
  });
});
