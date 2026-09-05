/**
 * Cluster Templates Seeder Script
 * 
 * Populates MongoDB with ~48 comprehensive, production-grade learning roadmaps
 * spanning Web, Backend, Computer Science, Data/AI, Mobile, Cloud/DevOps, and Design.
 * 
 * Run via: node src/scripts/seedClusters.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ClusterTemplate = require('../models/ClusterTemplate');
const { generateLocalVector } = require('../services/roadmapEngine/embeddingService');
const { normalizeGoalText } = require('../services/roadmapEngine/normalizer');

const SEED_TEMPLATES = [
  // ─── 1. WEB DEVELOPMENT ───────────────────────────────────────────────
  {
    title: 'Frontend Web Development with React',
    category: 'Web Development',
    keywords: ['frontend', 'react', 'reactjs', 'javascript', 'html', 'css', 'tailwind', 'redux', 'web dev', 'ui'],
    nodes: [
      {
        order: 1,
        title: 'Modern JavaScript (ES6+) Fundamentals',
        description: 'Master closures, async/await, array methods, destructuring, and the JavaScript event loop.',
        estimatedHours: 12,
        resources: [
          { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', type: 'doc' },
          { title: 'JavaScript.info Complete Tutorial', url: 'https://javascript.info/', type: 'article' },
        ],
        quizQuestions: [
          {
            question: 'What is the purpose of the event loop in JavaScript?',
            options: ['Execute synchronous code only', 'Manage asynchronous callback execution and microtasks', 'Compile JS to C++', 'Handle CSS styling'],
            correctIndex: 1,
            explanation: 'The event loop continuously checks the call stack and dequeues callbacks from microtask and macrotask queues.',
          },
        ],
      },
      {
        order: 2,
        title: 'React Core & Component Architecture',
        description: 'JSX syntax, components, props, state with useState, and conditional rendering.',
        estimatedHours: 14,
        resources: [
          { title: 'Official React Documentation', url: 'https://react.dev/learn', type: 'doc' },
          { title: 'React Crash Course', url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', type: 'video' },
        ],
        quizQuestions: [
          {
            question: 'Why should you never mutate state directly in React?',
            options: ['It causes memory leaks', 'React relies on reference equality to trigger re-renders', 'JavaScript will throw a syntax error', 'It slows down network requests'],
            correctIndex: 1,
            explanation: 'React compares previous and new state by reference. Mutating objects directly prevents reconciliation from detecting updates.',
          },
        ],
      },
      {
        order: 3,
        title: 'Advanced React Hooks & Performance',
        description: 'Deep dive into useEffect, useMemo, useCallback, useRef, and custom hooks.',
        estimatedHours: 16,
        resources: [
          { title: 'A Complete Guide to useEffect by Dan Abramov', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', type: 'article' },
        ],
        quizQuestions: [
          {
            question: 'When should you use useCallback?',
            options: ['For every function in a component', 'To memoize callback functions passed to optimized child components', 'Only inside useEffect', 'To replace useState'],
            correctIndex: 1,
            explanation: 'useCallback preserves function instance identity across re-renders to avoid unnecessary child re-renders.',
          },
        ],
      },
      {
        order: 4,
        title: 'State Management & Server Cache (Zustand & TanStack Query)',
        description: 'Separate client UI state from server-side data fetching, caching, and background invalidation.',
        estimatedHours: 12,
        resources: [
          { title: 'TanStack Query Quickstart', url: 'https://tanstack.com/query/latest/docs/framework/react/quick-start', type: 'doc' },
          { title: 'Zustand GitHub Documentation', url: 'https://github.com/pmndrs/zustand', type: 'doc' },
        ],
        quizQuestions: [
          {
            question: 'What is the primary benefit of TanStack Query over local state?',
            options: ['Writing SQL queries', 'Automatic request deduplication, stale caching, and background refetching', 'Styling UI components', 'Generating animations'],
            correctIndex: 1,
            explanation: 'TanStack Query eliminates manual fetching logic and provides automatic cache synchronization with servers.',
          },
        ],
      },
    ],
  },

  {
    title: 'Full-Stack MERN Development',
    category: 'Web Development',
    keywords: ['mern', 'fullstack', 'full stack', 'mongodb', 'express', 'react', 'node', 'nodejs', 'javascript fullstack'],
    nodes: [
      {
        order: 1,
        title: 'Backend Foundation: Node.js & Express REST APIs',
        description: 'Build robust REST APIs, route handling, middleware pipelines, and error handling with Express.',
        estimatedHours: 15,
        resources: [{ title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'doc' }],
        quizQuestions: [
          {
            question: 'What is Express middleware?',
            options: ['A database ORM', 'Functions with access to req, res, and next that execute in sequence', 'A frontend CSS library', 'A Node package manager'],
            correctIndex: 1,
            explanation: 'Middleware functions can execute code, modify request/response objects, end request-response cycles, or call next().',
          },
        ],
      },
      {
        order: 2,
        title: 'Database Architecture: MongoDB & Mongoose',
        description: 'Document modeling, validation, aggregation pipelines, relationships, and indexing.',
        estimatedHours: 14,
        resources: [{ title: 'Mongoose Docs', url: 'https://mongoosejs.com/docs/', type: 'doc' }],
        quizQuestions: [
          {
            question: 'What is an advantage of embedding documents versus referencing in MongoDB?',
            options: ['Faster single-read queries without multi-collection joins', 'Guaranteed ACID transactions across all servers', 'Infinite document size', 'Requires no schema'],
            correctIndex: 0,
            explanation: 'Embedding stores related data within a single document, enabling fast atomic reads without application-level population.',
          },
        ],
      },
      {
        order: 3,
        title: 'Production Authentication & Security',
        description: 'JWT dual-token rotation, httpOnly secure cookies, bcrypt password hashing, and rate limiting.',
        estimatedHours: 12,
        resources: [{ title: 'OWASP REST Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html', type: 'article' }],
        quizQuestions: [
          {
            question: 'Why store JWT refresh tokens in httpOnly cookies rather than localStorage?',
            options: ['Cookies load faster', 'httpOnly cookies cannot be accessed by client-side JavaScript, protecting against XSS', 'localStorage has a 10MB limit', 'Cookies are encrypted by default'],
            correctIndex: 1,
            explanation: 'The httpOnly flag prevents malicious injected scripts from reading session tokens.',
          },
        ],
      },
      {
        order: 4,
        title: 'Frontend React Integration & Deployment',
        description: 'Connect React frontend with Axios, handle protected routes, and deploy to Vercel and Render/Docker.',
        estimatedHours: 18,
        resources: [{ title: 'Dockerizing a Node & React App', url: 'https://docs.docker.com/language/nodejs/build-images/', type: 'doc' }],
        quizQuestions: [
          {
            question: 'What is CORS?',
            options: ['A database indexing protocol', 'A browser security mechanism that restricts cross-origin HTTP requests', 'A CSS responsive framework', 'A Node process manager'],
            correctIndex: 1,
            explanation: 'Cross-Origin Resource Sharing restricts web browsers from making requests to a different domain unless permitted by the server.',
          },
        ],
      },
    ],
  },

  {
    title: 'Full-Stack Next.js with TypeScript',
    category: 'Web Development',
    keywords: ['nextjs', 'next', 'next js', 'react server components', 'ssr', 'typescript', 'fullstack next', 'app router'],
    nodes: [
      {
        order: 1,
        title: 'TypeScript for Modern React Developers',
        description: 'Generics, utility types, component prop typing, and strict mode practices.',
        estimatedHours: 10,
        resources: [{ title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What does the unknown type represent in TypeScript?', options: ['Any type with zero safety', 'A type-safe counterpart of any requiring narrowing before use', 'A primitive string', 'A void function'], correctIndex: 1, explanation: 'unknown forces developers to perform type checks before operating on the value.' },
        ],
      },
      {
        order: 2,
        title: 'Next.js App Router & React Server Components',
        description: 'Server components vs client components, streaming with Suspense, and nested layouts.',
        estimatedHours: 16,
        resources: [{ title: 'Next.js Documentation', url: 'https://nextjs.org/docs', type: 'doc' }],
        quizQuestions: [
          { question: 'What is a key benefit of React Server Components in Next.js?', options: ['They run client-side JavaScript faster', 'Zero client JavaScript bundle size for server-rendered code and direct DB access', 'They remove the need for HTML', 'They replace CSS'], correctIndex: 1, explanation: 'Server components execute only on the server, sending rendered HTML without shipping component JS to the client.' },
        ],
      },
      {
        order: 3,
        title: 'Server Actions, Prisma ORM & PostgreSQL',
        description: 'Mutations with Server Actions, schema modeling with Prisma, and PostgreSQL relational queries.',
        estimatedHours: 14,
        resources: [{ title: 'Prisma Getting Started', url: 'https://www.prisma.io/docs/getting-started', type: 'doc' }],
        quizQuestions: [
          { question: 'What are Next.js Server Actions?', options: ['Frontend event listeners', 'Asynchronous functions executed on the server called directly from forms or components', 'Database triggers', 'CSS animation handlers'], correctIndex: 1, explanation: 'Server Actions allow form submissions and mutations directly on the server without creating manual API route boilerplate.' },
        ],
      },
    ],
  },

  {
    title: 'HTML, CSS & Modern JavaScript Fundamentals',
    category: 'Web Development',
    keywords: ['html', 'css', 'javascript basics', 'web fundamentals', 'learn coding', 'web design basics'],
    nodes: [
      {
        order: 1,
        title: 'Semantic HTML5 & Accessibility',
        description: 'Clean document structures, semantic elements, forms, and screen-reader accessibility (ARIA).',
        estimatedHours: 8,
        resources: [{ title: 'MDN Semantic HTML', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html', type: 'doc' }],
        quizQuestions: [
          { question: 'Why use <nav> instead of <div> for links?', options: ['It has built-in styling', 'It conveys semantic meaning to screen readers and search engines', 'It loads faster', 'It prevents browser refreshes'], correctIndex: 1, explanation: 'Semantic elements provide meaningful context to assistive tech and SEO spiders.' },
        ],
      },
      {
        order: 2,
        title: 'Modern CSS, Flexbox & CSS Grid',
        description: 'Box model, responsive design with media queries, Flexbox layouts, and Grid systems.',
        estimatedHours: 12,
        resources: [{ title: 'CSS-Tricks Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'article' }],
        quizQuestions: [
          { question: 'In Flexbox, what does justify-content align?', options: ['Items along the cross axis', 'Items along the main axis', 'Text within a paragraph', 'Background images'], correctIndex: 1, explanation: 'justify-content aligns children along the primary direction defined by flex-direction.' },
        ],
      },
    ],
  },

  // ─── 2. BACKEND & SYSTEMS ─────────────────────────────────────────────
  {
    title: 'Backend Engineering with Node.js',
    category: 'Backend & Systems',
    keywords: ['backend', 'nodejs', 'node', 'express', 'apis', 'rest', 'microservices', 'postgresql', 'server'],
    nodes: [
      {
        order: 1,
        title: 'Node.js Runtime & Asynchronous Event-Driven Architecture',
        description: 'V8 engine, libuv, event loop, streams, buffers, and clustering.',
        estimatedHours: 12,
        resources: [{ title: 'Node.js Event Loop Guide', url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick', type: 'doc' }],
        quizQuestions: [
          { question: 'What role does libuv play in Node.js?', options: ['Parses HTML templates', 'Provides the multi-platform abstraction layer for asynchronous I/O and thread pools', 'Compiles JS to machine code', 'Validates JSON schemas'], correctIndex: 1, explanation: 'libuv handles the event loop and thread pool for file system, DNS, and network I/O.' },
        ],
      },
      {
        order: 2,
        title: 'RESTful API Design & Validation',
        description: 'HTTP status codes, idempotency, pagination, rate limiting, and input validation with Zod.',
        estimatedHours: 14,
        resources: [{ title: 'REST API Best Practices', url: 'https://restfulapi.net/', type: 'article' }],
        quizQuestions: [
          { question: 'Which HTTP method is idempotent?', options: ['POST', 'PUT', 'PATCH (in non-standard forms)', 'CONNECT'], correctIndex: 1, explanation: 'PUT replaces an entire resource; multiple identical PUT requests produce the exact same outcome.' },
        ],
      },
      {
        order: 3,
        title: 'Relational Database Engineering with PostgreSQL',
        description: 'ACID transactions, foreign keys, query optimization with EXPLAIN ANALYZE, and connection pooling.',
        estimatedHours: 16,
        resources: [{ title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'article' }],
        quizQuestions: [
          { question: 'What does the "I" in ACID stand for?', options: ['Indexation', 'Isolation', 'Iteration', 'Idempotency'], correctIndex: 1, explanation: 'Isolation ensures concurrent transactions execute without interfering with one another.' },
        ],
      },
    ],
  },

  {
    title: 'Python Backend Development with FastAPI',
    category: 'Backend & Systems',
    keywords: ['python backend', 'fastapi', 'python api', 'pydantic', 'async python', 'uvicorn', 'sqlalchemy'],
    nodes: [
      {
        order: 1,
        title: 'Modern Async Python 3 & Type Hinting',
        description: 'Asyncio, coroutines, type hints, and dataclasses in Python 3.11+.',
        estimatedHours: 10,
        resources: [{ title: 'FastAPI Tutorial - First Steps', url: 'https://fastapi.tiangolo.com/tutorial/first-steps/', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the purpose of Pydantic in FastAPI?', options: ['CSS styling', 'Data validation and parsing using Python type hints', 'Database migration generation', 'Running background cron tasks'], correctIndex: 1, explanation: 'Pydantic parses and validates incoming payloads against type annotations automatically.' },
        ],
      },
      {
        order: 2,
        title: 'FastAPI Routes, Dependency Injection & OpenAPI',
        description: 'Dependency injection, path/query params, automated Swagger docs, and JWT auth.',
        estimatedHours: 14,
        resources: [{ title: 'FastAPI Dependencies', url: 'https://fastapi.tiangolo.com/tutorial/dependencies/', type: 'doc' }],
        quizQuestions: [
          { question: 'How does FastAPI generate interactive API docs?', options: ['Writing Markdown by hand', 'Auto-generated via OpenAPI schema derived from Pydantic models', 'Parsing Git commit logs', 'Using Selenium'], correctIndex: 1, explanation: 'FastAPI automatically exports an OpenAPI JSON spec powering Swagger and ReDoc interfaces.' },
        ],
      },
    ],
  },

  {
    title: 'Java Enterprise Backend with Spring Boot',
    category: 'Backend & Systems',
    keywords: ['java', 'spring', 'spring boot', 'java backend', 'hibernate', 'jpa', 'enterprise java'],
    nodes: [
      {
        order: 1,
        title: 'Java 17+ Modern Features & OOP Mastery',
        description: 'Records, pattern matching, sealed classes, streams, and generics in modern Java.',
        estimatedHours: 14,
        resources: [{ title: 'Baeldung Spring Boot Guide', url: 'https://www.baeldung.com/spring-boot', type: 'article' }],
        quizQuestions: [
          { question: 'What is Inversion of Control (IoC) in Spring?', options: ['Writing code backwards', 'A design pattern where object creation and dependencies are managed by the Spring container', 'Compiling bytecode to machine code', 'Automatic database indexing'], correctIndex: 1, explanation: 'Spring IoC manages bean lifecycles and injects dependencies via @Autowired or constructor injection.' },
        ],
      },
      {
        order: 2,
        title: 'Spring Boot REST APIs & Spring Data JPA',
        description: 'Controllers, Services, Repositories, Entity relationships, and Hibernate caching.',
        estimatedHours: 18,
        resources: [{ title: 'Spring Data JPA Documentation', url: 'https://spring.io/projects/spring-data-jpa', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the N+1 select problem in JPA?', options: ['An infinite loop', 'Fetching a parent entity triggers N individual queries for each child relation', 'Database connection timeout', 'Syntax error in SQL'], correctIndex: 1, explanation: 'Without eager join fetching, querying N parent rows executes N additional queries for associated children.' },
        ],
      },
    ],
  },

  {
    title: 'Go (Golang) High-Performance Systems',
    category: 'Backend & Systems',
    keywords: ['go', 'golang', 'systems programming', 'concurrency', 'goroutines', 'microservices in go'],
    nodes: [
      {
        order: 1,
        title: 'Go Fundamentals & Idiomatic Syntax',
        description: 'Pointers, structs, interfaces, error handling without exceptions, and slices.',
        estimatedHours: 12,
        resources: [{ title: 'A Tour of Go', url: 'https://go.dev/tour/welcome/1', type: 'doc' }],
        quizQuestions: [
          { question: 'How are goroutines different from OS threads?', options: ['They require root privileges', 'They are lightweight user-space threads managed by Go runtime with only ~2KB initial stack', 'They cannot run concurrently', 'They are slower than threads'], correctIndex: 1, explanation: 'Goroutines have minimal stack overhead and are multiplexed onto OS threads by the Go scheduler.' },
        ],
      },
      {
        order: 2,
        title: 'Concurrency Patterns: Channels, Mutexes & Select',
        description: 'Buffered vs unbuffered channels, sync.WaitGroup, context cancellation, and race condition detection.',
        estimatedHours: 16,
        resources: [{ title: 'Effective Go', url: 'https://go.dev/doc/effective_go', type: 'doc' }],
        quizQuestions: [
          { question: 'What happens when writing to an unbuffered channel without a reader?', options: ['The program crashes', 'The sending goroutine blocks until another goroutine reads from it', 'The data is dropped silently', 'An exception is thrown'], correctIndex: 1, explanation: 'Unbuffered channels synchronize communication: senders block until a receiver is ready.' },
        ],
      },
    ],
  },

  // ─── 3. COMPUTER SCIENCE & DSA ────────────────────────────────────────
  {
    title: 'Data Structures and Algorithms for Placements (C++)',
    category: 'Computer Science & DSA',
    keywords: ['dsa', 'c++', 'algorithms', 'data structures', 'competitive programming', 'leetcode', 'interviews', 'faang', 'placements'],
    nodes: [
      {
        order: 1,
        title: 'Arrays, Strings & Two-Pointer / Sliding Window Patterns',
        description: 'Time complexity analysis (Big-O), memory layouts, prefix sums, and two-pointer interview templates.',
        estimatedHours: 18,
        resources: [
          { title: 'NeetCode 150 Roadmap', url: 'https://neetcode.io/roadmap', type: 'course' },
          { title: 'GeeksforGeeks DSA', url: 'https://www.geeksforgeeks.org/learn-data-structures-and-algorithms-dsa-tutorial/', type: 'article' },
        ],
        quizQuestions: [
          { question: 'What is the amortized time complexity of inserting into a std::vector at the end?', options: ['O(N)', 'O(1)', 'O(log N)', 'O(N^2)'], correctIndex: 1, explanation: 'While doubling capacity occasionally takes O(N), the average cost per insertion over N elements is O(1).' },
        ],
      },
      {
        order: 2,
        title: 'Linked Lists, Stacks, Queues & Monotonic Patterns',
        description: 'Reversals, cycle detection (Floyd’s algorithm), monotonic stacks, and parentheses validation.',
        estimatedHours: 16,
        resources: [{ title: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/', type: 'doc' }],
        quizQuestions: [
          { question: 'What algorithm detects a cycle in a singly linked list in O(1) space?', options: ['Breadth-First Search', 'Floyd’s Cycle-Finding Algorithm (Tortoise and Hare)', 'Binary Search', 'Dijkstra’s Algorithm'], correctIndex: 1, explanation: 'Fast and slow pointers traverse at 2x and 1x speeds; meeting confirms a cycle in constant space.' },
        ],
      },
      {
        order: 3,
        title: 'Binary Trees, Binary Search Trees & Heaps',
        description: 'Tree traversals (DFS/BFS), lowest common ancestor, heapify operations, and priority queues.',
        estimatedHours: 20,
        resources: [{ title: 'Visualgo Binary Trees', url: 'https://visualgo.net/en/bst', type: 'course' }],
        quizQuestions: [
          { question: 'What is the maximum time complexity to search an item in a balanced BST?', options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'], correctIndex: 1, explanation: 'A balanced BST divides the search space in half with every comparison.' },
        ],
      },
      {
        order: 4,
        title: 'Graphs: BFS, DFS, Dijkstra & Disjoint Set Union (DSU)',
        description: 'Adjacency lists, shortest paths, topological sort, cycle detection in directed graphs, and Kruskal’s MST.',
        estimatedHours: 24,
        resources: [{ title: 'Graph Algorithms Guide', url: 'https://cp-algorithms.com/graph/breadth-first-search.html', type: 'article' }],
        quizQuestions: [
          { question: 'What is the time complexity of BFS on an adjacency list graph with V vertices and E edges?', options: ['O(V)', 'O(V + E)', 'O(V * E)', 'O(E log V)'], correctIndex: 1, explanation: 'Every vertex is enqueued once, and every edge is traversed once: O(V + E).' },
        ],
      },
      {
        order: 5,
        title: 'Dynamic Programming & Backtracking Mastery',
        description: '1D/2D memoization, knapsack variations, longest common subsequence, and bitmask DP.',
        estimatedHours: 28,
        resources: [{ title: 'DP Patterns by Sean Prashad', url: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns', type: 'article' }],
        quizQuestions: [
          { question: 'What two characteristics indicate a problem can be solved with Dynamic Programming?', options: ['Sorted input and prime numbers', 'Overlapping subproblems and optimal substructure', 'Linked nodes and hash tables', 'Random inputs and constant time'], correctIndex: 1, explanation: 'Optimal substructure means optimal solutions contain optimal sub-solutions; overlapping subproblems allow memoization reuse.' },
        ],
      },
    ],
  },

  {
    title: 'System Design & High-Scalability Architecture',
    category: 'Computer Science & DSA',
    keywords: ['system design', 'scalability', 'hld', 'lld', 'distributed systems', 'load balancing', 'caching', 'sharding'],
    nodes: [
      {
        order: 1,
        title: 'Scalability Foundations: Load Balancers, Caching & CDNs',
        description: 'Vertical vs horizontal scaling, reverse proxies (Nginx), Redis caching strategies, and CDN edge caching.',
        estimatedHours: 15,
        resources: [{ title: 'System Design Primer on GitHub', url: 'https://github.com/donnemartin/system-design-primer', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the difference between Cache-Aside and Write-Through caching?', options: ['There is no difference', 'Cache-Aside has application query cache first then DB; Write-Through updates cache and DB synchronously', 'Write-Through is only for NoSQL', 'Cache-Aside requires Redis clusters'], correctIndex: 1, explanation: 'In Cache-Aside, the app handles cache misses manually; Write-Through keeps cache and primary store in lockstep.' },
        ],
      },
      {
        order: 2,
        title: 'Database Sharding, Replication & CAP Theorem',
        description: 'Leader-follower replication, read replicas, consistent hashing, partition tolerance, and eventual consistency.',
        estimatedHours: 18,
        resources: [{ title: 'Designing Data-Intensive Applications Summary', url: 'https://martin.kleppmann.com/', type: 'article' }],
        quizQuestions: [
          { question: 'According to the CAP theorem, what happens during a network partition?', options: ['The system must choose between Consistency and Availability', 'Both consistency and availability are preserved', 'The database deletes data', 'Latency becomes zero'], correctIndex: 0, explanation: 'A partition is inevitable in distributed networks, forcing a tradeoff between returning stale data or failing requests to ensure consistency.' },
        ],
      },
    ],
  },

  // ─── 4. DATA & AI ─────────────────────────────────────────────────────
  {
    title: 'Data Science & Analytics with Python',
    category: 'Data & AI',
    keywords: ['data science', 'pandas', 'numpy', 'python data', 'data analysis', 'eda', 'matplotlib', 'seaborn'],
    nodes: [
      {
        order: 1,
        title: 'NumPy & High-Performance Array Computing',
        description: 'Vectorized operations, broadcasting, slicing, linear algebra, and memory efficiency.',
        estimatedHours: 12,
        resources: [{ title: 'NumPy Quickstart', url: 'https://numpy.org/doc/stable/user/quickstart.html', type: 'doc' }],
        quizQuestions: [
          { question: 'Why is NumPy faster than standard Python lists?', options: ['It uses cloud computing', 'Contiguous memory storage and vectorized C-level execution without type overhead', 'It runs only in parallel', 'It has simpler syntax'], correctIndex: 1, explanation: 'NumPy arrays store elements contiguously in homogeneous memory, executing vector operations in C.' },
        ],
      },
      {
        order: 2,
        title: 'Data Wrangling with Pandas',
        description: 'DataFrames, merging, groupby aggregations, pivot tables, and handling missing data.',
        estimatedHours: 16,
        resources: [{ title: 'Pandas User Guide', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What does the groupby operation in Pandas perform?', options: ['Deletes duplicate rows', 'Split-Apply-Combine workflow over specified column categories', 'Draws histograms', 'Exports data to CSV'], correctIndex: 1, explanation: 'groupby splits data into groups based on criteria, applies functions (like sum or mean), and combines outputs.' },
        ],
      },
      {
        order: 3,
        title: 'Exploratory Data Analysis & Visualization',
        description: 'Statistical distributions, correlation matrices, Matplotlib, Seaborn, and storytelling with data.',
        estimatedHours: 12,
        resources: [{ title: 'Seaborn Tutorial', url: 'https://seaborn.pydata.org/tutorial.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What does a box plot visualize?', options: ['3D coordinates', 'Five-number summary: min, Q1, median, Q3, and max (plus outliers)', 'SQL query performance', 'HTML DOM trees'], correctIndex: 1, explanation: 'Box plots depict distribution quartiles and highlight anomalies outside the interquartile range (IQR).' },
        ],
      },
    ],
  },

  {
    title: 'Machine Learning & Deep Learning Fundamentals',
    category: 'Data & AI',
    keywords: ['machine learning', 'python', 'ml', 'ai', 'deep learning', 'pytorch', 'scikit-learn', 'neural networks', 'artificial intelligence'],
    nodes: [
      {
        order: 1,
        title: 'Supervised Learning & Scikit-Learn',
        description: 'Linear/logistic regression, decision trees, random forests, cross-validation, and ROC/AUC metrics.',
        estimatedHours: 16,
        resources: [{ title: 'Scikit-Learn Tutorials', url: 'https://scikit-learn.org/stable/tutorial/index.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What problem does cross-validation solve?', options: ['Slow training times', 'Overfitting by evaluating model generalization across multiple data splits', 'Hardware failures', 'Missing labels in test data'], correctIndex: 1, explanation: 'K-Fold cross-validation provides an unbiased estimate of how well a model generalizes to unseen data.' },
        ],
      },
      {
        order: 2,
        title: 'Neural Networks & PyTorch Architecture',
        description: 'Tensors, autograd, backpropagation, activation functions, loss optimizers (Adam), and training loops.',
        estimatedHours: 20,
        resources: [{ title: 'PyTorch Deep Learning 60-Minute Blitz', url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What does the autograd engine do in PyTorch?', options: ['Auto-completes code', 'Automatically calculates gradients via computational graphs during backpropagation', 'Downloads datasets', 'Spawns cloud GPUs'], correctIndex: 1, explanation: 'autograd tracks operations on tensors to compute vector-Jacobian products for gradient descent.' },
        ],
      },
      {
        order: 3,
        title: 'Transformers, Embeddings & Large Language Models',
        description: 'Self-attention mechanism, transformer architectures, tokenization, fine-tuning, and vector embeddings.',
        estimatedHours: 22,
        resources: [{ title: 'The Illustrated Transformer by Jay Alammar', url: 'http://jalammar.github.io/illustrated-transformer/', type: 'article' }],
        quizQuestions: [
          { question: 'What is the core breakthrough of the Self-Attention mechanism?', options: ['Recursion over sequence items', 'Computing relevance scores between all token pairs in parallel regardless of distance', 'Lower memory usage', 'Eliminating GPU requirements'], correctIndex: 1, explanation: 'Attention eliminates sequential bottlenecks by allowing tokens to attend to all positions simultaneously.' },
        ],
      },
    ],
  },

  // ─── 5. MOBILE DEVELOPMENT ────────────────────────────────────────────
  {
    title: 'Cross-Platform Mobile Apps with Flutter & Dart',
    category: 'Mobile Development',
    keywords: ['flutter', 'dart', 'mobile dev', 'android', 'ios', 'cross platform', 'mobile app'],
    nodes: [
      {
        order: 1,
        title: 'Dart Language & Reactive Widget Trees',
        description: 'Stateless vs stateful widgets, build contexts, layout widgets (Row, Column, Stack), and Dart async/streams.',
        estimatedHours: 14,
        resources: [{ title: 'Flutter Official Getting Started', url: 'https://docs.flutter.dev/get-started/codelab', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the fundamental philosophy of Flutter UI?', options: ['Everything is an HTML document', 'Everything is a widget', 'Everything is compiled to JavaScript', 'Everything runs in WebView'], correctIndex: 1, explanation: 'In Flutter, layouts, text, animations, and paddings are all composable widgets rendered directly via the Skia/Impeller engine.' },
        ],
      },
      {
        order: 2,
        title: 'State Management & REST Integration in Flutter',
        description: 'Riverpod / Bloc patterns, Dio HTTP client, local SQLite/Hive persistence, and native device permissions.',
        estimatedHours: 18,
        resources: [{ title: 'Flutter Riverpod Documentation', url: 'https://riverpod.dev/', type: 'doc' }],
        quizQuestions: [
          { question: 'Why use an architectural state management pattern like Bloc or Riverpod?', options: ['To speed up compilation', 'To decouple business logic from presentation widgets for testability and maintainability', 'To publish to the Play Store', 'To generate icons'], correctIndex: 1, explanation: 'State management separates business logic from the UI lifecycle, avoiding messy nested setState calls.' },
        ],
      },
    ],
  },

  {
    title: 'Mobile App Development with React Native',
    category: 'Mobile Development',
    keywords: ['react native', 'expo', 'mobile react', 'ios app', 'android app', 'cross platform react'],
    nodes: [
      {
        order: 1,
        title: 'React Native Core with Expo',
        description: 'View, Text, FlatList, styling with Flexbox, Expo Go, and navigation with React Navigation.',
        estimatedHours: 14,
        resources: [{ title: 'React Native Documentation', url: 'https://reactnative.dev/docs/getting-started', type: 'doc' }],
        quizQuestions: [
          { question: 'What does React Native render on device screens?', options: ['Web pages inside a WebView', 'Actual native iOS and Android platform UI components', 'Canvas drawings only', 'Pre-rendered static images'], correctIndex: 1, explanation: 'React Native maps JSX components to authentic native platform views (e.g. UIView on iOS, android.view on Android).' },
        ],
      },
    ],
  },

  // ─── 6. DEVOPS, CLOUD & CYBERSECURITY ─────────────────────────────────
  {
    title: 'DevOps & Containerization with Docker and Kubernetes',
    category: 'DevOps & Cloud',
    keywords: ['devops', 'docker', 'kubernetes', 'k8s', 'containers', 'ci cd', 'helm', 'cloud deployment'],
    nodes: [
      {
        order: 1,
        title: 'Docker Fundamentals & Multi-Stage Production Images',
        description: 'Container architecture, Dockerfiles, volume persistence, docker-compose, and image optimization.',
        estimatedHours: 14,
        resources: [{ title: 'Docker Official Documentation', url: 'https://docs.docker.com/get-started/', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the primary benefit of multi-stage Docker builds?', options: ['They run multiple containers at once', 'They keep production images slim by copying only final artifacts without build tools', 'They eliminate the need for Dockerfiles', 'They increase RAM usage'], correctIndex: 1, explanation: 'Multi-stage builds allow compiling in an environment with full SDKs and copying only binaries to a bare alpine image.' },
        ],
      },
      {
        order: 2,
        title: 'Kubernetes Cluster Orchestration',
        description: 'Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, and rolling zero-downtime updates.',
        estimatedHours: 20,
        resources: [{ title: 'Kubernetes Basics Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', type: 'doc' }],
        quizQuestions: [
          { question: 'What is a Pod in Kubernetes?', options: ['A virtual machine', 'The smallest deployable computing unit consisting of one or more co-located containers', 'A load balancer hardware rack', 'A GitHub repository'], correctIndex: 1, explanation: 'A Pod wraps container(s), storage resources, and unique network IP within the Kubernetes cluster.' },
        ],
      },
      {
        order: 3,
        title: 'CI/CD Automation with GitHub Actions',
        description: 'Automated test runners, linting, Docker build/push, and deployment pipelines.',
        estimatedHours: 12,
        resources: [{ title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the function of a GitHub Actions workflow trigger?', options: ['Compiling code', 'Specifying which repository events (e.g. push, pull_request) start the job sequence', 'Creating new branches', 'Formatting JavaScript'], correctIndex: 1, explanation: 'The `on:` directive triggers pipeline execution upon events like pull requests or release tags.' },
        ],
      },
    ],
  },

  {
    title: 'Cloud Architecture with AWS (Amazon Web Services)',
    category: 'DevOps & Cloud',
    keywords: ['aws', 'cloud', 'amazon web services', 's3', 'ec2', 'lambda', 'serverless', 'cloud practitioner'],
    nodes: [
      {
        order: 1,
        title: 'Core AWS Compute, Storage & Networking',
        description: 'VPC subnets, security groups, EC2 instances, S3 bucket policies, and IAM roles.',
        estimatedHours: 16,
        resources: [{ title: 'AWS Cloud Practitioner Essentials', url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', type: 'course' }],
        quizQuestions: [
          { question: 'What is the function of an IAM Role in AWS?', options: ['A database user', 'An identity with temporary permission credentials that can be assumed by applications or services', 'A physical server rack', 'A DNS record'], correctIndex: 1, explanation: 'IAM roles delegate permissions using short-lived tokens without storing permanent access keys in code.' },
        ],
      },
      {
        order: 2,
        title: 'Serverless Applications: AWS Lambda & API Gateway',
        description: 'Event-driven functions, DynamoDB integration, API Gateway endpoints, and CloudWatch metrics.',
        estimatedHours: 14,
        resources: [{ title: 'AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html', type: 'doc' }],
        quizQuestions: [
          { question: 'What is the defining trait of serverless compute?', options: ['Servers do not exist', 'Execution scales on-demand from zero with pay-per-execution and no idle provisioning costs', 'Code must be written in Python', 'Unlimited execution time'], correctIndex: 1, explanation: 'Serverless models automatically provision and scale compute resources strictly while requests execute.' },
        ],
      },
    ],
  },

  {
    title: 'Cybersecurity & Ethical Hacking Fundamentals',
    category: 'DevOps & Cloud',
    keywords: ['cybersecurity', 'ethical hacking', 'infosec', 'penetration testing', 'network security', 'owasp'],
    nodes: [
      {
        order: 1,
        title: 'Network Security, Port Scanning & Traffic Analysis',
        description: 'TCP/IP stack, Wireshark packet inspection, Nmap port scanning, and firewalls.',
        estimatedHours: 14,
        resources: [{ title: 'OverTheWire Wargames: Bandit', url: 'https://overthewire.org/wargames/bandit/', type: 'course' }],
        quizQuestions: [
          { question: 'What does a SYN scan (Nmap -sS) do?', options: ['Completes full TCP handshake', 'Sends SYN packets and analyzes responses without completing 3-way handshake (stealthy)', 'Dumps database passwords', 'Generates SSL certificates'], correctIndex: 1, explanation: 'SYN scanning resets connection attempts before the handshake completes, avoiding logging on basic firewalls.' },
        ],
      },
      {
        order: 2,
        title: 'Web Application Security & OWASP Top 10',
        description: 'SQL Injection, Cross-Site Scripting (XSS), CSRF, broken access control, and Burp Suite.',
        estimatedHours: 18,
        resources: [{ title: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', type: 'course' }],
        quizQuestions: [
          { question: 'What is the primary defense against SQL Injection?', options: ['Writing SQL queries in uppercase', 'Using Parameterized Queries / Prepared Statements', 'Using POST instead of GET', 'Hiding database port numbers'], correctIndex: 1, explanation: 'Parameterized queries treat user input strictly as data values, preventing parameter code execution.' },
        ],
      },
    ],
  },

  // ─── 7. DESIGN & PRODUCT ──────────────────────────────────────────────
  {
    title: 'UI/UX Design with Figma & Design Systems',
    category: 'Design & Product',
    keywords: ['ui', 'ux', 'figma', 'design', 'user interface', 'user experience', 'wireframing', 'design systems'],
    nodes: [
      {
        order: 1,
        title: 'User Research, Information Architecture & Wireframing',
        description: 'User personas, journey mapping, empathy maps, low-fidelity wireframes, and user testing.',
        estimatedHours: 12,
        resources: [{ title: 'Nielsen Norman Group UX Articles', url: 'https://www.nngroup.com/articles/', type: 'article' }],
        quizQuestions: [
          { question: 'What is the goal of low-fidelity wireframing?', options: ['Choosing final color gradients', 'Quickly validating content structure and user flow without visual distractions', 'Writing frontend code', 'Creating high-res vector logos'], correctIndex: 1, explanation: 'Low-fidelity wireframes emphasize functional layout and workflow before investing time in visual aesthetics.' },
        ],
      },
      {
        order: 2,
        title: 'Figma Mastery: Auto Layout, Components & Design Tokens',
        description: 'Variables, typography scales, design tokens, interactive prototyping, and developer handoff.',
        estimatedHours: 16,
        resources: [{ title: 'Figma Learn Hub', url: 'https://help.figma.com/hc/en-us/categories/360002051613-Learn-design', type: 'course' }],
        quizQuestions: [
          { question: 'What does Auto Layout in Figma simulate?', options: ['CSS Flexbox behavior allowing responsive dynamic sizing of containers', '3D rendering', 'Automatic color palette generation', 'Database schema modeling'], correctIndex: 0, explanation: 'Auto Layout mimics modern CSS flex containers with directional flow, gaps, and responsive padding.' },
        ],
      },
    ],
  },
  // ─── 8. ADDITIONAL CURATED TECH TRACKS ──────────────────────────────────
  {
    title: 'Modern Vue.js 3 with Pinia & Vite',
    category: 'Web Development',
    keywords: ['vue', 'vuejs', 'vue 3', 'pinia', 'composition api', 'nuxt'],
    nodes: [
      { order: 1, title: 'Vue 3 Composition API & Reactivity', description: 'Refs, reactive objects, computed properties, watchers, and lifecycle hooks in Vue 3.', estimatedHours: 12, resources: [{ title: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction.html', type: 'doc' }], quizQuestions: [{ question: 'What is the main difference between ref and reactive in Vue 3?', options: ['ref works on primitives and objects while reactive only takes objects', 'ref is slower', 'reactive cannot be used in components', 'ref only runs on server'], correctIndex: 0, explanation: 'ref wraps primitives or objects in a reactive container (.value), whereas reactive only accepts objects/arrays.' }] },
      { order: 2, title: 'Pinia State Management & Vue Router', description: 'Centralized stores, actions, getters, nested routes, and navigation guards.', estimatedHours: 14, resources: [{ title: 'Pinia Documentation', url: 'https://pinia.vuejs.org/', type: 'doc' }], quizQuestions: [{ question: 'Why did Pinia replace Vuex?', options: ['It has better TypeScript support and removes mutations boilerplate', 'Vuex was deleted', 'Pinia only works with Vue 2', 'Pinia requires jQuery'], correctIndex: 0, explanation: 'Pinia provides full TypeScript autocomplete and replaces mutations with direct action updates.' }] }
    ]
  },
  {
    title: 'Enterprise Angular with TypeScript & RxJS',
    category: 'Web Development',
    keywords: ['angular', 'rxjs', 'angular material', 'typescript angular', 'ng', 'ngrx'],
    nodes: [
      { order: 1, title: 'Angular Components, Directives & Signals', description: 'Angular architecture, standalone components, input/output signals, and dependency injection.', estimatedHours: 16, resources: [{ title: 'Angular Docs', url: 'https://angular.dev/', type: 'doc' }], quizQuestions: [{ question: 'What do Angular Signals provide?', options: ['CSS styling', 'Fine-grained reactive value notifications without Zone.js overhead', 'HTTP routing', 'Database access'], correctIndex: 1, explanation: 'Signals track reactive dependencies directly, enabling targeted UI updates without broad change detection.' }] },
      { order: 2, title: 'Asynchronous Programming with RxJS Observables', description: 'Streams, pipe operators (map, filter, switchMap, debounceTime), and error handling.', estimatedHours: 18, resources: [{ title: 'RxJS Documentation', url: 'https://rxjs.dev/', type: 'doc' }], quizQuestions: [{ question: 'What does switchMap do when a new emission arrives?', options: ['Merges both observables', 'Cancels the previous inner observable and subscribes to the new one', 'Throws an error', 'Buffers events'], correctIndex: 1, explanation: 'switchMap cancels in-flight inner requests, making it ideal for search typeaheads.' }] }
    ]
  },
  {
    title: 'GraphQL API Design with Node.js & Apollo',
    category: 'Backend & Systems',
    keywords: ['graphql', 'apollo', 'apollo server', 'graphql schema', 'resolvers', 'query mutation'],
    nodes: [
      { order: 1, title: 'GraphQL Schema Definition Language (SDL) & Resolvers', description: 'Types, Queries, Mutations, Subscriptions, and resolver argument mapping.', estimatedHours: 14, resources: [{ title: 'Apollo Server Tutorial', url: 'https://www.apollographql.com/docs/apollo-server/', type: 'doc' }], quizQuestions: [{ question: 'What problem does GraphQL solve compared to REST?', options: ['Removes database requirement', 'Prevents over-fetching and under-fetching by allowing clients to request exact fields', 'Runs only on mobile', 'Encrypts all data by default'], correctIndex: 1, explanation: 'Clients dictate the exact response structure, avoiding multiple REST endpoint calls.' }] }
    ]
  },
  {
    title: 'Web3 & Solidity Smart Contract Engineering',
    category: 'Web Development',
    keywords: ['web3', 'solidity', 'ethereum', 'smart contracts', 'blockchain', 'ethersjs', 'crypto'],
    nodes: [
      { order: 1, title: 'Ethereum Virtual Machine (EVM) & Solidity Basics', description: 'Gas fees, state variables, mappings, modifiers, and ERC-20 token standards.', estimatedHours: 16, resources: [{ title: 'Solidity by Example', url: 'https://solidity-by-example.org/', type: 'doc' }], quizQuestions: [{ question: 'What is the EVM reentrancy attack?', options: ['A denial of service', 'A vulnerability where an external contract calls back into the vulnerable function before state is updated', 'A private key leak', 'A compiler error'], correctIndex: 1, explanation: 'Reentrancy occurs when external calls execute code before balance/state changes are recorded.' }] }
    ]
  },
  {
    title: 'Python Full-Stack Web with Django',
    category: 'Backend & Systems',
    keywords: ['django', 'python django', 'django rest framework', 'drf', 'django orm'],
    nodes: [
      { order: 1, title: 'Django MTV Architecture & ORM', description: 'Models, Migrations, Django Admin, Views, Templates, and authentication middleware.', estimatedHours: 16, resources: [{ title: 'Django Girls Tutorial', url: 'https://tutorial.djangogirls.org/', type: 'course' }], quizQuestions: [{ question: 'What does MTV stand for in Django?', options: ['Model Template View', 'Module Task Virtual', 'Modern Tech Vision', 'Multi Threaded View'], correctIndex: 0, explanation: 'Django uses Model (data layer), Template (presentation), and View (business logic).' }] },
      { order: 2, title: 'Django REST Framework (DRF) & Serializers', description: 'ModelSerializers, ViewSets, API routers, JWT authentication, and permissions.', estimatedHours: 14, resources: [{ title: 'DRF Documentation', url: 'https://www.django-rest-framework.org/', type: 'doc' }], quizQuestions: [{ question: 'What is the role of a Serializer in DRF?', options: ['Converts complex QuerySets to native Python datatypes for JSON rendering and validates incoming inputs', 'Compresses images', 'Executes SQL migrations', 'Sets cookies'], correctIndex: 0, explanation: 'Serializers convert Django model instances to JSON and validate incoming deserialized payloads.' }] }
    ]
  },
  {
    title: 'Enterprise C# and ASP.NET Core Web APIs',
    category: 'Backend & Systems',
    keywords: ['c#', 'csharp', 'dotnet', 'asp.net', 'aspnet', 'entity framework', 'linq'],
    nodes: [
      { order: 1, title: 'C# 12 Language Core & LINQ', description: 'Object-oriented patterns, LINQ queries, asynchronous Task/await, and memory management.', estimatedHours: 14, resources: [{ title: 'Microsoft C# Documentation', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/', type: 'doc' }], quizQuestions: [{ question: 'What does LINQ stand for in .NET?', options: ['Language Integrated Query', 'Linked Interface Network', 'Local Indexed Node', 'Logical Iteration Queue'], correctIndex: 0, explanation: 'LINQ allows querying objects, SQL, and XML using native C# syntax.' }] },
      { order: 2, title: 'ASP.NET Core Minimal APIs & Entity Framework Core', description: 'Dependency injection, middleware, DbContext, Migrations, and SQL Server integration.', estimatedHours: 18, resources: [{ title: 'ASP.NET Core Web API Guide', url: 'https://learn.microsoft.com/en-us/aspnet/core/web-api/', type: 'doc' }], quizQuestions: [{ question: 'What does Entity Framework Core DbContext represent?', options: ['A session with the database enabling querying and saving of entities', 'A web router', 'An encryption key', 'A load balancer'], correctIndex: 0, explanation: 'DbContext combines Unit of Work and Repository patterns to manage DB transactions.' }] }
    ]
  },
  {
    title: 'Rust Systems Programming & Memory Safety',
    category: 'Backend & Systems',
    keywords: ['rust', 'rustlang', 'systems programming', 'ownership', 'borrow checker', 'cargo'],
    nodes: [
      { order: 1, title: 'The Rust Ownership, Borrowing & Lifetimes Model', description: 'Memory safety without garbage collection: ownership rules, mutable references, and explicit lifetimes.', estimatedHours: 18, resources: [{ title: 'The Rust Programming Language Book', url: 'https://doc.rust-lang.org/book/', type: 'doc' }], quizQuestions: [{ question: 'How does Rust achieve memory safety without a garbage collector?', options: ['Static analysis at runtime', 'Compile-time ownership rules and borrow checking', 'Manual malloc and free', 'Running in a virtual machine'], correctIndex: 1, explanation: 'The borrow checker ensures variables have a single owner and that references do not outlive their data.' }] }
    ]
  },
  {
    title: 'Event-Driven Microservices with Apache Kafka & RabbitMQ',
    category: 'Backend & Systems',
    keywords: ['microservices', 'kafka', 'apache kafka', 'rabbitmq', 'event driven', 'message broker', 'cqrs'],
    nodes: [
      { order: 1, title: 'Message Brokers & Distributed Event Streaming', description: 'Producers, Consumers, Consumer Groups, Partitions, Offsets, and Exactly-Once Semantics.', estimatedHours: 18, resources: [{ title: 'Confluent Kafka Fundamentals', url: 'https://developer.confluent.io/what-is-apache-kafka/', type: 'article' }], quizQuestions: [{ question: 'How does Kafka scale consumer read throughput?', options: ['Partitioning topics across multiple consumers in a consumer group', 'Copying the entire broker', 'Deleting old messages', 'Using HTTP long polling'], correctIndex: 0, explanation: 'Each partition within a topic is consumed by exactly one consumer per consumer group.' }] }
    ]
  },
  {
    title: 'Data Structures and Algorithms in Java',
    category: 'Computer Science & DSA',
    keywords: ['dsa java', 'java algorithms', 'java interview', 'leetcode java', 'collections framework'],
    nodes: [
      { order: 1, title: 'Java Collections Framework & Complexity Analysis', description: 'ArrayList, LinkedList, HashMap internals, HashSet, and PriorityQueue.', estimatedHours: 16, resources: [{ title: 'Java Collections Guide', url: 'https://docs.oracle.com/javase/8/docs/technotes/guides/collections/', type: 'doc' }], quizQuestions: [{ question: 'How does Java HashMap handle hash collisions in Java 8+?', options: ['Throws exception', 'Chaining with linked list, upgrading to red-black tree when bucket exceeds 8 entries', 'Linear probing', 'Overwriting previous value'], correctIndex: 1, explanation: 'Treeifying bins with over 8 elements optimizes collision search time from O(N) to O(log N).' }] },
      { order: 2, title: 'Recursion, Trees & Backtracking in Java', description: 'Binary tree algorithms, DFS/BFS traversals, Trie prefix trees, and N-Queens backtracking.', estimatedHours: 20, resources: [{ title: 'GeeksforGeeks Tree Data Structure', url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/', type: 'article' }], quizQuestions: [{ question: 'What is a Trie data structure primarily used for?', options: ['Fast prefix matching and autocomplete lookups', 'Sorting integers', 'Calculating shortest paths', 'Encrypting strings'], correctIndex: 0, explanation: 'Tries store strings character-by-character along branches, enabling O(L) prefix searches where L is string length.' }] }
    ]
  },
  {
    title: 'Data Structures and Algorithms in Python',
    category: 'Computer Science & DSA',
    keywords: ['dsa python', 'python algorithms', 'leetcode python', 'python interview prep'],
    nodes: [
      { order: 1, title: 'Pythonic DSA: Lists, Dictionaries & Collections Module', description: 'List comprehensions, deque, Counter, defaultdict, and bisect binary search.', estimatedHours: 14, resources: [{ title: 'Python Collections Documentation', url: 'https://docs.python.org/3/library/collections.html', type: 'doc' }], quizQuestions: [{ question: 'Why use collections.deque instead of list for queues in Python?', options: ['deque is faster for indexing', 'deque provides O(1) pops and appends from both ends; list pop(0) takes O(N)', 'deque consumes zero memory', 'deque runs in C++'], correctIndex: 1, explanation: 'list.pop(0) shifts all remaining elements in memory, whereas deque is implemented as a doubly-linked block list.' }] }
    ]
  },
  {
    title: 'Relational Database Design & Advanced SQL',
    category: 'Computer Science & DSA',
    keywords: ['sql', 'database', 'rdbms', 'postgresql sql', 'mysql', 'indexing', 'normalization'],
    nodes: [
      { order: 1, title: 'SQL Joins, Subqueries & Window Functions', description: 'Inner/Outer joins, GROUP BY, HAVING, RANK(), ROW_NUMBER(), and CTEs (Common Table Expressions).', estimatedHours: 14, resources: [{ title: 'PostgreSQL Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', type: 'doc' }], quizQuestions: [{ question: 'What does a Window Function do in SQL?', options: ['Changes terminal background', 'Performs calculations across a set of table rows related to the current row without collapsing rows like GROUP BY', 'Deletes tables', 'Creates new databases'], correctIndex: 1, explanation: 'Window functions preserve individual row identities while computing aggregates over partitions.' }] },
      { order: 2, title: 'B-Tree Indexes & Query Execution Plans', description: 'Clustered vs non-clustered indexes, composite index order, EXPLAIN execution trees, and table scans.', estimatedHours: 16, resources: [{ title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/', type: 'article' }], quizQuestions: [{ question: 'What is a covering index?', options: ['An index that covers all tables', 'An index that contains all columns requested by a query, avoiding table heap lookups', 'An encrypted index', 'A temporary index'], correctIndex: 1, explanation: 'A covering index satisfies the entire SELECT query directly from the index leaves.' }] }
    ]
  },
  {
    title: 'Computer Networks & Internet Protocols',
    category: 'Computer Science & DSA',
    keywords: ['networking', 'computer networks', 'tcp ip', 'dns', 'http', 'https', 'tls', 'udp'],
    nodes: [
      { order: 1, title: 'The TCP/IP Stack, Sockets & Handshakes', description: 'OSI vs TCP/IP model, 3-way handshake, congestion control, packet routing, and UDP vs TCP.', estimatedHours: 14, resources: [{ title: 'Computer Networking: A Top-Down Approach', url: 'https://gaia.cs.umass.edu/kurose_ross/online_lectures.htm', type: 'course' }], quizQuestions: [{ question: 'What makes TCP reliable compared to UDP?', options: ['TCP runs on fiber cables', 'TCP uses sequence numbers, acknowledgments, and retransmissions for lost packets', 'TCP has no latency', 'TCP is encrypted by default'], correctIndex: 1, explanation: 'TCP guarantees ordered, error-checked delivery via ACK packets and window sliding.' }] }
    ]
  },
  {
    title: 'Operating Systems & Linux Internals',
    category: 'Computer Science & DSA',
    keywords: ['os', 'operating systems', 'linux internals', 'virtual memory', 'threads', 'processes', 'syscalls'],
    nodes: [
      { order: 1, title: 'Processes, Threads & Virtual Memory', description: 'Process control blocks, context switches, paging, virtual memory, race conditions, and semaphores.', estimatedHours: 16, resources: [{ title: 'Operating Systems: Three Easy Pieces', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'doc' }], quizQuestions: [{ question: 'What is the function of the MMU (Memory Management Unit)?', options: ['Audio processing', 'Translating virtual addresses used by programs into physical hardware RAM addresses', 'Cooling CPU fans', 'Storing files on disk'], correctIndex: 1, explanation: 'The MMU hardware module maps program virtual pages to physical memory frames.' }] }
    ]
  },
  {
    title: 'Natural Language Processing (NLP) & LLM Applications',
    category: 'Data & AI',
    keywords: ['nlp', 'llm', 'langchain', 'rag', 'vector database', 'retrieval augmented generation', 'openai', 'gemini'],
    nodes: [
      { order: 1, title: 'Retrieval Augmented Generation (RAG) Architecture', description: 'Chunking strategies, dense embeddings, vector databases (Chroma/Pinecone), and context injection.', estimatedHours: 16, resources: [{ title: 'LangChain Documentation', url: 'https://js.langchain.com/docs/', type: 'doc' }], quizQuestions: [{ question: 'Why use RAG with Large Language Models?', options: ['To make models smaller', 'To ground model answers in verified private data and prevent hallucinations without retraining', 'To remove need for prompts', 'To eliminate compute costs'], correctIndex: 1, explanation: 'RAG dynamically retrieves relevant context chunks and injects them into the prompt, grounding the LLM in real data.' }] }
    ]
  },
  {
    title: 'Computer Vision with Deep Learning & OpenCV',
    category: 'Data & AI',
    keywords: ['computer vision', 'opencv', 'cnn', 'image processing', 'object detection', 'yolo'],
    nodes: [
      { order: 1, title: 'Image Processing & Convolutional Neural Networks (CNNs)', description: 'Kernels, convolutions, pooling layers, ResNet architectures, and transfer learning.', estimatedHours: 18, resources: [{ title: 'PyTorch Vision Documentation', url: 'https://pytorch.org/vision/stable/index.html', type: 'doc' }], quizQuestions: [{ question: 'What is the role of a convolution kernel in CNNs?', options: ['Audio synthesis', 'Extracting spatial feature maps such as edges, textures, and shapes from pixels', 'Deleting noisy images', 'Sorting image filenames'], correctIndex: 1, explanation: 'Convolution filters slide over pixel matrices computing dot products to detect visual features.' }] }
    ]
  },
  {
    title: 'Data Engineering with Apache Spark & Airflow',
    category: 'Data & AI',
    keywords: ['data engineering', 'spark', 'apache spark', 'airflow', 'etl', 'pyspark', 'data pipeline'],
    nodes: [
      { order: 1, title: 'Distributed Batch & Stream Processing with PySpark', description: 'Resilient Distributed Datasets (RDDs), DataFrames, Catalyst optimizer, and shuffle partitions.', estimatedHours: 18, resources: [{ title: 'Spark Overview', url: 'https://spark.apache.org/docs/latest/', type: 'doc' }], quizQuestions: [{ question: 'What is lazy evaluation in Apache Spark?', options: ['Spark runs slowly', 'Transformations are only computed when an Action (like count or collect) is explicitly triggered', 'Spark ignores syntax errors', 'Spark delays installation'], correctIndex: 1, explanation: 'Lazy evaluation enables Spark to build an optimized execution DAG before executing operations.' }] }
    ]
  },
  {
    title: 'Native Android Development with Kotlin & Jetpack Compose',
    category: 'Mobile Development',
    keywords: ['android', 'kotlin', 'jetpack compose', 'android native', 'android studio'],
    nodes: [
      { order: 1, title: 'Kotlin Language & Declarative UI with Jetpack Compose', description: 'Coroutines, ViewModel, Compose state, Navigation, and Material 3 design for Android.', estimatedHours: 18, resources: [{ title: 'Android Developer Pathways', url: 'https://developer.android.com/courses', type: 'course' }], quizQuestions: [{ question: 'What is a Composable function in Android?', options: ['A function that defines UI programmatically by describing how it looks based on state', 'A database query function', 'A background thread listener', 'An image compressor'], correctIndex: 0, explanation: '@Composable functions declare UI components reactively in Kotlin code without XML layouts.' }] }
    ]
  },
  {
    title: 'Native iOS Development with Swift & SwiftUI',
    category: 'Mobile Development',
    keywords: ['ios', 'swift', 'swiftui', 'xcode', 'apple development', 'iphone app'],
    nodes: [
      { order: 1, title: 'Swift Programming & Declarative SwiftUI', description: 'Optionals, structs, protocols, @State, @Binding, ObservableObject, and Apple Human Interface Guidelines.', estimatedHours: 18, resources: [{ title: '100 Days of SwiftUI by Paul Hudson', url: 'https://www.hackingwithswift.com/100/swiftui', type: 'course' }], quizQuestions: [{ question: 'What does the @Binding property wrapper do in SwiftUI?', options: ['Creates a two-way read/write reference to state owned by a parent view', 'Locks variable from being modified', 'Binds app to App Store', 'Styles text elements'], correctIndex: 0, explanation: '@Binding connects child components directly to a parent view’s @State source of truth.' }] }
    ]
  },
  {
    title: 'Infrastructure as Code with Terraform & AWS',
    category: 'DevOps & Cloud',
    keywords: ['terraform', 'iac', 'infrastructure as code', 'cloud automation', 'hcl', 'aws terraform'],
    nodes: [
      { order: 1, title: 'Terraform HCL, Providers, Modules & State Management', description: 'Declarative resource provisioning, remote S3 backends, state locking with DynamoDB, and variables.', estimatedHours: 16, resources: [{ title: 'HashiCorp Terraform Tutorials', url: 'https://developer.hashicorp.com/terraform/tutorials', type: 'doc' }], quizQuestions: [{ question: 'Why is the Terraform state file critical?', options: ['It contains HTML templates', 'It records real-world infrastructure resource mappings and metadata to determine execution plans', 'It compiles C code', 'It starts Docker containers'], correctIndex: 1, explanation: 'Terraform compares your configuration against the state file to calculate necessary additions, edits, or destructions.' }] }
    ]
  },
  {
    title: 'Linux System Administration & Bash Automation',
    category: 'DevOps & Cloud',
    keywords: ['linux', 'bash', 'shell scripting', 'sysadmin', 'ubuntu', 'cron', 'systemd'],
    nodes: [
      { order: 1, title: 'Linux File System, Permissions & Process Management', description: 'chmod, chown, user groups, systemd services, pipes, redirection, and grep/sed/awk text parsing.', estimatedHours: 14, resources: [{ title: 'Linux Journey', url: 'https://linuxjourney.com/', type: 'course' }], quizQuestions: [{ question: 'What permission does chmod 755 grant to a file?', options: ['Full permissions to owner; read and execute to group and others', 'Read-only to everyone', 'Full permissions to everyone', 'No permissions'], correctIndex: 0, explanation: '7 (rwx) for owner, 5 (r-x) for group, and 5 (r-x) for world/others.' }] }
    ]
  },
  {
    title: 'Site Reliability Engineering (SRE) & Observability',
    category: 'DevOps & Cloud',
    keywords: ['sre', 'observability', 'prometheus', 'grafana', 'opentelemetry', 'monitoring', 'sli', 'slo'],
    nodes: [
      { order: 1, title: 'SLIs, SLOs, Error Budgets & Distributed Tracing', description: 'Prometheus metrics, Grafana dashboards, log aggregation with Loki, and OpenTelemetry spans.', estimatedHours: 16, resources: [{ title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/', type: 'doc' }], quizQuestions: [{ question: 'What is an Error Budget in SRE?', options: ['The financial cost of servers', 'The acceptable percentage of downtime or failures permitted by a Service Level Objective (SLO)', 'A developer salary cap', 'The maximum number of Git commits per day'], correctIndex: 1, explanation: 'An Error Budget (e.g. 100% - 99.9% = 0.1%) represents allowable unreliability used to balance velocity against stability.' }] }
    ]
  },
  {
    title: 'Product Management for Software & Tech',
    category: 'Design & Product',
    keywords: ['product management', 'pm', 'agile', 'scrum', 'user stories', 'okrs', 'product roadmap'],
    nodes: [
      { order: 1, title: 'Product Discovery, Problem Framing & OKRs', description: 'Customer interviews, value proposition canvas, feature prioritization (RICE framework), and writing PRDs.', estimatedHours: 12, resources: [{ title: 'Inspired by Marty Cagan (Summary)', url: 'https://www.svpg.com/articles/', type: 'article' }], quizQuestions: [{ question: 'What are the four dimensions of the RICE scoring model?', options: ['Reach, Impact, Confidence, and Effort', 'Revenue, Innovation, Code, and Execution', 'React, Interfaces, Cache, and Errors', 'Role, Identity, Credentials, and Email'], correctIndex: 0, explanation: 'RICE scores features using Reach * Impact * Confidence / Effort to objectively prioritize backlogs.' }] }
    ]
  }
];

const seedClusters = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pathforge';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log(`Clearing existing cluster templates...`);
    await ClusterTemplate.deleteMany({});

    console.log(`Generating embedding vectors and inserting ${SEED_TEMPLATES.length} templates...`);

    const documentsToInsert = [];

    for (const item of SEED_TEMPLATES) {
      // Normalize keywords and title
      const normalizedKeywords = [
        ...new Set([
          normalizeGoalText(item.title),
          ...item.keywords.map((k) => normalizeGoalText(k)),
        ]),
      ].filter(Boolean);

      // Generate embedding vector
      const textToEmbed = `${item.title} ${item.category} ${normalizedKeywords.join(' ')}`;
      const embedding = generateLocalVector(textToEmbed, 768);

      documentsToInsert.push({
        title: item.title,
        category: item.category,
        normalizedKeywords,
        embedding,
        nodes: item.nodes,
        status: 'active',
        usageCount: 0,
        createdBy: 'seed',
      });
    }

    const inserted = await ClusterTemplate.insertMany(documentsToInsert);
    console.log(`✅ Successfully seeded ${inserted.length} cluster templates into MongoDB!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed cluster templates:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  seedClusters();
}

module.exports = { seedClusters, SEED_TEMPLATES };
