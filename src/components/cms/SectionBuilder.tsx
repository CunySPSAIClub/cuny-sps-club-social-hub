import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Plus,
  Trash2,
  Type,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import {
  createSectionFromTemplate,
  type CustomSectionCard,
  type PageSection,
  type SectionTemplateType,
} from '../../data/siteContent';
import {
  EditableImage,
  EditableLink,
  EditableRepeatingItemBar,
  EditableText,
} from './EditablePrimitives';

interface EditableSectionShellProps {
  title: string;
  visible: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canDelete?: boolean;
  onToggleVisible: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function EditableSectionShell({
  title,
  visible,
  canMoveUp = false,
  canMoveDown = false,
  canDelete = false,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: EditableSectionShellProps) {
  const { isEditActive } = useSiteContent();

  if (!visible && !isEditActive) {
    return null;
  }

  if (!isEditActive) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative rounded-lg transition-all ${
        visible
          ? 'ring-1 ring-dashed ring-[#004B87]/40 p-2 -m-2'
          : 'border border-dashed border-slate-300 bg-slate-100/80 p-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-[11px]">
        <div className="flex items-center gap-2 font-semibold">
          <span>Section: {title}</span>
          {!visible && <span className="text-amber-300 font-normal">(Hidden from visitors)</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleVisible}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
          >
            {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{visible ? 'Hide' : 'Show'}</span>
          </button>
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              title="Move section up"
              aria-label={`Move ${title} up`}
              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-35 rounded cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              title="Move section down"
              aria-label={`Move ${title} down`}
              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-35 rounded cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete section"
              aria-label={`Delete ${title}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/90 hover:bg-red-600 text-white rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {visible ? children : (
        <div className="text-xs text-slate-500 px-2 py-1">
          This section is hidden. Click &ldquo;Show&rdquo; above to make it visible again.
        </div>
      )}
    </div>
  );
}

interface CustomSectionsListProps {
  sections: PageSection[];
  onChange: (nextSections: PageSection[]) => void;
  onNavigateInternal?: (href: string) => void;
}

const SECTION_TEMPLATES: {
  type: SectionTemplateType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: 'text',
    label: 'Text Block',
    description: 'Heading, eyebrow, and paragraph',
    icon: Type,
  },
  {
    type: 'image-text',
    label: 'Image + Text',
    description: 'Visual spotlight paired with copy & button',
    icon: ImageIcon,
  },
  {
    type: 'card-grid',
    label: 'Card Grid',
    description: 'Repeatable resource or feature cards',
    icon: LayoutGrid,
  },
  {
    type: 'cta',
    label: 'Call-to-Action',
    description: 'Banner with headline and action buttons',
    icon: Megaphone,
  },
];

export function CustomSectionsList({
  sections,
  onChange,
  onNavigateInternal,
}: CustomSectionsListProps) {
  const { isEditActive } = useSiteContent();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  const visibleSections = isEditActive ? sections : sections.filter((s) => s.visible);

  if (visibleSections.length === 0 && !isEditActive) {
    return null;
  }

  const updateSection = (id: string, patch: Partial<PageSection>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChange(copy);
  };

  const deleteSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const addSection = (type: SectionTemplateType) => {
    onChange([...sections, createSectionFromTemplate(type)]);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <EditableSectionShell
          key={section.id}
          title={section.heading || section.type}
          visible={section.visible}
          canMoveUp={idx > 0}
          canMoveDown={idx < sections.length - 1}
          canDelete
          onToggleVisible={() => updateSection(section.id, { visible: !section.visible })}
          onMoveUp={() => moveSection(idx, -1)}
          onMoveDown={() => moveSection(idx, 1)}
          onDelete={() => deleteSection(section.id)}
        >
          {section.type === 'text' && (
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-2">
              {(section.eyebrow || isEditActive) && (
                <EditableText
                  as="div"
                  value={section.eyebrow ?? ''}
                  placeholder="Optional eyebrow label"
                  onChange={(next) => updateSection(section.id, { eyebrow: next })}
                  className="text-xs font-semibold tracking-wide text-[#004B87]"
                />
              )}
              <EditableText
                as="h2"
                value={section.heading}
                onChange={(next) => updateSection(section.id, { heading: next })}
                className="text-xl font-bold text-slate-900"
              />
              <EditableText
                as="p"
                multiline
                value={section.body}
                onChange={(next) => updateSection(section.id, { body: next })}
                className="text-sm text-slate-600 leading-relaxed max-w-3xl"
              />
            </section>
          )}

          {section.type === 'image-text' && (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div
                  className={`md:col-span-5 ${
                    section.imagePosition === 'right' ? 'md:order-2' : ''
                  }`}
                >
                  <EditableImage
                    src={section.image?.src ?? ''}
                    alt={section.image?.alt ?? section.heading}
                    onChange={(nextImg) => updateSection(section.id, { image: nextImg })}
                    className="w-full h-56 object-cover rounded-md border border-slate-200"
                  />
                  {isEditActive && (
                    <button
                      type="button"
                      onClick={() =>
                        updateSection(section.id, {
                          imagePosition: section.imagePosition === 'right' ? 'left' : 'right',
                        })
                      }
                      className="mt-2 text-[11px] font-medium text-[#004B87] hover:underline cursor-pointer"
                    >
                      Swap image to {section.imagePosition === 'right' ? 'left' : 'right'}
                    </button>
                  )}
                </div>
                <div
                  className={`md:col-span-7 space-y-3 ${
                    section.imagePosition === 'right' ? 'md:order-1' : ''
                  }`}
                >
                  {(section.eyebrow || isEditActive) && (
                    <EditableText
                      as="div"
                      value={section.eyebrow ?? ''}
                      placeholder="Optional eyebrow"
                      onChange={(next) => updateSection(section.id, { eyebrow: next })}
                      className="text-xs font-semibold tracking-wide text-[#004B87]"
                    />
                  )}
                  <EditableText
                    as="h2"
                    value={section.heading}
                    onChange={(next) => updateSection(section.id, { heading: next })}
                    className="text-xl font-bold text-slate-900"
                  />
                  <EditableText
                    as="p"
                    multiline
                    value={section.body}
                    onChange={(next) => updateSection(section.id, { body: next })}
                    className="text-sm text-slate-600 leading-relaxed"
                  />
                  {section.primaryCta && (
                    <div className="pt-1">
                      <EditableLink
                        label={section.primaryCta.label}
                        href={section.primaryCta.href}
                        onNavigateInternal={onNavigateInternal}
                        onChange={(next) => updateSection(section.id, { primaryCta: next })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {section.type === 'card-grid' && (
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  {(section.eyebrow || isEditActive) && (
                    <EditableText
                      as="div"
                      value={section.eyebrow ?? ''}
                      placeholder="Optional eyebrow"
                      onChange={(next) => updateSection(section.id, { eyebrow: next })}
                      className="text-xs font-semibold tracking-wide text-[#004B87]"
                    />
                  )}
                  <EditableText
                    as="h2"
                    value={section.heading}
                    onChange={(next) => updateSection(section.id, { heading: next })}
                    className="text-lg font-bold text-slate-900"
                  />
                  {(section.body || isEditActive) && (
                    <EditableText
                      as="p"
                      value={section.body}
                      placeholder="Optional section subtitle"
                      onChange={(next) => updateSection(section.id, { body: next })}
                      className="text-xs text-slate-600"
                    />
                  )}
                </div>
                {isEditActive && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextCard: CustomSectionCard = {
                        id: `card-${Date.now().toString(36)}`,
                        title: 'New Card',
                        description: 'Click to edit card description.',
                        linkLabel: 'Learn More',
                        linkHref: '#public',
                      };
                      updateSection(section.id, {
                        cards: [...(section.cards ?? []), nextCard],
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add new card</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(section.cards ?? []).map((card, cIdx) => {
                  const cards = section.cards ?? [];
                  return (
                    <div
                      key={card.id}
                      draggable={isEditActive}
                      onDragStart={() => setDraggingCardId(card.id)}
                      onDragOver={(e) => {
                        if (isEditActive) e.preventDefault();
                      }}
                      onDrop={() => {
                        if (!draggingCardId || draggingCardId === card.id) return;
                        const list = [...cards];
                        const from = list.findIndex((c) => c.id === draggingCardId);
                        const to = list.findIndex((c) => c.id === card.id);
                        if (from >= 0 && to >= 0) {
                          const [moved] = list.splice(from, 1);
                          list.splice(to, 0, moved);
                          updateSection(section.id, { cards: list });
                        }
                        setDraggingCardId(null);
                      }}
                      className="border border-slate-200 rounded-md p-4 bg-slate-50/40 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <EditableRepeatingItemBar
                          itemLabel={`Card #${cIdx + 1}`}
                          canMoveUp={cIdx > 0}
                          canMoveDown={cIdx < cards.length - 1}
                          onMoveUp={() => {
                            const list = [...cards];
                            const [m] = list.splice(cIdx, 1);
                            list.splice(cIdx - 1, 0, m);
                            updateSection(section.id, { cards: list });
                          }}
                          onMoveDown={() => {
                            const list = [...cards];
                            const [m] = list.splice(cIdx, 1);
                            list.splice(cIdx + 1, 0, m);
                            updateSection(section.id, { cards: list });
                          }}
                          onDuplicate={() => {
                            const copy: CustomSectionCard = {
                              ...card,
                              id: `card-copy-${Date.now().toString(36)}`,
                              title: `${card.title} (Copy)`,
                            };
                            const list = [...cards];
                            list.splice(cIdx + 1, 0, copy);
                            updateSection(section.id, { cards: list });
                          }}
                          onDelete={() => {
                            updateSection(section.id, {
                              cards: cards.filter((c) => c.id !== card.id),
                            });
                          }}
                        />

                        {(card.imageUrl || isEditActive) && (
                          <div className="mb-3">
                            <EditableImage
                              src={card.imageUrl ?? ''}
                              alt={card.imageAlt || card.title}
                              onChange={(nextImg) =>
                                updateSection(section.id, {
                                  cards: cards.map((c) =>
                                    c.id === card.id
                                      ? { ...c, imageUrl: nextImg.src, imageAlt: nextImg.alt }
                                      : c
                                  ),
                                })
                              }
                              className="w-full h-32 object-cover rounded border border-slate-200"
                              fallback={
                                <div className="w-full h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                                  Optional card image
                                </div>
                              }
                            />
                          </div>
                        )}

                        <EditableText
                          as="h3"
                          value={card.title}
                          onChange={(next) =>
                            updateSection(section.id, {
                              cards: cards.map((c) =>
                                c.id === card.id ? { ...c, title: next } : c
                              ),
                            })
                          }
                          className="text-sm font-bold text-slate-900"
                        />
                        <EditableText
                          as="p"
                          multiline
                          value={card.description}
                          onChange={(next) =>
                            updateSection(section.id, {
                              cards: cards.map((c) =>
                                c.id === card.id ? { ...c, description: next } : c
                              ),
                            })
                          }
                          className="text-xs text-slate-600 mt-1.5 leading-relaxed"
                        />
                      </div>

                      {(card.linkLabel || isEditActive) && (
                        <div className="pt-2 border-t border-slate-200/70">
                          <EditableLink
                            label={card.linkLabel || 'Learn More'}
                            href={card.linkHref || '#public'}
                            onNavigateInternal={onNavigateInternal}
                            onChange={(next) =>
                              updateSection(section.id, {
                                cards: cards.map((c) =>
                                  c.id === card.id
                                    ? { ...c, linkLabel: next.label, linkHref: next.href }
                                    : c
                                ),
                              })
                            }
                            className="text-xs font-semibold text-[#004B87] hover:underline cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {section.type === 'cta' && (
            <section className="bg-[#0B0B0F] text-white border border-slate-800 rounded-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                {(section.eyebrow || isEditActive) && (
                  <EditableText
                    as="div"
                    value={section.eyebrow ?? ''}
                    placeholder="Optional eyebrow"
                    onChange={(next) => updateSection(section.id, { eyebrow: next })}
                    className="text-xs font-semibold tracking-wide text-[#C4F500]"
                  />
                )}
                <EditableText
                  as="h2"
                  value={section.heading}
                  onChange={(next) => updateSection(section.id, { heading: next })}
                  className="text-xl font-bold text-white"
                />
                <EditableText
                  as="p"
                  multiline
                  value={section.body}
                  onChange={(next) => updateSection(section.id, { body: next })}
                  className="text-sm text-slate-300 leading-relaxed"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {section.primaryCta && (
                  <EditableLink
                    label={section.primaryCta.label}
                    href={section.primaryCta.href}
                    onNavigateInternal={onNavigateInternal}
                    onChange={(next) => updateSection(section.id, { primaryCta: next })}
                    className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                  />
                )}
                {section.secondaryCta && section.secondaryCta.label && (
                  <EditableLink
                    label={section.secondaryCta.label}
                    href={section.secondaryCta.href}
                    onNavigateInternal={onNavigateInternal}
                    onChange={(next) => updateSection(section.id, { secondaryCta: next })}
                    className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
                  />
                )}
              </div>
            </section>
          )}
        </EditableSectionShell>
      ))}

      {isEditActive && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white/80">
          {!pickerOpen ? (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#004B87] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add section</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">Choose a section template</div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SECTION_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.type}
                      type="button"
                      onClick={() => addSection(tpl.type)}
                      className="p-3.5 text-left rounded-md border border-slate-200 bg-white hover:border-[#004B87] hover:bg-sky-50/40 transition-colors cursor-pointer space-y-1"
                    >
                      <Icon className="w-4 h-4 text-[#004B87]" />
                      <div className="text-xs font-bold text-slate-900">{tpl.label}</div>
                      <div className="text-[11px] text-slate-500">{tpl.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
