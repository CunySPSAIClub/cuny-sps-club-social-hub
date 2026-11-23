import { Download, Smartphone, X } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

interface PWAInstallButtonProps {
  variant: 'sidebar' | 'signin';
}

export function PWAInstallButton({ variant }: PWAInstallButtonProps) {
  const { isInstalled, isDismissed, isIOS, triggerInstall, dismissForever } = usePWA();

  // Completely hide when already running as an installed app (standalone mode) or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <div className="rounded-lg border border-slate-200 bg-[#0B0B0F] p-2.5 text-white shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => void triggerInstall()}
            className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer group"
          >
            <span className="w-7 h-7 rounded-md bg-[#C4F500] text-[#0B0B0F] flex items-center justify-center shrink-0 group-hover:opacity-90 transition-opacity">
              {isIOS ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-white leading-tight truncate">
                Add to Home Screen
              </span>
              <span className="block text-[10px] text-slate-300 leading-tight mt-0.5 truncate">
                Install Club Hub app
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={dismissForever}
            title="Don't show again"
            aria-label="Don't show Add to Home Screen again"
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={dismissForever}
          className="mt-1.5 text-[10px] text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer"
        >
          Don&apos;t show again
        </button>
      </div>
    );
  }

  // Sign-in page variant
  return (
    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => void triggerInstall()}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#0B0B0F] hover:bg-slate-800 rounded-md transition-colors cursor-pointer whitespace-nowrap"
      >
        <span className="w-4 h-4 rounded bg-[#C4F500] text-[#0B0B0F] flex items-center justify-center shrink-0">
          {isIOS ? <Smartphone className="w-3 h-3" /> : <Download className="w-3 h-3" />}
        </span>
        <span>Add to Home Screen</span>
      </button>
      <button
        type="button"
        onClick={dismissForever}
        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 underline underline-offset-2 cursor-pointer"
      >
        Don&apos;t show again
      </button>
    </div>
  );
}
