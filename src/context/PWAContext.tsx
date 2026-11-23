import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISS_STORAGE_KEY = 'cuny_sps_pwa_install_dismissed_v1';

export interface PWAClientEnvironment {
  isIOS: boolean;
  isIOSSafari: boolean;
  isIOSNonSafari: boolean;
  isStandalone: boolean;
  isInIframe: boolean;
}

export function detectPWAEnvironment(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0,
  standaloneMatch = false,
  navigatorStandalone = false,
  inIframe = false
): PWAClientEnvironment {
  const ua = userAgent || '';
  const isIOSDevice =
    /iphone|ipad|ipod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  // Third-party iOS browsers and in-app webviews embed distinct tokens in UA
  const isNonSafariIOSBrowser =
    /crios|fxios|edgios|opios|duckduckgo|fban|fbav|instagram|whatsapp|line\/|gsa\/|snapchat/i.test(
      ua
    );
  const hasSafariToken = /safari/i.test(ua) && /applewebkit/i.test(ua);
  const isIOSSafari = isIOSDevice && hasSafariToken && !isNonSafariIOSBrowser;
  const isIOSNonSafari = isIOSDevice && !isIOSSafari;

  return {
    isIOS: isIOSDevice,
    isIOSSafari,
    isIOSNonSafari,
    isStandalone: Boolean(standaloneMatch || navigatorStandalone),
    isInIframe: Boolean(inIframe),
  };
}

interface PWAContextValue {
  isInstalled: boolean;
  isInstallPromptReady: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  isIOSNonSafari: boolean;
  isInIframe: boolean;
  isDismissed: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  showGuideModal: boolean;
  triggerInstall: () => Promise<void>;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
  dismissForever: () => void;
  applyUpdate: () => void;
  dismissUpdateBanner: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

function readDismissedFlag(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const initialEnv = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isIOS: false,
        isIOSSafari: false,
        isIOSNonSafari: false,
        isStandalone: false,
        isInIframe: false,
      };
    }
    const standaloneMedia =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const navStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    return detectPWAEnvironment(
      navigator.userAgent,
      navigator.platform || '',
      navigator.maxTouchPoints || 0,
      standaloneMedia,
      navStandalone,
      inIframe
    );
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(initialEnv.isStandalone);
  const [isDismissed, setIsDismissed] = useState<boolean>(readDismissedFlag);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const refreshingRef = useRef(false);

  // Capture beforeinstallprompt, appinstalled, standalone media query, and online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const mql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowGuideModal(false);
      }
    };
    if (mql) {
      if (mql.matches) setIsInstalled(true);
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleDisplayModeChange);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (mql && typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  // Register /sw.js on page load and watch for deployed updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let registrationRef: ServiceWorkerRegistration | null = null;
    let isMounted = true;

    const markWaitingWorker = (worker: ServiceWorker | null) => {
      if (!worker || !isMounted) return;
      waitingWorkerRef.current = worker;
      setUpdateAvailable(true);
    };

    const handleControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        registrationRef = reg;

        if (reg.waiting && navigator.serviceWorker.controller) {
          markWaitingWorker(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              markWaitingWorker(reg.waiting || installing);
            }
          });
        });
      } catch {
        // Ignore SW registration failure in restricted environments (e.g. private/insecure contexts)
      }
    };

    const onLoad = () => {
      void registerServiceWorker();
    };

    if (document.readyState === 'complete') {
      void registerServiceWorker();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registrationRef) {
        registrationRef.update().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (isInstalled) return;
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return;
        }
        // Prompt can only be invoked once per beforeinstallprompt event
        setDeferredPrompt(null);
      } catch {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  }, [deferredPrompt, isInstalled]);

  const openInstallGuide = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  const closeInstallGuide = useCallback(() => {
    setShowGuideModal(false);
  }, []);

  const dismissForever = useCallback(() => {
    setIsDismissed(true);
    setShowGuideModal(false);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  const dismissUpdateBanner = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  const value: PWAContextValue = {
    isInstalled,
    isInstallPromptReady: Boolean(deferredPrompt),
    isIOS: initialEnv.isIOS,
    isIOSSafari: initialEnv.isIOSSafari,
    isIOSNonSafari: initialEnv.isIOSNonSafari,
    isInIframe: initialEnv.isInIframe,
    isDismissed,
    isOnline,
    updateAvailable,
    showGuideModal,
    triggerInstall,
    openInstallGuide,
    closeInstallGuide,
    dismissForever,
    applyUpdate,
    dismissUpdateBanner,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA(): PWAContextValue {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return ctx;
}
