/**
 * Profile & Settings Page
 * 
 * Provides:
 * - Profile tab: Update display name, view role, joined date, and current learning target
 * - Security tab: Change password (revoking older device sessions)
 * - Danger Zone: Permanent GDPR-compliant account deletion with confirmation modal
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Trash2,
  Lock,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ProfileSettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'danger'
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { isSubmitting: isSubmittingProfile },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data) => {
    setProfileMessage('');
    setErrorMessage('');
    try {
      const res = await api.patch('/users/me', data);
      setUser(res.data.data.user);
      setProfileMessage('Profile updated successfully!');
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update profile.');
    }
  };

  const onChangePassword = async (data) => {
    setPasswordMessage('');
    setErrorMessage('');
    try {
      await api.post('/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordMessage('Password updated successfully! All other sessions have been logged out.');
      resetPasswordForm();
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to delete account.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* ─── Page Title ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-surface-dark dark:text-white">
          Account Settings
        </h1>
        <p className="text-sm text-surface-muted mt-1">
          Manage your personal profile, security preferences, and learning parameters.
        </p>
      </div>

      {/* ─── Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex border-b border-primary-100 dark:border-primary-900 gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            setErrorMessage('');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-muted hover:text-surface-dark dark:hover:text-white'
          }`}
        >
          <User size={16} />
          Profile & Preferences
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('security');
            setErrorMessage('');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-muted hover:text-surface-dark dark:hover:text-white'
          }`}
        >
          <Shield size={16} />
          Security
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('danger');
            setErrorMessage('');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'danger'
              ? 'border-accent-rose text-accent-rose'
              : 'border-transparent text-surface-muted hover:text-accent-rose'
          }`}
        >
          <Trash2 size={16} />
          Danger Zone
        </button>
      </div>

      {/* ─── Global Error Banner ──────────────────────────────────── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
          {errorMessage}
        </div>
      )}

      {/* ─── TAB 1: PROFILE ───────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          {profileMessage && (
            <div className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/20 text-accent-teal flex items-center gap-2 text-sm">
              <CheckCircle2 size={18} />
              <span>{profileMessage}</span>
            </div>
          )}

          {/* Profile Details Card */}
          <div className="card p-6 sm:p-8 space-y-6 shadow-card">
            <h2 className="text-lg font-heading font-semibold text-surface-dark dark:text-white">
              Personal Information
            </h2>

            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  {...registerProfile('name')}
                  className="input-field"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field pl-10 opacity-70 cursor-not-allowed bg-primary-50 dark:bg-primary-900/30"
                  />
                </div>
                <p className="text-xs text-surface-muted mt-1">
                  Email address cannot be changed directly.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="btn-primary py-2.5 px-6 text-sm"
                >
                  {isSubmittingProfile ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>

            <div className="pt-6 border-t border-primary-100 dark:border-primary-900 grid sm:grid-cols-2 gap-4 text-xs text-surface-muted">
              <div className="flex items-center gap-2">
                <Calendar size={15} />
                <span>Member since {formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={15} />
                <span>Role: <strong className="capitalize text-primary-600">{user?.role || 'Student'}</strong></span>
              </div>
            </div>
          </div>

          {/* Current Onboarding Preferences Card */}
          <div className="card p-6 sm:p-8 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold text-surface-dark dark:text-white">
                  Learning Roadmap Preferences
                </h2>
                <p className="text-xs text-surface-muted mt-0.5">
                  These answers determine roadmap topic matching, pacing, and resource types.
                </p>
              </div>
              <Link to="/onboarding" className="btn-secondary text-xs py-2 px-3">
                Update Preferences
              </Link>
            </div>

            {user?.onboarding?.completedAt ? (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900">
                  <div className="text-xs text-surface-muted font-medium">Target Learning Goal</div>
                  <div className="text-sm font-semibold text-primary-900 dark:text-white mt-1">
                    {user.onboarding.goalText}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900">
                  <div className="text-xs text-surface-muted font-medium">Skill Level</div>
                  <div className="text-sm font-semibold capitalize text-primary-900 dark:text-white mt-1">
                    {user.onboarding.skillLevel}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900">
                  <div className="text-xs text-surface-muted font-medium">Study Commitment</div>
                  <div className="text-sm font-semibold text-primary-900 dark:text-white mt-1">
                    {user.onboarding.hoursPerWeek} hours / week
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900">
                  <div className="text-xs text-surface-muted font-medium">Preferred Style</div>
                  <div className="text-sm font-semibold capitalize text-primary-900 dark:text-white mt-1">
                    {user.onboarding.learningStyle}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-dashed border-2 border-primary-200 dark:border-primary-800 rounded-xl space-y-3">
                <Sparkles size={24} className="mx-auto text-primary-600" />
                <p className="text-sm text-surface-muted">
                  You haven&apos;t completed the onboarding questionnaire yet.
                </p>
                <Link to="/onboarding" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
                  Launch Onboarding Wizard
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECURITY ──────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="card p-6 sm:p-8 space-y-6 shadow-card animate-fade-in">
          <div>
            <h2 className="text-lg font-heading font-semibold text-surface-dark dark:text-white">
              Change Account Password
            </h2>
            <p className="text-xs text-surface-muted mt-0.5">
              Updating your password will immediately terminate all active sessions across all your devices.
            </p>
          </div>

          {passwordMessage && (
            <div className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/20 text-accent-teal flex items-center gap-2 text-sm">
              <CheckCircle2 size={18} />
              <span>{passwordMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="password"
                  {...registerPassword('currentPassword')}
                  className="input-field pl-10"
                  placeholder="••••••••••••"
                />
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-accent-rose mt-1">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="password"
                  {...registerPassword('newPassword')}
                  className="input-field pl-10"
                  placeholder="••••••••••••"
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-accent-rose mt-1">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="password"
                  {...registerPassword('confirmPassword')}
                  className="input-field pl-10"
                  placeholder="••••••••••••"
                />
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-accent-rose mt-1">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                {isSubmittingPassword ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 3: DANGER ZONE ───────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="card p-6 sm:p-8 space-y-6 shadow-card border-accent-rose/30 animate-fade-in">
          <div>
            <h2 className="text-lg font-heading font-semibold text-accent-rose flex items-center gap-2">
              <AlertTriangle size={20} />
              Delete Account & Purge Data
            </h2>
            <p className="text-xs text-surface-muted mt-1 leading-relaxed">
              Permanently delete your PathForge account, completed roadmap progress, earned XP, and saved
              preferences. This action cannot be undone.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose leading-relaxed">
            Per GDPR and privacy best practices, deleting your account will purge all personal identifiers,
            active session credentials, and user data from our databases immediately.
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger py-2.5 px-6 text-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete my account
            </button>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-card space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-heading font-bold text-surface-dark dark:text-white">
                Are you absolutely sure?
              </h3>
              <p className="text-xs text-surface-muted mt-1 leading-relaxed">
                This will permanently delete your PathForge account (<strong className="text-surface-dark dark:text-white">{user?.email}</strong>) and erase all your learning roadmaps and badges.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary-100 dark:border-primary-900">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="btn-danger text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, delete my account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
