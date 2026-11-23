import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SITE_CONTENT,
  GOOGLE_FONT_OPTIONS,
  cloneSiteContent,
  normalizeSiteContent,
  sanitizeImageSrc,
  type SiteContent,
} from '../data/siteContent';

export interface AdminAuthStatus {
  configured: boolean;
  source: 'env' | 'claimed' | 'unclaimed';
}

interface SiteContentContextValue {
  content: SiteContent;
  loading: boolean;
  updatedAt: string | null;
  // Admin editor session (held strictly in memory)
  isAdminLoggedIn: boolean;
  editModeEnabled: boolean;
  isPreviewMode: boolean;
  isEditActive: boolean;
  isDirty: boolean;
  canUndo: boolean;
  undoCount: number;
  saving: boolean;
  justSaved: boolean;
  saveError: string;
  // Modals & drawers
  showLoginModal: boolean;
  setShowLoginModal: (open: boolean) => void;
  showSettingsDrawer: boolean;
  setShowSettingsDrawer: (open: boolean) => void;
  activeCustomPageId: string | null;
  setActiveCustomPageId: (pageId: string | null) => void;
  // Auth actions
  fetchAuthStatus: () => Promise<AdminAuthStatus>;
  setupAdminPassword: (password: string) => Promise<void>;
  loginAdmin: (password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  // Mode toggles
  setEditModeEnabled: (enabled: boolean) => void;
  toggleEditMode: () => void;
  setIsPreviewMode: (preview: boolean) => void;
  // Content editing & persistence
  updateContent: (updater: (draft: SiteContent) => void) => void;
  undo: () => void;
  saveContent: () => Promise<boolean>;
  resetToOriginal: () => Promise<boolean>;
  exportContentJson: () => void;
  importContentJson: (file: File) => Promise<{ ok: boolean; error?: string }>;
  reloadContent: () => Promise<void>;
  // Admin Edit Mode entity mutations (clubs, events, blogPosts, personas)
  mutateEntity: (
    kind: 'clubs' | 'events' | 'blogPosts' | 'personas',
    payload: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);
const MAX_UNDO_STACK = 40;

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => cloneSiteContent(DEFAULT_SITE_CONTENT));
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Admin editor token stored strictly in React memory (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [undoStack, setUndoStack] = useState<SiteContent[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [activeCustomPageId, setActiveCustomPageId] = useState<string | null>(null);

  const savedTimerRef = useRef<number | null>(null);
  const isAdminLoggedIn = Boolean(adminToken);
  const isEditActive = isAdminLoggedIn && editModeEnabled && !isPreviewMode;

  const reloadContent = useCallback(async () => {
    try {
      const res = await fetch('/api/site-content');
      if (!res.ok) return;
      const data = (await res.json()) as { content?: unknown; updatedAt?: string };
      if (data.content) {
        setContent(normalizeSiteContent(data.content));
        setUpdatedAt(data.updatedAt ?? null);
        setIsDirty(false);
      }
    } catch {
      // Keep default site content if server unreachable during startup
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadContent();
  }, [reloadContent]);

  // Apply live site-wide settings (title, favicon, Google Fonts, brand colors)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const { settings } = content;

    document.title = settings.browserTitle || settings.siteName || 'CUNY SPS Club Social Hub';

    // Update favicon link
    const safeFav = sanitizeImageSrc(settings.faviconUrl);
    if (safeFav) {
      let iconEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!iconEl) {
        iconEl = document.createElement('link');
        iconEl.rel = 'icon';
        document.head.appendChild(iconEl);
      }
      iconEl.href = safeFav;
    }

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--site-primary', settings.colors.primary);
    root.style.setProperty('--cuny-navy', settings.colors.primary);
    root.style.setProperty('--site-secondary', settings.colors.secondary);
    root.style.setProperty('--brand-ink', settings.colors.secondary);
    root.style.setProperty('--site-accent', settings.colors.accent);
    root.style.setProperty('--brand-signal', settings.colors.accent);
    root.style.setProperty('--site-bg', settings.colors.background);
    root.style.setProperty('--site-text', settings.colors.text);

    root.style.setProperty(
      '--font-display',
      `'${settings.fonts.heading}', system-ui, -apple-system, sans-serif`
    );
    root.style.setProperty(
      '--font-sans',
      `'${settings.fonts.body}', system-ui, -apple-system, sans-serif`
    );
    root.style.setProperty(
      '--font-brand',
      `'${settings.fonts.brand}', '${settings.fonts.heading}', system-ui, -apple-system, sans-serif`
    );

    const defColors = DEFAULT_SITE_CONTENT.settings.colors;
    const isCustomColors =
      settings.colors.primary.toLowerCase() !== defColors.primary.toLowerCase() ||
      settings.colors.secondary.toLowerCase() !== defColors.secondary.toLowerCase() ||
      settings.colors.background.toLowerCase() !== defColors.background.toLowerCase() ||
      settings.colors.text.toLowerCase() !== defColors.text.toLowerCase();
    if (isCustomColors) {
      root.setAttribute('data-site-themed', 'true');
    } else {
      root.removeAttribute('data-site-themed');
    }

    // Dynamically load selected Google Fonts
    const chosenFonts = Array.from(
      new Set([settings.fonts.heading, settings.fonts.body, settings.fonts.brand])
    );
    const specs = chosenFonts
      .map((name): string | undefined => GOOGLE_FONT_OPTIONS.find((f) => f.name === name)?.googleSpec)
      .filter((spec): spec is string => Boolean(spec));

    if (specs.length > 0) {
      const href = `https://fonts.googleapis.com/css2?${specs
        .map((s) => `family=${s}`)
        .join('&')}&display=swap`;
      let linkEl = document.getElementById('dynamic-site-fonts') as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'dynamic-site-fonts';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      if (linkEl.href !== href) {
        linkEl.href = href;
      }
    }
  }, [content.settings]);

  // Warn before closing/reloading page with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const fetchAuthStatus = useCallback(async (): Promise<AdminAuthStatus> => {
    const res = await fetch('/api/site-content/auth/status');
    if (!res.ok) {
      return { configured: false, source: 'unclaimed' };
    }
    return (await res.json()) as AdminAuthStatus;
  }, []);

  const setupAdminPassword = useCallback(async (password: string) => {
    const res = await fetch('/api/site-content/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Unable to set admin password.');
    }
    setAdminToken(data.token);
    setEditModeEnabled(true);
    setIsPreviewMode(false);
    setShowLoginModal(false);
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
    const res = await fetch('/api/site-content/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Incorrect admin password.');
    }
    setAdminToken(data.token);
    setEditModeEnabled(true);
    setIsPreviewMode(false);
    setShowLoginModal(false);
  }, []);

  const logoutAdmin = useCallback(async () => {
    if (adminToken) {
      await fetch('/api/site-content/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    setAdminToken(null);
    setEditModeEnabled(false);
    setIsPreviewMode(false);
    setShowSettingsDrawer(false);
    setSaveError('');
  }, [adminToken]);

  const updateContent = useCallback((updater: (draft: SiteContent) => void) => {
    setContent((prev) => {
      const snapshot = cloneSiteContent(prev);
      const draft = cloneSiteContent(prev);
      updater(draft);
      setUndoStack((stack) => [...stack.slice(-(MAX_UNDO_STACK - 1)), snapshot]);
      return draft;
    });
    setIsDirty(true);
    setJustSaved(false);
    setSaveError('');
  }, []);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1];
      setContent(previous);
      setIsDirty(true);
      setJustSaved(false);
      return stack.slice(0, -1);
    });
  }, []);

  const saveContent = useCallback(async (): Promise<boolean> => {
    if (!adminToken) {
      setShowLoginModal(true);
      return false;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        content?: unknown;
        updatedAt?: string;
        error?: string;
      };
      if (res.status === 401) {
        setAdminToken(null);
        setShowLoginModal(true);
        setSaveError('Your admin session expired. Please sign in again to save.');
        return false;
      }
      if (!res.ok || !data.content) {
        setSaveError(data.error || 'Unable to save site changes.');
        return false;
      }
      setContent(normalizeSiteContent(data.content));
      setUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setIsDirty(false);
      setJustSaved(true);
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => setJustSaved(false), 3500);
      return true;
    } catch {
      setSaveError('Network error while saving changes.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [adminToken, content]);

  const resetToOriginal = useCallback(async (): Promise<boolean> => {
    if (!adminToken) {
      setShowLoginModal(true);
      return false;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/site-content/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        content?: unknown;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok || !data.content) {
        setSaveError(data.error || 'Unable to reset site content.');
        return false;
      }
      setUndoStack((stack) => [...stack.slice(-(MAX_UNDO_STACK - 1)), cloneSiteContent(content)]);
      setContent(normalizeSiteContent(data.content));
      setUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setIsDirty(false);
      setJustSaved(true);
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => setJustSaved(false), 3500);
      return true;
    } catch {
      setSaveError('Network error while resetting site content.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [adminToken, content]);

  const exportContentJson = useCallback(() => {
    const json = JSON.stringify(content, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-content-backup-${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const importContentJson = useCallback(
    async (file: File): Promise<{ ok: boolean; error?: string }> => {
      try {
        if (file.size > 5 * 1024 * 1024) {
          return { ok: false, error: 'Backup file must be 5 MB or smaller.' };
        }
        const text = await file.text();
        const parsed: unknown = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          return { ok: false, error: 'Invalid JSON backup file.' };
        }
        const normalized = normalizeSiteContent(parsed);
        setUndoStack((stack) => [...stack.slice(-(MAX_UNDO_STACK - 1)), cloneSiteContent(content)]);
        setContent(normalized);
        setIsDirty(true);
        setJustSaved(false);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not parse JSON file. Make sure it is a valid backup.' };
      }
    },
    [content]
  );

  const mutateEntity = useCallback(
    async (
      kind: 'clubs' | 'events' | 'blogPosts' | 'personas',
      payload: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      if (!adminToken) {
        setShowLoginModal(true);
        throw new Error('Admin Edit Mode authentication required.');
      }
      const res = await fetch(`/api/site-content/entities/${kind}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unable to update item.');
      }
      setJustSaved(true);
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => setJustSaved(false), 3000);
      return data;
    },
    [adminToken]
  );

  const toggleEditMode = useCallback(() => {
    setEditModeEnabled((prev) => {
      const next = !prev;
      if (next) setIsPreviewMode(false);
      return next;
    });
  }, []);

  return (
    <SiteContentContext.Provider
      value={{
        content,
        loading,
        updatedAt,
        isAdminLoggedIn,
        editModeEnabled,
        isPreviewMode,
        isEditActive,
        isDirty,
        canUndo: undoStack.length > 0,
        undoCount: undoStack.length,
        saving,
        justSaved,
        saveError,
        showLoginModal,
        setShowLoginModal,
        showSettingsDrawer,
        setShowSettingsDrawer,
        activeCustomPageId,
        setActiveCustomPageId,
        fetchAuthStatus,
        setupAdminPassword,
        loginAdmin,
        logoutAdmin,
        setEditModeEnabled,
        toggleEditMode,
        setIsPreviewMode,
        updateContent,
        undo,
        saveContent,
        resetToOriginal,
        exportContentJson,
        importContentJson,
        reloadContent,
        mutateEntity,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContentContextValue {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return ctx;
}
