/**
 * Roadmap Controller
 * 
 * Orchestrates the full roadmap generation pipeline:
 * 1. POST /api/v1/roadmaps/generate
 *    - Checks ClusterMatcher first (Tier 1 & Tier 2) -> Instant hit (<5ms, 0 tokens)
 *    - If no cluster hit -> Enqueues background Gemini generation job
 * 2. GET  /api/v1/roadmaps/generate/status/:jobId
 *    - Polling endpoint returning live progress (pending -> generating -> completed -> failed)
 */

const { findClusterMatch } = require('../services/roadmapEngine/clusterMatcher');
const { addRoadmapGenerationJob, getJobStatus } = require('../queues/roadmapQueue');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/v1/roadmaps/generate
 * Initiates the roadmap creation pipeline
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const user = req.user;
    let { goalText, skillLevel, hoursPerWeek, learningStyle } = req.body;

    // Use onboarding defaults from user profile if not provided in body
    if (!goalText && user?.onboarding?.goalText) {
      goalText = user.onboarding.goalText;
    }
    if (!skillLevel && user?.onboarding?.skillLevel) {
      skillLevel = user.onboarding.skillLevel;
    }
    if (!hoursPerWeek && user?.onboarding?.hoursPerWeek) {
      hoursPerWeek = user.onboarding.hoursPerWeek;
    }
    if (!learningStyle && user?.onboarding?.learningStyle) {
      learningStyle = user.onboarding.learningStyle;
    }

    if (!goalText || typeof goalText !== 'string' || !goalText.trim()) {
      return next(new AppError('goalText is required to generate a roadmap', 400, 'ERR_VALIDATION'));
    }

    goalText = goalText.trim();
    const startTime = Date.now();

    // ─── Step 1: Check Cluster Matcher (Zero AI Latency & Cost) ────
    const clusterResult = await findClusterMatch(goalText);

    if (clusterResult.match && clusterResult.confidence >= 0.75) {
      const latencyMs = Date.now() - startTime;
      const matched = clusterResult.match;

      return res.status(200).json({
        success: true,
        data: {
          isInstantClusterMatch: true,
          status: 'completed',
          confidence: clusterResult.confidence,
          method: clusterResult.method,
          latencyMs,
          roadmap: {
            title: matched.title,
            category: matched.category,
            description: `Curated learning path for ${matched.title}.`,
            totalEstimatedHours: matched.nodes?.reduce((sum, n) => sum + (n.estimatedHours || 0), 0) || 0,
            nodeCount: matched.nodes?.length || 0,
            nodes: matched.nodes || [],
            source: 'cluster_template',
          },
        },
      });
    }

    // ─── Step 2: No Cluster Match -> Enqueue Gemini Generation ──────
    const jobData = {
      userId: user?._id || 'guest',
      goalText,
      skillLevel: skillLevel || 'beginner',
      hoursPerWeek: Number(hoursPerWeek) || 10,
      learningStyle: learningStyle || 'hands-on',
    };

    const { jobId, status, isMemoryQueue } = await addRoadmapGenerationJob(jobData);

    return res.status(202).json({
      success: true,
      message: 'Roadmap generation initiated in background',
      data: {
        isInstantClusterMatch: false,
        jobId,
        status,
        isMemoryQueue,
        statusUrl: `/api/v1/roadmaps/generate/status/${jobId}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/roadmaps/generate/status/:jobId
 * Returns current status and completed roadmap payload
 */
const getGenerationStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return next(new AppError('jobId parameter is required', 400, 'ERR_VALIDATION'));
    }

    const job = await getJobStatus(jobId);

    if (!job) {
      return next(new AppError('Generation job not found or expired', 404, 'ERR_NOT_FOUND'));
    }

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  getGenerationStatus,
};
