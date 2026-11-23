import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { sanitizeHref, type SocialFooterLink } from '../../data/siteContent';
import { EditableLink, EditableText } from './EditablePrimitives';

interface SiteFooterProps {
  compact?: boolean;
}

export function SiteFooter({ compact = false }: SiteFooterProps) {
  const {
    content,
    isAdminLoggedIn,
    isEditActive,
    setShowLoginModal,
    setShowSettingsDrawer,
    updateContent,
  } = useSiteContent();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { footer } = content;

  const moveSocial = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= footer.socialLinks.length) return;
    updateContent((draft) => {
      const list = draft.footer.socialLinks;
      const [moved] = list.splice(index, 1);
      list.splice(target, 0, moved);
    });
  };

  const addSocialLink = () => {
    updateContent((draft) => {
      const next: SocialFooterLink = {
        id: `soc-${Date.now().toString(36)}`,
        label: 'New Link',
        url: 'https://sps.cuny.edu',
      };
      draft.footer.socialLinks.push(next);
    });
  };

  const duplicateSocial = (index: number) => {
    updateContent((draft) => {
      const orig = draft.footer.socialLinks[index];
      if (!orig) return;
      draft.footer.socialLinks.splice(index + 1, 0, {
        ...orig,
        id: `soc-copy-${Date.now().toString(36)}`,
        label: `${orig.label} (Copy)`,
      });
    });
  };

  const deleteSocial = (id: string) => {
    updateContent((draft) => {
      draft.footer.socialLinks = draft.footer.socialLinks.filter((l) => l.id !== id);
    });
  };

  const cleanEmail = footer.contactEmail.trim();

  return (
    <footer
      className={`border-t border-slate-200 bg-white ${
        compact ? 'px-5 lg:px-8 py-5 mt-8' : 'px-4 sm:px-6 lg:px-8 py-6 mt-10'
      }`}
    >
      <div className={compact ? 'max-w-[1440px] mx-auto' : 'max-w-7xl mx-auto'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <EditableText
              as="div"
              value={footer.text}
              onChange={(next) =>
                updateContent((draft) => {
                  draft.footer.text = next;
                })
              }
              className="text-xs font-semibold text-slate-800"
            />
            {(footer.subtext || isEditActive) && (
              <EditableText
                as="p"
                value={footer.subtext}
                placeholder="Optional footer subtext"
                onChange={(next) =>
                  updateContent((draft) => {
                    draft.footer.subtext = next;
                  })
                }
                className="text-[11px] text-slate-500"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {(cleanEmail || isEditActive) && (
              <div className="inline-flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {isEditActive ? (
                  <EditableText
                    as="span"
                    value={footer.contactEmail}
                    placeholder="contact@sps.cuny.edu"
                    onChange={(next) =>
                      updateContent((draft) => {
                        draft.footer.contactEmail = next;
                      })
                    }
                    className="text-xs font-medium text-[#004B87]"
                  />
                ) : (
                  <a
                    href={sanitizeHref(`mailto:${cleanEmail}`)}
                    className="font-medium text-slate-600 hover:text-[#004B87] hover:underline"
                  >
                    {cleanEmail}
                  </a>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {footer.socialLinks.map((link, idx) => (
                <div
                  key={link.id}
                  draggable={isEditActive}
                  onDragStart={() => setDraggingId(link.id)}
                  onDragOver={(e) => {
                    if (isEditActive) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (!draggingId || draggingId === link.id) return;
                    updateContent((draft) => {
                      const list = draft.footer.socialLinks;
                      const from = list.findIndex((i) => i.id === draggingId);
                      const to = list.findIndex((i) => i.id === link.id);
                      if (from >= 0 && to >= 0) {
                        const [m] = list.splice(from, 1);
                        list.splice(to, 0, m);
                      }
                    });
                    setDraggingId(null);
                  }}
                  className={`inline-flex items-center gap-1 ${
                    isEditActive
                      ? 'px-2 py-0.5 rounded border border-dashed border-[#004B87]/50 bg-sky-50/50'
                      : ''
                  }`}
                >
                  <EditableLink
                    label={link.label}
                    href={link.url}
                    onChange={(next) =>
                      updateContent((draft) => {
                        const item = draft.footer.socialLinks.find((l) => l.id === link.id);
                        if (item) {
                          item.label = next.label;
                          item.url = next.href;
                        }
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#004B87] hover:underline"
                  >
                    {!isEditActive && <ExternalLink className="w-3 h-3 opacity-60" />}
                  </EditableLink>

                  {isEditActive && (
                    <span className="inline-flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSocial(idx, -1)}
                        aria-label={`Move ${link.label} left`}
                        className="p-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === footer.socialLinks.length - 1}
                        onClick={() => moveSocial(idx, 1)}
                        aria-label={`Move ${link.label} right`}
                        className="p-0.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateSocial(idx)}
                        aria-label={`Duplicate ${link.label}`}
                        className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSocial(link.id)}
                        aria-label={`Delete ${link.label}`}
                        className="p-0.5 text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              ))}

              {isEditActive && (
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add link</span>
                </button>
              )}
            </div>

            <span className="hidden sm:inline text-slate-300" aria-hidden="true">
              |
            </span>

            <button
              type="button"
              onClick={() => {
                if (isAdminLoggedIn) {
                  setShowSettingsDrawer(true);
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
