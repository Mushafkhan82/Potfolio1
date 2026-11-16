import React, { useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Globe,
  Save,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  FileText,
  Menu as MenuIcon,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Layers,
  Palette,
  Search,
  Zap,
} from 'lucide-react';
import {
  deleteBlogPost,
  deleteCmsPage,
  publishSiteContent,
  saveBlogPost,
  saveCmsPage,
  saveNavigationMenu,
  saveSiteContentDraft,
  slugify,
} from '../../lib/storeService';
import { DEFAULT_QUICK_ACTIONS } from '../../lib/seedData';
import { openExternalUrl } from '../../hooks/usePortfolioHelpers';
import { MediaPickerModal, RichTextEditor } from './AdminShared';
import type {
  BlogPost,
  CmsPage,
  HomeSectionConfig,
  HomeSectionType,
  NavLinkItem,
  NavigationMenu,
  PageSeoEntry,
  QuickActionItem,
  SiteContentDoc,
} from '../../types/store';

const SECTION_CATALOG: { type: HomeSectionType; label: string }[] = [
  { type: 'announcement', label: 'Announcement Bar' },
  { type: 'hero', label: 'Hero Banner' },
  { type: 'featured_collection', label: 'Featured Collection' },
  { type: 'product_grid', label: 'Product Grid' },
  { type: 'banner', label: 'Promotional Banner' },
  { type: 'testimonials', label: 'Testimonials' },
  { type: 'services', label: '3D Services Doors' },
  { type: 'portfolio', label: 'Portfolio Showcase' },
  { type: 'faq', label: 'FAQ Block' },
  { type: 'newsletter', label: 'Newsletter Signup' },
  { type: 'contact', label: 'Contact CTA' },
  { type: 'footer', label: 'Footer Block' },
];

const PREVIEW_ROUTES: { path: string; label: string }[] = [
  { path: '/', label: 'Home (/)' },
  { path: '/shop', label: 'Shop (/shop)' },
  { path: '/work', label: 'Portfolio (/work)' },
  { path: '/services', label: 'Services (/services)' },
  { path: '/about', label: 'About (/about)' },
  { path: '/contact', label: 'Contact (/contact)' },
  { path: '/blog', label: 'Blog (/blog)' },
];

const SeoSerpFields: React.FC<{
  routePath: string;
  titleValue: string;
  descValue: string;
  fallbackTitle?: string;
  fallbackDesc?: string;
  onChangeTitle: (v: string) => void;
  onChangeDesc: (v: string) => void;
  ogImageValue?: string;
  onPickOgImage?: () => void;
  onClearOgImage?: () => void;
}> = ({
  routePath,
  titleValue,
  descValue,
  fallbackTitle = 'Mushaf Khan | Digital Studio & Store',
  fallbackDesc = 'High-speed custom websites, 3D visuals, SEO architecture, and studio digital templates.',
  onChangeTitle,
  onChangeDesc,
  ogImageValue,
  onPickOgImage,
  onClearOgImage,
}) => {
  const titleLen = titleValue.length;
  const descLen = descValue.length;
  const displayTitle = titleValue.trim() || fallbackTitle;
  const displayDesc = descValue.trim() || fallbackDesc;
  const normalizedPath = routePath === '/' ? '' : routePath;

  return (
    <div className="space-y-3 text-xs font-mono">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[color:var(--text-muted)]">SEO Title</span>
          <span
            className={
              titleLen > 60
                ? 'text-amber-400 font-bold'
                : 'text-[color:var(--text-muted)]'
            }
          >
            {titleLen}/60
          </span>
        </div>
        <input
          value={titleValue}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={fallbackTitle}
          className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[color:var(--text-muted)]">Meta Description</span>
          <span
            className={
              descLen > 155
                ? 'text-amber-400 font-bold'
                : 'text-[color:var(--text-muted)]'
            }
          >
            {descLen}/155
          </span>
        </div>
        <textarea
          rows={3}
          value={descValue}
          onChange={(e) => onChangeDesc(e.target.value)}
          placeholder={fallbackDesc}
          className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        />
      </div>

      {onPickOgImage && (
        <div className="space-y-1.5">
          <span className="text-[color:var(--text-muted)] block">
            Social Share Image (OG)
          </span>
          {ogImageValue && (
            <img
              src={ogImageValue}
              alt="OpenGraph preview"
              className="w-full h-24 object-cover rounded-xl border border-[color:var(--border-subtle)]"
            />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPickOgImage}
              className="flex-1 py-2 rounded-xl border border-[color:var(--border-subtle)] hover:border-[#C6F432] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ImageIcon size={13} />
              <span>{ogImageValue ? 'Change OG Image' : 'Select OG Image'}</span>
            </button>
            {ogImageValue && onClearOgImage && (
              <button
                type="button"
                onClick={onClearOgImage}
                className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Google SERP Preview */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#141714] border border-[color:var(--border-subtle)] space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] mb-1">
          Google Search Preview
        </div>
        <div className="text-[11px] font-sans text-[#188038] dark:text-[#8ab4f8] truncate">
          https://mushafkhan.com{normalizedPath}
        </div>
        <div className="text-sm font-sans font-medium text-[#1a0dab] dark:text-[#8ab4f8] leading-snug line-clamp-1">
          {displayTitle}
        </div>
        <div className="text-xs font-sans text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
          {displayDesc}
        </div>
      </div>
    </div>
  );
};

// ======================= ONLINE STORE > CUSTOMIZE =======================

export const AdminCustomizerPanel: React.FC<{
  initialDraft: SiteContentDoc;
  onDirtyChange: (dirty: boolean) => void;
  onToast: (msg: string) => void;
}> = ({ initialDraft, onDirtyChange, onToast }) => {
  const [docState, setDocState] = useState<SiteContentDoc>(initialDraft);
  const [undoStack, setUndoStack] = useState<SiteContentDoc[]>([]);
  const [redoStack, setRedoStack] = useState<SiteContentDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    initialDraft.sections[0]?.id || ''
  );
  const [mobilePane, setMobilePane] = useState<'sections' | 'preview' | 'settings'>('sections');
  const [inspectorTab, setInspectorTab] = useState<'section' | 'theme' | 'seo' | 'quick_actions'>(
    'section'
  );
  const [previewRoute, setPreviewRoute] = useState<string>('/');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [autosaveStatus, setAutosaveStatus] = useState<
    'saved' | 'saving' | 'unsaved'
  >('saved');
  const [publishing, setPublishing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    'section_img' | 'hero_portrait' | 'logo_img' | 'favicon_img' | 'page_og_img' | null
  >(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const baselineRef = useRef<SiteContentDoc>(initialDraft);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const firstRender = useRef(true);

  const postPreviewToIframe = (payload: SiteContentDoc) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'mk-preview-draft', payload },
        window.location.origin
      );
    } catch {
      // Ignore cross-frame timing errors before initial mount
    }
  };

  const pushUpdate = (next: SiteContentDoc) => {
    setUndoStack((h) => [...h.slice(-19), docState]);
    setRedoStack([]);
    setDocState(next);
    setConfirmDiscard(false);
    setAutosaveStatus('unsaved');
    onDirtyChange(true);
    postPreviewToIframe(next);
  };

  // Debounced Draft Autosave (1.0s)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        await saveSiteContentDraft(docState);
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('unsaved');
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [docState]);

  // Keep preview iframe synchronized on every change
  useEffect(() => {
    postPreviewToIframe(docState);
  }, [docState]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((h) => h.slice(0, -1));
    setRedoStack((r) => [...r.slice(-19), docState]);
    setDocState(prev);
    setAutosaveStatus('unsaved');
    onDirtyChange(true);
    postPreviewToIframe(prev);
    onToast('Undid last change');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((h) => [...h.slice(-19), docState]);
    setDocState(next);
    setAutosaveStatus('unsaved');
    onDirtyChange(true);
    postPreviewToIframe(next);
    onToast('Restored change');
  };

  const handleDiscard = async () => {
    const baseline = baselineRef.current;
    setDocState(baseline);
    setUndoStack([]);
    setRedoStack([]);
    setConfirmDiscard(false);
    onDirtyChange(false);
    postPreviewToIframe(baseline);
    try {
      await saveSiteContentDraft(baseline);
      setAutosaveStatus('saved');
    } catch {
      setAutosaveStatus('unsaved');
    }
    onToast('Reverted draft to last published snapshot');
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishSiteContent(docState);
      baselineRef.current = docState;
      onDirtyChange(false);
      setAutosaveStatus('saved');
      setConfirmDiscard(false);
      window.dispatchEvent(new CustomEvent('storefront-published'));
      onToast('Live storefront updated & published!');
    } catch (err: any) {
      onToast(err?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const selectedSection = docState.sections.find((s) => s.id === selectedId);
  const currentPageSeo: PageSeoEntry = docState.pageSeo?.[previewRoute] || {};

  const updateSection = (id: string, patch: Partial<HomeSectionConfig>) => {
    pushUpdate({
      ...docState,
      sections: docState.sections.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const updateSectionSettings = (
    id: string,
    patch: Partial<HomeSectionConfig['settings']>
  ) => {
    pushUpdate({
      ...docState,
      sections: docState.sections.map((s) =>
        s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s
      ),
    });
  };

  const updatePageSeo = (patch: Partial<PageSeoEntry>) => {
    pushUpdate({
      ...docState,
      pageSeo: {
        ...(docState.pageSeo || {}),
        [previewRoute]: {
          ...currentPageSeo,
          ...patch,
        },
      },
    });
  };

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= docState.sections.length || from === to) return;
    const next = [...docState.sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    pushUpdate({ ...docState, sections: next });
  };

  const addSection = (type: HomeSectionType) => {
    const meta = SECTION_CATALOG.find((x) => x.type === type);
    const created: HomeSectionConfig = {
      id: `sec-${Date.now()}`,
      type,
      label: meta?.label || type,
      visible: true,
      settings: {
        heading: meta?.label || 'New Section',
        subheading: 'Edit copy, CTA links, and styling in the inspector.',
        buttonLabel: 'Explore',
        buttonLink: '/shop',
      },
    };
    pushUpdate({
      ...docState,
      sections: [...docState.sections, created],
    });
    setSelectedId(created.id);
    setInspectorTab('section');
    setMobilePane('settings');
  };

  const quickActionsList: QuickActionItem[] =
    docState.quickActions && docState.quickActions.length > 0
      ? docState.quickActions
      : DEFAULT_QUICK_ACTIONS;

  const updateQuickActions = (nextActions: QuickActionItem[]) => {
    pushUpdate({
      ...docState,
      quickActions: nextActions,
    });
  };

  const previewUrl = `${previewRoute}?preview=draft`;

  return (
    <div className="space-y-4">
      {/* Top Editor Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[color:var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl">
              Visual Theme Editor
            </h1>
            <p className="text-[11px] font-mono text-[color:var(--text-muted)]">
              Live storefront iframe synced with draft state &amp; per-page SEO
            </p>
          </div>

          <select
            aria-label="Preview route"
            value={previewRoute}
            onChange={(e) => setPreviewRoute(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.06] border border-[color:var(--border-subtle)] cursor-pointer"
          >
            {PREVIEW_ROUTES.map((r) => (
              <option key={r.path} value={r.path}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/[0.06] text-[color:var(--text-muted)]">
            {autosaveStatus === 'saving'
              ? 'Autosaving...'
              : autosaveStatus === 'saved'
                ? 'Draft saved'
                : 'Unsaved draft'}
          </span>

          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            title="Undo"
            aria-label="Undo edit"
            className="w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono disabled:opacity-40 cursor-pointer flex items-center justify-center"
          >
            <Undo2 size={15} />
          </button>

          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            title="Redo"
            aria-label="Redo edit"
            className="w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono disabled:opacity-40 cursor-pointer flex items-center justify-center"
          >
            <Redo2 size={15} />
          </button>

          <div className="hidden xl:inline-flex rounded-xl p-1 border border-[color:var(--border-subtle)] bg-black/5 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              aria-label="Desktop preview"
              className={`min-h-[36px] min-w-[36px] p-1.5 rounded-lg cursor-pointer flex items-center justify-center ${
                previewMode === 'desktop'
                  ? 'bg-[#C6F432] text-[#050505]'
                  : 'text-[color:var(--text-muted)]'
              }`}
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              aria-label="Mobile preview"
              className={`min-h-[36px] min-w-[36px] p-1.5 rounded-lg cursor-pointer flex items-center justify-center ${
                previewMode === 'mobile'
                  ? 'bg-[#C6F432] text-[#050505]'
                  : 'text-[color:var(--text-muted)]'
              }`}
            >
              <Smartphone size={14} />
            </button>
          </div>

          {!confirmDiscard ? (
            <button
              type="button"
              onClick={() => setConfirmDiscard(true)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 hover:border-red-400/50 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Discard</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs font-mono">
              <span className="text-red-400">Reset draft?</span>
              <button
                type="button"
                onClick={handleDiscard}
                className="min-h-[36px] px-2.5 py-1 rounded bg-red-500 text-white font-bold cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="min-h-[36px] px-2.5 py-1 rounded border border-[color:var(--border-subtle)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => openExternalUrl(previewUrl)}
            title="Open draft preview in new tab"
            className="min-h-[44px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 hover:border-[#C6F432] cursor-pointer"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Globe size={14} />
            <span>{publishing ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* Mobile 3-Pane Switcher */}
      <div
        role="tablist"
        aria-label="Editor workspace view"
        className="xl:hidden grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-xs font-mono"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'sections'}
          onClick={() => setMobilePane('sections')}
          className={`min-h-[44px] py-2 rounded-lg font-semibold cursor-pointer ${
            mobilePane === 'sections'
              ? 'bg-[#C6F432] text-[#050505] font-bold'
              : 'text-[color:var(--text-secondary)]'
          }`}
        >
          Sections ({docState.sections.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'preview'}
          onClick={() => setMobilePane('preview')}
          className={`min-h-[44px] py-2 rounded-lg font-semibold cursor-pointer ${
            mobilePane === 'preview'
              ? 'bg-[#C6F432] text-[#050505] font-bold'
              : 'text-[color:var(--text-secondary)]'
          }`}
        >
          Live Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'settings'}
          onClick={() => setMobilePane('settings')}
          className={`min-h-[44px] py-2 rounded-lg font-semibold cursor-pointer ${
            mobilePane === 'settings'
              ? 'bg-[#C6F432] text-[#050505] font-bold'
              : 'text-[color:var(--text-secondary)]'
          }`}
        >
          Settings
        </button>
      </div>

      {/* 3-Pane Shopify-Style Editor */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: Sections Tree */}
        <div
          className={`xl:col-span-3 rounded-2xl glass-card p-3.5 space-y-3 ${
            mobilePane === 'sections' ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase tracking-wider text-[color:var(--text-muted)] flex items-center gap-1.5">
              <Layers size={13} />
              <span>Sections ({docState.sections.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {docState.sections.map((sec, idx) => (
              <div
                key={sec.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null) moveSection(dragIdx, idx);
                  setDragIdx(null);
                }}
                onClick={() => {
                  setSelectedId(sec.id);
                  setInspectorTab('section');
                  setMobilePane('settings');
                }}
                className={`min-h-[44px] flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedId === sec.id
                    ? 'border-[#C6F432] bg-[#C6F432]/10'
                    : 'border-[color:var(--border-subtle)] hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <GripVertical
                    size={13}
                    className="text-[color:var(--text-muted)] cursor-grab shrink-0"
                  />
                  <span
                    className={`font-medium truncate ${
                      sec.visible ? '' : 'opacity-45 line-through'
                    }`}
                  >
                    {sec.label}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, idx - 1);
                    }}
                    aria-label={`Move ${sec.label} up`}
                    className="min-w-[34px] min-h-[34px] xl:min-w-[24px] xl:min-h-[24px] flex items-center justify-center text-[color:var(--text-muted)] cursor-pointer"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, idx + 1);
                    }}
                    aria-label={`Move ${sec.label} down`}
                    className="min-w-[34px] min-h-[34px] xl:min-w-[24px] xl:min-h-[24px] flex items-center justify-center text-[color:var(--text-muted)] cursor-pointer"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSection(sec.id, { visible: !sec.visible });
                    }}
                    aria-label={sec.visible ? `Hide ${sec.label}` : `Show ${sec.label}`}
                    className="min-w-[34px] min-h-[34px] xl:min-w-[24px] xl:min-h-[24px] flex items-center justify-center cursor-pointer"
                  >
                    {sec.visible ? (
                      <Eye size={13} className="text-[color:var(--accent-text)]" />
                    ) : (
                      <EyeOff size={13} className="text-[color:var(--text-muted)]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pushUpdate({
                        ...docState,
                        sections: docState.sections.filter((x) => x.id !== sec.id),
                      });
                    }}
                    aria-label={`Remove ${sec.label}`}
                    className="min-w-[34px] min-h-[34px] xl:min-w-[24px] xl:min-h-[24px] flex items-center justify-center text-red-400 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <select
            aria-label="Add section type"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                addSection(e.target.value as HomeSectionType);
                e.target.value = '';
              }
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.05] border border-dashed border-[color:var(--border-subtle)] hover:border-[#C6F432] cursor-pointer"
          >
            <option value="">+ Add Section...</option>
            {SECTION_CATALOG.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* CENTER PANE: Live Iframe Canvas */}
        <div
          className={`xl:col-span-6 space-y-2 ${
            mobilePane === 'preview' ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-black/20 overflow-hidden shadow-2xl">
            <div className="px-3 py-2 border-b border-[color:var(--border-subtle)] bg-black/30 flex items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-400/70" />
                <span className="w-2 h-2 rounded-full bg-amber-400/70" />
                <span className="w-2 h-2 rounded-full bg-[#C6F432]/80" />
                <span className="ml-2 truncate text-[color:var(--text-muted)]">
                  {previewUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[color:var(--border-subtle)] flex items-center gap-1 hover:border-[#C6F432] cursor-pointer shrink-0"
              >
                <RefreshCw size={11} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="p-2 sm:p-3 bg-[#090b08] flex justify-center overflow-x-auto">
              <iframe
                key={`${previewRoute}-${iframeKey}`}
                ref={iframeRef}
                src={previewUrl}
                title="Live Storefront Draft Preview"
                onLoad={() => postPreviewToIframe(docState)}
                className={`h-[560px] sm:h-[640px] bg-[#090b08] transition-all duration-300 ${
                  previewMode === 'mobile'
                    ? 'w-[375px] max-w-full rounded-[28px] border-[6px] border-neutral-800 shadow-2xl'
                    : 'w-full rounded-xl border border-white/10'
                }`}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Context-Sensitive Inspector */}
        <div
          className={`xl:col-span-3 rounded-2xl glass-card p-3.5 space-y-4 ${
            mobilePane === 'settings' ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.05] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setInspectorTab('section')}
              className={`min-h-[40px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                inspectorTab === 'section'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              <Layers size={12} />
              <span>Section</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('theme')}
              className={`min-h-[40px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                inspectorTab === 'theme'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              <Palette size={12} />
              <span>Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('seo')}
              className={`min-h-[40px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                inspectorTab === 'seo'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              <Search size={12} />
              <span>Page SEO</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('quick_actions')}
              className={`min-h-[40px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                inspectorTab === 'quick_actions'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              <Zap size={12} />
              <span>Actions</span>
            </button>
          </div>

          {inspectorTab === 'section' &&
            (selectedSection ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[color:var(--accent-text)] uppercase truncate">
                    {selectedSection.label}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSection(selectedSection.id, {
                        visible: !selectedSection.visible,
                      })
                    }
                    className="min-h-[36px] px-2.5 py-1 rounded border border-[color:var(--border-subtle)] text-[11px] cursor-pointer"
                  >
                    {selectedSection.visible ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <label className="block space-y-1">
                  <span className="text-[color:var(--text-muted)]">Heading</span>
                  <input
                    value={selectedSection.settings.heading || ''}
                    onChange={(e) =>
                      updateSectionSettings(selectedSection.id, {
                        heading: e.target.value,
                      })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[color:var(--text-muted)]">
                    Subheading / Copy
                  </span>
                  <textarea
                    rows={3}
                    value={selectedSection.settings.subheading || ''}
                    onChange={(e) =>
                      updateSectionSettings(selectedSection.id, {
                        subheading: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-[color:var(--text-muted)]">
                      Button Label
                    </span>
                    <input
                      value={selectedSection.settings.buttonLabel || ''}
                      onChange={(e) =>
                        updateSectionSettings(selectedSection.id, {
                          buttonLabel: e.target.value,
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[color:var(--text-muted)]">
                      Button Link
                    </span>
                    <input
                      value={selectedSection.settings.buttonLink || ''}
                      onChange={(e) =>
                        updateSectionSettings(selectedSection.id, {
                          buttonLink: e.target.value,
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-[color:var(--text-muted)]">
                      Background
                    </span>
                    <input
                      type="color"
                      value={selectedSection.settings.bgColor || '#090b08'}
                      onChange={(e) =>
                        updateSectionSettings(selectedSection.id, {
                          bgColor: e.target.value,
                        })
                      }
                      className="w-full h-11 rounded-lg cursor-pointer"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[color:var(--text-muted)]">
                      Text Color
                    </span>
                    <input
                      type="color"
                      value={selectedSection.settings.textColor || '#ffffff'}
                      onChange={(e) =>
                        updateSectionSettings(selectedSection.id, {
                          textColor: e.target.value,
                        })
                      }
                      className="w-full h-11 rounded-lg cursor-pointer"
                    />
                  </label>
                </div>

                {selectedSection.settings.imageUrl && (
                  <img
                    src={selectedSection.settings.imageUrl}
                    alt={selectedSection.label}
                    className="w-full h-24 object-cover rounded-xl border border-[color:var(--border-subtle)]"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setPickerTarget('section_img')}
                  className="w-full min-h-[44px] py-2 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center gap-2 hover:border-[#C6F432] cursor-pointer"
                >
                  <ImageIcon size={13} />
                  <span>
                    {selectedSection.settings.imageUrl
                      ? 'Change Section Image'
                      : 'Set Section Image'}
                  </span>
                </button>

                {selectedSection.type === 'hero' && (
                  <div className="pt-3 mt-3 border-t border-[color:var(--border-subtle)] space-y-3">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-[color:var(--accent-text)]">
                      Founder Hero Portrait
                    </div>
                    {selectedSection.settings.portraitUrl && (
                      <img
                        src={selectedSection.settings.portraitUrl}
                        alt={selectedSection.settings.portraitAlt || 'Hero portrait'}
                        style={{
                          objectPosition:
                            selectedSection.settings.portraitFocalPoint || '50% 12%',
                        }}
                        className="w-full h-28 object-cover rounded-xl border border-[color:var(--border-subtle)]"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPickerTarget('hero_portrait')}
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] hover:border-[#C6F432] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon size={13} />
                        <span>
                          {selectedSection.settings.portraitUrl
                            ? 'Change Portrait'
                            : 'Set Portrait'}
                        </span>
                      </button>
                      {selectedSection.settings.portraitUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateSectionSettings(selectedSection.id, {
                              portraitUrl: '/assets/studio/mushaf-khan-portrait.webp',
                            })
                          }
                          className="min-h-[44px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] hover:border-red-400/50 cursor-pointer"
                          title="Reset to studio portrait"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <label className="block space-y-1">
                      <span className="text-[color:var(--text-muted)]">
                        Portrait Alt Text
                      </span>
                      <input
                        value={selectedSection.settings.portraitAlt || ''}
                        onChange={(e) =>
                          updateSectionSettings(selectedSection.id, {
                            portraitAlt: e.target.value,
                          })
                        }
                        placeholder="Mushaf Khan — Digital Studio Founder"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[color:var(--text-muted)]">
                        Focal Point (CSS object-position)
                      </span>
                      <input
                        value={selectedSection.settings.portraitFocalPoint || '50% 12%'}
                        onChange={(e) =>
                          updateSectionSettings(selectedSection.id, {
                            portraitFocalPoint: e.target.value,
                          })
                        }
                        placeholder="50% 12%"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-mono text-[color:var(--text-muted)]">
                Select a section from the left pane to edit its copy &amp; media.
              </p>
            ))}

          {inspectorTab === 'theme' && (
            <div className="space-y-3 text-xs font-mono">
              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Logo Text</span>
                <input
                  value={docState.theme.logoText}
                  onChange={(e) =>
                    pushUpdate({
                      ...docState,
                      theme: { ...docState.theme, logoText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget('logo_img')}
                  className="py-2 rounded-xl border border-[color:var(--border-subtle)] hover:border-[#C6F432] cursor-pointer"
                >
                  {docState.theme.logoImageUrl ? 'Change Logo' : 'Set Logo'}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTarget('favicon_img')}
                  className="py-2 rounded-xl border border-[color:var(--border-subtle)] hover:border-[#C6F432] cursor-pointer"
                >
                  {docState.theme.faviconUrl ? 'Change Favicon' : 'Set Favicon'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Primary</span>
                  <input
                    type="color"
                    value={docState.theme.primaryColor || '#f2f0eb'}
                    onChange={(e) =>
                      pushUpdate({
                        ...docState,
                        theme: { ...docState.theme, primaryColor: e.target.value },
                      })
                    }
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Accent</span>
                  <input
                    type="color"
                    value={docState.theme.accentColor}
                    onChange={(e) =>
                      pushUpdate({
                        ...docState,
                        theme: { ...docState.theme, accentColor: e.target.value },
                      })
                    }
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Background</span>
                  <input
                    type="color"
                    value={docState.theme.backgroundColor}
                    onChange={(e) =>
                      pushUpdate({
                        ...docState,
                        theme: {
                          ...docState.theme,
                          backgroundColor: e.target.value,
                        },
                      })
                    }
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Text</span>
                  <input
                    type="color"
                    value={docState.theme.textColor}
                    onChange={(e) =>
                      pushUpdate({
                        ...docState,
                        theme: { ...docState.theme, textColor: e.target.value },
                      })
                    }
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Display Font</span>
                <select
                  value={docState.theme.displayFont}
                  onChange={(e) =>
                    pushUpdate({
                      ...docState,
                      theme: { ...docState.theme, displayFont: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                >
                  <option value="Instrument Serif">Instrument Serif</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Inter">Inter</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Body Font</span>
                <select
                  value={docState.theme.bodyFont}
                  onChange={(e) =>
                    pushUpdate({
                      ...docState,
                      theme: { ...docState.theme, bodyFont: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Outfit">Outfit</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Button Style</span>
                <select
                  value={docState.theme.buttonRadius}
                  onChange={(e) =>
                    pushUpdate({
                      ...docState,
                      theme: {
                        ...docState.theme,
                        buttonRadius: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                >
                  <option value="rounded-full">Pill (Rounded Full)</option>
                  <option value="rounded-xl">Soft Square</option>
                  <option value="rounded-none">Architectural Sharp</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Default Mode</span>
                <select
                  value={docState.theme.defaultMode}
                  onChange={(e) =>
                    pushUpdate({
                      ...docState,
                      theme: {
                        ...docState.theme,
                        defaultMode: e.target.value as 'dark' | 'light',
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </label>
            </div>
          )}

          {inspectorTab === 'seo' && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-[color:var(--accent-text)] uppercase font-bold">
                Route Override: {previewRoute}
              </div>
              <SeoSerpFields
                routePath={previewRoute}
                titleValue={currentPageSeo.title || ''}
                descValue={currentPageSeo.description || ''}
                onChangeTitle={(title) => updatePageSeo({ title })}
                onChangeDesc={(description) => updatePageSeo({ description })}
                ogImageValue={currentPageSeo.ogImage || ''}
                onPickOgImage={() => setPickerTarget('page_og_img')}
                onClearOgImage={() => updatePageSeo({ ogImage: '' })}
              />
            </div>
          )}
          {inspectorTab === 'quick_actions' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold uppercase text-[color:var(--accent-text)]">
                  One-Tap Shortcuts ({quickActionsList.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuickActions([
                      ...quickActionsList,
                      {
                        id: `qa-${Date.now()}`,
                        label: 'New Shortcut',
                        subtitle: 'Quick launch',
                        url: '/shop',
                        icon: 'sparkles',
                        enabled: true,
                      },
                    ])
                  }
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#C6F432] text-[#050505] font-bold cursor-pointer"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {quickActionsList.map((qa, qIdx) => (
                  <div
                    key={qa.id}
                    className="p-3 rounded-xl border border-[color:var(--border-subtle)] bg-black/5 dark:bg-white/[0.03] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qa.enabled}
                          onChange={(e) =>
                            updateQuickActions(
                              quickActionsList.map((item, i) =>
                                i === qIdx
                                  ? { ...item, enabled: e.target.checked }
                                  : item
                              )
                            )
                          }
                          className="w-4 h-4 accent-[#C6F432]"
                        />
                        <span className="font-semibold truncate max-w-[120px]">
                          {qa.label || 'Shortcut'}
                        </span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={qIdx === 0}
                          onClick={() => {
                            const next = [...quickActionsList];
                            const [m] = next.splice(qIdx, 1);
                            next.splice(qIdx - 1, 0, m);
                            updateQuickActions(next);
                          }}
                          aria-label={`Move ${qa.label} up`}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={qIdx === quickActionsList.length - 1}
                          onClick={() => {
                            const next = [...quickActionsList];
                            const [m] = next.splice(qIdx, 1);
                            next.splice(qIdx + 1, 0, m);
                            updateQuickActions(next);
                          }}
                          aria-label={`Move ${qa.label} down`}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuickActions(
                              quickActionsList.filter((_, i) => i !== qIdx)
                            )
                          }
                          aria-label={`Remove ${qa.label}`}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-red-400 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <input
                      value={qa.label}
                      onChange={(e) =>
                        updateQuickActions(
                          quickActionsList.map((item, i) =>
                            i === qIdx ? { ...item, label: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Label"
                      className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                    <input
                      value={qa.subtitle || ''}
                      onChange={(e) =>
                        updateQuickActions(
                          quickActionsList.map((item, i) =>
                            i === qIdx ? { ...item, subtitle: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Subtitle"
                      className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <input
                        value={qa.url}
                        onChange={(e) =>
                          updateQuickActions(
                            quickActionsList.map((item, i) =>
                              i === qIdx ? { ...item, url: e.target.value } : item
                            )
                          )
                        }
                        placeholder="/contact or https://..."
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                      />
                      <select
                        value={qa.icon}
                        aria-label={`Icon for ${qa.label}`}
                        onChange={(e) =>
                          updateQuickActions(
                            quickActionsList.map((item, i) =>
                              i === qIdx
                                ? { ...item, icon: e.target.value as QuickActionItem['icon'] }
                                : item
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-2 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                      >
                        <option value="briefcase">briefcase</option>
                        <option value="calendar">calendar</option>
                        <option value="shopping-bag">shopping-bag</option>
                        <option value="layers">layers</option>
                        <option value="message-circle">message-circle</option>
                        <option value="sparkles">sparkles</option>
                        <option value="compass">compass</option>
                        <option value="truck">truck</option>
                        <option value="external-link">external-link</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-0.5 text-[11px]">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(qa.accent)}
                          onChange={(e) =>
                            updateQuickActions(
                              quickActionsList.map((item, i) =>
                                i === qIdx ? { ...item, accent: e.target.checked } : item
                              )
                            )
                          }
                          className="accent-[#C6F432]"
                        />
                        <span>Lime Accent</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(qa.external)}
                          onChange={(e) =>
                            updateQuickActions(
                              quickActionsList.map((item, i) =>
                                i === qIdx ? { ...item, external: e.target.checked } : item
                              )
                            )
                          }
                          className="accent-[#C6F432]"
                        />
                        <span>External Link</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Customizer Action Bar */}
      <div className="xl:hidden sticky bottom-2 z-20 p-2.5 rounded-2xl glass-card border border-[color:var(--border-subtle)] flex items-center justify-between gap-2 shadow-xl">
        <span className="text-[11px] font-mono text-[color:var(--text-muted)] px-1.5 truncate">
          {autosaveStatus === 'saving'
            ? 'Saving...'
            : autosaveStatus === 'saved'
              ? 'Draft saved'
              : 'Unsaved'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            aria-label="Undo edit"
            className="w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center disabled:opacity-40 cursor-pointer"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Globe size={14} />
            <span>{publishing ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(asset) => {
          if (pickerTarget === 'section_img' && selectedSection) {
            updateSectionSettings(selectedSection.id, { imageUrl: asset.url });
          } else if (pickerTarget === 'hero_portrait' && selectedSection) {
            updateSectionSettings(selectedSection.id, { portraitUrl: asset.url });
          } else if (pickerTarget === 'logo_img') {
            pushUpdate({
              ...docState,
              theme: { ...docState.theme, logoImageUrl: asset.url },
            });
          } else if (pickerTarget === 'favicon_img') {
            pushUpdate({
              ...docState,
              theme: { ...docState.theme, faviconUrl: asset.url },
            });
          } else if (pickerTarget === 'page_og_img') {
            updatePageSeo({ ogImage: asset.url });
          }
        }}
      />
    </div>
  );
};

// ======================= PAGES & BLOG PANEL =======================

export const AdminPagesAndBlogPanel: React.FC<{
  pages: CmsPage[];
  posts: BlogPost[];
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}> = ({ pages, posts, onRefresh, onToast }) => {
  const [subTab, setSubTab] = useState<'pages' | 'blog'>('pages');
  const [editPage, setEditPage] = useState<CmsPage | null>(null);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (editPage) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await saveCmsPage({
            ...editPage,
            slug: editPage.slug || slugify(editPage.title),
          });
          await onRefresh();
          setEditPage(null);
          onToast('CMS page saved');
        }}
        className="space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditPage(null)}
            className="min-h-[44px] px-2 inline-flex items-center gap-2 text-xs font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Pages</span>
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Page</span>
          </button>
        </div>

        <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">Page Title *</span>
              <input
                required
                value={editPage.title}
                onChange={(e) =>
                  setEditPage({
                    ...editPage,
                    title: e.target.value,
                    slug: editPage.slug || slugify(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">
                URL Slug (/pages/...)
              </span>
              <input
                value={editPage.slug}
                onChange={(e) =>
                  setEditPage({ ...editPage, slug: slugify(e.target.value) })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-xs"
              />
            </label>
          </div>
          <RichTextEditor
            value={editPage.content}
            onChange={(html) => setEditPage({ ...editPage, content: html })}
            minHeight={220}
          />
          <SeoSerpFields
            routePath={`/pages/${editPage.slug || 'page'}`}
            titleValue={editPage.seoTitle}
            descValue={editPage.metaDescription}
            fallbackTitle={`${editPage.title || 'Page'} | Mushaf Khan`}
            fallbackDesc="Studio policy and information page from Mushaf Khan Digital Studio."
            onChangeTitle={(seoTitle) => setEditPage({ ...editPage, seoTitle })}
            onChangeDesc={(metaDescription) =>
              setEditPage({ ...editPage, metaDescription })
            }
          />
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editPage.published}
              onChange={(e) =>
                setEditPage({ ...editPage, published: e.target.checked })
              }
              className="accent-[#C6F432]"
            />
            <span>Published</span>
          </label>
        </div>
      </form>
    );
  }

  if (editPost) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await saveBlogPost({
            ...editPost,
            slug: editPost.slug || slugify(editPost.title),
          });
          await onRefresh();
          setEditPost(null);
          onToast('Blog article saved');
        }}
        className="space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditPost(null)}
            className="min-h-[44px] px-2 inline-flex items-center gap-2 text-xs font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Blog</span>
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Article</span>
          </button>
        </div>

        <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              value={editPost.title}
              onChange={(e) =>
                setEditPost({
                  ...editPost,
                  title: e.target.value,
                  slug: editPost.slug || slugify(e.target.value),
                })
              }
              placeholder="Article Title"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-sm"
            />
            <input
              value={editPost.slug}
              onChange={(e) =>
                setEditPost({ ...editPost, slug: slugify(e.target.value) })
              }
              placeholder="Slug (/blog/...)"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {editPost.coverImage && (
              <img
                src={editPost.coverImage}
                alt="Cover"
                className="w-20 h-14 object-cover rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[color:var(--border-subtle)] cursor-pointer"
            >
              Choose Cover Image
            </button>
          </div>

          <textarea
            rows={2}
            value={editPost.excerpt}
            onChange={(e) =>
              setEditPost({ ...editPost, excerpt: e.target.value })
            }
            placeholder="Short excerpt..."
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-xs"
          />

          <RichTextEditor
            value={editPost.content}
            onChange={(html) => setEditPost({ ...editPost, content: html })}
            minHeight={220}
          />

          <SeoSerpFields
            routePath={`/blog/${editPost.slug || 'article'}`}
            titleValue={editPost.seoTitle}
            descValue={editPost.metaDescription}
            fallbackTitle={`${editPost.title || 'Article'} | Mushaf Khan Journal`}
            fallbackDesc={
              editPost.excerpt ||
              'Notes on conversion engineering, 3D web design, and AI automation.'
            }
            onChangeTitle={(seoTitle) => setEditPost({ ...editPost, seoTitle })}
            onChangeDesc={(metaDescription) =>
              setEditPost({ ...editPost, metaDescription })
            }
          />

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editPost.published}
              onChange={(e) =>
                setEditPost({ ...editPost, published: e.target.checked })
              }
              className="accent-[#C6F432]"
            />
            <span>Published on /blog</span>
          </label>
        </div>

        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(a) => setEditPost({ ...editPost, coverImage: a.url })}
        />
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">
            Pages &amp; Blog Journal
          </h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Rich-text custom CMS pages (/pages/:slug) and studio blog articles (/blog)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl p-1 border border-[color:var(--border-subtle)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setSubTab('pages')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg cursor-pointer ${
                subTab === 'pages'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              Pages ({pages.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('blog')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg cursor-pointer ${
                subTab === 'blog'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              Blog ({posts.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (subTab === 'pages') {
                setEditPage({
                  id: `page-${Date.now()}`,
                  title: '',
                  slug: '',
                  content: '<p></p>',
                  published: true,
                  seoTitle: '',
                  metaDescription: '',
                  updatedAt: new Date().toISOString(),
                });
              } else {
                setEditPost({
                  id: `post-${Date.now()}`,
                  title: '',
                  slug: '',
                  excerpt: '',
                  content: '<p></p>',
                  coverImage: '',
                  author: 'Mushaf Khan',
                  tags: ['Studio'],
                  published: true,
                  seoTitle: '',
                  metaDescription: '',
                  publishedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{subTab === 'pages' ? 'New Page' : 'New Article'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {subTab === 'pages'
          ? pages.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl glass-card p-4 flex items-center justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={() => setEditPage(p)}
                  className="cursor-pointer flex items-center gap-3 text-left flex-1 min-w-0 min-h-[44px]"
                >
                  <FileText size={18} className="text-[color:var(--accent-text)] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-xs font-mono text-[color:var(--text-muted)] truncate">
                      /pages/{p.slug} · {p.published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Delete page ${p.title}`}
                  onClick={async () => {
                    await deleteCmsPage(p.id);
                    await onRefresh();
                    onToast('Page deleted');
                  }}
                  className="w-11 h-11 flex items-center justify-center text-red-400 cursor-pointer shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          : posts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl glass-card p-4 flex items-center justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={() => setEditPost(post)}
                  className="cursor-pointer flex items-center gap-3 text-left flex-1 min-w-0 min-h-[44px]"
                >
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-14 h-10 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{post.title}</div>
                    <div className="text-xs font-mono text-[color:var(--text-muted)] truncate">
                      /blog/{post.slug} · {post.published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Delete article ${post.title}`}
                  onClick={async () => {
                    await deleteBlogPost(post.id);
                    await onRefresh();
                    onToast('Article deleted');
                  }}
                  className="w-11 h-11 flex items-center justify-center text-red-400 cursor-pointer shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
      </div>
    </div>
  );
};

// ======================= NAVIGATION MENU EDITOR =======================

export const AdminNavigationPanel: React.FC<{
  menus: NavigationMenu[];
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}> = ({ menus, onRefresh, onToast }) => {
  const [activeId, setActiveId] = useState<string>(menus[0]?.id || 'header');
  const activeMenu = menus.find((m) => m.id === activeId) || menus[0];
  const [items, setItems] = useState<NavLinkItem[]>(activeMenu?.items || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeMenu) setItems(activeMenu.items);
  }, [activeId, activeMenu]);

  const handleSave = async () => {
    if (!activeMenu) return;
    setSaving(true);
    await saveNavigationMenu({
      ...activeMenu,
      items,
      updatedAt: new Date().toISOString(),
    });
    await onRefresh();
    setSaving(false);
    onToast(`Saved ${activeMenu.title}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Navigation</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Edit header and footer menus, order, and nested dropdown links
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save Menu'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {menus.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveId(m.id)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeId === m.id
                ? 'bg-[#C6F432] text-[#050505]'
                : 'border border-[color:var(--border-subtle)]'
            }`}
          >
            <MenuIcon size={13} />
            <span>{m.title}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass-card p-5 space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border border-[color:var(--border-subtle)] space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <input
                value={item.label}
                onChange={(e) =>
                  setItems(
                    items.map((x, i) =>
                      i === idx ? { ...x, label: e.target.value } : x
                    )
                  )
                }
                placeholder="Label"
                className="flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
              <input
                value={item.url}
                onChange={(e) =>
                  setItems(
                    items.map((x, i) =>
                      i === idx ? { ...x, url: e.target.value } : x
                    )
                  )
                }
                placeholder="/shop"
                className="flex-1 min-w-[160px] min-h-[44px] px-3 py-2 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => {
                  const next = [...items];
                  const [m] = next.splice(idx, 1);
                  next.splice(idx - 1, 0, m);
                  setItems(next);
                }}
                aria-label="Move item up"
                className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1}
                onClick={() => {
                  const next = [...items];
                  const [m] = next.splice(idx, 1);
                  next.splice(idx + 1, 0, m);
                  setItems(next);
                }}
                aria-label="Move item down"
                className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setItems(
                    items.map((x, i) =>
                      i === idx
                        ? {
                            ...x,
                            children: [
                              ...(x.children || []),
                              {
                                id: `sub-${Date.now()}`,
                                label: 'Sub Link',
                                url: '/shop',
                              },
                            ],
                          }
                        : x
                    )
                  )
                }
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-[color:var(--border-subtle)] text-[11px] cursor-pointer"
              >
                + Nested
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.label}`}
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="w-11 h-11 flex items-center justify-center text-red-400 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {item.children && item.children.length > 0 && (
              <div className="pl-4 sm:pl-6 space-y-1.5">
                {item.children.map((sub, sIdx) => (
                  <div key={sub.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs font-mono">
                    <span className="text-[color:var(--text-muted)]">↳</span>
                    <input
                      value={sub.label}
                      onChange={(e) => {
                        const kids = item.children!.map((k, ki) =>
                          ki === sIdx ? { ...k, label: e.target.value } : k
                        );
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, children: kids } : x
                          )
                        );
                      }}
                      className="flex-1 min-w-[120px] min-h-[40px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                    <input
                      value={sub.url}
                      onChange={(e) => {
                        const kids = item.children!.map((k, ki) =>
                          ki === sIdx ? { ...k, url: e.target.value } : k
                        );
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, children: kids } : x
                          )
                        );
                      }}
                      className="flex-1 min-w-[120px] min-h-[40px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${sub.label}`}
                      onClick={() => {
                        const kids = item.children!.filter((_, ki) => ki !== sIdx);
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, children: kids } : x
                          )
                        );
                      }}
                      className="w-10 h-10 flex items-center justify-center text-red-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setItems([
              ...items,
              { id: `nav-${Date.now()}`, label: 'New Link', url: '/shop' },
            ])
          }
          className="min-h-[44px] px-4 py-2 rounded-xl border border-dashed border-[color:var(--border-subtle)] text-xs font-mono hover:border-[#C6F432] cursor-pointer"
        >
          + Add Menu Item
        </button>
      </div>
    </div>
  );
};
