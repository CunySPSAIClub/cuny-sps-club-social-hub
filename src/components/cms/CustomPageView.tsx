import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { EditableText } from './EditablePrimitives';
import { CustomSectionsList } from './SectionBuilder';

interface CustomPageViewProps {
  pageId: string;
  onBack: () => void;
  onNavigateInternal?: (href: string) => void;
}

export function CustomPageView({ pageId, onBack, onNavigateInternal }: CustomPageViewProps) {
  const { content, isEditActive, updateContent } = useSiteContent();
  const page = content.customPages.find((p) => p.id === pageId);

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-600">
          This custom page may have been removed or hidden.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004B87] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        {!page.visible && isEditActive && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
            Hidden from visitors
          </span>
        )}
      </div>

      <header className="bg-white border border-slate-200 rounded-lg p-6 space-y-2">
        <EditableText
          as="h1"
          value={page.title}
          onChange={(next) =>
            updateContent((draft) => {
              const target = draft.customPages.find((p) => p.id === page.id);
              if (target) target.title = next;
              const reg = draft.pageRegistry.find((r) => r.id === page.id);
              if (reg) reg.title = next;
              const nav = draft.navigation.topNav.find((n) => n.target === page.id);
              if (nav) nav.label = next;
            })
          }
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
        />
        {(page.subtitle || isEditActive) && (
          <EditableText
            as="p"
            multiline
            value={page.subtitle}
            placeholder="Optional page subtitle"
            onChange={(next) =>
              updateContent((draft) => {
                const target = draft.customPages.find((p) => p.id === page.id);
                if (target) target.subtitle = next;
              })
            }
            className="text-sm text-slate-600 leading-relaxed max-w-3xl"
          />
        )}
      </header>

      <CustomSectionsList
        sections={page.sections}
        onNavigateInternal={onNavigateInternal}
        onChange={(nextSections) =>
          updateContent((draft) => {
            const target = draft.customPages.find((p) => p.id === page.id);
            if (target) target.sections = nextSections;
          })
        }
      />
    </div>
  );
}
