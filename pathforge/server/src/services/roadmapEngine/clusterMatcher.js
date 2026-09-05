/**
 * Cluster-Matching Service
 * 
 * Implements Step 2 of Section 7:
 * - Two-tier zero-cost match:
 *   Tier 1: Fast Fuzzy Keyword Search (Fuse.js) against title and synonyms (<3ms)
 *   Tier 2: Semantic Vector Cosine Similarity against template embeddings
 * - Configurable CLUSTER_MATCH_THRESHOLD (default 0.82)
 * - Transparent Redis result caching when available
 */

const Fuse = require('fuse.js');
const ClusterTemplate = require('../../models/ClusterTemplate');
const { normalizeGoalText } = require('./normalizer');
const { generateEmbedding, calculateCosineSimilarity } = require('./embeddingService');
const { getRedisClient, isRedisAvailable } = require('../../config/redis');
const { env } = require('../../config/env');
const { logger } = require('../../config/logger');

// Local in-memory cache for cluster templates to avoid MongoDB queries on every keystroke
let cachedTemplates = null;
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Loads active cluster templates from DB with in-memory TTL caching
 */
const getActiveTemplates = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedTemplates && now - lastCacheUpdate < CACHE_TTL_MS) {
    return cachedTemplates;
  }

  cachedTemplates = await ClusterTemplate.find({ status: 'active' }).lean();
  lastCacheUpdate = now;
  return cachedTemplates;
};

// Stopwords and career framing filler that don't differentiate tech tracks
const QUERY_STOPWORDS = new Set([
  'and', 'or', 'in', 'at', 'with', 'for', 'to', 'the', 'a', 'an', 'of', 'how',
  'want', 'become', 'learn', 'master', 'study', 'guide', 'tutorial', 'need',
  'like', 'teach', 'me', 'into', 'get', 'engineer', 'developer', 'specialist',
  'expert', 'programming', 'basics', 'course', 'path', 'roadmap', 'modern', 'complete',
]);

/**
 * Main cluster matching function
 * @param {string} rawGoalText - The free-text query from the student
 * @returns {Promise<{ match: Object|null, confidence: number, method: string, normalizedQuery: string }>}
 */
const findClusterMatch = async (rawGoalText = '') => {
  const normalizedQuery = normalizeGoalText(rawGoalText);

  if (!normalizedQuery) {
    return { match: null, confidence: 0, method: 'none', normalizedQuery: '' };
  }

  // ─── 0. Check Redis Cache ─────────────────────────────────────
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(`cluster_match:${normalizedQuery}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          logger.info(`⚡ Cluster match cache hit for: "${normalizedQuery}" -> ${parsed.title}`);
          return { match: parsed, confidence: 1.0, method: 'cache', normalizedQuery };
        }
      }
    } catch {
      // Redis error, proceed to algorithmic match
    }
  }

  const templates = await getActiveTemplates();
  if (!templates || templates.length === 0) {
    return { match: null, confidence: 0, method: 'no_templates', normalizedQuery };
  }

  // ─── Tier 1: Fast Fuzzy & Token Keyword Matching (Fuse.js) ─────
  const meaningfulTokens = normalizedQuery
    .split(/\s+/)
    .filter((t) => t.length > 1 && !QUERY_STOPWORDS.has(t));

  const fuse = new Fuse(templates, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'normalizedKeywords', weight: 0.4 },
    ],
    threshold: 0.5,
    includeScore: true,
    ignoreLocation: true,
  });

  const fuzzyResults = fuse.search(normalizedQuery);
  const fuseMap = new Map();
  for (const r of fuzzyResults) {
    fuseMap.set(String(r.item._id), 1 - r.score);
  }

  let bestKeywordMatch = null;
  let highestKeywordScore = 0;

  for (const t of templates) {
    const target = [t.title, ...(t.normalizedKeywords || [])].join(' ').toLowerCase();
    let matchedCount = 0;
    for (const tok of meaningfulTokens) {
      if (target.includes(tok)) matchedCount++;
    }
    const tokenScore = meaningfulTokens.length > 0 ? matchedCount / meaningfulTokens.length : 0;
    const fuseScore = fuseMap.get(String(t._id)) || 0;

    // Full token match gets high priority; partial combines token overlap and fuzzy score
    const composite = tokenScore === 1.0
      ? Math.max(0.88, fuseScore)
      : (tokenScore * 0.7 + fuseScore * 0.3);

    if (composite > highestKeywordScore) {
      highestKeywordScore = composite;
      bestKeywordMatch = t;
    }
  }

  highestKeywordScore = Number(highestKeywordScore.toFixed(3));

  if (bestKeywordMatch && highestKeywordScore >= 0.75) {
    logger.info(
      `🎯 Tier 1 Keyword Hit: "${normalizedQuery}" -> "${bestKeywordMatch.title}" (Confidence: ${highestKeywordScore})`
    );

    // Cache result in Redis (1 hour TTL)
    cacheResult(normalizedQuery, bestKeywordMatch);

    return {
      match: bestKeywordMatch,
      confidence: highestKeywordScore,
      method: 'keyword',
      normalizedQuery,
    };
  }

  // ─── Tier 2: Semantic Vector Cosine Similarity ────────────────
  logger.info(`🔍 Keyword match low. Running Tier 2 vector embedding comparison for: "${normalizedQuery}"`);
  const queryVector = await generateEmbedding(normalizedQuery);

  let bestMatch = null;
  let highestSimilarity = 0;
  const matchThreshold = env.CLUSTER_MATCH_THRESHOLD || 0.82;

  for (const template of templates) {
    if (template.embedding && template.embedding.length > 0) {
      const similarity = calculateCosineSimilarity(queryVector, template.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = template;
      }
    }
  }

  highestSimilarity = Number(highestSimilarity.toFixed(3));

  if (bestMatch && highestSimilarity >= matchThreshold) {
    logger.info(
      `✨ Tier 2 Vector Embedding Hit: "${normalizedQuery}" -> "${bestMatch.title}" (Cosine: ${highestSimilarity} >= ${matchThreshold})`
    );

    cacheResult(normalizedQuery, bestMatch);

    return {
      match: bestMatch,
      confidence: highestSimilarity,
      method: 'embedding',
      normalizedQuery,
    };
  }

  // No confident cluster match found — will trigger Gemini fallback in Phase 5
  logger.info(
    `❌ No confident cluster match for: "${normalizedQuery}" (Highest similarity: ${highestSimilarity} < ${matchThreshold})`
  );

  return {
    match: null,
    confidence: highestSimilarity,
    method: 'none',
    normalizedQuery,
  };
};

/**
 * Helper to cache query matches in Redis safely
 */
const cacheResult = async (query, template) => {
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.setex(`cluster_match:${query}`, 3600, JSON.stringify(template));
      }
    } catch {
      // Ignore cache write errors
    }
  }
};

module.exports = {
  findClusterMatch,
  getActiveTemplates,
};
