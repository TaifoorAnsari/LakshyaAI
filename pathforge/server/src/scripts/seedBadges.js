/**
 * Badge Catalog Seeder Script
 * 
 * Populates MongoDB with the official PathForge achievement badges.
 * Run via: node src/scripts/seedBadges.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Badge = require('../models/Badge');

const SEED_BADGES = [
  {
    code: 'FIRST_STEP',
    name: 'First Milestone',
    description: 'Completed your first learning milestone node.',
    icon: 'Award',
    category: 'milestone',
    rarity: 'common',
    xpReward: 50,
    criteriaDescription: 'Pass your first milestone comprehension quiz.',
  },
  {
    code: 'STREAK_3',
    name: '3-Day Ignition',
    description: 'Studied for 3 consecutive days.',
    icon: 'Flame',
    category: 'streak',
    rarity: 'common',
    xpReward: 50,
    criteriaDescription: 'Reach an unbroken 3-day study streak.',
  },
  {
    code: 'STREAK_7',
    name: '7-Day Warrior',
    description: 'Maintained a full 7-day unbroken study streak.',
    icon: 'Flame',
    category: 'streak',
    rarity: 'rare',
    xpReward: 100,
    criteriaDescription: 'Reach an unbroken 7-day study streak.',
  },
  {
    code: 'STREAK_30',
    name: 'Monthly Master',
    description: 'Achieved an extraordinary 30-day continuous study streak.',
    icon: 'Crown',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 300,
    criteriaDescription: 'Reach an unbroken 30-day study streak.',
  },
  {
    code: 'PERFECT_QUIZ',
    name: 'Flawless Score',
    description: 'Scored 100% on a milestone comprehension quiz on the first try.',
    icon: 'Sparkles',
    category: 'quiz',
    rarity: 'rare',
    xpReward: 50,
    criteriaDescription: 'Score 100% on any milestone assessment.',
  },
  {
    code: 'QUIZ_PRO',
    name: 'Quiz Veteran',
    description: 'Successfully passed 5 milestone comprehension quizzes.',
    icon: 'Zap',
    category: 'quiz',
    rarity: 'rare',
    xpReward: 100,
    criteriaDescription: 'Pass 5 milestone quizzes across any roadmaps.',
  },
  {
    code: 'PATH_PIONEER',
    name: 'Path Pioneer',
    description: 'Completed 100% of all milestones in a learning roadmap.',
    icon: 'Compass',
    category: 'mastery',
    rarity: 'epic',
    xpReward: 250,
    criteriaDescription: 'Finish all stages of a personalized learning path.',
  },
  {
    code: 'POLYGLOT',
    name: 'Multi-Tracker',
    description: 'Enrolled in 2 or more active roadmaps simultaneously.',
    icon: 'BookOpen',
    category: 'special',
    rarity: 'rare',
    xpReward: 50,
    criteriaDescription: 'Actively pursue multiple learning tracks.',
  },
  {
    code: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Studied or passed a milestone quiz after 10:00 PM.',
    icon: 'Moon',
    category: 'special',
    rarity: 'common',
    xpReward: 25,
    criteriaDescription: 'Complete an activity between 10:00 PM and 4:00 AM.',
  },
  {
    code: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Kicked off your morning study session before 8:00 AM.',
    icon: 'Sun',
    category: 'special',
    rarity: 'common',
    xpReward: 25,
    criteriaDescription: 'Complete an activity between 5:00 AM and 8:00 AM.',
  },
  {
    code: 'VELOCITY_LEARNER',
    name: 'Velocity Learner',
    description: 'Cleared 2 milestone stages in a single 24-hour period.',
    icon: 'Rocket',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 75,
    criteriaDescription: 'Complete 2 milestones on the same calendar day.',
  },
];

const seedBadges = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pathforge';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log(`Upserting ${SEED_BADGES.length} achievement badges...`);

    for (const badgeData of SEED_BADGES) {
      await Badge.findOneAndUpdate(
        { code: badgeData.code },
        { $set: badgeData },
        { upsert: true, new: true }
      );
    }

    const total = await Badge.countDocuments();
    console.log(`✅ Successfully seeded ${total} achievement badges into MongoDB!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed badges:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  seedBadges();
}

module.exports = { seedBadges, SEED_BADGES };
