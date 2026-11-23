import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthPublicConfig, PortalMode, SessionContext, User } from '../types';

export interface AiDraftHandoff {
  title: string;
  caption: string;
  hashtags: string[];
  callToAction?: string;
  relatedEvent?: string;
  eventDate?: string;
  platformAdaptations?: Record<string, string>;
  aiAssisted: boolean;
}

export interface ProfileUpdatePayload {
  displayName?: string;
  program?: string;
  avatarUrl?: string;
  interests?: string[];
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
}

interface AuthContextValue {
  session: SessionContext | null;
  authConfig: AuthPublicConfig;
  loading: boolean;
  viewingHome: boolean;
  setViewingHome: (viewing: boolean) => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  activeClubId: string | null;
  setActiveClubId: (clubId: string) => void;
  loginAs: (payload: {
    userId?: string;
    email?: string;
    startOnboarding?: boolean;
  }) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (patch: ProfileUpdatePayload) => Promise<SessionContext>;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  draftHandoff: AiDraftHandoff | null;
  setDraftHandoff: (draft: AiDraftHandoff | null) => void;
}

const DEFAULT_AUTH_CONFIG: AuthPublicConfig = {
  demoMode: true,
  googleClientId: '',
  authProvider: 'google',
  allowedDomains: ['@spsmail.cuny.edu', '@sps.cuny.edu'],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionContext | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthPublicConfig>(DEFAULT_AUTH_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewingHome, setViewingHome] = useState<boolean>(false);
  const [portalMode, setPortalMode] = useState<PortalMode>('CLUB');
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [draftHandoff, setDraftHandoff] = useState<AiDraftHandoff | null>(null);

  const apiFetch = useCallback(async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
    }
    return data as T;
  }, []);

  const applySession = useCallback((nextSession: SessionContext) => {
    setSession(nextSession);
    if (nextSession.effectiveAdminRole) {
      setPortalMode('ADMIN');
    } else {
      setPortalMode('CLUB');
    }
    if (nextSession.memberships.length > 0) {
      setActiveClubId((prev) => {
        const stillValid = nextSession.memberships.some((m) => m.clubId === prev);
        return stillValid ? prev : nextSession.memberships[0].clubId;
      });
    } else if (nextSession.effectiveAdminRole) {
      setActiveClubId((prev) => prev || 'club-ai');
    } else {
      setActiveClubId(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const [cfgRes, sessRes] = await Promise.all([
        fetch('/api/auth/config', { credentials: 'include' }).catch(() => null),
        fetch('/api/auth/session', { credentials: 'include' }).catch(() => null),
      ]);

      if (cfgRes && cfgRes.ok) {
        const cfg = (await cfgRes.json()) as AuthPublicConfig;
        setAuthConfig(cfg);
      }

      if (sessRes && sessRes.ok) {
        const data = (await sessRes.json()) as SessionContext;
        applySession(data);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loginAs = useCallback(
    async (payload: { userId?: string; email?: string; startOnboarding?: boolean }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || 'Institutional authentication failed.'
        );
      }
      setViewingHome(false);
      applySession(data as SessionContext);
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || 'Please use your CUNY SPS email.'
        );
      }
      setViewingHome(false);
      applySession(data as SessionContext);
    },
    [applySession]
  );

  const updateProfile = useCallback(
    async (patch: ProfileUpdatePayload): Promise<SessionContext> => {
      const updated = await apiFetch<SessionContext>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      applySession(updated);
      return updated;
    },
    [apiFetch, applySession]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
    } catch {
      // Clear local session state even if network call fails
    }
    setSession(null);
    setViewingHome(false);
    setActiveClubId(null);
    setDraftHandoff(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        authConfig,
        loading,
        viewingHome,
        setViewingHome,
        portalMode,
        setPortalMode,
        activeClubId,
        setActiveClubId,
        loginAs,
        loginWithGoogle,
        logout,
        refreshSession,
        updateProfile,
        apiFetch,
        draftHandoff,
        setDraftHandoff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function formatRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'SL_SUPER_ADMIN':
      return 'Student Life Super Admin';
    case 'SL_ADMIN':
      return 'Student Life Admin (Scoped)';
    case 'CLUB_LEAD':
      return 'Club Lead';
    case 'EDITOR':
      return 'Club Social Media Editor';
    case 'CONTRIBUTOR':
      return 'Contributor';
    case 'VIEWER':
      return 'Viewer';
    default:
      return 'Institutional User';
  }
}

export type PersonaListItem = {
  user: User;
  memberships: SessionContext['memberships'];
};
