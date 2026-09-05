/**
 * Cluster Matcher & Roadmap Engine Unit/Integration Tests
 * 
 * Tests:
 * 1. Normalizer (intent extraction, prefix stripping)
 * 2. Vector Embedding & Cosine Similarity
 * 3. Cluster Matcher (Tier 1 Fuzzy + Tier 2 Semantic)
 * 4. Cluster API Endpoints (GET /clusters, POST /clusters/match)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { env } = require('../../src/config/env');
const { normalizeGoalText, extractKeywords } = require('../../src/services/roadmapEngine/normalizer');
const {
  generateLocalVector,
  calculateCosineSimilarity,
} = require('../../src/services/roadmapEngine/embeddingService');
const { findClusterMatch } = require('../../src/services/roadmapEngine/clusterMatcher');

describe('Cluster Matching Engine & Roadmap Services', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ─── 1. Normalizer Tests ──────────────────────────────────────────────
  describe('Input Normalizer', () => {
    it('should strip conversational filler prefixes', () => {
      const input = 'I want to learn Full-Stack Web Development for beginners';
      const output = normalizeGoalText(input);
      expect(output).toBe('full-stack web development');
    });

    it('should strip "how to become a" and punctuation', () => {
      const input = 'How to become a DevOps Engineer in 2025?!';
      const output = normalizeGoalText(input);
      expect(output).toBe('devops engineer');
    });

    it('should preserve technical terms like node.js, c++, c#', () => {
      const input = 'Roadmap to learn Node.js and C++';
      const output = normalizeGoalText(input);
      expect(output).toContain('node');
      expect(output).toContain('c++');
    });

    it('should return empty string for empty or null inputs', () => {
      expect(normalizeGoalText('')).toBe('');
      expect(normalizeGoalText(null)).toBe('');
      expect(normalizeGoalText(undefined)).toBe('');
    });

    it('should extract distinct keywords correctly', () => {
      const keywords = extractKeywords('I want to learn python machine learning and python data');
      expect(keywords).toContain('python');
      expect(keywords).toContain('machine');
      expect(keywords).toContain('learning');
      expect(keywords).toContain('data');
      // No duplicates
      const pythonCount = keywords.filter((k) => k === 'python').length;
      expect(pythonCount).toBe(1);
    });
  });

  // ─── 2. Embedding & Vector Similarity Tests ───────────────────────────
  describe('Vector Embedding & Cosine Similarity', () => {
    it('should generate a 768-dimensional normalized unit vector', () => {
      const vec = generateLocalVector('React Frontend Development', 768);
      expect(Array.isArray(vec)).toBe(true);
      expect(vec.length).toBe(768);

      // Verify unit length (sum of squares ≈ 1.0)
      const sumSquares = vec.reduce((sum, val) => sum + val * val, 0);
      expect(sumSquares).toBeCloseTo(1.0, 1);
    });

    it('should produce 1.0 cosine similarity for identical vectors', () => {
      const vecA = generateLocalVector('Data Science with Python', 768);
      const similarity = calculateCosineSimilarity(vecA, vecA);
      expect(similarity).toBeCloseTo(1.0, 4);
    });

    it('should produce higher similarity for semantically related texts', () => {
      const vecOriginal = generateLocalVector('Frontend React Web Developer', 768);
      const vecRelated = generateLocalVector('React Web Development UI Frontend', 768);
      const vecUnrelated = generateLocalVector('Quantum Mechanics Classical Physics', 768);

      const simRelated = calculateCosineSimilarity(vecOriginal, vecRelated);
      const simUnrelated = calculateCosineSimilarity(vecOriginal, vecUnrelated);

      expect(simRelated).toBeGreaterThan(simUnrelated);
    });

    it('should handle empty or malformed vectors gracefully without crashing', () => {
      expect(calculateCosineSimilarity([], [])).toBe(0);
      expect(calculateCosineSimilarity(null, [1, 2, 3])).toBe(0);
    });
  });

  // ─── 3. Two-Tier Matching Algorithm Tests ─────────────────────────────
  describe('Cluster Matcher Engine', () => {
    it('should match a common tech query via Tier 1 fuzzy keyword search', async () => {
      const result = await findClusterMatch('I want to learn React');
      expect(result).toBeDefined();
      expect(result.match).not.toBeNull();
      expect(result.confidence).toBeGreaterThanOrEqual(0.78);
      expect(['keyword', 'cache']).toContain(result.method);
      expect(result.match.title).toMatch(/React/i);
    });

    it('should match a Docker/Kubernetes query to DevOps roadmap', async () => {
      const result = await findClusterMatch('How to become a DevOps and Kubernetes engineer');
      expect(result).toBeDefined();
      expect(result.match).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.match.title).toMatch(/DevOps|Cloud/i);
    });

    it('should match a DSA/Algorithm query', async () => {
      const result = await findClusterMatch('Data structures and algorithms');
      expect(result).toBeDefined();
      expect(result.match).not.toBeNull();
      expect(result.match.title).toMatch(/Data Structures|Algorithms/i);
    });

    it('should return no match for random non-tech nonsense query', async () => {
      const result = await findClusterMatch('How to make artisanal sourdough bread with yeast');
      expect(result).toBeDefined();
      expect(result.match).toBeNull();
      expect(result.method).toBe('none');
      expect(result.confidence).toBeLessThan(0.82);
    });
  });

  // ─── 4. Cluster HTTP Endpoints ────────────────────────────────────────
  describe('Cluster API Routes', () => {
    it('GET /api/v1/clusters should return catalog of seeded roadmaps', async () => {
      const res = await request(app)
        .get('/api/v1/clusters')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(30);
      expect(Array.isArray(res.body.data.clusters)).toBe(true);

      const first = res.body.data.clusters[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('category');
      expect(first).toHaveProperty('nodeCount');
      expect(first).toHaveProperty('totalEstimatedHours');
    });

    it('POST /api/v1/clusters/match should return match payload with latencyMs', async () => {
      const res = await request(app)
        .post('/api/v1/clusters/match')
        .send({ goalText: 'I want to master Python for Machine Learning' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('matched');
      expect(res.body.data).toHaveProperty('confidence');
      expect(res.body.data).toHaveProperty('method');
      expect(res.body.data).toHaveProperty('latencyMs');
      expect(res.body.data.matchedTemplate).not.toBeNull();
      expect(res.body.data.matchedTemplate.title).toMatch(/Python|Machine Learning|Data Science/i);
    });

    it('POST /api/v1/clusters/match should reject empty goalText with 400', async () => {
      const res = await request(app)
        .post('/api/v1/clusters/match')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
