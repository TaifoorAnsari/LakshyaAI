/**
 * Student Seeder Script
 * 
 * Populates diverse sample student accounts into MongoDB so the leaderboard
 * has realistic peer learners alongside any student accounts created by the user.
 * 
 * Run with: node src/scripts/seedStudents.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const Badge = require('../models/Badge');

const SAMPLE_STUDENTS = [
  {
    name: 'Maya Chen',
    email: 'maya.chen@example.com',
    role: 'student',
    xp: 650,
    level: 4,
    currentStreak: 12,
    longestStreak: 15,
    badgeCodes: ['FIRST_STEP', 'STREAK_7', 'PERFECT_QUIZ'],
  },
  {
    name: 'Liam Patel',
    email: 'liam.patel@example.com',
    role: 'student',
    xp: 420,
    level: 3,
    currentStreak: 8,
    longestStreak: 8,
    badgeCodes: ['FIRST_STEP', 'STREAK_7'],
  },
  {
    name: 'Sophia Rodriguez',
    email: 'sophia.r@example.com',
    role: 'student',
    xp: 280,
    level: 2,
    currentStreak: 5,
    longestStreak: 9,
    badgeCodes: ['FIRST_STEP', 'STREAK_3'],
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'student',
    xp: 150,
    level: 2,
    currentStreak: 3,
    longestStreak: 6,
    badgeCodes: ['FIRST_STEP'],
  },
  {
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@example.com',
    role: 'student',
    xp: 90,
    level: 1,
    currentStreak: 2,
    longestStreak: 2,
    badgeCodes: ['FIRST_STEP'],
  },
];

async function seedStudents() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pathforge';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const badges = await Badge.find({});
    const badgeMap = new Map();
    badges.forEach((b) => badgeMap.set(b.code, b));

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    let createdCount = 0;
    for (const studentData of SAMPLE_STUDENTS) {
      const existing = await User.findOne({ email: studentData.email });
      if (existing) {
        continue;
      }

      const userBadges = (studentData.badgeCodes || [])
        .map((code) => {
          const badge = badgeMap.get(code);
          if (!badge) return null;
          return {
            badgeId: badge._id,
            code: badge.code,
            name: badge.name,
            earnedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
          };
        })
        .filter(Boolean);

      await User.create({
        name: studentData.name,
        email: studentData.email,
        passwordHash: defaultPasswordHash,
        role: 'student',
        isEmailVerified: true,
        xp: studentData.xp,
        level: studentData.level,
        currentStreak: studentData.currentStreak,
        longestStreak: studentData.longestStreak,
        badges: userBadges,
        onboarding: {
          goalText: 'Full Stack Web Development',
          skillLevel: 'intermediate',
          hoursPerWeek: 10,
          learningStyle: 'hands-on',
          completedAt: new Date(),
        },
      });

      createdCount++;
    }

    console.log(`✅ Seeded ${createdCount} sample peer students into MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed students:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedStudents();
}

module.exports = seedStudents;
