import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { sanitizeHref, sanitizeImageSrc } from '../../data/siteContent';
import { readAndResizeBlogCoverFile } from '../../utils/brandAssets';

interface EditableTextProps {
  value: string;
  onChange: (next: string) => void;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export function EditableText({
  value,
  onChange,
  as = 'span',
  multiline = false,
  className = '',
  placeholder = 'Click to edit text...',
  ariaLabel,
}: EditableTextProps) {
  const { isEditActive } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!isEditActive) {
    const Tag = as;
    return <Tag className={className}>{value}</Tag>;
  }

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const sharedClass =
      'w-full min-w-[140px] bg-white text-slate-900 border-2 border-[#004B87] rounded px-2 py-1 text-inherit font-inherit leading-inherit shadow-sm focus:outline-none';
    return (
      <span
        className="inline-block w-full max-w-full align-baseline"
        onClick={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={Math.max(2, Math.min(6, Math.ceil(draft.length / 65)))}
            value={draft}
            aria-label={ariaLabel || 'Edit text'}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            className={sharedClass}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            aria-label={ariaLabel || 'Edit text'}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            className={sharedClass}
          />
        )}
      </span>
    );
  }

  const Tag = as;
  return (
    <Tag
      role="button"
      tabIndex={0}
      title="Click to edit text"
      aria-label={ariaLabel ? `Edit ${ariaLabel}` : 'Click to edit text'}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }
      }}
      className={`${className} group/edit relative cursor-text rounded-sm transition-all hover:outline-2 hover:outline-dashed hover:outline-[#004B87] hover:outline-offset-2`}
    >
      {value || <span className="italic opacity-60">{placeholder}</span>}
      <span
        aria-hidden="true"
        className="pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity inline-flex items-center justify-center ml-1.5 w-4 h-4 rounded bg-[#004B87] text-white align-middle"
      >
        <Pencil className="w-2.5 h-2.5" />
      </span>
    </Tag>
  );
}

interface EditableImageProps {
  src: string;
  alt: string;
  onChange: (next: { src: string; alt: string }) => void;
  className?: string;
  fallback?: React.ReactNode;
}

export function EditableImage({
  src,
  alt,
  onChange,
  className = '',
  fallback,
}: EditableImageProps) {
  const { isEditActive } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(src);
  const [altDraft, setAltDraft] = useState(alt);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const safeSrc = sanitizeImageSrc(src);

  const openPanel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUrlDraft(src);
    setAltDraft(alt);
    setUploadError('');
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const dataUrl = await readAndResizeBlogCoverFile(file, 1000, 1000);
      setUrlDraft(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = () => {
    const cleaned = urlDraft.trim() ? sanitizeImageSrc(urlDraft) : '';
    if (urlDraft.trim() && !cleaned) {
      setUploadError('Enter a valid https://, http://, or relative / image URL.');
      return;
    }
    onChange({ src: cleaned, alt: altDraft.trim() || alt });
    setOpen(false);
  };

  const visual = safeSrc ? (
    <img src={safeSrc} alt={alt} className={className} referrerPolicy="no-referrer" />
  ) : (
    fallback ?? (
      <div
        className={`flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 ${className}`}
      >
        <ImageIcon className="w-6 h-6" />
      </div>
    )
  );

  if (!isEditActive) {
    return <>{visual}</>;
  }

  return (
    <span className="relative inline-block group/img">
      <button
        type="button"
        onClick={openPanel}
        title="Click to change image or alt text"
        className="relative inline-block text-left rounded cursor-pointer hover:outline-2 hover:outline-dashed hover:outline-[#004B87] hover:outline-offset-2"
      >
        {visual}
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 transition-opacity inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-[#004B87] text-white rounded shadow-sm"
        >
          <Pencil className="w-2.5 h-2.5" />
          <span>Image</span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Edit image and alt text"
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[80] bg-slate-900/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#004B87]" />
                <span>Edit Image</span>
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close image editor"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sanitizeImageSrc(urlDraft) && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-center">
                <img
                  src={sanitizeImageSrc(urlDraft)}
                  alt={altDraft || 'Preview'}
                  className="max-h-36 w-auto object-contain rounded"
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Upload New Image
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Processing...' : 'Choose image file (PNG, JPG, WebP)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleFileUpload(e)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="text"
                  value={urlDraft}
                  onChange={(e) => {
                    setUrlDraft(e.target.value);
                    setUploadError('');
                  }}
                  placeholder="https://example.com/image.png or /assets/..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alt Text (accessibility description)
                </label>
                <input
                  type="text"
                  value={altDraft}
                  onChange={(e) => setAltDraft(e.target.value)}
                  placeholder="Describe this image for screen readers"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                />
              </div>

              {uploadError && (
                <p role="alert" className="text-xs text-red-700">
                  {uploadError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

interface EditableLinkProps {
  label: string;
  href: string;
  onChange: (next: { label: string; href: string }) => void;
  onNavigateInternal?: (href: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function EditableLink({
  label,
  href,
  onChange,
  onNavigateInternal,
  className = '',
  children,
}: EditableLinkProps) {
  const { isEditActive } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState(label);
  const [hrefDraft, setHrefDraft] = useState(href);
  const [err, setErr] = useState('');

  const safeHref = sanitizeHref(href);
  const isExternal = /^https?:\/\//i.test(safeHref);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditActive) {
      e.preventDefault();
      e.stopPropagation();
      setLabelDraft(label);
      setHrefDraft(href);
      setErr('');
      setOpen(true);
      return;
    }
    if (!isExternal && !safeHref.startsWith('mailto:') && onNavigateInternal) {
      e.preventDefault();
      onNavigateInternal(safeHref);
    }
  };

  const handleApply = () => {
    const cleanLabel = labelDraft.trim();
    if (!cleanLabel) {
      setErr('Button or link text is required.');
      return;
    }
    const cleanHref = sanitizeHref(hrefDraft);
    onChange({ label: cleanLabel, href: cleanHref });
    setOpen(false);
  };

  return (
    <span className="relative inline-block">
      <a
        href={safeHref}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className={`${className} ${
          isEditActive
            ? 'group/link hover:outline-2 hover:outline-dashed hover:outline-[#004B87] hover:outline-offset-2'
            : ''
        }`}
      >
        <span>{label}</span>
        {children}
        {isEditActive && (
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center ml-1 w-4 h-4 rounded bg-[#004B87] text-white"
          >
            <Pencil className="w-2.5 h-2.5" />
          </span>
        )}
      </a>

      {open && (
        <div
          role="dialog"
          aria-label="Edit link text and destination"
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[80] bg-slate-900/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#004B87]" />
                <span>Edit Link / Button</span>
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close link editor"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Button / Link Text
                </label>
                <input
                  type="text"
                  value={labelDraft}
                  onChange={(e) => {
                    setLabelDraft(e.target.value);
                    setErr('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Destination URL (https://..., mailto:..., or #public)
                </label>
                <input
                  type="text"
                  value={hrefDraft}
                  onChange={(e) => {
                    setHrefDraft(e.target.value);
                    setErr('');
                  }}
                  placeholder="https://... or #public"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                />
              </div>

              {err && (
                <p role="alert" className="text-xs text-red-700">
                  {err}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
              {/^https?:\/\//i.test(sanitizeHref(hrefDraft)) ? (
                <a
                  href={sanitizeHref(hrefDraft)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#004B87] hover:underline"
                >
                  <span>Test link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

interface EditableRepeatingItemBarProps {
  itemLabel: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function EditableRepeatingItemBar({
  itemLabel,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: EditableRepeatingItemBarProps) {
  const { isEditActive } = useSiteContent();
  if (!isEditActive) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 mb-2 bg-sky-50/90 border border-dashed border-[#004B87]/50 rounded-md text-[11px]"
    >
      <div className="inline-flex items-center gap-1.5 text-[#004B87] font-semibold">
        <GripVertical className="w-3.5 h-3.5 cursor-grab" aria-hidden="true" />
        <span>{itemLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          title="Move up"
          aria-label={`Move ${itemLabel} up`}
          className="p-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded cursor-pointer"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          title="Move down"
          aria-label={`Move ${itemLabel} down`}
          className="p-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          title="Duplicate"
          aria-label={`Duplicate ${itemLabel}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer"
        >
          <Copy className="w-3 h-3" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          aria-label={`Delete ${itemLabel}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}
