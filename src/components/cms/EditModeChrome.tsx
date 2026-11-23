import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Pencil,
  Save,
  Settings,
  ShieldCheck,
  Undo2,
  X,
} from 'lucide-react';
import { useSiteContent, type AdminAuthStatus } from '../../context/SiteContentContext';

export function EditModeChrome() {
  const {
    isAdminLoggedIn,
    editModeEnabled,
    isPreviewMode,
    isDirty,
    canUndo,
    undoCount,
    saving,
    justSaved,
    saveError,
    showLoginModal,
    setShowLoginModal,
    setShowSettingsDrawer,
    fetchAuthStatus,
    setupAdminPassword,
    loginAdmin,
    logoutAdmin,
    toggleEditMode,
    setIsPreviewMode,
    undo,
    saveContent,
  } = useSiteContent();

  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!showLoginModal) return;
    setPassword('');
    setConfirmPassword('');
    setAuthError('');
    setLoadingStatus(true);
    void fetchAuthStatus()
      .then((status) => setAuthStatus(status))
      .catch(() => setAuthStatus({ configured: false, source: 'unclaimed' }))
      .finally(() => setLoadingStatus(false));
  }, [showLoginModal, fetchAuthStatus]);

  const isSetupMode = authStatus?.source === 'unclaimed';

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!password.trim()) {
      setAuthError('Please enter a password.');
      return;
    }
    if (isSetupMode) {
      if (password.trim().length < 8) {
        setAuthError('Please choose a password of at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSetupMode) {
        await setupAdminPassword(password);
      } else {
        await loginAdmin(password);
      }
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestLogout = () => {
    if (isDirty) {
      setShowLogoutConfirm(true);
    } else {
      void logoutAdmin();
    }
  };

  return (
    <>
      {/* Sticky Top Admin Bar — visible ONLY when logged in as Site Admin */}
      {isAdminLoggedIn && (
        <div
          role="region"
          aria-label="Site Editor Admin Controls"
          className="sticky top-0 z-[60] bg-[#0B0B0F] text-white border-b border-slate-700 shadow-md"
        >
          <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-tight text-white">
                <Pencil className="w-3.5 h-3.5 text-[#C4F500]" />
                <span>Site Editor</span>
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                {isPreviewMode
                  ? 'Preview Mode'
                  : editModeEnabled
                  ? 'Edit Mode: ON'
                  : 'Edit Mode: OFF'}
              </span>
              {isDirty && (
                <span className="text-[11px] font-medium text-amber-300">
                  Unsaved changes
                </span>
              )}
              {justSaved && !isDirty && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveContent()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-[#C4F500] hover:bg-[#b5e200] disabled:opacity-60 rounded cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                type="button"
                disabled={!canUndo}
                onClick={undo}
                title="Undo last change"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded cursor-pointer transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undo</span>
                {undoCount > 0 && (
                  <span className="text-[10px] text-slate-300 tabular-nums">({undoCount})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border cursor-pointer transition-colors ${
                  isPreviewMode
                    ? 'bg-[#004B87] text-white border-sky-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isPreviewMode ? 'Exit Preview' : 'Preview'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsDrawer(true)}
                title="Open Site Settings"
                aria-label="Site Settings"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Site Settings</span>
              </button>

              <button
                type="button"
                onClick={handleRequestLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-red-700/80 border border-slate-700 rounded cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>

          {saveError && (
            <div className="bg-red-950/90 border-t border-red-800 px-4 py-1.5 text-xs text-red-100 flex items-center justify-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Edit Mode: ON / OFF Toggle — visible ONLY when logged in as Site Admin */}
      {isAdminLoggedIn && (
        <div className="fixed bottom-4 right-4 z-[65] flex items-center gap-2">
          <button
            type="button"
            onClick={toggleEditMode}
            aria-pressed={editModeEnabled && !isPreviewMode}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-bold tracking-tight cursor-pointer transition-all ${
              editModeEnabled && !isPreviewMode
                ? 'bg-[#004B87] text-white border-sky-400 hover:bg-[#003865]'
                : 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>
              Edit Mode: {editModeEnabled && !isPreviewMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      )}

      {/* Admin Login / First-Run Setup Modal */}
      {showLoginModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site Editor Admin Login"
          className="fixed inset-0 z-[90] bg-slate-900/55 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#004B87]" />
                <h2 className="text-sm font-bold text-slate-900">
                  {isSetupMode ? 'Set Up Admin Edit Mode Password' : 'Admin Edit Mode Sign-In'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                aria-label="Close admin login dialog"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingStatus ? (
              <div className="p-6 text-xs text-slate-500 text-center">
                Checking admin editor configuration...
              </div>
            ) : (
              <form onSubmit={(e) => void handleAuthSubmit(e)} className="p-5 space-y-4">
                {isSetupMode ? (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-[#004B87] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>First-Time Admin Setup</span>
                    </div>
                    <p>
                      Create an admin password to unlock Edit Mode. You can also set or override
                      this anytime via the <code className="font-mono">SITE_EDITOR_ADMIN_PASSWORD</code>{' '}
                      environment variable.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">
                    Enter your Site Admin password to edit text, images, navigation, colors, fonts,
                    pages, and sections across the entire site.
                  </p>
                )}

                <div>
                  <label
                    htmlFor="site-editor-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    {isSetupMode ? 'Choose Admin Password (min 8 characters)' : 'Admin Password'}
                  </label>
                  <input
                    id="site-editor-password"
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder={isSetupMode ? 'Enter a strong password' : 'Enter admin password'}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>

                {isSetupMode && (
                  <div>
                    <label
                      htmlFor="site-editor-password-confirm"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="site-editor-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                )}

                {authError && (
                  <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {authError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 rounded-md cursor-pointer"
                  >
                    {submitting
                      ? 'Verifying...'
                      : isSetupMode
                      ? 'Save Password & Enter Edit Mode'
                      : 'Sign In to Edit Mode'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal on Log Out */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved changes confirmation"
          className="fixed inset-0 z-[95] bg-slate-900/55 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">You have unsaved changes</h3>
                <p className="text-xs text-slate-600">
                  Save your edits so they stay live for all visitors, or discard them before logging
                  out of Edit Mode.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  void logoutAdmin();
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md cursor-pointer"
              >
                Discard &amp; Log Out
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await saveContent();
                  if (ok) {
                    setShowLogoutConfirm(false);
                    await logoutAdmin();
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
              >
                Save &amp; Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
