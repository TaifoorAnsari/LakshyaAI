/**
 * Roadmap Controller
 * 
 * Orchestrates the full roadmap generation and progress pipeline:
 * 1. POST /api/v1/roadmaps/generate
 *    - Checks ClusterMatcher first (Tier 1 & Tier 2) -> Instant hit (<5ms, 0 tokens)
 *    - If no cluster hit -> Enqueues background Gemini generation job
 * 2. GET  /api/v1/roadmaps/generate/status/:jobId
 *    - Polling endpoint returning live progress (pending -> generating -> completed -> failed)
 * 3. POST /api/v1/roadmaps/enroll
 *    - Clones template or AI roadmap into a personal UserRoadmap
 * 4. GET  /api/v1/roadmaps/my
 *    - Returns current active personal roadmap
 * 5. GET  /api/v1/roadmaps/:id
 *    - Returns specific personal roadmap by ID
 * 6. PATCH /api/v1/roadmaps/:id/nodes/:nodeId
 *    - Updates milestone progress or personal study notes
 * 7. POST /api/v1/roadmaps/:id/nodes/:nodeId/quiz
 *    - Evaluates quiz answers, unlocks next milestone, awards +50 XP
 */

const { findClusterMatch } = require('../services/roadmapEngine/clusterMatcher');
const { validateLearningGoal } = require('../services/roadmapEngine/domainValidator');
const { addRoadmapGenerationJob, getJobStatus } = require('../queues/roadmapQueue');
const { AppError } = require('../middleware/errorHandler');
const UserRoadmap = require('../models/UserRoadmap');
const ClusterTemplate = require('../models/ClusterTemplate');
const User = require('../models/User');
const { recordActivity } = require('../services/gamificationService');

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

    // ─── Step 0: Validate Goal is a genuine study topic / course ──────
    const validation = validateLearningGoal(goalText);
    if (!validation.isValid) {
      return next(new AppError(validation.error, 400, 'ERR_INVALID_LEARNING_GOAL'));
    }

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
          templateId: matched._id,
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

/**
 * POST /api/v1/roadmaps/enroll
 * Clones a selected ClusterTemplate or AI-generated roadmap into an active UserRoadmap
 */
const enrollInRoadmap = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { templateId, customRoadmap } = req.body;

    let sourceData = null;
    let source = 'cluster_template';

    if (templateId) {
      const template = await ClusterTemplate.findById(templateId);
      if (!template) {
        return next(new AppError('Cluster template not found', 404, 'ERR_NOT_FOUND'));
      }
      sourceData = template;
      // Increment template usage count
      await ClusterTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });
    } else if (customRoadmap && customRoadmap.nodes?.length > 0) {
      const cleanedTitle = (customRoadmap.title || '').replace(/ Mastery Path| Learning Path/gi, '').trim();
      const validation = validateLearningGoal(cleanedTitle);
      if (!validation.isValid) {
        return next(new AppError(validation.error || 'Invalid study topic for roadmap', 400, 'ERR_INVALID_LEARNING_GOAL'));
      }
      sourceData = customRoadmap;
      source = customRoadmap.source || 'gemini';
    } else {
      return next(
        new AppError('Must provide either templateId or customRoadmap payload', 400, 'ERR_VALIDATION')
      );
    }

    // Fetch student profile to personalize resource recommendation by learningStyle
    const studentUser = await User.findById(userId);
    const learningStyle = studentUser?.onboarding?.learningStyle || 'hands-on';

    // Clone nodes with initial state machine: Node 1 is 'in_progress', rest are 'locked'
    const clonedNodes = sourceData.nodes.map((node, index) => {
      const rawResources = Array.isArray(node.resources) ? node.resources : [];
      
      // Determine student's preferred resource type based on onboarding
      const preferredType = learningStyle === 'visual' ? 'video' : learningStyle === 'reading' ? 'article' : null;

      // Identify candidates
      let startIndex = -1;
      if (preferredType) {
        startIndex = rawResources.findIndex((r) => r.type === preferredType && !r.isOfficialDoc);
      }
      if (startIndex === -1) {
        startIndex = rawResources.findIndex((r) => r.isStartHere === true);
      }
      if (startIndex === -1) {
        // Fallback: pick first non-official-doc resource, or index 0
        startIndex = rawResources.findIndex((r) => !r.isOfficialDoc);
        if (startIndex === -1) startIndex = 0;
      }

      // Structure and annotate each resource
      const processedResources = rawResources.map((res, rIdx) => {
        const isOfficial = res.isOfficialDoc === true || res.type === 'doc' || /doc|reference|mdn/i.test(res.title);
        const isStartHere = rIdx === startIndex;

        return {
          title: res.title,
          url: res.url,
          type: res.type || 'doc',
          isStartHere: isStartHere,
          isOfficialDoc: isOfficial && !isStartHere,
          duration: res.duration || (res.type === 'video' ? '25 min video' : res.type === 'course' ? '1 hr course' : isOfficial ? 'Reference guide' : '12 min read'),
          difficulty: res.difficulty || (index === 0 ? 'Beginner' : index < 3 ? 'Intermediate' : 'Advanced'),
          source: res.source || (source === 'cluster_template' ? 'verified' : 'ai_suggested'),
        };
      });

      // Sort resources strictly:
      // 1. Primary explainer (isStartHere === true)
      // 2. Official doc (isOfficialDoc === true)
      // 3. Other complementary resources
      processedResources.sort((a, b) => {
        if (a.isStartHere) return -1;
        if (b.isStartHere) return 1;
        if (a.isOfficialDoc && !b.isOfficialDoc) return -1;
        if (!a.isOfficialDoc && b.isOfficialDoc) return 1;
        return 0;
      });

      return {
        order: node.order || index + 1,
        title: node.title,
        description: node.description,
        estimatedHours: node.estimatedHours || 5,
        status: index === 0 ? 'in_progress' : 'locked',
        completedAt: null,
        quizScore: null,
        quizPassed: false,
        userNotes: '',
        resources: processedResources,
        quizQuestions: node.quizQuestions || [],
      };
    });

    const totalHours = clonedNodes.reduce((sum, n) => sum + (n.estimatedHours || 0), 0);

    // Check if student is already enrolled in this exact roadmap
    const existing = await UserRoadmap.findOne({
      userId,
      title: sourceData.title,
      status: { $in: ['in_progress', 'completed'] },
    });

    if (existing) {
      existing.lastAccessedAt = new Date();
      await existing.save();

      // Return existing roadmap and all active roadmaps
      const allActive = await UserRoadmap.find({
        userId,
        status: { $in: ['in_progress', 'completed'] },
      }).sort({ lastAccessedAt: -1, updatedAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'You are already enrolled in this roadmap',
        data: {
          roadmap: existing,
          roadmaps: allActive,
          alreadyEnrolled: true,
        },
      });
    }

    // Create new personal roadmap (allows students to have 2-3+ roadmaps concurrently)
    const userRoadmap = await UserRoadmap.create({
      userId,
      title: sourceData.title,
      category: sourceData.category || 'Specialized Track',
      description: sourceData.description || '',
      source,
      totalEstimatedHours: totalHours,
      overallProgress: 0,
      status: 'in_progress',
      lastAccessedAt: new Date(),
      nodes: clonedNodes,
    });

    // Fetch all active roadmaps for the student
    const allActive = await UserRoadmap.find({
      userId,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in roadmap',
      data: {
        roadmap: userRoadmap,
        roadmaps: allActive,
        alreadyEnrolled: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/roadmaps/my
 * Returns the authenticated student's active roadmaps
 */
const getMyRoadmap = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const roadmaps = await UserRoadmap.find({
      userId,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        roadmap: roadmaps[0] || null,
        roadmaps: roadmaps || [],
        totalRoadmaps: roadmaps.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/roadmaps/:id
 * Fetches a specific UserRoadmap by ID
 */
const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await UserRoadmap.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!roadmap) {
      return next(new AppError('Roadmap not found', 404, 'ERR_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        roadmap,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/roadmaps/:id/nodes/:nodeId
 * Updates milestone study notes or manual progress status
 */
const updateNodeProgress = async (req, res, next) => {
  try {
    const { id, nodeId } = req.params;
    const { userNotes, status } = req.body;

    const roadmap = await UserRoadmap.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!roadmap) {
      return next(new AppError('Roadmap not found', 404, 'ERR_NOT_FOUND'));
    }

    const node = roadmap.nodes.id(nodeId);
    if (!node) {
      return next(new AppError('Milestone node not found', 404, 'ERR_NOT_FOUND'));
    }

    if (typeof userNotes === 'string') {
      node.userNotes = userNotes;
    }

    if (status && ['locked', 'in_progress', 'completed'].includes(status)) {
      node.status = status;
      if (status === 'completed' && !node.completedAt) {
        node.completedAt = new Date();
      }
    }

    roadmap.recalculateProgress();
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Node progress updated',
      data: {
        roadmap,
        updatedNode: node,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/roadmaps/:id/nodes/:nodeId/quiz
 * Grades milestone comprehension quiz, marks node completed, unlocks next milestone, and awards XP
 */
const submitNodeQuiz = async (req, res, next) => {
  try {
    const { id, nodeId } = req.params;
    const { answers } = req.body; // Array of selected indices: [0, 2]

    if (!Array.isArray(answers)) {
      return next(new AppError('answers array is required', 400, 'ERR_VALIDATION'));
    }

    const roadmap = await UserRoadmap.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!roadmap) {
      return next(new AppError('Roadmap not found', 404, 'ERR_NOT_FOUND'));
    }

    const node = roadmap.nodes.id(nodeId);
    if (!node) {
      return next(new AppError('Milestone node not found', 404, 'ERR_NOT_FOUND'));
    }

    const questions = node.quizQuestions || [];
    let correctCount = 0;
    const answerFeedback = [];

    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) correctCount++;
      answerFeedback.push({
        questionIndex: i,
        selected: answers[i],
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;
    const passed = score >= 70; // 70% passing grade

    node.quizScore = score;
    let xpAwarded = 0;
    let unlockedNextNode = false;

    if (passed) {
      node.quizPassed = true;
      node.status = 'completed';
      if (!node.completedAt) {
        node.completedAt = new Date();
      }

      // Unlock next sequential milestone
      const nextNode = roadmap.nodes.find((n) => n.order === node.order + 1);
      if (nextNode && nextNode.status === 'locked') {
        nextNode.status = 'in_progress';
        unlockedNextNode = true;
      }

      // Check if this completes the roadmap
      const completedMilestonesCount = roadmap.nodes.filter((n) => n.status === 'completed' || n._id.equals(node._id)).length;
      const isRoadmapCompleted = completedMilestonesCount === roadmap.nodes.length;

      // Check active roadmaps count
      const activeRoadmapsCount = await UserRoadmap.countDocuments({
        userId: req.user._id,
        status: { $in: ['in_progress', 'completed'] },
      });

      // Award base +50 XP and trigger gamification engine
      const user = await User.findById(req.user._id);
      let gamificationResult = null;

      if (user) {
        xpAwarded = 50;
        user.xp = (user.xp || 0) + 50;
        await user.save();

        gamificationResult = await recordActivity(req.user._id, 'QUIZ_PASSED', {
          quizScore: score,
          completedMilestonesCount,
          isRoadmapCompleted,
          activeRoadmapsCount,
        });

        // Add bonus XP from newly unlocked badges
        if (gamificationResult?.newlyEarnedBadges?.length > 0) {
          const badgeBonusXp = gamificationResult.newlyEarnedBadges.reduce(
            (sum, b) => sum + (b.xpReward || 0),
            0
          );
          xpAwarded += badgeBonusXp;
        }
      }

      roadmap.recalculateProgress();
      await roadmap.save();

      return res.status(200).json({
        success: true,
        data: {
          passed,
          score,
          correctCount,
          totalQuestions,
          xpAwarded,
          unlockedNextNode,
          answerFeedback,
          roadmap,
          gamification: gamificationResult,
        },
      });
    }

    roadmap.recalculateProgress();
    await roadmap.save();

    res.status(200).json({
      success: true,
      data: {
        passed,
        score,
        correctCount,
        totalQuestions,
        xpAwarded: 0,
        unlockedNextNode: false,
        answerFeedback,
        roadmap,
        gamification: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/roadmaps/:id/select
 * Sets the chosen roadmap as active (updates lastAccessedAt)
 */
const selectRoadmap = async (req, res, next) => {
  try {
    const roadmap = await UserRoadmap.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: { $in: ['in_progress', 'completed'] },
    });

    if (!roadmap) {
      return next(new AppError('Roadmap not found', 404, 'ERR_NOT_FOUND'));
    }

    roadmap.lastAccessedAt = new Date();
    await roadmap.save();

    const roadmaps = await UserRoadmap.find({
      userId: req.user._id,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Active roadmap switched',
      data: {
        roadmap,
        roadmaps,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/roadmaps/:id
 * Sets roadmap status to abandoned (removes from active roadmaps)
 */
const deleteRoadmap = async (req, res, next) => {
  try {
    const roadmap = await UserRoadmap.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!roadmap) {
      return next(new AppError('Roadmap not found', 404, 'ERR_NOT_FOUND'));
    }

    roadmap.status = 'abandoned';
    await roadmap.save();

    const roadmaps = await UserRoadmap.find({
      userId: req.user._id,
      status: { $in: ['in_progress', 'completed'] },
    }).sort({ lastAccessedAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Roadmap archived',
      data: {
        roadmap: roadmaps[0] || null,
        roadmaps,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  getGenerationStatus,
  enrollInRoadmap,
  getMyRoadmap,
  getRoadmapById,
  updateNodeProgress,
  submitNodeQuiz,
  selectRoadmap,
  deleteRoadmap,
};
