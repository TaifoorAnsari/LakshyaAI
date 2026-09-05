/**
 * Layout Component
 * 
 * The shell that wraps every page: sticky navbar, main content, footer.
 * Supports dark mode toggle with persistent preference in localStorage.
 * Connects directly to Zustand authStore for live session state.
 */

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('pf_theme') === 'dark' ||
        (!localStorage.getItem('pf_theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pf_theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failure on logout
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary-50 dark:bg-surface-dark transition-colors duration-300">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 glass border-b border-primary-100 dark:border-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors">
                <span className="text-white font-heading font-bold text-sm">P</span>
              </div>
              <span className="font-heading font-bold text-xl text-primary-900 dark:text-white">
                PathForge
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-surface-muted hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/roadmap"
                    className="text-surface-muted hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-sm font-medium"
                  >
                    My Roadmap
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="text-surface-muted hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-sm font-medium"
                  >
                    Leaderboard
                  </Link>
                </>
              ) : null}

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-surface-muted hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Auth actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-100/60 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 hover:border-primary-400 transition-colors"
                    title="Account Settings"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
                    </div>
                    <span className="text-sm font-medium text-surface-dark dark:text-white">
                      {user?.name || 'Student'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5 text-surface-muted hover:text-accent-rose"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm py-1.5 px-3">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                    Sign up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-surface-muted hover:bg-primary-100 dark:hover:bg-primary-900/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-primary-100 dark:border-primary-900 mt-2 pt-4">
              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-surface-muted hover:text-primary-600 text-sm font-medium px-2 py-1"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/roadmap"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-surface-muted hover:text-primary-600 text-sm font-medium px-2 py-1"
                    >
                      My Roadmap
                    </Link>
                    <Link
                      to="/leaderboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-surface-muted hover:text-primary-600 text-sm font-medium px-2 py-1"
                    >
                      Leaderboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-left text-accent-rose text-sm font-medium px-2 py-1 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-surface-muted hover:text-primary-600 text-sm font-medium px-2 py-1"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary text-sm py-1.5 text-center"
                    >
                      Sign up
                    </Link>
                  </>
                )}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-2 text-surface-muted text-sm px-2 py-1 pt-2 border-t border-primary-100 dark:border-primary-900"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-primary-100 dark:border-primary-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-heading font-bold text-xs">P</span>
              </div>
              <span className="text-sm text-surface-muted">
                PathForge &copy; {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-xs text-surface-muted">
              Built for learners, powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
