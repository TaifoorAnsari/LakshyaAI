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
5. resources: (array of 2-3 high-quality educational resources with title, valid web URL, and type: 'video', 'article', 'doc', or 'course')
6. quizQuestions: (array of 2 interactive multiple-choice questions testing core concepts in this milestone, with question, options: [min 3 choices], correctIndex: 0-indexed integer, and explanation)

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
  const primaryResourceType =
    learningStyle === 'visual' ? 'video' :
    learningStyle === 'reading' ? 'doc' : 'article';

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
            title: `Official ${goalText} Getting Started & Documentation`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' documentation')}`,
            type: primaryResourceType === 'video' ? 'doc' : primaryResourceType,
          },
          {
            title: `${goalText} Beginner Video Walkthrough`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' crash course')}`,
            type: 'video',
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
        ],
      },
      {
        order: 2,
        title: `Intermediate ${goalText} Architecture & Patterns`,
        description: `Deepen your knowledge with design patterns, asynchronous workflows, data structures, and best practices in ${goalText}.`,
        estimatedHours: hoursPerMilestone + 2,
        resources: [
          {
            title: `In-depth ${goalText} Patterns & Best Practices Guide`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' best practices architecture')}`,
            type: 'article',
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
        ],
      },
      {
        order: 3,
        title: `Performance, Testing & Security in ${goalText}`,
        description: `Implement unit and integration testing, memory and query profiling, and security defenses specific to ${goalText}.`,
        estimatedHours: hoursPerMilestone + 1,
        resources: [
          {
            title: `${goalText} Testing Strategies & Frameworks`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' testing profiling')}`,
            type: 'doc',
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
        ],
      },
      {
        order: 4,
        title: `Capstone Project & Production Deployment`,
        description: `Build a production-ready application end-to-end, configure CI/CD automation, and deploy live on cloud infrastructure.`,
        estimatedHours: hoursPerMilestone + 4,
        resources: [
          {
            title: `Deploying ${goalText} to Modern Cloud Infrastructure`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' deployment production guide')}`,
            type: 'article',
          },
        ],
        quizQuestions: [
          {
            question: `What makes a capstone project valuable for a portfolio?`,
            options: [
              'Copying a tutorial line-by-line',
              'Solving a real-world problem with clean architecture, tests, and live deployment',
              'Using as many libraries as possible',
              'Writing code in a single file',
            ],
            correctIndex: 1,
            explanation: 'Demonstrating end-to-end execution and problem solving proves real engineering capability.',
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
