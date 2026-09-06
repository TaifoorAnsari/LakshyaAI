const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { env } = require('../../src/config/env');
const User = require('../../src/models/User');
const UserRoadmap = require('../../src/models/UserRoadmap');
const StudySchedule = require('../../src/models/StudySchedule');
const { generateAccessToken } = require('../../src/utils/jwt');

describe('Schedule Controller API Tests', () => {
  let user;
  let token;
  let schedule;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await UserRoadmap.deleteMany({});
    await StudySchedule.deleteMany({});

    user = await User.create({
      email: 'sched_user@test.com',
      passwordHash: 'hash12345678',
      name: 'Tester',
    });
    token = generateAccessToken(user);

    const roadmap = await UserRoadmap.create({
      userId: user._id,
      title: 'Testing Path',
      category: 'Web',
      nodes: [
        {
          order: 1,
          title: 'Node 1',
          description: 'Desc',
          status: 'in_progress',
        },
      ],
    });

    schedule = await StudySchedule.create({
      userId: user._id,
      roadmapId: roadmap._id,
      sessions: [
        {
          milestoneId: roadmap.nodes[0]._id,
          milestoneTitle: 'Node 1',
          milestoneOrder: 1,
          scheduledDate: new Date(),
          startTime: '18:00',
          endTime: '19:00',
          status: 'scheduled',
        },
      ],
    });
  });

  it('PATCH /api/v1/schedule/sessions/:sessionId should mark session as completed', async () => {
    const sessionId = schedule.sessions[0]._id;
    const res = await request(app)
      .patch(`/api/v1/schedule/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
  });
});
