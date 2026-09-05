/**
 * Roadmap Input Normalizer
 * 
 * Implements Step 1 of the Roadmap Generation Engine (Section 7):
 * - Trims and converts text to lowercase
 * - Strips common filler / conversational prefixes and suffixes
 * - Normalizes punctuation and excessive whitespace
 * - Generates clean query string + token set for keyword and fuzzy matching
 */

const FILLER_PHRASES = [
  // Conversational goals
  'i want to learn',
  'i want to become a',
  'i want to become an',
  'i want to become',
  'i want to study',
  'i want to master',
  'i need to learn',
  'i would like to learn',
  'teach me how to',
  'teach me',
  'how to become a',
  'how to become an',
  'how to become',
  'how to learn',
  'how do i learn',
  'how to get into',
  'guide me to learn',
  'help me learn',

  // Request framing
  'roadmap for',
  'roadmap to',
  'roadmap on',
  'learning path for',
  'learning path to',
  'path for',
  'path to',
  'guide for',
  'guide to',
  'tutorial for',
  'tutorial on',
  'course on',
  'course for',
  'basics of',
  'fundamentals of',
  'introduction to',
  'intro to',
  'complete guide to',
  'step by step',
  'from scratch',
  'for beginners',
  'in 2025',
  'in 2026',
];

/**
 * Normalizes free-text user learning goals
 * @param {string} text - Raw input from user (e.g. "I want to learn Full-Stack Web Development for beginners")
 * @returns {string} - Cleaned query (e.g. "full-stack web development")
 */
const normalizeGoalText = (text = '') => {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text.toLowerCase().trim();

  // Strip punctuation except hyphens/pluses (e.g. c++, c#, node.js)
  cleaned = cleaned.replace(/[!?.,;:"'()[\]{}<>/\\]/g, ' ');

  // Remove filler phrases repeatedly until stable
  let changed = true;
  while (changed) {
    const prev = cleaned;
    for (const phrase of FILLER_PHRASES) {
      // Matches phrase at start, middle, or end with word boundaries
      const regex = new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'gi');
      cleaned = cleaned.replace(regex, ' ');
    }
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
    changed = prev !== cleaned;
  }

  // Preserve tech specifics (e.g. "node.js" -> keep "nodejs" or "node js")
  return cleaned;
};

/**
 * Extracts distinct meaningful keywords/tokens
 * @param {string} text
 * @returns {string[]}
 */
const extractKeywords = (text = '') => {
  const normalized = normalizeGoalText(text);
  if (!normalized) return [];

  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  return [...new Set(tokens)];
};

module.exports = {
  normalizeGoalText,
  extractKeywords,
};
