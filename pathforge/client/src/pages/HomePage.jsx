/**
 * Landing Page (Home)
 * 
 * The first page a visitor sees. Communicates:
 * 1. What PathForge is (value proposition)
 * 2. How it works (3 steps)
 * 3. Social proof (testimonials placeholder)
 * 4. CTA to sign up
 * 
 * This is the placeholder version — will be enriched with
 * Framer Motion animations and a sample roadmap preview later.
 */

import { Sparkles, Route, Trophy, ArrowRight, Target, Zap, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-surface-dark dark:via-primary-900/20 dark:to-surface-dark" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700 mb-6">
              <Sparkles size={14} className="text-primary-600" />
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                AI-powered learning paths
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight">
              Turn <span className="text-gradient">&ldquo;I want to learn&rdquo;</span>
              <br />
              into <span className="text-gradient">a clear path forward</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl text-surface-muted dark:text-primary-300 max-w-2xl mx-auto leading-relaxed">
              Tell us your goal. PathForge builds a personalized, step-by-step
              learning roadmap — with quizzes, XP, streaks, and badges to keep
              you motivated.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/register" className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
                Start your path
                <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto">
                See how it works
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {[
                { value: '50+', label: 'Learning paths' },
                { value: '10K+', label: 'Nodes completed' },
                { value: '95%', label: 'Completion rate' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-primary-600">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-surface-muted mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-white dark:bg-primary-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">
              Three steps to your roadmap
            </h2>
            <p className="mt-4 text-surface-muted dark:text-primary-300 max-w-xl mx-auto">
              No more guessing what to learn next. PathForge does the planning
              so you can focus on the learning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                step: '01',
                title: 'Tell us your goal',
                desc: 'Type what you want to learn in plain English. "I want to become a backend developer" is all it takes.',
              },
              {
                icon: Route,
                step: '02',
                title: 'Get your roadmap',
                desc: 'We match your goal to curated paths or generate a custom one with AI. Either way, it\'s personalized to your level.',
              },
              {
                icon: Trophy,
                step: '03',
                title: 'Learn & level up',
                desc: 'Complete nodes, pass quizzes, earn XP and badges. Track your streak and climb the leaderboard.',
              },
            ].map((item) => (
              <div key={item.step} className="card text-center group hover:shadow-glow transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mx-auto mb-5
                              group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <item.icon size={24} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-bold text-primary-300 dark:text-primary-700 mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-muted dark:text-primary-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Preview ───────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">
              Everything you need to stay on track
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Daily Streaks', desc: 'Build consistency with streak tracking. Miss a day? Use a streak freeze.' },
              { icon: Trophy, title: 'Badges & XP', desc: 'Earn experience points and unlock badges as you progress through your roadmap.' },
              { icon: BarChart3, title: 'Progress Analytics', desc: 'GitHub-style heatmap, XP charts, and time breakdowns to visualize your journey.' },
              { icon: Route, title: 'Visual Roadmaps', desc: 'Your learning path displayed as a skill tree — see what\'s next at a glance.' },
              { icon: Sparkles, title: 'AI-Powered', desc: 'Can\'t find a matching path? Our AI generates one tailored to your exact goal.' },
              { icon: Target, title: 'Quizzes', desc: 'Each node ends with a short quiz to verify understanding before moving on.' },
            ].map((feature) => (
              <div key={feature.title} className="card flex items-start gap-4 hover:shadow-glow transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                  <feature.icon size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-surface-muted dark:text-primary-300">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
            Ready to forge your path?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join thousands of learners who turned vague goals into structured progress.
          </p>
          <a href="/register" className="mt-8 inline-flex items-center gap-2 btn bg-white text-primary-700 hover:bg-primary-50 text-base px-8 py-3 shadow-card">
            Get started — it&apos;s free
            <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
