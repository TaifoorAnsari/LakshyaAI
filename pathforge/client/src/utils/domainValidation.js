/**
 * Client-Side Study Topic Validator
 * 
 * Provides immediate instant feedback when a user types non-educational phrases,
 * profanity, slang, bodily states, feelings, casual sports, or random noise into the goal input.
 */

// Whitelist of valid academic, engineering, technology, scientific, business, creative & vocational domains
const VALID_DOMAIN_ROOTS = new Set([
  // Programming & Software Engineering
  'javascript', 'typescript', 'python', 'java', 'c++', 'cpp', 'c#', 'csharp', 'golang', 'go',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'dart', 'r', 'matlab', 'sql', 'nosql',
  'html', 'css', 'react', 'reactjs', 'vue', 'vuejs', 'angular', 'svelte', 'nextjs', 'nuxt',
  'nodejs', 'node', 'express', 'nestjs', 'django', 'fastapi', 'flask', 'spring', 'springboot',
  'rails', 'laravel', 'graphql', 'rest', 'api', 'mongodb', 'postgresql', 'postgres', 'mysql',
  'redis', 'database', 'databases', 'frontend', 'backend', 'fullstack', 'web', 'mobile',
  'android', 'ios', 'flutter', 'react native', 'devops', 'cloud', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'linux', 'git', 'github', 'ci/cd',
  'microservices', 'system design', 'architecture', 'security', 'cybersecurity', 'cryptography',
  'blockchain', 'web3', 'solidity', 'smart contracts', 'testing', 'qa', 'automation',

  // Computer Science & Mathematics
  'data structures', 'algorithms', 'dsa', 'operating systems', 'computer networks',
  'networking', 'compilers', 'computer science', 'discrete math', 'linear algebra',
  'calculus', 'statistics', 'probability', 'boolean algebra',

  // Artificial Intelligence & Data Science
  'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data science',
  'nlp', 'natural language processing', 'computer vision', 'data analytics', 'data analysis',
  'neural networks', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'keras',
  'large language models', 'llm', 'generative ai', 'prompt engineering', 'data engineering',
  'hadoop', 'spark', 'kafka', 'etl', 'tableau', 'power bi', 'business intelligence',

  // Other Engineering, Science, Humanities & Business
  'robotics', 'ros', 'ros2', 'embedded systems', 'iot', 'electronics', 'physics', 'chemistry',
  'biology', 'bioinformatics', 'genetics', 'neuroscience', 'quantum computing',
  'ui', 'ux', 'ui/ux', 'user experience', 'user interface', 'figma', 'product design',
  'product management', 'project management', 'agile', 'scrum', 'marketing', 'digital marketing',
  'seo', 'copywriting', 'finance', 'accounting', 'economics', 'entrepreneurship',
  'graphic design', 'animation', 'video editing', 'blender', '3d modeling', 'game development',
  'unity', 'unreal engine', 'music production', 'photography',
  'history', 'philosophy', 'psychology', 'sociology', 'linguistics', 'literature',
  'law', 'medicine', 'anatomy', 'physiology', 'mechanics', 'circuits',
]);

const ACADEMIC_INDICATORS = new Set([
  'development', 'engineering', 'programming', 'architecture', 'curriculum',
  'course', 'bootcamp', 'algorithms', 'structures', 'analysis', 'analytics',
  'systems', 'design', 'theory', 'foundations', 'fundamentals', 'principles',
  'security', 'infrastructure', 'protocol', 'science', 'management', 'mathematics',
  'studies', 'computation', 'automation', 'modeling', 'intelligence', 'learning',
]);

const NONSENSE_PATTERNS = [
  // Profanity, vulgarity & slang expletives
  /\b(hell|wtf|fuck|fucking|shit|damn|crap|bitch|bastard|asshole|piss|dick|pussy|whore|slut|cunt|suck|stupid|dumb|idiot)\b/i,
  // Conversational questions, filler & chatter
  /\b(what the hell|what is this|who are you|how are you|hello|hi there|hey bro|testing|test 123|nothing|idk|i don'?t know|whatever|random|no idea|help me please|tell me)\b/i,
  // Bodily states, physical functions & sleep
  /\b(sleep|sleeping|nap|bed|tired|exhausted|slumber)\b/i,
  /\b(eat|eating|food|hungry|starving|lunch|dinner|breakfast|snack|cook|cooking|pizza|burger|drink|drinking|thirsty|pee|poop|bath|shower)\b/i,
  // Moods & feelings
  /\b(chill|relax|bored|boring|lazy|hangout|couch|party|clubbing|depressed|crying|sad)\b/i,
  /\b(hate|kill|die|suicide|shut up)\b/i,
  /\b(crypto moon|get rich quick|lottery|gambling|casino|betting)\b/i,
  // Casual video games & entertainment
  /\b(movie|watch tv|netflix|anime|gaming|play(ing)? (video\s?)?games?|videogames?|roblox|fortnite|minecraft|pubg|call of duty|free fire)\b/i,
  /\b(boy|girl|dating|kiss|marry|girlfriend|boyfriend|tinder)\b/i,
  // Casual sports as raw hobby (unless paired with an academic indicator)
  /\b(football|soccer|cricket|basketball|baseball|tennis|volleyball|badminton|swimming|gym|workout|bodybuilding|running)\b/i,
];

export function validateStudyGoalInput(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Please enter what subject or skill you want to learn.' };
  }

  const trimmed = text.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Please enter at least 2 characters.' };
  }

  // Check nonsense, profanity, and chatter patterns
  for (const pattern of NONSENSE_PATTERNS) {
    if (pattern.test(trimmed)) {
      const lower = trimmed.toLowerCase();
      const hasEducationalContext = Array.from(ACADEMIC_INDICATORS).some((ind) => lower.includes(ind));
      const hasProfanity = /\b(hell|wtf|fuck|shit|damn|crap|bitch|bastard|asshole)\b/i.test(trimmed);

      if (hasProfanity || !hasEducationalContext) {
        return {
          isValid: false,
          error: `"${trimmed}" is not a recognized study topic. Please enter a genuine academic subject, technology, or course (e.g. "React and Node.js", "Python Data Science", or "System Design").`,
        };
      }
    }
  }

  // Keyboard smashing check
  if (/([a-zA-Z])\1{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a genuine study subject, technology, or course name.',
    };
  }

  const lower = trimmed.toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ');
  const tokens = lower.split(/\s+/).filter((t) => t.length > 1);

  if (tokens.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a genuine study subject, technology, or course name.',
    };
  }

  const hasDomainRoot = Array.from(VALID_DOMAIN_ROOTS).some((root) => {
    return lower.includes(root) || tokens.includes(root);
  });

  const hasAcademicIndicator = tokens.some((t) => ACADEMIC_INDICATORS.has(t));

  if (!hasDomainRoot && !hasAcademicIndicator) {
    return {
      isValid: false,
      error: `"${trimmed}" is not recognized as a valid educational subject or course. Please enter a genuine academic topic, programming technology, or professional skill (e.g. "React and Node.js", "Python Data Science", or "System Design").`,
    };
  }

  return { isValid: true };
}
