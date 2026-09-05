/**
 * Gemini Roadmap Generation Service
 * 
 * Core AI generation service implementing Step 3 of the Roadmap Engine (Section 7):
 * - Connects to Google's Generative AI SDK using gemini-2.0-flash.
 * - Forces structured JSON response schema adhering to RoadmapNodeSchema:
 *   nodes: [{ order, title, description, estimatedHours, resources: [...], quizQuestions: [...] }]
 * - Adapts content to user's skillLevel, hoursPerWeek, and learningStyle.
 * - Graceful fallback to deterministic structured blueprint when GEMINI_API_KEY
 *   is missing or network fails.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../../config/env');
const { logger } = require('../../config/logger');

let geminiClient = null;

const getGeminiClient = () => {
  if (geminiClient) return geminiClient;
  if (env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
};

/**
 * Builds the structured system prompt for Gemini
 */
const buildPrompt = ({ goalText, skillLevel = 'beginner', hoursPerWeek = 10, learningStyle = 'hands-on' }) => {
  return `You are PathForge AI, an expert computer science curriculum architect and senior tech educator.
Create a comprehensive, production-grade learning roadmap for a student with the following profile:
- Learning Goal: "${goalText}"
- Current Skill Level: ${skillLevel}
- Available Study Commitment: ${hoursPerWeek} hours per week
- Preferred Learning Style: ${learningStyle} (prioritize matching resources: 'video' for visual, 'article'/'doc' for reading, and project-based for hands-on)

Generate between 4 and 6 sequential milestone nodes.
Each milestone MUST have:
1. order: (integer starting at 1)
2. title: (concise, professional milestone title)
3. description: (detailed 2-3 sentence overview of concepts to master)
4. estimatedHours: (realistic hours based on total ${hoursPerWeek} hrs/week pacing)
5. resources: (array of exactly 3-4 high-quality educational resources, ordered as follows:
   - Item 1: Primary explainer matching the student's learning style (${learningStyle === 'visual' ? 'video' : 'article'}), with "isStartHere": true, "duration" (e.g. "15 min video" or "12 min read"), "difficulty": "${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}", "source": "ai_suggested". Only ONE resource can have isStartHere: true.
   - Item 2: Official language/framework reference documentation, with "isOfficialDoc": true, "isStartHere": false, "duration": "Reference guide", "difficulty": "Intermediate", "source": "ai_suggested".
   - Items 3+: Complementary articles/tutorials with "isStartHere": false, "isOfficialDoc": false, "duration": "20 min read", "difficulty": "${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}", "source": "ai_suggested".
6. quizQuestions: (array of 3 diverse multiple-choice questions testing:
   - Question 1: Core foundational concept
   - Question 2: Implementation pattern or syntax rule
   - Question 3: Common pitfall or best practice
   Each with: question, options [4 distinct options], correctIndex (0-indexed), and detailed explanation)

Return ONLY a valid JSON object with the exact keys:
{
  "title": "Clear roadmap title",
  "category": "High-level category (e.g. Web Development, Cloud & DevOps, Data & AI, Backend & Systems, Mobile Development)",
  "description": "2-3 sentence curriculum overview",
  "nodes": [...]
}
Do not enclose in markdown code fences. Output raw JSON only.`;
};

/**
 * Smart Blueprint / Mock Generator Fallback
 * Used when GEMINI_API_KEY is not configured or offline during development/testing.
 */
const generateBlueprintFallback = ({ goalText, skillLevel = 'beginner', hoursPerWeek = 10, learningStyle = 'hands-on' }) => {
  const isVisual = learningStyle === 'visual';
  const totalWeeks = skillLevel === 'beginner' ? 8 : skillLevel === 'intermediate' ? 6 : 4;
  const hoursPerMilestone = Math.max(5, Math.round((hoursPerWeek * totalWeeks) / 4));

  return {
    title: `${goalText.charAt(0).toUpperCase() + goalText.slice(1)} Mastery Path`,
    category: 'Custom AI Curriculum',
    description: `A personalized ${skillLevel}-level curriculum tailored for ${hoursPerWeek} hours/week of study, focusing on ${learningStyle} learning.`,
    nodes: [
      {
        order: 1,
        title: `${goalText} Core Foundations & Environment Setup`,
        description: `Establish strong mental models, install essential tools, and master fundamental syntax and concepts of ${goalText}.`,
        estimatedHours: hoursPerMilestone,
        resources: [
          {
            title: isVisual ? `${goalText} Comprehensive Video Crash Course` : `${goalText} Core Architecture & Fundamentals Guide`,
            url: isVisual
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' crash course')}`
              : `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' tutorial')}`,
            type: isVisual ? 'video' : 'article',
            isStartHere: true,
            isOfficialDoc: false,
            duration: isVisual ? '30 min video' : '15 min read',
            difficulty: 'Beginner',
            source: 'ai_suggested',
          },
          {
            title: `Official ${goalText} Documentation & API Reference`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' official documentation')}`,
            type: 'doc',
            isStartHere: false,
            isOfficialDoc: true,
            duration: 'Reference guide',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `${goalText} Hands-on Practice & Exercises`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' exercises practice')}`,
            type: 'article',
            isStartHere: false,
            isOfficialDoc: false,
            duration: '20 min practice',
            difficulty: 'Beginner',
            source: 'ai_suggested',
          },
        ],
        quizQuestions: [
          {
            question: `What is the foundational first step when starting with ${goalText}?`,
            options: [
              'Deploy directly to production servers',
              'Understand core concepts, runtime environment, and directory tooling',
              'Memorize all standard library functions',
              'Skip syntax and write complex algorithms',
            ],
            correctIndex: 1,
            explanation: 'Setting up the correct environment and grasping fundamental paradigms prevents downstream issues.',
          },
          {
            question: `Why is practicing with small isolated exercises effective in ${goalText}?`,
            options: [
              'It eliminates the need for testing',
              'It reinforces syntax memory and clarifies error diagnostics',
              'It requires no documentation',
              'It completes the entire roadmap',
            ],
            correctIndex: 1,
            explanation: 'Targeted drills build muscle memory and familiarity with debugging tools.',
          },
          {
            question: `Which approach is considered a best practice for managing errors in ${goalText}?`,
            options: [
              'Suppress all runtime exceptions silently',
              'Catch exceptions at appropriate boundaries and provide descriptive error messages',
              'Rely entirely on browser console warnings',
              'Restart the server on every error',
            ],
            correctIndex: 1,
            explanation: 'Structured error handling allows graceful degradation and clear logging for diagnosis.',
          },
        ],
      },
      {
        order: 2,
        title: `Intermediate ${goalText} Architecture & Patterns`,
        description: `Deepen your knowledge with design patterns, asynchronous workflows, data structures, and best practices in ${goalText}.`,
        estimatedHours: hoursPerMilestone + 2,
        resources: [
          {
            title: isVisual ? `${goalText} Design Patterns & Workflow Video` : `In-depth ${goalText} Patterns & Best Practices Guide`,
            url: isVisual
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' patterns')}`
              : `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' best practices architecture')}`,
            type: isVisual ? 'video' : 'article',
            isStartHere: true,
            isOfficialDoc: false,
            duration: isVisual ? '25 min video' : '18 min read',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `Official ${goalText} Style Guide & Conventions`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' style guide')}`,
            type: 'doc',
            isStartHere: false,
            isOfficialDoc: true,
            duration: 'Reference guide',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `Case Study: Production Patterns in ${goalText}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' production case study')}`,
            type: 'article',
            isStartHere: false,
            isOfficialDoc: false,
            duration: '15 min read',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
        ],
        quizQuestions: [
          {
            question: `What is the primary benefit of adhering to standard patterns in ${goalText}?`,
            options: [
              'Code looks more complex',
              'Improved maintainability, readability, and team scalability',
              'Faster download times',
              'Guaranteed zero bugs',
            ],
            correctIndex: 1,
            explanation: 'Standard conventions reduce cognitive overhead and make applications maintainable.',
          },
          {
            question: `When modularizing code in ${goalText}, what is the key principle to preserve?`,
            options: [
              'High coupling and low cohesion',
              'Single responsibility and clear separation of concerns',
              'Writing all logic in a single file',
              'Avoiding parameter passing',
            ],
            correctIndex: 1,
            explanation: 'Separation of concerns ensures modules can be developed, tested, and maintained independently.',
          },
          {
            question: `How should dependencies be managed across modules?`,
            options: [
              'Hardcode concrete implementations directly inside calling classes',
              'Use dependency injection or standard modular imports',
              'Duplicate code across modules',
              'Store all dependencies in global variables',
            ],
            correctIndex: 1,
            explanation: 'Injecting or explicitly importing dependencies enables easy mocking and modular testing.',
          },
        ],
      },
      {
        order: 3,
        title: `Performance, Testing & Security in ${goalText}`,
        description: `Implement unit and integration testing, memory and query profiling, and security defenses specific to ${goalText}.`,
        estimatedHours: hoursPerMilestone + 1,
        resources: [
          {
            title: isVisual ? `${goalText} Automated Testing & Profiling Masterclass` : `${goalText} Testing Strategies & Frameworks`,
            url: isVisual
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' testing')}`
              : `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' testing profiling')}`,
            type: isVisual ? 'video' : 'article',
            isStartHere: true,
            isOfficialDoc: false,
            duration: isVisual ? '35 min video' : '20 min read',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `Official ${goalText} Testing Documentation`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' test runner docs')}`,
            type: 'doc',
            isStartHere: false,
            isOfficialDoc: true,
            duration: 'Reference guide',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `Security Checklist & Hardening in ${goalText}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' security checklist')}`,
            type: 'article',
            isStartHere: false,
            isOfficialDoc: false,
            duration: '15 min read',
            difficulty: 'Advanced',
            source: 'ai_suggested',
          },
        ],
        quizQuestions: [
          {
            question: `Why is automated testing critical before shipping ${goalText} projects?`,
            options: [
              'It generates documentation automatically',
              'It catches regressions early and enables fearless refactoring',
              'It eliminates server hosting costs',
              'It replaces code linting',
            ],
            correctIndex: 1,
            explanation: 'Automated test suites verify system behavior and prevent breaking regressions.',
          },
          {
            question: `What distinguishes integration tests from unit tests?`,
            options: [
              'Integration tests run faster than unit tests',
              'Integration tests verify combined interactions between modules or external services',
              'Unit tests test the whole application simultaneously',
              'Integration tests never use database connections',
            ],
            correctIndex: 1,
            explanation: 'Unit tests isolate individual functions, whereas integration tests evaluate how components collaborate.',
          },
          {
            question: `What is the most common vulnerability vector when handling user inputs?`,
            options: [
              'Improper validation and unescaped input interpolation',
              'Using HTTPS encryption',
              'Storing data in JSON format',
              'Using strong password hashes',
            ],
            correctIndex: 0,
            explanation: 'Unsanitized input can lead to injection attacks, XSS, or memory corruption depending on runtime.',
          },
        ],
      },
      {
        order: 4,
        title: `Capstone Project & Production Deployment`,
        description: `Build a production-ready application end-to-end, configure CI/CD automation, and deploy live on cloud infrastructure.`,
        estimatedHours: hoursPerMilestone + 4,
        resources: [
          {
            title: isVisual ? `Deploying ${goalText} to Production (Full Walkthrough)` : `Deploying ${goalText} to Modern Cloud Infrastructure`,
            url: isVisual
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' deployment production')}`
              : `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' deployment production guide')}`,
            type: isVisual ? 'video' : 'article',
            isStartHere: true,
            isOfficialDoc: false,
            duration: isVisual ? '40 min video' : '25 min read',
            difficulty: 'Advanced',
            source: 'ai_suggested',
          },
          {
            title: `Cloud Deployment & Docker Reference Guide`,
            url: `https://docs.docker.com/get-started/`,
            type: 'doc',
            isStartHere: false,
            isOfficialDoc: true,
            duration: 'Reference guide',
            difficulty: 'Intermediate',
            source: 'ai_suggested',
          },
          {
            title: `CI/CD Automation Pipeline Blueprint`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' github actions cicd')}`,
            type: 'article',
            isStartHere: false,
            isOfficialDoc: false,
            duration: '18 min read',
            difficulty: 'Advanced',
            source: 'ai_suggested',
          },
        ],
        quizQuestions: [
          {
            question: `What is the primary benefit of containerizing a ${goalText} application?`,
            options: [
              'Guaranteed consistency across development, staging, and production environments',
              'Elimination of source code',
              'It makes code run 100x faster automatically',
              'It removes the need for environment variables',
            ],
            correctIndex: 0,
            explanation: 'Containers bundle application code with dependencies, avoiding "works on my machine" issues.',
          },
          {
            question: `Why is CI/CD automation valuable in software release cycles?`,
            options: [
              'It automates linting, testing, and deployment to ensure stable and repeatable releases',
              'It replaces the need for version control',
              'It writes unit tests on the fly',
              'It guarantees zero server downtime without monitoring',
            ],
            correctIndex: 0,
            explanation: 'CI/CD pipelines automate testing and deployment steps to ensure continuous delivery with high quality.',
          },
          {
            question: `Which monitoring metric is most critical for detecting production outages?`,
            options: [
              'Number of comments in the git repo',
              'HTTP 5xx error rate, request latency, and service health checks',
              'Total lines of CSS in the build bundle',
              'The developer workstation OS version',
            ],
            correctIndex: 1,
            explanation: 'Error rates and latency percentiles are direct signals of user-facing system degradation.',
          },
        ],
      },
    ],
  };
};

/**
 * Main Gemini Roadmap Generation Function
 * 
 * @param {Object} params
 * @param {string} params.goalText - Topic/goal to learn
 * @param {string} params.skillLevel - 'beginner' | 'intermediate' | 'advanced'
 * @param {number} params.hoursPerWeek - Number of hours per week
 * @param {string} params.learningStyle - 'hands-on' | 'visual' | 'reading'
 * @returns {Promise<{ roadmap: Object, source: 'gemini' | 'blueprint' }>}
 */
const generateRoadmapWithGemini = async ({
  goalText,
  skillLevel = 'beginner',
  hoursPerWeek = 10,
  learningStyle = 'hands-on',
}) => {
  const client = getGeminiClient();

  if (client) {
    try {
      logger.info(`🤖 Calling Gemini 2.0 Flash to generate roadmap for: "${goalText}"`);
      const model = client.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3, // Low temperature for consistent structural output
        },
      });

      const prompt = buildPrompt({ goalText, skillLevel, hoursPerWeek, learningStyle });
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      if (text) {
        // Parse and validate JSON structure
        const parsed = JSON.parse(text);
        if (parsed.title && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          logger.info(`✨ Gemini successfully generated roadmap: "${parsed.title}" with ${parsed.nodes.length} nodes`);
          return { roadmap: parsed, source: 'gemini' };
        }
      }
    } catch (error) {
      logger.warn(`Gemini generation call failed (${error.message}). Falling back to blueprint generator.`);
    }
  } else {
    logger.info(`ℹ️ GEMINI_API_KEY not configured. Using smart blueprint generator for: "${goalText}"`);
  }

  // Fallback to deterministic blueprint
  const blueprint = generateBlueprintFallback({ goalText, skillLevel, hoursPerWeek, learningStyle });
  return { roadmap: blueprint, source: 'blueprint' };
};

module.exports = {
  generateRoadmapWithGemini,
  buildPrompt,
  generateBlueprintFallback,
};
