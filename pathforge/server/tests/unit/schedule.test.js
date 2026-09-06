const mongoose = require('mongoose');
const { env } = require('../../src/config/env');
const User = require('../../src/models/User');
const UserRoadmap = require('../../src/models/UserRoadmap');
const StudySchedule = require('../../src/models/StudySchedule');
const { generateStudySchedule, generateICalendarData } = require('../../src/services/schedulerService');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
  await UserRoadmap.deleteMany({});
  await StudySchedule.deleteMany({});
});

describe('Study Scheduler Service', () => {
  test('generates study sessions distributed across preferred weekdays', async () => {
    // 1. Create student
    const user = await User.create({
      email: 'student@studytest.com',
      passwordHash: 'hashedpwd123',
      name: 'Alice Learner',
      onboarding: {
        goalText: 'Master React & Node.js',
        skillLevel: 'intermediate',
        hoursPerWeek: 10,
        learningStyle: 'hands-on',
        completedAt: new Date(),
      },
    });

    // 2. Create active roadmap with 2 milestones
    const roadmap = await UserRoadmap.create({
      userId: user._id,
      title: 'Fullstack Web Mastery',
      category: 'web-development',
      status: 'in_progress',
      nodes: [
        {
          order: 1,
          title: 'React Fundamentals',
          description: 'Components, JSX, state, props',
          estimatedHours: 2,
          status: 'in_progress',
        },
        {
          order: 2,
          title: 'Node.js & Express Basics',
          description: 'REST APIs, middleware, HTTP',
          estimatedHours: 3,
          status: 'locked',
        },
      ],
    });

    // 3. Generate schedule: 60-min sessions, preferred days Mon(1), Wed(3), Fri(5)
    const schedule = await generateStudySchedule(user._id, {
      weeklyHours: 10,
      preferredDays: [1, 3, 5],
      dailyStartTime: '19:00',
      sessionDurationMinutes: 60,
    });

    expect(schedule).toBeDefined();
    expect(schedule.sessions.length).toBe(5); // 2 hours (2 sessions) + 3 hours (3 sessions) = 5 sessions
    expect(schedule.sessions[0].milestoneTitle).toBe('React Fundamentals');
    expect(schedule.sessions[0].startTime).toBe('19:00');
    expect(schedule.sessions[0].endTime).toBe('20:00');
    expect(schedule.sessions[0].durationMinutes).toBe(60);

    // Verify all scheduled dates fall on Monday, Wednesday, or Friday
    for (const session of schedule.sessions) {
      const day = new Date(session.scheduledDate).getDay();
      expect([1, 3, 5]).toContain(day);
    }
  });

  test('generates compliant RFC 5545 iCalendar (.ics) string', async () => {
    const mockSchedule = {
      sessions: [
        {
          milestoneId: new mongoose.Types.ObjectId(),
          milestoneTitle: 'Data Structures with Python',
          milestoneOrder: 1,
          scheduledDate: new Date('2026-09-10T00:00:00.000Z'),
          startTime: '18:30',
          endTime: '19:30',
          durationMinutes: 60,
          topicsCovered: ['Arrays and Hash Maps'],
          status: 'scheduled',
        },
      ],
    };

    const ics = generateICalendarData(mockSchedule, 'Python DSA');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//PathForge//Learning Timetable//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:[PathForge] Milestone #1: Data Structures with Python');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});
