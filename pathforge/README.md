# 🔥 PathForge

**AI-powered personalized learning roadmap platform.**

Turn "I want to learn web development" into a structured, step-by-step roadmap with quizzes, XP, streaks, and badges.

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 (Vite), Tailwind CSS, Zustand, TanStack Query, Framer Motion |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Redis (ioredis) |
| **AI** | Google Gemini API (fallback only — cluster-first architecture) |
| **Jobs** | BullMQ (background processing) |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Infra** | Docker Compose, GitHub Actions CI/CD |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- Docker (for MongoDB + Redis)

### Setup

```bash
# 1. Clone and install
cd pathforge
npm install

# 2. Set up environment
cp .env.example server/.env
# Edit server/.env with your values

# 3. Start MongoDB + Redis
docker compose up -d

# 4. Start development servers
npm run dev:server    # Express API on :5000
npm run dev:client    # Vite React on :5173
```

### Verify
- **API Health:** http://localhost:5000/api/v1/health
- **Frontend:** http://localhost:5173

---

## 📁 Project Structure

```
pathforge/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── features/       # Feature modules (auth, roadmap, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Axios instance, query client
│   │   ├── pages/          # Page components
│   │   ├── routes/         # React Router config
│   │   └── store/          # Zustand state stores
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB, Redis, env, logger setup
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, rate limit, validation, errors
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic (roadmap engine, gamification)
│   │   ├── jobs/           # BullMQ queues + workers
│   │   ├── validators/     # Zod schemas for request validation
│   │   └── utils/          # Helpers
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml      # MongoDB + Redis for local dev
├── .env.example
└── README.md
```

---

## 🔑 Core Architecture

**Cluster-first, Gemini-fallback:** When a user asks to learn something, we first try to match their goal to a curated cluster of ~50 common learning paths (keyword + embedding similarity). Only if no confident match exists do we call the Gemini API. This keeps costs near-zero for 80%+ of requests while still handling niche topics.

---

## 📝 License

MIT
