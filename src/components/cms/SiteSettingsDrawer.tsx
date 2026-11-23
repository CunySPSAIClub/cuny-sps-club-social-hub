import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Menu,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import {
  DEFAULT_SITE_CONTENT,
  GOOGLE_FONT_OPTIONS,
  createSectionFromTemplate,
  sanitizeHref,
  sanitizeImageSrc,
  type CustomPage,
  type PortalNavItemConfig,
  type TopNavItem,
} from '../../data/siteContent';
import { readAndResizeBlogCoverFile } from '../../utils/brandAssets';

type SettingsTab = 'brand' | 'theme' | 'navigation' | 'pages' | 'footer' | 'backup';

export function SiteSettingsDrawer() {
  const {
    content,
    isAdminLoggedIn,
    showSettingsDrawer,
    setShowSettingsDrawer,
    setActiveCustomPageId,
    updateContent,
    saveContent,
    resetToOriginal,
    exportContentJson,
    importContentJson,
    saving,
    justSaved,
    isDirty,
  } = useSiteContent();

  const [tab, setTab] = useState<SettingsTab>('brand');
  const [navGroup, setNavGroup] = useState<'topNav' | 'adminNav' | 'clubNav'>('topNav');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [dragNavIdx, setDragNavIdx] = useState<number | null>(null);
  const [dragPageIdx, setDragPageIdx] = useState<number | null>(null);

  if (!isAdminLoggedIn || !showSettingsDrawer) {
    return null;
  }

  const handleImageUpload = async (
    field: 'logoUrl' | 'partnerLogoUrl' | 'faviconUrl',
    file: File | undefined
  ) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const maxDim = field === 'faviconUrl' ? 128 : 512;
      const dataUrl = await readAndResizeBlogCoverFile(file, maxDim, maxDim);
      updateContent((draft) => {
        draft.settings[field] = dataUrl;
      });
    } catch {
      // Ignore invalid files silently
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newPageTitle.trim();
    if (!title) return;
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom-page';
    const id = `custom-${Date.now().toString(36)}`;
    const newPage: CustomPage = {
      id,
      title,
      slug: slugBase,
      subtitle: 'Click any text below while Edit Mode is ON to customize this page.',
      visible: true,
      sections: [createSectionFromTemplate('text')],
    };

    updateContent((draft) => {
      draft.customPages.push(newPage);
      draft.pageRegistry.push({
        id,
        title,
        slug: slugBase,
        visible: true,
        isBuiltin: false,
      });
      draft.navigation.topNav.push({
        id: `nav-${id}`,
        label: title,
        target: id,
        kind: 'custom-page',
        visible: true,
      });
    });
    setNewPageTitle('');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importContentJson(file);
    if (result.ok) {
      setImportStatus({
        ok: true,
        msg: 'Backup loaded into editor. Click "Save Changes" to publish it to all visitors.',
      });
    } else {
      setImportStatus({ ok: false, msg: result.error || 'Import failed.' });
    }
    e.target.value = '';
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'brand', label: 'Brand', icon: ImageIcon },
    { id: 'theme', label: 'Colors & Fonts', icon: Palette },
    { id: 'navigation', label: 'Navigation', icon: Menu },
    { id: 'pages', label: 'Pages', icon: Layers },
    { id: 'footer', label: 'Footer', icon: FileText },
    { id: 'backup', label: 'Backup & Reset', icon: Download },
  ];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site-Wide Settings"
        className="fixed inset-0 z-[85] bg-slate-900/45 flex justify-end"
        onClick={() => setShowSettingsDrawer(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#004B87]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Site Settings</h2>
                <p className="text-[11px] text-slate-500">
                  Changes apply immediately in preview — click Save to publish for all visitors.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(false)}
              aria-label="Close Site Settings"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap gap-1 shrink-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#004B87] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* BRAND TAB */}
            {tab === 'brand' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={content.settings.siteName}
                      onChange={(e) =>
                        updateContent((d) => {
                          d.settings.siteName = e.target.value;
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Browser Tab Title
                    </label>
                    <input
                      type="text"
                      value={content.settings.browserTitle}
                      onChange={(e) =>
                        updateContent((d) => {
                          d.settings.browserTitle = e.target.value;
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={content.settings.tagline}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.tagline = e.target.value;
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sidebar Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.settings.sidebarSubtitle}
                      onChange={(e) =>
                        updateContent((d) => {
                          d.settings.sidebarSubtitle = e.target.value;
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilot Badge Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.settings.pilotBadgeSubtitle}
                      onChange={(e) =>
                        updateContent((d) => {
                          d.settings.pilotBadgeSubtitle = e.target.value;
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                </div>

                {/* Custom Site Logo */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Site Logo (leave URL blank to use built-in mark)
                    </span>
                    {content.settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((d) => {
                            d.settings.logoUrl = '';
                          })
                        }
                        className="text-[11px] text-red-700 hover:underline cursor-pointer"
                      >
                        Reset to default mark
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {sanitizeImageSrc(content.settings.logoUrl) && (
                      <img
                        src={sanitizeImageSrc(content.settings.logoUrl)}
                        alt={content.settings.logoAlt}
                        className="h-10 w-10 object-contain rounded border border-slate-200 bg-white p-1"
                      />
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingField === 'logoUrl' ? 'Processing...' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => void handleImageUpload('logoUrl', e.target.files?.[0])}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={content.settings.logoUrl}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.logoUrl = e.target.value;
                      })
                    }
                    placeholder="https://... or /assets/..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                  <input
                    type="text"
                    value={content.settings.logoAlt}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.logoAlt = e.target.value;
                      })
                    }
                    placeholder="Logo alt text"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>

                {/* Partner / Student Life Logo */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
                  <div className="text-xs font-bold text-slate-900">
                    Partner / Office of Student Life Logo
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {sanitizeImageSrc(content.settings.partnerLogoUrl) && (
                      <img
                        src={sanitizeImageSrc(content.settings.partnerLogoUrl)}
                        alt={content.settings.partnerLogoAlt}
                        className="h-10 w-auto max-w-[140px] object-contain rounded border border-slate-200 bg-white p-1"
                      />
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingField === 'partnerLogoUrl' ? 'Processing...' : 'Upload Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) =>
                          void handleImageUpload('partnerLogoUrl', e.target.files?.[0])
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={content.settings.partnerLogoUrl}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.partnerLogoUrl = e.target.value;
                      })
                    }
                    placeholder="https://... or /assets/..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                  <input
                    type="text"
                    value={content.settings.partnerLogoAlt}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.partnerLogoAlt = e.target.value;
                      })
                    }
                    placeholder="Partner logo alt text"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>

                {/* Favicon */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
                  <div className="text-xs font-bold text-slate-900">Favicon</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {sanitizeImageSrc(content.settings.faviconUrl) && (
                      <img
                        src={sanitizeImageSrc(content.settings.faviconUrl)}
                        alt="Favicon preview"
                        className="h-8 w-8 object-contain rounded border border-slate-200 bg-white p-1"
                      />
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingField === 'faviconUrl' ? 'Processing...' : 'Upload Favicon'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => void handleImageUpload('faviconUrl', e.target.files?.[0])}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={content.settings.faviconUrl}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.settings.faviconUrl = e.target.value;
                      })
                    }
                    placeholder="/club-social-hub-mark.svg or https://..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>
              </div>
            )}

            {/* COLORS & FONTS TAB */}
            {tab === 'theme' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Brand Colors
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent((d) => {
                          d.settings.colors = { ...DEFAULT_SITE_CONTENT.settings.colors };
                        })
                      }
                      className="text-[11px] font-medium text-[#004B87] hover:underline cursor-pointer"
                    >
                      Restore default colors
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        ['primary', 'Primary Brand Color', 'Buttons, links, active highlights'],
                        ['secondary', 'Secondary / Dark Surface', 'Header badges, CTA banners'],
                        ['background', 'Page Background', 'Main site canvas background'],
                        ['text', 'Primary Text Color', 'Headings and body typography'],
                        ['accent', 'Accent Highlight', 'Editor badges and accent marks'],
                      ] as const
                    ).map(([key, label, hint]) => (
                      <div
                        key={key}
                        className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-slate-800">{label}</div>
                        <div className="text-[11px] text-slate-500">{hint}</div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="color"
                            aria-label={label}
                            value={content.settings.colors[key]}
                            onChange={(e) =>
                              updateContent((d) => {
                                d.settings.colors[key] = e.target.value;
                              })
                            }
                            className="w-9 h-8 rounded border border-slate-300 cursor-pointer bg-white"
                          />
                          <input
                            type="text"
                            value={content.settings.colors[key]}
                            onChange={(e) =>
                              updateContent((d) => {
                                d.settings.colors[key] = e.target.value;
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Typography (Google Fonts)
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent((d) => {
                          d.settings.fonts = { ...DEFAULT_SITE_CONTENT.settings.fonts };
                        })
                      }
                      className="text-[11px] font-medium text-[#004B87] hover:underline cursor-pointer"
                    >
                      Restore default fonts
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        ['heading', 'Heading Font'],
                        ['body', 'Body Font'],
                        ['brand', 'Brand / Logo Font'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {label}
                        </label>
                        <select
                          value={content.settings.fonts[key]}
                          onChange={(e) =>
                            updateContent((d) => {
                              d.settings.fonts[key] = e.target.value;
                            })
                          }
                          className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                        >
                          {GOOGLE_FONT_OPTIONS.map((font) => (
                            <option key={font.name} value={font.name}>
                              {font.name} — {font.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION TAB */}
            {tab === 'navigation' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                    {(
                      [
                        ['topNav', 'Public Header Nav'],
                        ['clubNav', 'Club Sidebar'],
                        ['adminNav', 'Admin Sidebar'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNavGroup(key)}
                        className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                          navGroup === key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      updateContent((draft) => {
                        if (navGroup === 'topNav') {
                          const next: TopNavItem = {
                            id: `nav-${Date.now().toString(36)}`,
                            label: 'New Menu Link',
                            target: 'https://sps.cuny.edu',
                            kind: 'external',
                            visible: true,
                          };
                          draft.navigation.topNav.push(next);
                        } else {
                          const next: PortalNavItemConfig = {
                            id: `custom-nav-${Date.now().toString(36)}`,
                            label: 'New Link',
                            section: 'Custom Links',
                            visible: true,
                            customUrl: 'https://sps.cuny.edu',
                          };
                          draft.navigation[navGroup].push(next);
                        }
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add nav item</span>
                  </button>
                </div>

                {navGroup === 'topNav' ? (
                  <div className="space-y-2">
                    {content.navigation.topNav.map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDragNavIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragNavIdx === null || dragNavIdx === idx) return;
                          updateContent((d) => {
                            const list = d.navigation.topNav;
                            const [moved] = list.splice(dragNavIdx, 1);
                            list.splice(idx, 0, moved);
                          });
                          setDragNavIdx(null);
                        }}
                        className={`p-3 border rounded-lg space-y-2 ${
                          item.visible
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-100 border-dashed border-slate-300 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <GripVertical className="w-4 h-4 cursor-grab" />
                            <span className="text-[11px] font-mono">{item.kind}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateContent((d) => {
                                  d.navigation.topNav[idx].visible = !item.visible;
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              title={item.visible ? 'Hide' : 'Show'}
                            >
                              {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() =>
                                updateContent((d) => {
                                  const [m] = d.navigation.topNav.splice(idx, 1);
                                  d.navigation.topNav.splice(idx - 1, 0, m);
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === content.navigation.topNav.length - 1}
                              onClick={() =>
                                updateContent((d) => {
                                  const [m] = d.navigation.topNav.splice(idx, 1);
                                  d.navigation.topNav.splice(idx + 1, 0, m);
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
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
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
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
                              className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) =>
                              updateContent((d) => {
                                d.navigation.topNav[idx].label = e.target.value;
                              })
                            }
                            placeholder="Label"
                            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                          />
                          {item.kind === 'external' ? (
                            <input
                              type="text"
                              value={item.target}
                              onChange={(e) =>
                                updateContent((d) => {
                                  d.navigation.topNav[idx].target = e.target.value;
                                })
                              }
                              placeholder="https://..."
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                            />
                          ) : (
                            <input
                              type="text"
                              disabled
                              value={`Target: ${item.target}`}
                              className="px-2.5 py-1.5 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {content.navigation[navGroup].map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDragNavIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragNavIdx === null || dragNavIdx === idx) return;
                          updateContent((d) => {
                            const list = d.navigation[navGroup];
                            const [moved] = list.splice(dragNavIdx, 1);
                            list.splice(idx, 0, moved);
                          });
                          setDragNavIdx(null);
                        }}
                        className={`p-2.5 border rounded-md space-y-2 ${
                          item.visible
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-100 border-dashed border-slate-300 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0" />
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                updateContent((d) => {
                                  d.navigation[navGroup][idx].label = e.target.value;
                                })
                              }
                              className="px-2 py-1 text-xs font-medium border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                updateContent((d) => {
                                  d.navigation[navGroup][idx].visible = !item.visible;
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() =>
                                updateContent((d) => {
                                  const [m] = d.navigation[navGroup].splice(idx, 1);
                                  d.navigation[navGroup].splice(idx - 1, 0, m);
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === content.navigation[navGroup].length - 1}
                              onClick={() =>
                                updateContent((d) => {
                                  const [m] = d.navigation[navGroup].splice(idx, 1);
                                  d.navigation[navGroup].splice(idx + 1, 0, m);
                                })
                              }
                              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {item.customUrl !== undefined && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateContent((d) => {
                                    d.navigation[navGroup] = d.navigation[navGroup].filter(
                                      (n) => n.id !== item.id
                                    );
                                  })
                                }
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.section}
                            onChange={(e) =>
                              updateContent((d) => {
                                d.navigation[navGroup][idx].section = e.target.value;
                              })
                            }
                            placeholder="Group heading"
                            className="px-2 py-1 text-[11px] text-slate-600 border border-slate-200 rounded"
                          />
                          {item.customUrl !== undefined && (
                            <input
                              type="text"
                              value={item.customUrl}
                              onChange={(e) =>
                                updateContent((d) => {
                                  d.navigation[navGroup][idx].customUrl = e.target.value;
                                })
                              }
                              placeholder="https://..."
                              className="px-2 py-1 text-[11px] border border-slate-200 rounded"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAGES TAB */}
            {tab === 'pages' && (
              <div className="space-y-4">
                <form
                  onSubmit={handleAddCustomPage}
                  className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg flex flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="New page title (e.g. Student FAQ, About Us, Guidelines)"
                    className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Page</span>
                  </button>
                </form>

                <div className="space-y-2">
                  {content.pageRegistry.map((pg, idx) => (
                    <div
                      key={pg.id}
                      draggable
                      onDragStart={() => setDragPageIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragPageIdx === null || dragPageIdx === idx) return;
                        updateContent((d) => {
                          const [moved] = d.pageRegistry.splice(dragPageIdx, 1);
                          d.pageRegistry.splice(idx, 0, moved);
                        });
                        setDragPageIdx(null);
                      }}
                      className={`p-3 border rounded-lg space-y-2 ${
                        pg.visible
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-100 border-dashed border-slate-300 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab shrink-0" />
                          <input
                            type="text"
                            value={pg.title}
                            onChange={(e) =>
                              updateContent((d) => {
                                d.pageRegistry[idx].title = e.target.value;
                                const cp = d.customPages.find((c) => c.id === pg.id);
                                if (cp) cp.title = e.target.value;
                                const navItem = d.navigation.topNav.find(
                                  (n) =>
                                    (pg.isBuiltin && n.target === pg.builtinTarget) ||
                                    (!pg.isBuiltin && n.target === pg.id)
                                );
                                if (navItem) navItem.label = e.target.value;
                              })
                            }
                            className="flex-1 min-w-[140px] px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                          />
                          <span className="text-[10px] font-mono text-slate-500">
                            /{pg.slug}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {!pg.isBuiltin && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCustomPageId(pg.id);
                                setShowSettingsDrawer(false);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer"
                            >
                              Open &amp; Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              updateContent((d) => {
                                d.pageRegistry[idx].visible = !pg.visible;
                                const cp = d.customPages.find((c) => c.id === pg.id);
                                if (cp) cp.visible = !pg.visible;
                                const navItem = d.navigation.topNav.find(
                                  (n) =>
                                    (pg.isBuiltin && n.target === pg.builtinTarget) ||
                                    (!pg.isBuiltin && n.target === pg.id)
                                );
                                if (navItem) navItem.visible = !pg.visible;
                              })
                            }
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            title={pg.visible ? 'Hide page' : 'Show page'}
                          >
                            {pg.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              updateContent((d) => {
                                const [m] = d.pageRegistry.splice(idx, 1);
                                d.pageRegistry.splice(idx - 1, 0, m);
                              })
                            }
                            className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === content.pageRegistry.length - 1}
                            onClick={() =>
                              updateContent((d) => {
                                const [m] = d.pageRegistry.splice(idx, 1);
                                d.pageRegistry.splice(idx + 1, 0, m);
                              })
                            }
                            className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {!pg.isBuiltin && (
                            <button
                              type="button"
                              onClick={() =>
                                updateContent((d) => {
                                  d.pageRegistry = d.pageRegistry.filter((p) => p.id !== pg.id);
                                  d.customPages = d.customPages.filter((c) => c.id !== pg.id);
                                  d.navigation.topNav = d.navigation.topNav.filter(
                                    (n) => n.target !== pg.id
                                  );
                                })
                              }
                              className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER TAB */}
            {tab === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={content.footer.text}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.footer.text = e.target.value;
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Footer Subtext
                  </label>
                  <input
                    type="text"
                    value={content.footer.subtext}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.footer.subtext = e.target.value;
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={content.footer.contactEmail}
                    onChange={(e) =>
                      updateContent((d) => {
                        d.footer.contactEmail = e.target.value;
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Footer Social &amp; External Links
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent((d) => {
                          d.footer.socialLinks.push({
                            id: `soc-${Date.now().toString(36)}`,
                            label: 'New Link',
                            url: 'https://sps.cuny.edu',
                          });
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  {content.footer.socialLinks.map((link, idx) => (
                    <div
                      key={link.id}
                      className="p-2.5 border border-slate-200 rounded-md bg-slate-50/60 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                    >
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) =>
                          updateContent((d) => {
                            d.footer.socialLinks[idx].label = e.target.value;
                          })
                        }
                        placeholder="Label"
                        className="sm:w-36 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) =>
                          updateContent((d) => {
                            d.footer.socialLinks[idx].url = sanitizeHref(e.target.value);
                          })
                        }
                        placeholder="https://..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            updateContent((d) => {
                              const [m] = d.footer.socialLinks.splice(idx, 1);
                              d.footer.socialLinks.splice(idx - 1, 0, m);
                            })
                          }
                          className="p-1 text-slate-600 hover:bg-white disabled:opacity-30 rounded cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === content.footer.socialLinks.length - 1}
                          onClick={() =>
                            updateContent((d) => {
                              const [m] = d.footer.socialLinks.splice(idx, 1);
                              d.footer.socialLinks.splice(idx + 1, 0, m);
                            })
                          }
                          className="p-1 text-slate-600 hover:bg-white disabled:opacity-30 rounded cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateContent((d) => {
                              d.footer.socialLinks = d.footer.socialLinks.filter(
                                (l) => l.id !== link.id
                              );
                            })
                          }
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BACKUP & RESET TAB */}
            {tab === 'backup' && (
              <div className="space-y-5">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-900">Export Content Backup</h3>
                  <p className="text-xs text-slate-600">
                    Download a complete JSON snapshot of all site text, branding, colors, fonts,
                    navigation, custom pages, and sections.
                  </p>
                  <button
                    type="button"
                    onClick={exportContentJson}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export content (JSON)</span>
                  </button>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-900">Import Content Backup</h3>
                  <p className="text-xs text-slate-600">
                    Restore a previously exported JSON backup file. You can preview the imported
                    content and click Save to publish it.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-md cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import content (JSON)</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => void handleImportFile(e)}
                      className="sr-only"
                    />
                  </label>
                  {importStatus && (
                    <p
                      className={`text-xs font-medium px-3 py-2 rounded border ${
                        importStatus.ok
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {importStatus.msg}
                    </p>
                  )}
                </div>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50/60 space-y-2.5">
                  <h3 className="text-xs font-bold text-red-900">Reset to Original Defaults</h3>
                  <p className="text-xs text-red-800">
                    Restore all site text, colors, fonts, navigation, and sections back to the
                    original CUNY SPS Club Social Hub defaults.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to original</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500">
              {justSaved && !isDirty ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved for all visitors</span>
                </span>
              ) : isDirty ? (
                <span className="font-medium text-amber-700">Unsaved changes</span>
              ) : (
                <span>All changes published</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveContent()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 rounded-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset to Original Confirmation Modal */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm reset to original content"
          className="fixed inset-0 z-[95] bg-slate-900/55 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Reset all site content to original defaults?
                </h3>
                <p className="text-xs text-slate-600">
                  This replaces your customized wording, colors, fonts, navigation, and custom
                  sections with the original defaults. Consider exporting a JSON backup first.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await resetToOriginal();
                  if (ok) {
                    setShowResetConfirm(false);
                    setActiveCustomPageId(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md cursor-pointer"
              >
                Yes, Reset to Original
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
