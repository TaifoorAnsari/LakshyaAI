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
const { validateLearningGoal } = require('./domainValidator');

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

CRITICAL ACADEMIC VALIDITY GUARDRAIL:
First, inspect the student's learning goal: "${goalText}".
Determine if "${goalText}" is a genuine, recognizable academic subject, computer science/programming field, engineering discipline, mathematics, science, professional business skill, or educational course.
If the goal is:
- Vulgarity, profanity, swearing, or aggressive slang (e.g. "what the hell", "wtf", "damn"),
- Conversational chat, questions, or nonsense (e.g. "who are you", "what is this", "tell me a joke", "hello"),
- A feeling, mood, biological need, or sleep (e.g. "i wanna sleep", "i am hungry", "i feel lazy"),
- Casual leisure, gaming, or sports without academic study context (e.g. "football", "play minecraft", "watch anime"),
- Or gibberish/non-educational text:

You MUST immediately reject it and return ONLY the following JSON object:
{
  "isValidTopic": false,
  "error": "INVALID_STUDY_TOPIC",
  "message": "The topic \\"${goalText}\\" is not recognized as a valid study subject or course. Please provide a genuine academic subject, technology, or professional skill (e.g. React & Node.js, Python Data Science, or System Design)."
}

If and ONLY if the goal is a legitimate educational or technological topic, generate a comprehensive learning roadmap:
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
5. topics: (array of 3 to 4 sequential, granular sub-topics covering every key topic of this milestone in detail)
   Each topic object MUST have:
   - title: (clear sub-topic title, e.g. "JSX Syntax, Virtual DOM & Reconciliation")
   - description: (detailed 2-sentence explanation of what to learn and why it matters)
   - keyConcepts: (array of 3-4 key takeaways/principles to master, e.g. ["Reconciliation algorithm", "Virtual DOM vs Real DOM", "JSX compilation"])
   - resources: (array of 2-3 specific learning resources for THIS specific topic:
     - 1 video tutorial: "type": "video", "duration": "15-30 min video", "difficulty": "${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}", "isStartHere": true, "source": "ai_suggested"
     - 1 official reference/documentation: "type": "doc", "duration": "Reference doc", "isOfficialDoc": true, "source": "ai_suggested"
     - 1 hands-on practice or deep-dive article: "type": "interactive" or "article", "duration": "15-20 min", "source": "ai_suggested"
   - isCompleted: false
6. resources: (array of 2-3 milestone-level overview resources for quick high-level reference:
   - 1 primary video/article matching learning style with "isStartHere": true
   - 1 official documentation reference with "isOfficialDoc": true
7. quizQuestions: (array of 3 diverse multiple-choice questions testing:
   - Question 1: Core foundational concept
   - Question 2: Implementation pattern or syntax rule
   - Question 3: Common pitfall or best practice
   Each with: question, options [4 distinct options], correctIndex (0-indexed), and detailed explanation)

Return ONLY a valid JSON object with the exact keys:
{
  "isValidTopic": true,
  "title": "Clear roadmap title",
  "category": "High-level category (e.g. Web Development, Cloud & DevOps, Data & AI, Backend & Systems, Mobile Development)",
  "description": "2-3 sentence curriculum overview",
  "nodes": [...]
}
Do not enclose in markdown code fences. Output raw JSON only.`;
};

/**
 * Helper to generate 3-4 granular sub-topics with curated study resources for each milestone
 */
const createBlueprintTopics = (goalText, order, isVisual, skillLevel) => {
  const cap = goalText.charAt(0).toUpperCase() + goalText.slice(1);
  if (order === 1) {
    return [
      {
        title: `${cap} Development Tooling & Environment Setup`,
        description: `Install compilers, runtimes, linters, and configure your local workspace for production ${goalText} development.`,
        keyConcepts: ['Toolchain & runtime installation', 'Package management and workspace configuration', 'IDE extensions & debugging tools'],
        resources: [
          {
            title: `${cap} Complete Setup & Hello World Video`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' environment setup tutorial')}`,
            type: 'video',
            duration: '20 min video',
            difficulty: 'Beginner',
            isStartHere: true,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Official ${cap} Getting Started Guide`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' official getting started')}`,
            type: 'doc',
            duration: 'Reference doc',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: true,
            source: 'ai_suggested',
          },
          {
            title: `${cap} Interactive Sandbox Practice`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' interactive sandbox exercises')}`,
            type: 'interactive',
            duration: '15 min practice',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Core Syntax, Primitive Types & Variables`,
        description: `Understand variable scoping, primary data types, operators, and basic statements in ${goalText}.`,
        keyConcepts: ['Strong vs dynamic typing paradigms', 'Memory allocation for primitives', 'Lexical scoping and hoisting'],
        resources: [
          {
            title: `${cap} Syntax & Data Types Deep Dive`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' syntax data types')}`,
            type: 'video',
            duration: '25 min video',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Language Specifications & Syntax Reference`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' syntax language reference')}`,
            type: 'doc',
            duration: '15 min read',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: true,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Control Flow, Functions & Modular Constructs`,
        description: `Master condition branches, loops, function declarations, parameters, and error handling fundamentals.`,
        keyConcepts: ['Pure functions and side effects', 'Branching execution & recursion', 'Handling runtime exceptions'],
        resources: [
          {
            title: `${cap} Control Flow & Functions Masterclass`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' functions control flow')}`,
            type: 'video',
            duration: '30 min video',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Hands-on Code Drills: Functions in ${cap}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' coding challenges functions')}`,
            type: 'interactive',
            duration: '20 min practice',
            difficulty: 'Beginner',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
    ];
  } else if (order === 2) {
    return [
      {
        title: `Modular Architecture & File Organization`,
        description: `Structure real-world ${goalText} projects using design patterns, separation of concerns, and reusable modules.`,
        keyConcepts: ['Single responsibility principle', 'Import/export conventions', 'Dependency management'],
        resources: [
          {
            title: `${cap} Project Structure & Architecture Guide`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' project architecture patterns')}`,
            type: 'video',
            duration: '25 min video',
            difficulty: 'Intermediate',
            isStartHere: true,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Official Architectural Style Guide for ${cap}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' style guide architecture')}`,
            type: 'doc',
            duration: 'Reference doc',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: true,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Asynchronous Workflows, Events & Streams`,
        description: `Handle concurrency, non-blocking I/O, event loops, promises/futures, and data streams effectively.`,
        keyConcepts: ['Concurrency vs parallelism', 'Error propagation in async flows', 'Memory-safe streaming'],
        resources: [
          {
            title: `Async Programming & Streams in ${cap}`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' async programming streams')}`,
            type: 'video',
            duration: '30 min video',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Async Patterns In-Depth Article`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' async await patterns article')}`,
            type: 'article',
            duration: '15 min read',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `State Management & In-Memory Data Structures`,
        description: `Design efficient in-memory data representations and state synchronization mechanisms.`,
        keyConcepts: ['Immutable state paradigms', 'Lookup optimization with maps/sets', 'Garbage collection considerations'],
        resources: [
          {
            title: `${cap} State Management Patterns Video`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' state management data structures')}`,
            type: 'video',
            duration: '20 min video',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Interactive State & Data Modeling Sandbox`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' state exercises')}`,
            type: 'interactive',
            duration: '20 min practice',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
    ];
  } else if (order === 3) {
    return [
      {
        title: `Automated Unit Testing & Mocking`,
        description: `Set up test runners, write comprehensive test assertions, and mock external service dependencies.`,
        keyConcepts: ['Test-driven design', 'Mocking I/O and network boundaries', 'Code coverage metrics'],
        resources: [
          {
            title: `${cap} Unit Testing Crash Course`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' unit testing guide')}`,
            type: 'video',
            duration: '30 min video',
            difficulty: 'Intermediate',
            isStartHere: true,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Official Testing Framework Documentation`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' testing framework docs')}`,
            type: 'doc',
            duration: 'Reference doc',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: true,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Performance Profiling & Memory Leak Prevention`,
        description: `Profile CPU execution bottlenecks, benchmark algorithms, and inspect heap allocations to optimize throughput.`,
        keyConcepts: ['CPU time profiling', 'Detecting retained memory leaks', 'Cache invalidation strategies'],
        resources: [
          {
            title: `Profiling & Optimizing ${cap} Applications`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' performance profiling optimization')}`,
            type: 'video',
            duration: '25 min video',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `High-Performance Engineering Article`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' performance optimization best practices')}`,
            type: 'article',
            duration: '18 min read',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Security Hardening & Input Sanitization`,
        description: `Defend against injection vulnerabilities, implement strict authentication tokens, and audit third-party dependencies.`,
        keyConcepts: ['Sanitizing untrusted inputs', 'OWASP vulnerability defenses', 'Secret management & HTTPS enforcement'],
        resources: [
          {
            title: `${cap} Security Checklist & Vulnerability Prevention`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' security best practices owasp')}`,
            type: 'article',
            duration: '20 min read',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Hands-on Security Audit Exercises`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' security audit lab')}`,
            type: 'interactive',
            duration: '25 min practice',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
    ];
  } else {
    return [
      {
        title: `Production Architecture & Capstone Design`,
        description: `Architect a full-scale ${goalText} application adhering to industry standards and clean architecture paradigms.`,
        keyConcepts: ['Domain-driven modeling', 'Scalable component design', 'End-to-end telemetry'],
        resources: [
          {
            title: `Building a Production-Grade ${cap} App (Full Project)`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText + ' full capstone project tutorial')}`,
            type: 'video',
            duration: '45 min video',
            difficulty: 'Advanced',
            isStartHere: true,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `System Architecture Specification Template`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' production architecture case study')}`,
            type: 'article',
            duration: '20 min read',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `Docker Containerization & Multi-Stage Builds`,
        description: `Package your application into lightweight, reproducible container images with multi-stage Dockerfiles.`,
        keyConcepts: ['Container isolation & layers', 'Optimizing image bundle size', 'Environment variable injection'],
        resources: [
          {
            title: `Dockerizing ${cap} Applications Masterclass`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent('dockerize ' + goalText + ' tutorial')}`,
            type: 'video',
            duration: '25 min video',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Official Docker Documentation & Multi-Stage Guide`,
            url: `https://docs.docker.com/develop/develop-images/multistage-build/`,
            type: 'doc',
            duration: 'Reference doc',
            difficulty: 'Intermediate',
            isStartHere: false,
            isOfficialDoc: true,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
      {
        title: `CI/CD Automation & Cloud Deployment`,
        description: `Configure GitHub Actions or automated deployment pipelines to test, build, and deploy live to cloud infrastructure.`,
        keyConcepts: ['Continuous integration pipelines', 'Health checks and zero-downtime releases', 'Cloud hosting & DNS setup'],
        resources: [
          {
            title: `CI/CD Pipeline Setup for ${cap} with GitHub Actions`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent('github actions cicd ' + goalText)}`,
            type: 'video',
            duration: '30 min video',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
          {
            title: `Interactive Cloud Deployment Lab`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(goalText + ' cloud deployment guide')}`,
            type: 'interactive',
            duration: '30 min practice',
            difficulty: 'Advanced',
            isStartHere: false,
            isOfficialDoc: false,
            source: 'ai_suggested',
          },
        ],
        isCompleted: false,
      },
    ];
  }
};

/**
 * Smart Blueprint / Mock Generator Fallback
 * Used when GEMINI_API_KEY is not configured or offline during development/testing.
 */
const generateBlueprintFallback = ({ goalText, skillLevel = 'beginner', hoursPerWeek = 10, learningStyle = 'hands-on' }) => {
  // Guard against non-educational/invalid topics
  const validation = validateLearningGoal(goalText);
  if (!validation.isValid) {
    const err = new Error(validation.error || `"${goalText}" is not recognized as a valid study subject or course.`);
    err.code = 'ERR_INVALID_LEARNING_GOAL';
    err.statusCode = 400;
    throw err;
  }

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
        topics: createBlueprintTopics(goalText, 1, isVisual, skillLevel),
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
        topics: createBlueprintTopics(goalText, 2, isVisual, skillLevel),
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
        topics: createBlueprintTopics(goalText, 3, isVisual, skillLevel),
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
        topics: createBlueprintTopics(goalText, 4, isVisual, skillLevel),
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

        // Check if Gemini rejected the topic as non-academic / nonsense
        if (parsed.isValidTopic === false || parsed.error === 'INVALID_STUDY_TOPIC') {
          const msg = parsed.message || `"${goalText}" is not recognized as a valid study subject or course.`;
          logger.warn(`Gemini rejected invalid study topic: "${goalText}" - ${msg}`);
          const err = new Error(msg);
          err.code = 'ERR_INVALID_LEARNING_GOAL';
          err.statusCode = 400;
          throw err;
        }

        if (parsed.title && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          logger.info(`✨ Gemini successfully generated roadmap: "${parsed.title}" with ${parsed.nodes.length} nodes`);
          return { roadmap: parsed, source: 'gemini' };
        }
      }
    } catch (error) {
      if (error.code === 'ERR_INVALID_LEARNING_GOAL') {
        throw error;
      }
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
  createBlueprintTopics,
};
