/**
 * UserRoadmap & Progress Engine Unit/Integration Tests
 * 
 * Tests:
 * 1. Roadmap Enrollment (cloning from ClusterTemplate)
 * 2. Milestone State Machine initialization (Node 1 in_progress, Node 2..N locked)
 * 3. GET /roadmaps/my retrieval
 * 4. Study Notes updating via PATCH /nodes/:nodeId
 * 5. Quiz Submission, Node Completion, Next Node Unlocking, and XP Reward
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { env } = require('../../src/config/env');
const User = require('../../src/models/User');
const ClusterTemplate = require('../../src/models/ClusterTemplate');
const UserRoadmap = require('../../src/models/UserRoadmap');

describe('UserRoadmap Progress & Quiz Engine', () => {
  let userToken = null;
  let testUser = null;
  let sampleTemplate = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    // Clean up
    await User.deleteMany({ email: 'ada.lovelace@test.pathforge.dev' });
    await UserRoadmap.deleteMany({});

    // Register user
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'ada.lovelace@test.pathforge.dev',
        password: 'password123',
      });

    userToken = authRes.body.data.accessToken;
    testUser = authRes.body.data.user;

    // Fetch an existing cluster template
    sampleTemplate = await ClusterTemplate.findOne({ status: 'active' });
    if (!sampleTemplate) {
      throw new Error('No active cluster templates found. Run seed script first.');
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'ada.lovelace@test.pathforge.dev' });
    await UserRoadmap.deleteMany({});
    await mongoose.connection.close();
  });

  let enrolledRoadmapId = null;
  let firstNodeId = null;
  let secondNodeId = null;

  describe('Roadmap Enrollment', () => {
    it('should reject unauthenticated enrollment with 401', async () => {
      const res = await request(app)
        .post('/api/v1/roadmaps/enroll')
        .send({ templateId: sampleTemplate._id })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should enroll authenticated student and initialize milestone states', async () => {
      const res = await request(app)
        .post('/api/v1/roadmaps/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ templateId: sampleTemplate._id })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roadmap).toBeDefined();

      const roadmap = res.body.data.roadmap;
      enrolledRoadmapId = roadmap._id;
      expect(roadmap.userId).toBe(testUser.id);
      expect(roadmap.title).toBe(sampleTemplate.title);
      expect(roadmap.overallProgress).toBe(0);
      expect(roadmap.nodes.length).toBeGreaterThanOrEqual(2);

      // Node 1 should be 'in_progress', Node 2 should be 'locked'
      expect(roadmap.nodes[0].status).toBe('in_progress');
      expect(roadmap.nodes[1].status).toBe('locked');

      firstNodeId = roadmap.nodes[0]._id;
      secondNodeId = roadmap.nodes[1]._id;
    });

    it('should fetch active roadmap on GET /roadmaps/my', async () => {
      const res = await request(app)
        .get('/api/v1/roadmaps/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roadmap).not.toBeNull();
      expect(res.body.data.roadmap._id).toBe(enrolledRoadmapId);
    });
  });

  describe('Milestone Notes & Progress Updates', () => {
    it('should update personal study notes on PATCH /nodes/:nodeId', async () => {
      const noteText = 'Finished reviewing JavaScript async/await and closures!';

      const res = await request(app)
        .patch(`/api/v1/roadmaps/${enrolledRoadmapId}/nodes/${firstNodeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userNotes: noteText })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedNode.userNotes).toBe(noteText);
    });
  });

  describe('Comprehension Quiz & Milestone Unlocking', () => {
    it('should fail quiz and NOT unlock next milestone if answers are incorrect', async () => {
      // Find expected questions for first node
      const currentRoadmap = await UserRoadmap.findById(enrolledRoadmapId);
      const node = currentRoadmap.nodes.id(firstNodeId);
      const wrongAnswers = node.quizQuestions.map(() => 999); // completely wrong

      const res = await request(app)
        .post(`/api/v1/roadmaps/${enrolledRoadmapId}/nodes/${firstNodeId}/quiz`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answers: wrongAnswers })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.passed).toBe(false);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.unlockedNextNode).toBe(false);

      // Verify second node is STILL locked
      const updatedRoadmap = await UserRoadmap.findById(enrolledRoadmapId);
      expect(updatedRoadmap.nodes.id(secondNodeId).status).toBe('locked');
    });

    it('should pass quiz, mark node completed, unlock next node, and award +50 XP', async () => {
      const currentRoadmap = await UserRoadmap.findById(enrolledRoadmapId);
      const node = currentRoadmap.nodes.id(firstNodeId);
      const correctAnswers = node.quizQuestions.map((q) => q.correctIndex);

      const res = await request(app)
        .post(`/api/v1/roadmaps/${enrolledRoadmapId}/nodes/${firstNodeId}/quiz`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answers: correctAnswers })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.passed).toBe(true);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.xpAwarded).toBe(50);
      expect(res.body.data.unlockedNextNode).toBe(true);

      // Verify in DB that:
      // 1. First node is 'completed'
      // 2. Second node is now unlocked to 'in_progress'
      // 3. User XP increased by 50
      const dbRoadmap = await UserRoadmap.findById(enrolledRoadmapId);
      expect(dbRoadmap.nodes.id(firstNodeId).status).toBe('completed');
      expect(dbRoadmap.nodes.id(secondNodeId).status).toBe('in_progress');
      expect(dbRoadmap.overallProgress).toBeGreaterThan(0);

      const dbUser = await User.findById(testUser.id);
      expect(dbUser.xp).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Multiple Concurrent Roadmaps & Switching', () => {
    let secondRoadmapId = null;

    it('should allow student to enroll in a second roadmap concurrently without deleting the first', async () => {
      // Find a different template
      const secondTemplate = await ClusterTemplate.findOne({
        _id: { $ne: sampleTemplate._id },
        status: 'active',
      });

      const res = await request(app)
        .post('/api/v1/roadmaps/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ templateId: secondTemplate._id })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roadmap.title).toBe(secondTemplate.title);
      expect(res.body.data.roadmaps.length).toBe(2);

      secondRoadmapId = res.body.data.roadmap._id;

      // Check GET /roadmaps/my returns both
      const myRes = await request(app)
        .get('/api/v1/roadmaps/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(myRes.body.data.totalRoadmaps).toBe(2);
      expect(myRes.body.data.roadmaps.length).toBe(2);
    });

    it('should switch active roadmap via POST /roadmaps/:id/select', async () => {
      const res = await request(app)
        .post(`/api/v1/roadmaps/${enrolledRoadmapId}/select`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roadmap._id).toBe(enrolledRoadmapId);

      // Now GET /roadmaps/my should return enrolledRoadmapId as primary
      const myRes = await request(app)
        .get('/api/v1/roadmaps/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(myRes.body.data.roadmap._id).toBe(enrolledRoadmapId);
    });

    it('should remove a roadmap via DELETE /roadmaps/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/roadmaps/${secondRoadmapId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roadmaps.length).toBe(1);
    });
  });
});
