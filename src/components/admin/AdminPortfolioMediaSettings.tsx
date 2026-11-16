import React, { useMemo, useState } from 'react';
import {
  Upload,
  Copy,
  Trash2,
  Search,
  Check,
  Loader2,
  Film,
  Save,
  ExternalLink,
  Mail,
  Wrench,
  UserPlus,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  deleteMediaAsset,
  renameMediaAsset,
  saveRolesConfig,
  saveStoreSettings,
  toggleInquiryStatus,
  uploadFileToStorage,
} from '../../lib/storeService';
import type {
  BlogPost,
  CmsPage,
  Collection,
  CurrencyCode,
  MediaAsset,
  Product,
  RolesConfig,
  SiteContentDoc,
  StoreSettings,
} from '../../types/store';

// ======================= SECTION 11: MERGED PORTFOLIO & INQUIRIES =======================

export const AdminPortfolioMergedPanel: React.FC<{
  inquiries: any[];
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}> = ({ inquiries, onRefresh, onToast }) => {
  const [subTab, setSubTab] = useState<'inquiries' | 'projects' | 'studio'>(
    'inquiries'
  );
  const [studioTitle, setStudioTitle] = useState('Mushaf Khan Digital Studio');
  const [studioEmail, setStudioEmail] = useState('mushafdigital82@gmail.com');
  const [studioWhatsapp, setStudioWhatsapp] = useState('+92 300 0000000');
  const [studioInstagram, setStudioInstagram] = useState(
    'https://instagram.com/mushafkhan._.82'
  );
  const [savingStudio, setSavingStudio] = useState(false);

  const [newProjName, setNewProjName] = useState('');
  const [newProjOutcome, setNewProjOutcome] = useState('');
  const [newProjService, setNewProjService] = useState('Web Development');
  const [customProjects, setCustomProjects] = useState<any[]>([]);
  const [loadedProjects, setLoadedProjects] = useState(false);

  React.useEffect(() => {
    if (loadedProjects) return;
    setLoadedProjects(true);
    getDoc(doc(db, 'live_content', 'site_content'))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          if (d.studioTitle) setStudioTitle(d.studioTitle);
          if (d.email) setStudioEmail(d.email);
          if (d.whatsapp) setStudioWhatsapp(d.whatsapp);
          if (d.instagram) setStudioInstagram(d.instagram);
          if (Array.isArray(d.customProjects)) setCustomProjects(d.customProjects);
        }
      })
      .catch(() => {});
  }, [loadedProjects]);

  const handleSaveStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudio(true);
    try {
      await setDoc(
        doc(db, 'live_content', 'site_content'),
        {
          studioTitle,
          email: studioEmail,
          whatsapp: studioWhatsapp,
          instagram: studioInstagram,
          customProjects,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      onToast('Studio portfolio settings saved to Firestore');
    } catch (err: any) {
      onToast(err?.message || 'Save failed');
    } finally {
      setSavingStudio(false);
    }
  };

  const handleAddPortfolioProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const next = [
      ...customProjects,
      {
        id: `proj-${Date.now()}`,
        name: newProjName.trim(),
        serviceType: newProjService,
        outcome: newProjOutcome.trim(),
        createdAt: new Date().toISOString(),
      },
    ];
    setCustomProjects(next);
    setNewProjName('');
    setNewProjOutcome('');
    await setDoc(
      doc(db, 'live_content', 'site_content'),
      { customProjects: next, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    onToast('Portfolio case study added to Firestore');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">
            Portfolio &amp; Inquiries
          </h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Client project briefs, quote requests &amp; legacy portfolio settings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-xl p-1 border border-[color:var(--border-subtle)] text-xs font-mono overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSubTab('inquiries')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                subTab === 'inquiries'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : ''
              }`}
            >
              Inquiries ({inquiries.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('projects')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                subTab === 'projects'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : ''
              }`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => setSubTab('studio')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                subTab === 'studio'
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : ''
              }`}
            >
              Studio Settings
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'a', altKey: true })
              )
            }
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:border-[#C6F432]"
          >
            <Wrench size={13} />
            <span>Quick Inspector (Alt+A)</span>
          </button>
        </div>
      </div>

      {subTab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] space-y-2">
              <Mail size={26} className="mx-auto text-[color:var(--text-muted)]" />
              <p className="text-sm font-medium">No client inquiries yet</p>
              <p className="text-xs text-[color:var(--text-muted)]">
                Submissions from /contact and /pricing will appear here.
              </p>
            </div>
          ) : (
            inquiries.map((inq) => {
              const handled =
                inq.source === 'quote_requests'
                  ? inq.status === 'accepted'
                  : Boolean(inq.handled);
              return (
                <div
                  key={`${inq.source}-${inq.id}`}
                  className="rounded-2xl glass-card p-5 flex flex-wrap items-start justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#C6F432]/15 text-[color:var(--accent-text)] uppercase">
                        {inq.source === 'quote_requests' ? 'Quote' : 'Enquiry'}
                      </span>
                      <span className="font-bold">
                        {inq.name || inq.clientName || 'Client Lead'}
                      </span>
                      <span className="text-[color:var(--text-muted)]">
                        {inq.email || inq.clientEmail}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {inq.title || inq.service || 'Studio Project Brief'}
                    </p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {inq.description || inq.message || inq.details}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleInquiryStatus(inq.id, inq.source, !handled);
                        await onRefresh();
                        onToast(handled ? 'Marked pending' : 'Marked handled');
                      }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer ${
                        handled
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {handled ? 'Handled' : 'Mark Handled'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === 'projects' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddPortfolioProject}
            className="rounded-2xl glass-card p-5 grid sm:grid-cols-4 gap-3 items-end text-xs font-mono"
          >
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">
                Project Title *
              </span>
              <input
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Atelier Architecture Portal"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">Discipline</span>
              <input
                value={newProjService}
                onChange={(e) => setNewProjService(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">
                Key Outcome
              </span>
              <input
                value={newProjOutcome}
                onChange={(e) => setNewProjOutcome(e.target.value)}
                placeholder="+52% organic conversions"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#C6F432] text-[#050505] font-bold cursor-pointer"
            >
              Add Portfolio Case
            </button>
          </form>

          <div className="rounded-2xl glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl">
                Custom Portfolio Entries ({customProjects.length})
              </h3>
              <a
                href="/work"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[color:var(--accent-text)] inline-flex items-center gap-1"
              >
                <span>Open /work gallery</span>
                <ExternalLink size={12} />
              </a>
            </div>
            {customProjects.length === 0 ? (
              <p className="text-xs font-mono text-[color:var(--text-muted)]">
                Your 14 core portfolio projects continue running cleanly on /work. Add new case studies above or use Quick Inspector (Alt+A) for inline project overrides.
              </p>
            ) : (
              customProjects.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-sm">{cp.name}</div>
                    <div className="text-[color:var(--text-muted)]">
                      {cp.serviceType} · {cp.outcome}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = customProjects.filter((x) => x.id !== cp.id);
                      setCustomProjects(next);
                      await setDoc(
                        doc(db, 'live_content', 'site_content'),
                        { customProjects: next },
                        { merge: true }
                      );
                      onToast('Removed entry');
                    }}
                    className="text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === 'studio' && (
        <form
          onSubmit={handleSaveStudio}
          className="rounded-2xl glass-card p-5 sm:p-6 max-w-2xl space-y-4 text-xs font-mono"
        >
          <label className="block space-y-1">
            <span className="text-[color:var(--text-muted)]">
              Studio Display Name
            </span>
            <input
              value={studioTitle}
              onChange={(e) => setStudioTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[color:var(--text-muted)]">
                Contact Email
              </span>
              <input
                value={studioEmail}
                onChange={(e) => setStudioEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[color:var(--text-muted)]">WhatsApp</span>
              <input
                value={studioWhatsapp}
                onChange={(e) => setStudioWhatsapp(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[color:var(--text-muted)]">Instagram</span>
            <input
              value={studioInstagram}
              onChange={(e) => setStudioInstagram(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <button
            type="submit"
            disabled={savingStudio}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C6F432] text-[#050505] font-bold flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} />
            <span>{savingStudio ? 'Saving...' : 'Save Studio Info'}</span>
          </button>
        </form>
      )}
    </div>
  );
};

// ======================= SECTION 12: MEDIA LIBRARY =======================

export const AdminMediaLibraryPanel: React.FC<{
  media: MediaAsset[];
  products: Product[];
  collections: Collection[];
  posts: BlogPost[];
  siteContent: SiteContentDoc;
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}> = ({
  media,
  products,
  collections,
  posts,
  siteContent,
  onRefresh,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [uploadingPct, setUploadingPct] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const usageMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const asset of media) {
      const usedIn: string[] = [];
      products.forEach((p) => {
        if (p.media.some((m) => m.url === asset.url))
          usedIn.push(`Product: ${p.title}`);
      });
      collections.forEach((c) => {
        if (c.imageUrl === asset.url) usedIn.push(`Collection: ${c.title}`);
      });
      posts.forEach((post) => {
        if (post.coverImage === asset.url) usedIn.push(`Blog: ${post.title}`);
      });
      siteContent.sections.forEach((sec) => {
        if (sec.settings.imageUrl === asset.url)
          usedIn.push(`Home Section: ${sec.label}`);
      });
      map[asset.id] = usedIn;
    }
    return map;
  }, [media, products, collections, posts, siteContent]);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        setUploadingPct(0);
        await uploadFileToStorage(file, 'store-media', (pct) =>
          setUploadingPct(pct)
        );
      }
      await onRefresh();
      onToast(`Uploaded ${files.length} file(s) to Firebase Storage`);
    } catch (err: any) {
      onToast(err?.message || 'Storage upload failed');
    } finally {
      setUploadingPct(null);
    }
  };

  const filtered = media.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Media Library</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            All images &amp; videos hosted in Firebase Storage (never base64)
          </p>
        </div>

        <label className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-2 cursor-pointer">
          {uploadingPct !== null ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          <span>
            {uploadingPct !== null
              ? `Uploading ${uploadingPct}%`
              : 'Upload Files'}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] text-xs font-mono text-[color:var(--text-muted)]">
          No Storage assets uploaded yet. Upload your first product photo or video above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => {
            const usedIn = usageMap[asset.id] || [];
            const isVideo = asset.mimeType.startsWith('video/');
            return (
              <div
                key={asset.id}
                className="rounded-2xl glass-card overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-square bg-black/20 overflow-hidden">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center text-[color:var(--accent-text)]">
                      <Film size={28} />
                    </div>
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="p-3 space-y-2 text-xs">
                  <input
                    defaultValue={asset.name}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val && val !== asset.name) {
                        await renameMediaAsset(asset.id, val);
                        await onRefresh();
                        onToast('Renamed asset');
                      }
                    }}
                    className="w-full font-mono text-xs bg-transparent border-b border-transparent focus:border-[#C6F432] focus:outline-none truncate"
                  />

                  <div className="text-[10px] font-mono text-[color:var(--text-muted)]">
                    {(asset.sizeBytes / 1024).toFixed(0)} KB ·{' '}
                    {usedIn.length > 0
                      ? `Used in ${usedIn.length} place(s)`
                      : 'Unused'}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(asset.url);
                        setCopiedId(asset.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[color:var(--accent-text)] cursor-pointer"
                    >
                      {copiedId === asset.id ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
                    </button>

                    {confirmDeleteId === asset.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteMediaAsset(asset);
                            setConfirmDeleteId(null);
                            await onRefresh();
                            onToast('Deleted asset from Storage');
                          }}
                          className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                          title={
                            usedIn.length > 0
                              ? `Asset is used in ${usedIn[0]}`
                              : `Confirm delete ${asset.name}`
                          }
                        >
                          {usedIn.length > 0 ? 'Delete Used' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1 rounded-md border border-[color:var(--border-subtle)] text-[10px] font-mono cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(asset.id)}
                        className="p-1 text-red-400 cursor-pointer"
                        aria-label={`Delete ${asset.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ======================= SECTION 13: SETTINGS =======================

export const AdminSettingsPanel: React.FC<{
  initialSettings: StoreSettings;
  initialRoles: RolesConfig;
  products?: Product[];
  pages?: CmsPage[];
  posts?: BlogPost[];
  onNavigateTab?: (tab: string) => void;
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}> = ({
  initialSettings,
  initialRoles,
  products = [],
  pages = [],
  posts = [],
  onNavigateTab,
  onRefresh,
  onToast,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [roles, setRoles] = useState<RolesConfig>(initialRoles);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const seoAudit = useMemo(() => {
    const missingMetaDesc = [
      ...products.filter((p) => !(p.metaDescription || '').trim()).map((p) => p.title),
      ...pages.filter((p) => !(p.metaDescription || '').trim()).map((p) => p.title),
      ...posts.filter((p) => !(p.metaDescription || '').trim()).map((p) => p.title),
    ];
    const longTitles = [
      ...products
        .filter((p) => (p.seoTitle || p.title || '').length > 60)
        .map((p) => p.title),
      ...pages
        .filter((p) => (p.seoTitle || p.title || '').length > 60)
        .map((p) => p.title),
      ...posts
        .filter((p) => (p.seoTitle || p.title || '').length > 60)
        .map((p) => p.title),
    ];
    const missingAltProducts = products.filter((p) =>
      p.media.some((m) => !(m.alt || '').trim())
    );
    const hasDefaultDesc = (settings.defaultMetaDescription || '').trim().length >= 50;
    const score = Math.max(
      0,
      100 -
        missingMetaDesc.length * 8 -
        longTitles.length * 5 -
        missingAltProducts.length * 6 -
        (hasDefaultDesc ? 0 : 15)
    );
    return { missingMetaDesc, longTitles, missingAltProducts, hasDefaultDesc, score };
  }, [products, pages, posts, settings.defaultMetaDescription]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings(settings);
      await saveRolesConfig(roles);
      await onRefresh();
      window.dispatchEvent(new CustomEvent('storefront-published'));
      onToast('Store settings & roles saved');
    } catch (err: any) {
      onToast(err?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Store Settings</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Contact, payments, shipping zones, taxes, SEO, analytics &amp; staff roles
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Store Details & Contact */}
      <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
        <h3 className="font-display text-2xl">Store Identity &amp; Contact</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">Store Name</span>
            <input
              value={settings.storeName}
              onChange={(e) =>
                setSettings({ ...settings, storeName: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">Support Email</span>
            <input
              value={settings.email}
              onChange={(e) =>
                setSettings({ ...settings, email: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">Phone</span>
            <input
              value={settings.phone}
              onChange={(e) =>
                setSettings({ ...settings, phone: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">
              WhatsApp Number (Order button)
            </span>
            <input
              value={settings.whatsappNumber}
              onChange={(e) =>
                setSettings({ ...settings, whatsappNumber: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">Address</span>
            <input
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[color:var(--text-muted)]">
              Default Currency
            </span>
            <select
              value={settings.defaultCurrency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultCurrency: e.target.value as CurrencyCode,
                })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            >
              <option value="PKR">PKR (Default)</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
        <h3 className="font-display text-2xl">Payment Methods</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {settings.payments.map((pm, idx) => (
            <div
              key={pm.id}
              className="p-4 rounded-xl border border-[color:var(--border-subtle)] space-y-2.5"
            >
              <label className="flex items-center justify-between font-bold cursor-pointer">
                <span>{pm.name}</span>
                <input
                  type="checkbox"
                  checked={pm.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: settings.payments.map((x, i) =>
                        i === idx ? { ...x, enabled: e.target.checked } : x
                      ),
                    })
                  }
                  className="accent-[#C6F432]"
                />
              </label>
              <input
                value={pm.instructions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payments: settings.payments.map((x, i) =>
                      i === idx ? { ...x, instructions: e.target.value } : x
                    ),
                  })
                }
                placeholder="Customer instructions"
                className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
              {(pm.id === 'bank_transfer' || pm.id === 'jazzcash_easypaisa') && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={pm.accountTitle || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payments: settings.payments.map((x, i) =>
                          i === idx ? { ...x, accountTitle: e.target.value } : x
                        ),
                      })
                    }
                    placeholder="Account Title"
                    className="px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                  <input
                    value={pm.accountNumber || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payments: settings.payments.map((x, i) =>
                          i === idx ? { ...x, accountNumber: e.target.value } : x
                        ),
                      })
                    }
                    placeholder="Account / IBAN"
                    className="px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Zones & Taxes */}
      <div className="grid lg:grid-cols-2 gap-5 text-xs font-mono">
        <div className="rounded-2xl glass-card p-5 space-y-3">
          <h3 className="font-display text-2xl">Shipping Zones</h3>
          {settings.shippingZones.map((zone, idx) => (
            <div
              key={zone.id}
              className="p-3.5 rounded-xl border border-[color:var(--border-subtle)] space-y-2"
            >
              <div className="flex items-center justify-between font-bold">
                <span>{zone.name}</span>
                <input
                  type="checkbox"
                  checked={zone.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shippingZones: settings.shippingZones.map((z, i) =>
                        i === idx ? { ...z, enabled: e.target.checked } : z
                      ),
                    })
                  }
                  className="accent-[#C6F432]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-[color:var(--text-muted)]">
                    Flat Rate (PKR)
                  </span>
                  <input
                    type="number"
                    value={zone.flatRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingZones: settings.shippingZones.map((z, i) =>
                          i === idx
                            ? { ...z, flatRate: Number(e.target.value) }
                            : z
                        ),
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] text-[color:var(--text-muted)]">
                    Free Over (PKR)
                  </span>
                  <input
                    type="number"
                    value={zone.freeOverAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingZones: settings.shippingZones.map((z, i) =>
                          i === idx
                            ? { ...z, freeOverAmount: Number(e.target.value) }
                            : z
                        ),
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] text-[color:var(--text-muted)]">
                    ETA Days
                  </span>
                  <input
                    value={zone.estimatedDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingZones: settings.shippingZones.map((z, i) =>
                          i === idx ? { ...z, estimatedDays: e.target.value } : z
                        ),
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl glass-card p-5 space-y-3">
          <h3 className="font-display text-2xl">
            Taxes, Checkout &amp; Analytics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">Tax Rate (%)</span>
              <input
                type="number"
                value={settings.taxRatePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    taxRatePercent: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[color:var(--text-muted)]">
                GA4 Measurement ID
              </span>
              <input
                value={settings.gaMeasurementId}
                onChange={(e) =>
                  setSettings({ ...settings, gaMeasurementId: e.target.value })
                }
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowGuestCheckout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowGuestCheckout: e.target.checked,
                })
              }
              className="accent-[#C6F432]"
            />
            <span>Allow Guest Checkout (without Google login)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableWhatsappOrder}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enableWhatsappOrder: e.target.checked,
                })
              }
              className="accent-[#C6F432]"
            />
            <span>Enable &quot;Order via WhatsApp&quot; buttons</span>
          </label>
          <label className="block space-y-1">
            <span className="text-[color:var(--text-muted)]">
              Default SEO Description
            </span>
            <textarea
              rows={2}
              value={settings.defaultMetaDescription}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultMetaDescription: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </label>
        </div>
      </div>

      {/* SEO Health Check */}
      <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">SEO Health Check</h3>
            <p className="text-[color:var(--text-muted)]">
              Live audit across products, CMS pages, blog articles, sitemap, and OpenGraph assets
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-bold ${
              seoAudit.score >= 85
                ? 'bg-[#C6F432]/20 text-[#C6F432]'
                : seoAudit.score >= 60
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            Score: {seoAudit.score}/100
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-[color:var(--border-subtle)] space-y-1">
            <div className="text-[color:var(--text-muted)]">Missing Meta Desc</div>
            <div className="text-lg font-bold">
              {seoAudit.missingMetaDesc.length} item(s)
            </div>
            {seoAudit.missingMetaDesc.length > 0 && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('pages')}
                className="text-[color:var(--accent-text)] hover:underline cursor-pointer"
              >
                Fix in Pages &amp; Blog →
              </button>
            )}
          </div>

          <div className="p-3 rounded-xl border border-[color:var(--border-subtle)] space-y-1">
            <div className="text-[color:var(--text-muted)]">Titles &gt; 60 Chars</div>
            <div className="text-lg font-bold">{seoAudit.longTitles.length} item(s)</div>
            {seoAudit.longTitles.length > 0 && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('customize')}
                className="text-[color:var(--accent-text)] hover:underline cursor-pointer"
              >
                Trim in Editor →
              </button>
            )}
          </div>

          <div className="p-3 rounded-xl border border-[color:var(--border-subtle)] space-y-1">
            <div className="text-[color:var(--text-muted)]">Missing Image Alt</div>
            <div className="text-lg font-bold">
              {seoAudit.missingAltProducts.length} product(s)
            </div>
            {seoAudit.missingAltProducts.length > 0 && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="text-[color:var(--accent-text)] hover:underline cursor-pointer"
              >
                Update Products →
              </button>
            )}
          </div>

          <div className="p-3 rounded-xl border border-[color:var(--border-subtle)] space-y-1.5">
            <div className="text-[color:var(--text-muted)]">Crawlers &amp; Feeds</div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--accent-text)] hover:underline inline-flex items-center gap-1"
              >
                <span>sitemap.xml</span>
                <ExternalLink size={11} />
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--accent-text)] hover:underline inline-flex items-center gap-1"
              >
                <span>robots.txt</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Roles */}
      <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
        <h3 className="font-display text-2xl">Studio Staff Directory</h3>
        <p className="text-[color:var(--text-muted)]">
          Manage studio collaborator contacts and order notification recipients. Admin dashboard access is protected by the server-side studio password.
        </p>

        <div className="flex flex-wrap gap-2">
          {roles.staffEmails.map((em) => (
            <span
              key={em}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/10"
            >
              <span>{em}</span>
              {em.toLowerCase() !== roles.ownerEmail.toLowerCase() && (
                <button
                  type="button"
                  onClick={() =>
                    setRoles({
                      ...roles,
                      staffEmails: roles.staffEmails.filter((x) => x !== em),
                    })
                  }
                  className="text-red-400 cursor-pointer"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="email"
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            placeholder="staff@example.com"
            className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
          <button
            type="button"
            onClick={() => {
              const clean = newStaffEmail.trim().toLowerCase();
              if (clean && !roles.staffEmails.includes(clean)) {
                setRoles({
                  ...roles,
                  staffEmails: [...roles.staffEmails, clean],
                });
                setNewStaffEmail('');
              }
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#C6F432]"
          >
            <UserPlus size={13} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>
    </form>
  );
};
