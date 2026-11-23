import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { formatRoleLabel, type PersonaListItem, useAuth } from '../context/AuthContext';
import { useSiteContent } from '../context/SiteContentContext';
import { sanitizeHref, type TopNavItem } from '../data/siteContent';
import {
  ClubLogoMark,
  HubLogoLockup,
  HubLogoMark,
  StudentLifeLogo,
} from './BrandMarks';
import { PublicCampusDirectory } from './PublicCampusDirectory';
import { CustomPageView } from './cms/CustomPageView';
import {
  EditableImage,
  EditableLink,
  EditableRepeatingItemBar,
  EditableText,
} from './cms/EditablePrimitives';
import { CustomSectionsList, EditableSectionShell } from './cms/SectionBuilder';
import { SiteFooter } from './cms/SiteFooter';
import { PWAInstallButton } from './pwa/PWAInstallButton';

export function LoginView() {
  const { loginAs } = useAuth();
  const {
    content,
    isEditActive,
    activeCustomPageId,
    setActiveCustomPageId,
    updateContent,
    mutateEntity,
  } = useSiteContent();

  const [activeView, setActiveView] = useState<'login' | 'directory'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'public' || window.location.hash === '#public') {
        return 'directory';
      }
    }
    return 'login';
  });
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [emailInput, setEmailInput] = useState('aisha.rahman@spsmail.cuny.edu');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draggingNavId, setDraggingNavId] = useState<string | null>(null);
  const [draggingPersonaId, setDraggingPersonaId] = useState<string | null>(null);

  const loadPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/personas');
      const data = (await res.json()) as { personas?: PersonaListItem[] };
      setPersonas(data.personas ?? []);
    } catch {
      setError('Unable to load institutional identity directory.');
    }
  }, []);

  useEffect(() => {
    void loadPersonas();
  }, [loadPersonas]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginAs({ email: emailInput.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSignIn = async (userId: string) => {
    setError('');
    setSubmitting(true);
    try {
      await loginAs({ userId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInternalNavigate = (href: string) => {
    if (href === '#public' || href === '/public') {
      setActiveCustomPageId(null);
      setActiveView('directory');
      return;
    }
    if (href === '#login' || href === '/' || href === '#home') {
      setActiveCustomPageId(null);
      setActiveView('login');
      return;
    }
    const matchedCustom = content.customPages.find(
      (p) => `#${p.slug}` === href || `/${p.slug}` === href || p.id === href
    );
    if (matchedCustom) {
      setActiveCustomPageId(matchedCustom.id);
    }
  };

  const landing = content.pages.landing;
  const visibleTopNav = isEditActive
    ? content.navigation.topNav
    : content.navigation.topNav.filter((item) => item.visible);

  const moveTopNav = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= content.navigation.topNav.length) return;
    updateContent((draft) => {
      const list = draft.navigation.topNav;
      const [moved] = list.splice(idx, 1);
      list.splice(target, 0, moved);
    });
  };

  const addTopNavItem = () => {
    updateContent((draft) => {
      const next: TopNavItem = {
        id: `nav-${Date.now().toString(36)}`,
        label: 'New Link',
        target: 'https://sps.cuny.edu',
        kind: 'external',
        visible: true,
      };
      draft.navigation.topNav.push(next);
    });
  };

  const moveLandingSection = (
    key: 'hero' | 'loginCard' | 'personaDirectory',
    delta: -1 | 1
  ) => {
    updateContent((draft) => {
      const order = [...draft.pages.landing.sectionOrder];
      const idx = order.indexOf(key);
      const target = idx + delta;
      if (idx < 0 || target < 0 || target >= order.length) return;
      const [m] = order.splice(idx, 1);
      order.splice(target, 0, m);
      draft.pages.landing.sectionOrder = order;
    });
  };

  const handlePersonaMutation = async (payload: Record<string, unknown>) => {
    setError('');
    try {
      await mutateEntity('personas', payload);
      await loadPersonas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update persona directory.');
    }
  };

  const renderHeroSection = () => (
    <div className="space-y-4">
      <div className="bg-[#0B0B0F] border border-slate-900 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <HubLogoLockup
          theme="dark"
          size="md"
          showSubtitle
          subtitleField="pilotBadgeSubtitle"
          subtitle={content.settings.pilotBadgeSubtitle}
        />
        <HubLogoMark variant="orbit" surface="bare-light" size="sm" />
      </div>

      <div className="flex items-center gap-4 pt-1">
        <StudentLifeLogo className="h-11 w-auto" />
        <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
        <div className="flex items-center gap-2.5">
          {isEditActive ? (
            <EditableImage
              src={landing.partnerClubLogoUrl}
              alt={landing.partnerClubLogoAlt}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.landing.partnerClubLogoUrl = next.src;
                  d.pages.landing.partnerClubLogoAlt = next.alt;
                })
              }
              className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-slate-950 shrink-0"
              fallback={
                <ClubLogoMark
                  clubId="club-ai"
                  clubShortCode="AI-CLUB"
                  clubName={landing.partnerClubName}
                  size="md"
                />
              }
            />
          ) : (
            <ClubLogoMark
              clubId="club-ai"
              clubShortCode="AI-CLUB"
              clubName={landing.partnerClubName}
              logoUrl={landing.partnerClubLogoUrl}
              size="md"
            />
          )}
          <div>
            <EditableText
              as="div"
              value={landing.partnerClubName}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.landing.partnerClubName = next;
                })
              }
              className="text-[11px] font-semibold text-slate-900"
            />
            <EditableText
              as="div"
              value={landing.partnerClubRole}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.landing.partnerClubRole = next;
                })
              }
              className="text-[10px] text-slate-500"
            />
          </div>
        </div>
      </div>

      <EditableText
        as="p"
        value={landing.eyebrow}
        onChange={(next) =>
          updateContent((d) => {
            d.pages.landing.eyebrow = next;
          })
        }
        className="text-xs font-semibold tracking-wide text-[#004B87]"
      />
      <EditableText
        as="h1"
        value={landing.headline}
        onChange={(next) =>
          updateContent((d) => {
            d.pages.landing.headline = next;
          })
        }
        className="text-3xl font-bold tracking-tight text-slate-900 leading-tight"
      />
      <EditableText
        as="p"
        multiline
        value={landing.leadParagraph}
        onChange={(next) =>
          updateContent((d) => {
            d.pages.landing.leadParagraph = next;
          })
        }
        className="text-base text-slate-600 leading-relaxed"
      />
      <div className="pt-1">
        <EditableLink
          label={landing.browseEventsCta.label}
          href={landing.browseEventsCta.href}
          onNavigateInternal={handleInternalNavigate}
          onChange={(next) =>
            updateContent((d) => {
              d.pages.landing.browseEventsCta = next;
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#004B87] bg-white border border-[#004B87] hover:bg-sky-50 rounded-md whitespace-nowrap cursor-pointer transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </EditableLink>
      </div>
    </div>
  );

  const renderLoginCardSection = () => (
    <form
      onSubmit={handleManualLogin}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-5"
    >
      <div className="space-y-1">
        <EditableText
          as="h2"
          value={landing.loginCardHeading}
          onChange={(next) =>
            updateContent((d) => {
              d.pages.landing.loginCardHeading = next;
            })
          }
          className="text-base font-semibold text-slate-900"
        />
        <EditableText
          as="p"
          value={landing.loginCardSubtext}
          onChange={(next) =>
            updateContent((d) => {
              d.pages.landing.loginCardSubtext = next;
            })
          }
          className="text-xs text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="cuny-email" className="block text-xs font-medium text-slate-700">
          <EditableText
            as="span"
            value={landing.emailFieldLabel}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.landing.emailFieldLabel = next;
              })
            }
          />
        </label>
        <input
          id="cuny-email"
          type="email"
          required
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="name@spsmail.cuny.edu"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004B87]/20 focus:border-[#004B87]"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 rounded-md transition-colors cursor-pointer"
      >
        <KeyRound className="w-4 h-4" />
        <EditableText
          as="span"
          value={submitting ? 'Opening Demo...' : landing.loginSubmitLabel}
          onChange={(next) =>
            updateContent((d) => {
              d.pages.landing.loginSubmitLabel = next;
            })
          }
        />
      </button>

      {personas.length > 0 && (() => {
        const adminPersona =
          personas.find((p) => p.user.systemRole === 'SL_SUPER_ADMIN') ??
          personas.find((p) => p.user.systemRole === 'SL_ADMIN');
        const leadPersona = personas.find((p) =>
          p.memberships.some((m) => m.role === 'CLUB_LEAD' && m.status === 'Active')
        );
        return (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <EditableText
              as="div"
              value={landing.quickLaunchLabel}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.landing.quickLaunchLabel = next;
                })
              }
              className="text-[11px] font-semibold text-slate-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {adminPersona && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleQuickSignIn(adminPersona.user.userId)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <EditableText
                    as="span"
                    value={landing.adminConsoleBtnLabel}
                    onChange={(next) =>
                      updateContent((d) => {
                        d.pages.landing.adminConsoleBtnLabel = next;
                      })
                    }
                  />
                </button>
              )}
              {leadPersona && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleQuickSignIn(leadPersona.user.userId)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#004B87] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <EditableText
                    as="span"
                    value={landing.clubPortalBtnLabel}
                    onChange={(next) =>
                      updateContent((d) => {
                        d.pages.landing.clubPortalBtnLabel = next;
                      })
                    }
                  />
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <EditableText
            as="span"
            value={landing.securityNote1}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.landing.securityNote1 = next;
              })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <EditableText
            as="span"
            value={landing.securityNote2}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.landing.securityNote2 = next;
              })
            }
          />
        </div>
      </div>

      <PWAInstallButton variant="signin" />
    </form>
  );

  const renderPersonaDirectorySection = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <EditableText
            as="h2"
            value={landing.personaDirectoryHeading}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.landing.personaDirectoryHeading = next;
              })
            }
            className="text-base font-semibold text-slate-900"
          />
          <EditableText
            as="p"
            value={landing.personaDirectorySubtext}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.landing.personaDirectorySubtext = next;
              })
            }
            className="text-xs text-slate-500 mt-0.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-tabular text-slate-500">
            {personas.length} demo personas
          </span>
          {isEditActive && (
            <button
              type="button"
              onClick={() =>
                void handlePersonaMutation({
                  action: 'add',
                  name: 'New Demo Member',
                  departmentOrMajor: 'B.S. Information Systems',
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add new</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        {personas.map(({ user, memberships }, idx) => {
          const primaryRole =
            user.systemRole !== 'STANDARD_USER'
              ? formatRoleLabel(user.systemRole)
              : memberships[0]
                ? formatRoleLabel(memberships[0].role)
                : 'Candidate / Unassigned';
          const clubSummary =
            user.systemRole === 'SL_SUPER_ADMIN'
              ? 'All participating clubs'
              : user.systemRole === 'SL_ADMIN'
                ? `Scoped administrator: ${user.assignedAdminClubIds?.length ?? 0} assigned clubs`
                : memberships.length > 0
                  ? memberships.map((m) => `${m.clubShortCode} (${m.role})`).join(' · ')
                  : 'No active club workspace';

          return (
            <div
              key={user.userId}
              draggable={isEditActive}
              onDragStart={() => setDraggingPersonaId(user.userId)}
              onDragOver={(e) => {
                if (isEditActive) e.preventDefault();
              }}
              onDrop={() => {
                if (!draggingPersonaId || draggingPersonaId === user.userId) return;
                const ordered = personas.map((p) => p.user.userId);
                const from = ordered.indexOf(draggingPersonaId);
                const to = ordered.indexOf(user.userId);
                if (from >= 0 && to >= 0) {
                  const [m] = ordered.splice(from, 1);
                  ordered.splice(to, 0, m);
                  void handlePersonaMutation({ action: 'reorder', orderedIds: ordered });
                }
                setDraggingPersonaId(null);
              }}
              className="p-4 hover:bg-slate-50/80 transition-colors"
            >
              <EditableRepeatingItemBar
                itemLabel={`Persona #${idx + 1}`}
                canMoveUp={idx > 0}
                canMoveDown={idx < personas.length - 1}
                onMoveUp={() => {
                  const ordered = personas.map((p) => p.user.userId);
                  const [m] = ordered.splice(idx, 1);
                  ordered.splice(idx - 1, 0, m);
                  void handlePersonaMutation({ action: 'reorder', orderedIds: ordered });
                }}
                onMoveDown={() => {
                  const ordered = personas.map((p) => p.user.userId);
                  const [m] = ordered.splice(idx, 1);
                  ordered.splice(idx + 1, 0, m);
                  void handlePersonaMutation({ action: 'reorder', orderedIds: ordered });
                }}
                onDuplicate={() =>
                  void handlePersonaMutation({ action: 'duplicate', id: user.userId })
                }
                onDelete={() =>
                  void handlePersonaMutation({ action: 'delete', id: user.userId })
                }
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EditableText
                      as="span"
                      value={user.name}
                      onChange={(next) =>
                        void handlePersonaMutation({
                          action: 'update',
                          id: user.userId,
                          name: next,
                        })
                      }
                      className="text-sm font-semibold text-slate-900"
                    />
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-medium text-[#004B87]">{primaryRole}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{user.email}</span>
                    <span aria-hidden="true">·</span>
                    <EditableText
                      as="span"
                      value={user.departmentOrMajor}
                      onChange={(next) =>
                        void handlePersonaMutation({
                          action: 'update',
                          id: user.userId,
                          departmentOrMajor: next,
                        })
                      }
                    />
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    {user.systemRole !== 'STANDARD_USER' ? (
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{clubSummary}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={submitting || user.status !== 'Active'}
                  onClick={() => void handleQuickSignIn(user.userId)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:border-[#004B87] hover:text-[#004B87] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <EditableText
                    as="span"
                    value={user.status === 'Active' ? landing.enterPortalBtnLabel : 'Access Revoked'}
                    onChange={(next) =>
                      updateContent((d) => {
                        d.pages.landing.enterPortalBtnLabel = next;
                      })
                    }
                  />
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const sectionOrder = landing.sectionOrder;
  const heroIdx = sectionOrder.indexOf('hero');
  const loginIdx = sectionOrder.indexOf('loginCard');
  const personaIdx = sectionOrder.indexOf('personaDirectory');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <HubLogoLockup
            theme="light"
            size="md"
            showSubtitle
            subtitleField="tagline"
            subtitle={content.settings.tagline}
          />
          <div className="h-8 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />
          <StudentLifeLogo className="h-9 w-auto hidden sm:block" />
        </div>

        <nav aria-label="Primary Navigation" className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
          {visibleTopNav.map((item, idx) => {
            const isSelected =
              (item.kind === 'builtin-login' && !activeCustomPageId && activeView === 'login') ||
              (item.kind === 'builtin-directory' &&
                !activeCustomPageId &&
                activeView === 'directory') ||
              (item.kind === 'custom-page' && activeCustomPageId === item.target);

            const handleNavClick = () => {
              if (item.kind === 'builtin-login') {
                setActiveCustomPageId(null);
                setActiveView('login');
              } else if (item.kind === 'builtin-directory') {
                setActiveCustomPageId(null);
                setActiveView('directory');
              } else if (item.kind === 'custom-page') {
                setActiveCustomPageId(item.target);
              }
            };

            return (
              <div
                key={item.id}
                draggable={isEditActive}
                onDragStart={() => setDraggingNavId(item.id)}
                onDragOver={(e) => {
                  if (isEditActive) e.preventDefault();
                }}
                onDrop={() => {
                  if (!draggingNavId || draggingNavId === item.id) return;
                  updateContent((d) => {
                    const list = d.navigation.topNav;
                    const from = list.findIndex((n) => n.id === draggingNavId);
                    const to = list.findIndex((n) => n.id === item.id);
                    if (from >= 0 && to >= 0) {
                      const [m] = list.splice(from, 1);
                      list.splice(to, 0, m);
                    }
                  });
                  setDraggingNavId(null);
                }}
                className={`inline-flex items-center gap-1 ${
                  !item.visible && isEditActive ? 'opacity-50' : ''
                }`}
              >
                {item.kind === 'external' ? (
                  <EditableLink
                    label={item.label}
                    href={sanitizeHref(item.target)}
                    onChange={(next) =>
                      updateContent((d) => {
                        const t = d.navigation.topNav.find((n) => n.id === item.id);
                        if (t) {
                          t.label = next.label;
                          t.target = next.href;
                        }
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded text-slate-600 hover:text-slate-900 whitespace-nowrap"
                  >
                    {!isEditActive && <ExternalLink className="w-3 h-3 opacity-60" />}
                  </EditableLink>
                ) : (
                  <button
                    type="button"
                    onClick={handleNavClick}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <EditableText
                      as="span"
                      value={item.label}
                      onChange={(next) =>
                        updateContent((d) => {
                          const t = d.navigation.topNav.find((n) => n.id === item.id);
                          if (t) t.label = next;
                        })
                      }
                    />
                  </button>
                )}

                {isEditActive && (
                  <span className="inline-flex items-center gap-0.5 pr-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTopNav(idx, -1)}
                      aria-label={`Move ${item.label} left`}
                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === visibleTopNav.length - 1}
                      onClick={() => moveTopNav(idx, 1)}
                      aria-label={`Move ${item.label} right`}
                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent((d) => {
                          d.navigation.topNav.splice(idx + 1, 0, {
                            ...item,
                            id: `nav-copy-${Date.now().toString(36)}`,
                            label: `${item.label} (Copy)`,
                          });
                        })
                      }
                      aria-label={`Duplicate ${item.label}`}
                      className="p-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent((d) => {
                          d.navigation.topNav = d.navigation.topNav.filter(
                            (n) => n.id !== item.id
                          );
                        })
                      }
                      aria-label={`Delete ${item.label}`}
                      className="p-0.5 text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            );
          })}

          {isEditActive && (
            <button
              type="button"
              onClick={addTopNavItem}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          )}
        </nav>

        <EditableText
          as="div"
          value={landing.headerStatusText}
          onChange={(next) =>
            updateContent((d) => {
              d.pages.landing.headerStatusText = next;
            })
          }
          className="text-xs font-medium text-[#004B87] whitespace-nowrap shrink-0"
        />
      </header>

      {activeCustomPageId ? (
        <main className="flex-1 w-full">
          <CustomPageView
            pageId={activeCustomPageId}
            onBack={() => setActiveCustomPageId(null)}
            onNavigateInternal={handleInternalNavigate}
          />
        </main>
      ) : activeView === 'directory' ? (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
          <PublicCampusDirectory
            mode="public"
            onRequestLogin={() => setActiveView('login')}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-8">
              {sectionOrder
                .filter((k) => k === 'hero' || k === 'loginCard')
                .map((key) =>
                  key === 'hero' ? (
                    <EditableSectionShell
                      key="hero"
                      title="Hero & Brand Overview"
                      visible={landing.sectionVisibility.hero}
                      canMoveUp={heroIdx > 0}
                      canMoveDown={heroIdx < sectionOrder.length - 1}
                      onToggleVisible={() =>
                        updateContent((d) => {
                          d.pages.landing.sectionVisibility.hero =
                            !d.pages.landing.sectionVisibility.hero;
                        })
                      }
                      onMoveUp={() => moveLandingSection('hero', -1)}
                      onMoveDown={() => moveLandingSection('hero', 1)}
                    >
                      {renderHeroSection()}
                    </EditableSectionShell>
                  ) : (
                    <EditableSectionShell
                      key="loginCard"
                      title="Demo Workspace Sign-In"
                      visible={landing.sectionVisibility.loginCard}
                      canMoveUp={loginIdx > 0}
                      canMoveDown={loginIdx < sectionOrder.length - 1}
                      onToggleVisible={() =>
                        updateContent((d) => {
                          d.pages.landing.sectionVisibility.loginCard =
                            !d.pages.landing.sectionVisibility.loginCard;
                        })
                      }
                      onMoveUp={() => moveLandingSection('loginCard', -1)}
                      onMoveDown={() => moveLandingSection('loginCard', 1)}
                    >
                      {renderLoginCardSection()}
                    </EditableSectionShell>
                  )
                )}
            </div>

            <div className="lg:col-span-7">
              <EditableSectionShell
                title="Demo Persona Directory"
                visible={landing.sectionVisibility.personaDirectory}
                canMoveUp={personaIdx > 0}
                canMoveDown={personaIdx < sectionOrder.length - 1}
                onToggleVisible={() =>
                  updateContent((d) => {
                    d.pages.landing.sectionVisibility.personaDirectory =
                      !d.pages.landing.sectionVisibility.personaDirectory;
                  })
                }
                onMoveUp={() => moveLandingSection('personaDirectory', -1)}
                onMoveDown={() => moveLandingSection('personaDirectory', 1)}
              >
                {renderPersonaDirectorySection()}
              </EditableSectionShell>
            </div>
          </div>

          <CustomSectionsList
            sections={landing.customSections}
            onNavigateInternal={handleInternalNavigate}
            onChange={(nextSections) =>
              updateContent((d) => {
                d.pages.landing.customSections = nextSections;
              })
            }
          />
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
