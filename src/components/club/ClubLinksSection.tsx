import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Globe,
  GripVertical,
  Link2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type {
  ClubAdditionalLink,
  ClubLinksConfig,
  FixedClubLinkKey,
} from '../../types';
import {
  FIXED_CLUB_LINK_META,
  FIXED_CLUB_LINK_ORDER,
  MAX_ADDITIONAL_LABEL_LENGTH,
  MAX_ADDITIONAL_LINKS,
  MAX_LINK_DESCRIPTION_LENGTH,
  normalizeClubLinks,
  validateClubLinks,
  type ClubLinksValidationResult,
} from '../../utils/clubLinks';

export function ClubLinkPlatformIcon({
  kind,
  className = 'w-4 h-4',
}: {
  kind: FixedClubLinkKey | 'additional';
  className?: string;
}) {
  switch (kind) {
    case 'website':
      return <Globe className={`${className} text-[#004B87]`} aria-hidden="true" />;
    case 'facebook':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} text-[#1877F2]`}
          aria-hidden="true"
        >
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-[#C13584]`}
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} text-slate-900`}
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.64a6.34 6.34 0 0 0 6.34-6.34V8.73a8.26 8.26 0 0 0 4.76 1.52V6.81a4.85 4.85 0 0 1-1-.12Z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} text-[#16A34A]`}
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.59 5.95L0 24l6.33-1.66a11.88 11.88 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.76.99 1-3.66-.24-.38a9.86 9.86 0 0 1-1.51-5.25c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.88 9.9Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      );
    case 'additional':
    default:
      return <Link2 className={`${className} text-slate-600`} aria-hidden="true" />;
  }
}

function ActiveToggle({
  active,
  onChange,
  label,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${label} status: ${active ? 'Active' : 'Not active'}`}
      onClick={() => onChange(!active)}
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87] ${
        active
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
      }`}
    >
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          active ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            active ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span>{active ? 'Active' : 'Not active'}</span>
    </button>
  );
}

interface ClubLinksSectionProps {
  clubId: string;
  links?: ClubLinksConfig;
  canEdit: boolean;
  isPublic?: boolean;
  onSaved?: (updatedLinks: ClubLinksConfig) => Promise<void> | void;
}

export function ClubLinksSection({
  clubId,
  links,
  canEdit,
  isPublic = false,
  onSaved,
}: ClubLinksSectionProps) {
  const { apiFetch } = useAuth();
  const normalizedPropsLinks = useMemo(() => normalizeClubLinks(links), [links]);

  const [savedLinks, setSavedLinks] = useState<ClubLinksConfig>(normalizedPropsLinks);
  const [draftLinks, setDraftLinks] = useState<ClubLinksConfig>(normalizedPropsLinks);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validation, setValidation] = useState<ClubLinksValidationResult>({
    valid: true,
    fixedErrors: {},
    additionalErrors: {},
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    setSavedLinks(normalizedPropsLinks);
    if (!isEditing) {
      setDraftLinks(normalizedPropsLinks);
    }
  }, [normalizedPropsLinks, isEditing]);

  useEffect(() => {
    setIsEditing(false);
    setSavedNotice(false);
    setSubmitError('');
    setValidation({ valid: true, fixedErrors: {}, additionalErrors: {} });
  }, [clubId]);

  const activeFixedLinks = useMemo(
    () => savedLinks.fixed.filter((row) => row.active),
    [savedLinks.fixed]
  );
  const activeAdditionalLinks = useMemo(
    () => savedLinks.additional.filter((row) => row.active),
    [savedLinks.additional]
  );
  const hasAnyActiveLink = activeFixedLinks.length > 0 || activeAdditionalLinks.length > 0;

  const enterEditMode = () => {
    if (!canEdit) return;
    setDraftLinks(normalizeClubLinks(savedLinks));
    setValidation({ valid: true, fixedErrors: {}, additionalErrors: {} });
    setSubmitError('');
    setSavedNotice(false);
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setDraftLinks(normalizeClubLinks(savedLinks));
    setValidation({ valid: true, fixedErrors: {}, additionalErrors: {} });
    setSubmitError('');
    setIsEditing(false);
  };

  const updateFixedRow = (
    key: FixedClubLinkKey,
    patch: Partial<{ active: boolean; url: string; description: string }>
  ) => {
    setDraftLinks((prev) => ({
      ...prev,
      fixed: prev.fixed.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
    setValidation((prev) => {
      if (!prev.fixedErrors[key]) return prev;
      const nextRowErrors = { ...prev.fixedErrors[key] };
      if ('url' in patch || 'active' in patch) delete nextRowErrors.url;
      if ('description' in patch) delete nextRowErrors.description;
      const nextFixedErrors = { ...prev.fixedErrors };
      if (!nextRowErrors.url && !nextRowErrors.description) {
        delete nextFixedErrors[key];
      } else {
        nextFixedErrors[key] = nextRowErrors;
      }
      return { ...prev, fixedErrors: nextFixedErrors };
    });
  };

  const addAdditionalLink = () => {
    setDraftLinks((prev) => {
      if (prev.additional.length >= MAX_ADDITIONAL_LINKS) return prev;
      const newLink: ClubAdditionalLink = {
        id: `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        label: '',
        url: '',
        description: '',
        active: true,
      };
      return {
        ...prev,
        additional: [...prev.additional, newLink],
      };
    });
  };

  const updateAdditionalRow = (
    id: string,
    patch: Partial<{ label: string; url: string; description: string; active: boolean }>
  ) => {
    setDraftLinks((prev) => ({
      ...prev,
      additional: prev.additional.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
    setValidation((prev) => {
      if (!prev.additionalErrors[id]) return prev;
      const nextItemErrors = { ...prev.additionalErrors[id] };
      if ('label' in patch) delete nextItemErrors.label;
      if ('url' in patch) delete nextItemErrors.url;
      if ('description' in patch) delete nextItemErrors.description;
      const nextAddErrors = { ...prev.additionalErrors };
      if (!nextItemErrors.label && !nextItemErrors.url && !nextItemErrors.description) {
        delete nextAddErrors[id];
      } else {
        nextAddErrors[id] = nextItemErrors;
      }
      return { ...prev, additionalErrors: nextAddErrors };
    });
  };

  const deleteAdditionalRow = (id: string) => {
    setDraftLinks((prev) => ({
      ...prev,
      additional: prev.additional.filter((item) => item.id !== id),
    }));
    setValidation((prev) => {
      if (!prev.additionalErrors[id]) return prev;
      const nextAddErrors = { ...prev.additionalErrors };
      delete nextAddErrors[id];
      return { ...prev, additionalErrors: nextAddErrors };
    });
  };

  const reorderAdditionalRows = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setDraftLinks((prev) => {
      const list = [...prev.additional];
      const fromIndex = list.findIndex((item) => item.id === sourceId);
      const toIndex = list.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { ...prev, additional: list };
    });
  };

  const moveAdditionalRowByStep = (index: number, direction: -1 | 1) => {
    setDraftLinks((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.additional.length) return prev;
      const list = [...prev.additional];
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      return { ...prev, additional: list };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSavedNotice(false);

    const normalized = normalizeClubLinks(draftLinks);
    const result = validateClubLinks(normalized);
    setValidation(result);
    if (!result.valid) {
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ links: ClubLinksConfig }>(`/api/clubs/${clubId}/links`, {
        method: 'PUT',
        body: JSON.stringify({ links: normalized }),
      });
      const updated = normalizeClubLinks(res.links);
      setSavedLinks(updated);
      setDraftLinks(updated);
      setIsEditing(false);
      setSavedNotice(true);
      if (onSaved) {
        await onSaved(updated);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save club links.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-label="Club Links"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#004B87]" />
            <span>Club Links</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official website, social profiles, and member resources
          </p>
        </div>

        {!isEditing && canEdit && hasAnyActiveLink && (
          <button
            type="button"
            onClick={enterEditMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-white border border-slate-300 hover:border-[#004B87] hover:bg-sky-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87]"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit links</span>
          </button>
        )}
      </div>

      {savedNotice && !isEditing && (
        <div
          role="status"
          className="mx-5 mt-4 px-3.5 py-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">Links updated</span>
        </div>
      )}

      {!isEditing ? (
        <div className="p-5">
          {!hasAnyActiveLink ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
              <p className="text-xs text-slate-500">No links added yet</p>
              {canEdit && (
                <button
                  type="button"
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add links</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeFixedLinks.map((row) => {
                const meta = FIXED_CLUB_LINK_META[row.key];
                const isRestrictedWhatsApp = row.key === 'whatsapp' && (isPublic || !row.url);

                if (isRestrictedWhatsApp) {
                  return (
                    <div
                      key={row.key}
                      className="flex items-start gap-3 p-3.5 rounded-md border border-slate-200 bg-slate-50/70"
                    >
                      <div className="w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0">
                        <ClubLinkPlatformIcon kind={row.key} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          <span>{meta.label}</span>
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Ask a club officer to join
                        </p>
                      </div>
                    </div>
                  );
                }

                const targetUrl =
                  row.key === 'whatsapp' && !row.url && clubId === 'club-msa'
                    ? 'https://chat.whatsapp.com/CunySpsMsaCommunity'
                    : row.url;

                return (
                  <a
                    key={row.key}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3.5 rounded-md border border-slate-200 bg-white hover:border-[#004B87] hover:bg-sky-50/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#004B87]"
                  >
                    <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 group-hover:bg-white flex items-center justify-center shrink-0">
                      <ClubLinkPlatformIcon kind={row.key} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-[#004B87] truncate">
                          {meta.label}
                        </span>
                        {row.key === 'whatsapp' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-md shadow-xs">
                            Join WhatsApp
                            <ExternalLink className="w-3 h-3 text-white" />
                          </span>
                        ) : (
                          <ExternalLink
                            className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#004B87] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      {row.description ? (
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {row.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{targetUrl}</p>
                      )}
                    </div>
                  </a>
                );
              })}

              {activeAdditionalLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3.5 rounded-md border border-slate-200 bg-white hover:border-[#004B87] hover:bg-sky-50/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#004B87]"
                >
                  <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 group-hover:bg-white flex items-center justify-center shrink-0">
                    <ClubLinkPlatformIcon kind="additional" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-[#004B87] truncate">
                        {item.label}
                      </span>
                      <ExternalLink
                        className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#004B87] shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    {item.description ? (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{item.url}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} noValidate className="p-5 space-y-6">
          {(submitError || validation.formError) && (
            <div
              role="alert"
              className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md"
            >
              {submitError || validation.formError}
            </div>
          )}

          {/* Fixed Link Rows in Canonical Order */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Official Links
            </div>

            {FIXED_CLUB_LINK_ORDER.map((key) => {
              const row = draftLinks.fixed.find((f) => f.key === key)!;
              const meta = FIXED_CLUB_LINK_META[key];
              const rowError = validation.fixedErrors[key];

              return (
                <div
                  key={key}
                  className={`p-4 rounded-md border transition-colors ${
                    row.active
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200/80 opacity-65'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0">
                        <ClubLinkPlatformIcon kind={key} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
                        {key === 'whatsapp' && (
                          <div className="text-[11px] text-slate-500">
                            Visible only to signed-in members of this club; hidden on public pages
                          </div>
                        )}
                      </div>
                    </div>

                    <ActiveToggle
                      active={row.active}
                      onChange={(next) => updateFixedRow(key, { active: next })}
                      label={meta.label}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3">
                    <div>
                      <label
                        htmlFor={`club-link-${key}-url`}
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        URL {row.active ? <span className="text-red-600">*</span> : '(optional while not active)'}
                      </label>
                      <input
                        id={`club-link-${key}-url`}
                        type="text"
                        inputMode="url"
                        value={row.url}
                        onChange={(e) => updateFixedRow(key, { url: e.target.value })}
                        placeholder={meta.urlPlaceholder}
                        aria-invalid={Boolean(rowError?.url)}
                        aria-describedby={rowError?.url ? `club-link-${key}-url-error` : undefined}
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-md focus:outline-none ${
                          rowError?.url
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#004B87]'
                        }`}
                      />
                      {rowError?.url && (
                        <p
                          id={`club-link-${key}-url-error`}
                          role="alert"
                          className="mt-1 text-xs text-red-700"
                        >
                          {rowError.url}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor={`club-link-${key}-desc`}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Short Description (optional)
                        </label>
                        <span className="text-[11px] font-mono-tabular text-slate-500">
                          {row.description.length}/{MAX_LINK_DESCRIPTION_LENGTH}
                        </span>
                      </div>
                      <input
                        id={`club-link-${key}-desc`}
                        type="text"
                        maxLength={MAX_LINK_DESCRIPTION_LENGTH}
                        value={row.description}
                        onChange={(e) => updateFixedRow(key, { description: e.target.value })}
                        placeholder={meta.descriptionPlaceholder}
                        aria-invalid={Boolean(rowError?.description)}
                        aria-describedby={
                          rowError?.description ? `club-link-${key}-desc-error` : undefined
                        }
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-md focus:outline-none ${
                          rowError?.description
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#004B87]'
                        }`}
                      />
                      {rowError?.description && (
                        <p
                          id={`club-link-${key}-desc-error`}
                          role="alert"
                          className="mt-1 text-xs text-red-700"
                        >
                          {rowError.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Links */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Additional Links
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag to reorder · up to {MAX_ADDITIONAL_LINKS} custom links (
                  <span className="font-mono-tabular">
                    {draftLinks.additional.length}/{MAX_ADDITIONAL_LINKS}
                  </span>
                  )
                </p>
              </div>
              <button
                type="button"
                disabled={draftLinks.additional.length >= MAX_ADDITIONAL_LINKS}
                onClick={addAdditionalLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004B87] bg-white border border-[#004B87] hover:bg-sky-50 disabled:opacity-45 disabled:cursor-not-allowed rounded-md whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87]"
              >
                <span>+ Add link</span>
              </button>
            </div>

            {draftLinks.additional.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-md">
                No additional links added yet. Click &ldquo;+ Add link&rdquo; to include resources
                such as a project showcase, GitHub organization, or signup form.
              </div>
            ) : (
              <div className="space-y-3">
                {draftLinks.additional.map((item, idx) => {
                  const itemError = validation.additionalErrors[item.id];
                  const isDropTarget = dragOverId === item.id && draggingId !== item.id;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        const target = e.target as HTMLElement | null;
                        if (target && target.closest('input, textarea, select, button')) {
                          e.preventDefault();
                          return;
                        }
                        setDraggingId(item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', item.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverId !== item.id) {
                          setDragOverId(item.id);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverId === item.id) {
                          setDragOverId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = draggingId || e.dataTransfer.getData('text/plain');
                        reorderAdditionalRows(sourceId, item.id);
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      className={`p-4 rounded-md border transition-colors ${
                        isDropTarget
                          ? 'border-[#004B87] bg-sky-50/40'
                          : item.active
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-200/80 opacity-65'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5"
                            title="Drag to reorder"
                            aria-hidden="true"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0">
                            <ClubLinkPlatformIcon kind="additional" className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800">
                            {item.label.trim() || `Additional Link #${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveAdditionalRowByStep(idx, -1)}
                              aria-label={`Move ${item.label || `link ${idx + 1}`} up`}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === draftLinks.additional.length - 1}
                              onClick={() => moveAdditionalRowByStep(idx, 1)}
                              aria-label={`Move ${item.label || `link ${idx + 1}`} down`}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 border-l border-slate-200 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <ActiveToggle
                            active={item.active}
                            onChange={(next) => updateAdditionalRow(item.id, { active: next })}
                            label={item.label || `Additional Link ${idx + 1}`}
                          />

                          <button
                            type="button"
                            onClick={() => deleteAdditionalRow(item.id)}
                            aria-label={`Delete ${item.label || `link ${idx + 1}`}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-white border border-slate-300 hover:border-red-300 hover:bg-red-50 rounded-md cursor-pointer focus-visible:outline-2 focus-visible:outline-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor={`add-link-${item.id}-label`}
                              className="block text-xs font-medium text-slate-700"
                            >
                              Label <span className="text-red-600">*</span>
                            </label>
                            <span className="text-[11px] font-mono-tabular text-slate-500">
                              {item.label.length}/{MAX_ADDITIONAL_LABEL_LENGTH}
                            </span>
                          </div>
                          <input
                            id={`add-link-${item.id}-label`}
                            type="text"
                            maxLength={MAX_ADDITIONAL_LABEL_LENGTH}
                            value={item.label}
                            onChange={(e) => updateAdditionalRow(item.id, { label: e.target.value })}
                            placeholder="e.g., Project Showcase"
                            aria-invalid={Boolean(itemError?.label)}
                            aria-describedby={
                              itemError?.label ? `add-link-${item.id}-label-error` : undefined
                            }
                            className={`w-full px-3 py-2 text-xs bg-white border rounded-md focus:outline-none ${
                              itemError?.label
                                ? 'border-red-500 focus:border-red-600'
                                : 'border-slate-300 focus:border-[#004B87]'
                            }`}
                          />
                          {itemError?.label && (
                            <p
                              id={`add-link-${item.id}-label-error`}
                              role="alert"
                              className="mt-1 text-xs text-red-700"
                            >
                              {itemError.label}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`add-link-${item.id}-url`}
                            className="block text-xs font-medium text-slate-700 mb-1"
                          >
                            URL <span className="text-red-600">*</span>
                          </label>
                          <input
                            id={`add-link-${item.id}-url`}
                            type="text"
                            inputMode="url"
                            value={item.url}
                            onChange={(e) => updateAdditionalRow(item.id, { url: e.target.value })}
                            placeholder="https://..."
                            aria-invalid={Boolean(itemError?.url)}
                            aria-describedby={
                              itemError?.url ? `add-link-${item.id}-url-error` : undefined
                            }
                            className={`w-full px-3 py-2 text-xs bg-white border rounded-md focus:outline-none ${
                              itemError?.url
                                ? 'border-red-500 focus:border-red-600'
                                : 'border-slate-300 focus:border-[#004B87]'
                            }`}
                          />
                          {itemError?.url && (
                            <p
                              id={`add-link-${item.id}-url-error`}
                              role="alert"
                              className="mt-1 text-xs text-red-700"
                            >
                              {itemError.url}
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor={`add-link-${item.id}-desc`}
                              className="block text-xs font-medium text-slate-700"
                            >
                              Description (optional)
                            </label>
                            <span className="text-[11px] font-mono-tabular text-slate-500">
                              {item.description.length}/{MAX_LINK_DESCRIPTION_LENGTH}
                            </span>
                          </div>
                          <input
                            id={`add-link-${item.id}-desc`}
                            type="text"
                            maxLength={MAX_LINK_DESCRIPTION_LENGTH}
                            value={item.description}
                            onChange={(e) =>
                              updateAdditionalRow(item.id, { description: e.target.value })
                            }
                            placeholder="Optional short note"
                            aria-invalid={Boolean(itemError?.description)}
                            aria-describedby={
                              itemError?.description ? `add-link-${item.id}-desc-error` : undefined
                            }
                            className={`w-full px-3 py-2 text-xs bg-white border rounded-md focus:outline-none ${
                              itemError?.description
                                ? 'border-red-500 focus:border-red-600'
                                : 'border-slate-300 focus:border-[#004B87]'
                            }`}
                          />
                          {itemError?.description && (
                            <p
                              id={`add-link-${item.id}-desc-error`}
                              role="alert"
                              className="mt-1 text-xs text-red-700"
                            >
                              {itemError.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={cancelEditMode}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#004B87]"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export function PublicClubLinksList({ links }: { links?: ClubLinksConfig }) {
  const normalized = useMemo(() => normalizeClubLinks(links), [links]);
  const activeFixed = normalized.fixed.filter((row) => row.active);
  const activeAdditional = normalized.additional.filter((row) => row.active);

  if (activeFixed.length === 0 && activeAdditional.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      <div className="text-[11px] font-semibold text-slate-700">Club Links</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {activeFixed.map((row) => {
          const meta = FIXED_CLUB_LINK_META[row.key];
          if (row.key === 'whatsapp') {
            return (
              <div
                key={row.key}
                className="flex items-start gap-2.5 px-3 py-2 rounded-md border border-slate-200 bg-slate-50/70"
              >
                <ClubLinkPlatformIcon kind="whatsapp" className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>{meta.label}</span>
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="text-[11px] text-slate-600">Ask a club officer to join</div>
                </div>
              </div>
            );
          }

          return (
            <a
              key={row.key}
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2.5 px-3 py-2 rounded-md border border-slate-200 bg-white hover:border-[#004B87] hover:bg-sky-50/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#004B87]"
            >
              <ClubLinkPlatformIcon kind={row.key} className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-[#004B87] truncate">
                    {meta.label}
                  </span>
                  <ExternalLink
                    className="w-3 h-3 text-slate-400 group-hover:text-[#004B87] shrink-0"
                    aria-hidden="true"
                  />
                </div>
                {row.description && (
                  <div className="text-[11px] text-slate-600 truncate">{row.description}</div>
                )}
              </div>
            </a>
          );
        })}

        {activeAdditional.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 px-3 py-2 rounded-md border border-slate-200 bg-white hover:border-[#004B87] hover:bg-sky-50/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#004B87]"
          >
            <ClubLinkPlatformIcon kind="additional" className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-[#004B87] truncate">
                  {item.label}
                </span>
                <ExternalLink
                  className="w-3 h-3 text-slate-400 group-hover:text-[#004B87] shrink-0"
                  aria-hidden="true"
                />
              </div>
              {item.description && (
                <div className="text-[11px] text-slate-600 truncate">{item.description}</div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
