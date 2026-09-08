const { validateLearningGoal } = require('../../src/services/roadmapEngine/domainValidator');

describe('Domain Validator for Study Goals', () => {
  it('should accept valid programming, STEM, and technology learning goals', () => {
    const validGoals = [
      'Full-Stack MERN Development',
      'Data Structures and Algorithms in Java',
      'Frontend Web Development with React',
      'Python for Machine Learning & Deep Learning',
      'DevOps & Containerization with Docker and Kubernetes',
      'Go and Microservices Architecture',
      'Learn SQL and Database Design',
      'Quantum Computing Algorithms',
      'Organic Chemistry',
      'Discrete Mathematics',
      'Football analytics',
    ];

    for (const goal of validGoals) {
      const result = validateLearningGoal(goal);
      expect(result.isValid).toBe(true);
    }
  });

  it('should reject non-educational conversational desires like sleeping, eating, chilling', () => {
    const invalidGoals = [
      'i wanna sleep',
      'I want to sleep all day',
      'i am hungry',
      'wanna eat pizza',
      'chill and watch netflix',
      'play video games',
      'asdfghjk',
      'zzzzzzzzz',
    ];

    for (const goal of invalidGoals) {
      const result = validateLearningGoal(goal);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should reject profanity, exclamations, and random slang expressions', () => {
    const profaneOrSlang = [
      'what the hell',
      'wtf',
      'what the fuck',
      'damn it',
      'this is shit',
      'who are you',
      'what is this',
      'random nonsense',
      'football',
      'minecraft',
    ];

    for (const goal of profaneOrSlang) {
      const result = validateLearningGoal(goal);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should reject empty or whitespace inputs', () => {
    expect(validateLearningGoal('').isValid).toBe(false);
    expect(validateLearningGoal('   ').isValid).toBe(false);
    expect(validateLearningGoal(null).isValid).toBe(false);
  });
});
