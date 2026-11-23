import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  PlusSquare,
  RefreshCw,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export function PWAChrome() {
  const {
    isIOS,
    isIOSNonSafari,
    isInIframe,
    isOnline,
    updateAvailable,
    showGuideModal,
    closeInstallGuide,
    dismissForever,
    applyUpdate,
    dismissUpdateBanner,
  } = usePWA();

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  return (
    <>
      {/* Update available - Refresh banner */}
      {updateAvailable && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[65] max-w-[calc(100vw-2rem)] flex items-center gap-3 rounded-xl bg-[#0B0B0F] text-white border border-slate-700 px-4 py-2.5 shadow-xl"
        >
          <span className="w-2 h-2 rounded-full bg-[#C4F500] shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">Update available</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#0B0B0F] bg-[#C4F500] hover:opacity-90 rounded-md cursor-pointer transition-opacity whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={dismissUpdateBanner}
            aria-label="Dismiss update notification"
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Non-intrusive offline indicator */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-lg bg-[#0B0B0F] border border-amber-500/50 text-amber-200 px-3 py-2 text-xs font-medium shadow-lg"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Offline — Reconnect to load live club data.</span>
        </div>
      )}

      {/* Install Guide Modal (iPhone/iPad Safari, iPhone non-Safari, and Desktop/Android fallback) */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Brand Header */}
            <div className="bg-[#0B0B0F] px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/icons/icon-192.png"
                  alt="CUNY SPS Club Social Hub icon"
                  className="w-10 h-10 rounded-lg border border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <h2
                    id="pwa-install-guide-title"
                    className="text-sm font-bold text-white leading-tight truncate"
                  >
                    Add Club Hub to Home Screen
                  </h2>
                  <p className="text-[11px] text-[#C4F500] mt-0.5 truncate">
                    CUNY SPS Club Social Hub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeInstallGuide}
                aria-label="Close install instructions"
                className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isIOSNonSafari && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Compass className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 leading-relaxed">
                      <p className="font-semibold">Open this site in Safari first</p>
                      <p className="mt-1 text-amber-900">
                        On iPhone and iPad, apps can only be added to the Home Screen from{' '}
                        <strong>Safari</strong>. Copy the link below and open it in Safari, then
                        follow the 3 steps.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0B0B0F] bg-[#C4F500] hover:opacity-90 rounded-md cursor-pointer transition-opacity"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link copied — paste in Safari</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy link to open in Safari</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    {isIOSNonSafari
                      ? 'Once opened in Safari, follow these 3 quick steps:'
                      : 'Install Club Hub on your iPhone or iPad in 3 quick steps:'}
                  </p>

                  <ol className="space-y-2.5">
                    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#0B0B0F] text-[#C4F500] flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">1. Tap the Share button</span>
                        <p className="text-[11px] text-slate-500">
                          Look for the Share icon at the bottom (or top) of Safari.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#0B0B0F] text-[#C4F500] flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">
                          2. Tap &ldquo;Add to Home Screen&rdquo;
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Scroll down the share sheet and select Add to Home Screen.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#0B0B0F] text-[#C4F500] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">3. Tap &ldquo;Add&rdquo;</span>
                        <p className="text-[11px] text-slate-500">
                          Confirm in the top-right corner to place Club Hub on your Home Screen.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Install <strong>CUNY SPS Club Social Hub</strong> for quick one-tap access in its
                    own app window:
                  </p>

                  {isInIframe && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-900 leading-relaxed">
                      <strong>Tip:</strong> Browsers only show the one-click install popup when the
                      app is opened in its own full browser tab (outside an embedded preview).
                    </div>
                  )}

                  <ol className="space-y-2.5">
                    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#0B0B0F] text-[#C4F500] flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">
                          Chrome or Edge (Desktop &amp; Android)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Click the Install icon in the address bar, or open the browser menu and
                          select <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#0B0B0F] text-[#C4F500] flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">Safari (Mac &amp; iOS)</span>
                        <p className="text-[11px] text-slate-500">
                          On Mac choose <strong>File → Add to Dock</strong>; on iPhone/iPad tap{' '}
                          <strong>Share → Add to Home Screen</strong>.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={dismissForever}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
                >
                  Don&apos;t show again
                </button>
                <button
                  type="button"
                  onClick={closeInstallGuide}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B0B0F] hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
