import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Copy,
  Archive,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
  Download,
  GripVertical,
  Image as ImageIcon,
  Film,
  Loader2,
} from 'lucide-react';
import {
  deleteProduct,
  saveProduct,
  slugify,
  uploadFileToStorage,
} from '../../lib/storeService';
import { formatMoney } from '../../lib/currency';
import {
  downloadCsv,
  MediaPickerModal,
  parseCsv,
  RichTextEditor,
} from './AdminShared';
import type {
  Collection,
  CurrencyCode,
  MediaGalleryItem,
  Product,
  ProductVariant,
} from '../../types/store';

interface AdminProductsPanelProps {
  products: Product[];
  collections: Collection[];
  onRefresh: () => Promise<void>;
  currency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  onToast: (msg: string) => void;
}

const emptyProduct = (): Product => ({
  id: `prod-${Date.now()}`,
  title: '',
  handle: '',
  description: '<p></p>',
  media: [],
  price: 0,
  compareAtPrice: 0,
  cost: 0,
  sku: `MK-${Math.floor(1000 + Math.random() * 9000)}`,
  barcode: '',
  stockQuantity: 10,
  trackInventory: true,
  variants: [],
  optionDefinitions: [],
  weight: 250,
  tags: [],
  collectionIds: [],
  category: 'Studio Editions',
  status: 'draft',
  seoTitle: '',
  metaDescription: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminProductsPanel: React.FC<AdminProductsPanelProps> = ({
  products,
  collections,
  onRefresh,
  currency,
  exchangeRates,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmEditorDelete, setConfirmEditorDelete] = useState(false);
  const [confirmRowDeleteId, setConfirmRowDeleteId] = useState<string | null>(null);

  const fmt = (pkr: number) => formatMoney(pkr, currency, exchangeRates);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, statusFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (
    action: 'active' | 'draft' | 'archived' | 'delete'
  ) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirmBulkDelete) {
      setConfirmBulkDelete(true);
      onToast(`Click Delete again to confirm removing ${selectedIds.length} product(s).`);
      return;
    }
    setConfirmBulkDelete(false);
    for (const id of selectedIds) {
      const p = products.find((x) => x.id === id);
      if (!p) continue;
      if (action === 'delete') await deleteProduct(id);
      else await saveProduct({ ...p, status: action });
    }
    setSelectedIds([]);
    await onRefresh();
    onToast(`Bulk ${action} applied`);
  };

  const handleDuplicate = async (p: Product) => {
    const copy: Product = {
      ...p,
      id: `${p.id}-copy-${Date.now().toString().slice(-4)}`,
      title: `${p.title} (Copy)`,
      handle: `${p.handle}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProduct(copy);
    await onRefresh();
    onToast('Product duplicated');
  };

  const handleExportCsv = () => {
    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'id',
        'title',
        'handle',
        'sku',
        'pricePKR',
        'compareAtPricePKR',
        'costPKR',
        'stockQuantity',
        'trackInventory',
        'category',
        'tags',
        'status',
        'seoTitle',
        'metaDescription',
      ],
      products.map((p) => [
        p.id,
        p.title,
        p.handle,
        p.sku,
        p.price,
        p.compareAtPrice || '',
        p.cost || '',
        p.stockQuantity,
        p.trackInventory,
        p.category,
        p.tags.join(';'),
        p.status,
        p.seoTitle,
        p.metaDescription,
      ])
    );
    onToast('Exported products CSV');
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    for (const r of rows) {
      if (!r.title) continue;
      const p: Product = {
        ...emptyProduct(),
        id: r.id || slugify(r.title),
        title: r.title,
        handle: r.handle || slugify(r.title),
        sku: r.sku || `MK-${Math.floor(1000 + Math.random() * 9000)}`,
        price: Number(r.pricePKR || 0),
        compareAtPrice: Number(r.compareAtPricePKR || 0),
        cost: Number(r.costPKR || 0),
        stockQuantity: Number(r.stockQuantity || 0),
        trackInventory: r.trackInventory !== 'false',
        category: r.category || 'Studio Editions',
        tags: r.tags ? r.tags.split(';').map((t) => t.trim()) : [],
        status: (r.status as any) || 'draft',
        seoTitle: r.seoTitle || r.title,
        metaDescription: r.metaDescription || '',
      };
      await saveProduct(p);
    }
    await onRefresh();
    onToast(`Imported ${rows.length} products from CSV`);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await saveProduct({
        ...editing,
        handle: editing.handle || slugify(editing.title),
      });
      await onRefresh();
      setEditing(null);
      onToast('Product saved to Firestore');
    } catch (err: any) {
      onToast(err?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadProductMedia = async (files: FileList | null) => {
    if (!files || !editing) return;
    try {
      const added: MediaGalleryItem[] = [];
      for (const file of Array.from(files)) {
        setUploadingMedia(0);
        const asset = await uploadFileToStorage(file, 'products', (pct) =>
          setUploadingMedia(pct)
        );
        added.push({
          id: asset.id,
          url: asset.url,
          type: asset.mimeType.startsWith('video/') ? 'video' : 'image',
          alt: editing.title || asset.name,
        });
      }
      setEditing({ ...editing, media: [...editing.media, ...added] });
      onToast(`Uploaded ${added.length} media file(s) to Firebase Storage`);
    } catch (err: any) {
      onToast(err?.message || 'Upload failed');
    } finally {
      setUploadingMedia(null);
    }
  };

  const reorderMedia = (from: number, to: number) => {
    if (!editing || from === to) return;
    const next = [...editing.media];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEditing({ ...editing, media: next });
  };

  const generateVariantsMatrix = () => {
    if (!editing || editing.optionDefinitions.length === 0) return;
    const validOpts = editing.optionDefinitions.filter(
      (o) => o.name.trim() && o.values.length > 0
    );
    if (validOpts.length === 0) return;

    let combos: Record<string, string>[] = [{}];
    for (const opt of validOpts) {
      const next: Record<string, string>[] = [];
      for (const base of combos) {
        for (const val of opt.values) {
          next.push({ ...base, [opt.name]: val });
        }
      }
      combos = next;
    }

    const nextVariants: ProductVariant[] = combos.map((opts, i) => {
      const title = Object.values(opts).join(' / ');
      const existing = editing.variants.find((v) => v.title === title);
      return (
        existing || {
          id: `var-${Date.now()}-${i}`,
          title,
          options: opts,
          price: editing.price,
          sku: `${editing.sku}-${i + 1}`,
          stockQuantity: editing.stockQuantity,
          image: editing.media[0]?.url || '',
        }
      );
    });
    setEditing({ ...editing, variants: nextVariants });
  };

  if (editing) {
    const margin =
      editing.price > 0 && editing.cost
        ? Math.round(((editing.price - editing.cost) / editing.price) * 100)
        : 0;

    return (
      <form onSubmit={handleSaveEditor} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="min-h-[44px] px-2 inline-flex items-center gap-2 text-xs font-mono hover:text-[color:var(--accent-text)] cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Products</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {confirmEditorDelete ? (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    await deleteProduct(editing.id);
                    setConfirmEditorDelete(false);
                    await onRefresh();
                    setEditing(null);
                    onToast('Product deleted');
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-mono font-bold cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEditorDelete(false)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEditorDelete(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-mono cursor-pointer"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl glass-card p-5 space-y-4">
              <label className="block space-y-1 text-xs font-mono">
                <span className="text-[color:var(--text-muted)]">Title *</span>
                <input
                  required
                  value={editing.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditing({
                      ...editing,
                      title,
                      handle: editing.handle || slugify(title),
                    });
                  }}
                  placeholder="Architect Merino Felt Desk Mat"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[color:var(--text-muted)] block">
                  Description (Rich Text)
                </span>
                <RichTextEditor
                  value={editing.description}
                  onChange={(html) =>
                    setEditing({ ...editing, description: html })
                  }
                />
              </div>
            </div>

            {/* Media Gallery Upload + Reorder + Alt Text */}
            <div className="rounded-2xl glass-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl">
                    Media (Images &amp; Video)
                  </h3>
                  <p className="text-[11px] font-mono text-[color:var(--text-muted)]">
                    Uploads directly to Firebase Storage · Drag cards to reorder
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon size={13} />
                    <span>From Media Library</span>
                  </button>
                  <label className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer">
                    {uploadingMedia !== null ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    <span>
                      {uploadingMedia !== null
                        ? `${uploadingMedia}%`
                        : 'Upload Files'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handleUploadProductMedia(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {editing.media.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-[color:var(--border-subtle)] text-xs font-mono text-[color:var(--text-muted)]">
                  No media attached yet. Upload images or videos to Firebase Storage.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editing.media.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIdx !== null) reorderMedia(dragIdx, idx);
                        setDragIdx(null);
                      }}
                      className="flex gap-3 p-2.5 rounded-xl border border-[color:var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.03] items-center"
                    >
                      <GripVertical
                        size={14}
                        className="text-[color:var(--text-muted)] cursor-grab shrink-0"
                      />
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 shrink-0">
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-[color:var(--accent-text)]">
                            <Film size={20} />
                          </div>
                        ) : (
                          <img
                            src={m.url}
                            alt={m.alt}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          value={m.alt}
                          onChange={(e) => {
                            const next = editing.media.map((item, i) =>
                              i === idx ? { ...item, alt: e.target.value } : item
                            );
                            setEditing({ ...editing, media: next });
                          }}
                          placeholder="Alt text..."
                          className="w-full px-2 py-1 rounded text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                        />
                        <div className="text-[10px] font-mono text-[color:var(--text-muted)] truncate">
                          {idx === 0 ? 'Primary Cover' : `Slide #${idx + 1}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            media: editing.media.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1.5 text-[color:var(--text-muted)] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Inventory */}
            <div className="rounded-2xl glass-card p-5 space-y-4">
              <h3 className="font-display text-2xl">
                Pricing, SKU &amp; Inventory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Price (PKR) *</span>
                  <input
                    type="number"
                    required
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Compare-at</span>
                  <input
                    type="number"
                    value={editing.compareAtPrice || 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        compareAtPrice: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">
                    Cost (Margin {margin}%)
                  </span>
                  <input
                    type="number"
                    value={editing.cost || 0}
                    onChange={(e) =>
                      setEditing({ ...editing, cost: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Weight (g)</span>
                  <input
                    type="number"
                    value={editing.weight}
                    onChange={(e) =>
                      setEditing({ ...editing, weight: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">SKU</span>
                  <input
                    value={editing.sku}
                    onChange={(e) =>
                      setEditing({ ...editing, sku: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Barcode</span>
                  <input
                    value={editing.barcode || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, barcode: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[color:var(--text-muted)]">Stock Qty</span>
                  <input
                    type="number"
                    value={editing.stockQuantity}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                </label>
              </div>

              <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.trackInventory}
                  onChange={(e) =>
                    setEditing({ ...editing, trackInventory: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#C6F432]"
                />
                <span>Track stock quantity (disable for digital downloads)</span>
              </label>
            </div>

            {/* Options & Variants Matrix */}
            <div className="rounded-2xl glass-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-2xl">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        optionDefinitions: [
                          ...editing.optionDefinitions,
                          { name: 'Size', values: ['Standard'] },
                        ],
                      })
                    }
                    className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono cursor-pointer"
                  >
                    + Add Option
                  </button>
                  <button
                    type="button"
                    onClick={generateVariantsMatrix}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#C6F432]/20 border border-[#C6F432]/40 text-xs font-mono font-semibold cursor-pointer"
                  >
                    Generate Matrix
                  </button>
                </div>
              </div>

              {editing.optionDefinitions.map((opt, idx) => (
                <div
                  key={idx}
                  className="grid sm:grid-cols-12 gap-2 items-center text-xs font-mono"
                >
                  <input
                    value={opt.name}
                    onChange={(e) => {
                      const next = editing.optionDefinitions.map((o, i) =>
                        i === idx ? { ...o, name: e.target.value } : o
                      );
                      setEditing({ ...editing, optionDefinitions: next });
                    }}
                    placeholder="Option (e.g. Size)"
                    className="sm:col-span-4 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                  <input
                    value={opt.values.join(', ')}
                    onChange={(e) => {
                      const vals = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const next = editing.optionDefinitions.map((o, i) =>
                        i === idx ? { ...o, values: vals } : o
                      );
                      setEditing({ ...editing, optionDefinitions: next });
                    }}
                    placeholder="Values separated by comma (S, M, L)"
                    className="sm:col-span-7 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        optionDefinitions: editing.optionDefinitions.filter(
                          (_, i) => i !== idx
                        ),
                      })
                    }
                    className="sm:col-span-1 p-2 text-red-400 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {editing.variants.length > 0 && (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs font-mono">
                    <thead className="border-b border-[color:var(--border-subtle)] text-[color:var(--text-muted)]">
                      <tr>
                        <th className="py-2 text-left">Variant</th>
                        <th className="py-2 text-left">Price (PKR)</th>
                        <th className="py-2 text-left">SKU</th>
                        <th className="py-2 text-left">Stock</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                      {editing.variants.map((v, vIdx) => (
                        <tr key={v.id}>
                          <td className="py-2 pr-2 font-semibold">{v.title}</td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => {
                                const next = editing.variants.map((item, i) =>
                                  i === vIdx
                                    ? { ...item, price: Number(e.target.value) }
                                    : item
                                );
                                setEditing({ ...editing, variants: next });
                              }}
                              className="w-24 px-2 py-1 rounded bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              value={v.sku}
                              onChange={(e) => {
                                const next = editing.variants.map((item, i) =>
                                  i === vIdx
                                    ? { ...item, sku: e.target.value }
                                    : item
                                );
                                setEditing({ ...editing, variants: next });
                              }}
                              className="w-32 px-2 py-1 rounded bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={v.stockQuantity}
                              onChange={(e) => {
                                const next = editing.variants.map((item, i) =>
                                  i === vIdx
                                    ? {
                                        ...item,
                                        stockQuantity: Number(e.target.value),
                                      }
                                    : item
                                );
                                setEditing({ ...editing, variants: next });
                              }}
                              className="w-16 px-2 py-1 rounded bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  ...editing,
                                  variants: editing.variants.filter(
                                    (_, i) => i !== vIdx
                                  ),
                                })
                              }
                              className="text-red-400 p-1 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SEO Fields */}
            <div className="rounded-2xl glass-card p-5 space-y-3 text-xs font-mono">
              <h3 className="font-display text-2xl">Search Engine Listing</h3>
              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">URL Handle</span>
                <input
                  value={editing.handle}
                  onChange={(e) =>
                    setEditing({ ...editing, handle: slugify(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">SEO Title</span>
                <input
                  value={editing.seoTitle}
                  onChange={(e) =>
                    setEditing({ ...editing, seoTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">
                  Meta Description
                </span>
                <textarea
                  rows={2}
                  value={editing.metaDescription}
                  onChange={(e) =>
                    setEditing({ ...editing, metaDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Status</span>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as Product['status'],
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                >
                  <option value="active">Active (Live on Store)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">Category</span>
                <input
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>

              <div className="space-y-1.5">
                <span className="text-[color:var(--text-muted)] block">
                  Collections
                </span>
                {collections.map((col) => {
                  const checked = editing.collectionIds.includes(col.id);
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setEditing({
                            ...editing,
                            collectionIds: checked
                              ? editing.collectionIds.filter((x) => x !== col.id)
                              : [...editing.collectionIds, col.id],
                          })
                        }
                        className="accent-[#C6F432]"
                      />
                      <span>{col.title}</span>
                    </label>
                  );
                })}
              </div>

              <label className="block space-y-1">
                <span className="text-[color:var(--text-muted)]">
                  Tags (comma separated)
                </span>
                <input
                  value={editing.tags.join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                />
              </label>
            </div>
          </div>
        </div>

        <MediaPickerModal
          open={pickerOpen}
          acceptVideo
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setEditing({
              ...editing,
              media: [
                ...editing.media,
                {
                  id: asset.id,
                  url: asset.url,
                  type: asset.mimeType.startsWith('video/') ? 'video' : 'image',
                  alt: editing.title || asset.name,
                },
              ],
            });
          }}
        />
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Products</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            {products.length} total items · Manage variants, inventory &amp; SEO
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:border-[#C6F432]">
            <Upload size={13} />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCsv}
            />
          </label>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:border-[#C6F432]"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setEditing(emptyProduct())}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 w-full">
          <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or SKU..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </div>
          <select
            aria-label="Filter product status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span>{selectedIds.length} selected:</span>
            <button
              type="button"
              onClick={() => handleBulkAction('active')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#C6F432]/20 text-[color:var(--accent-text)] cursor-pointer"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('archived')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('delete')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Mobile Product Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl glass-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <label className="min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  aria-label={`Select ${p.title}`}
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="w-4 h-4 accent-[#C6F432]"
                />
              </label>
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/15 shrink-0 border border-[color:var(--border-subtle)]">
                  {p.media?.[0]?.url && (
                    <img
                      src={p.media[0].url}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{p.title}</div>
                  <div className="text-[11px] font-mono text-[color:var(--text-muted)] truncate">
                    {p.sku} · {p.category}
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md uppercase text-[11px] ${
                    p.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : p.status === 'draft'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-black/15 text-[color:var(--text-muted)]'
                  }`}
                >
                  {p.status}
                </span>
                <span className="text-[color:var(--text-muted)] tabular-nums">
                  {p.trackInventory ? `${p.stockQuantity} in stock` : 'Digital'}
                </span>
              </div>
              <span className="font-bold text-sm tabular-nums text-[color:var(--accent-text)]">
                {fmt(p.price)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[color:var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="min-h-[44px] flex-1 px-3 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono font-semibold cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Duplicate ${p.title}`}
                onClick={() => handleDuplicate(p)}
                className="w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center cursor-pointer"
              >
                <Copy size={15} />
              </button>
              <button
                type="button"
                aria-label={`Archive ${p.title}`}
                onClick={async () => {
                  await saveProduct({ ...p, status: 'archived' });
                  await onRefresh();
                  onToast('Archived product');
                }}
                className="w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center cursor-pointer"
              >
                <Archive size={15} />
              </button>
              {confirmRowDeleteId === p.id ? (
                <button
                  type="button"
                  onClick={async () => {
                    await deleteProduct(p.id);
                    setConfirmRowDeleteId(null);
                    await onRefresh();
                    onToast('Deleted product');
                  }}
                  className="min-h-[44px] px-3 rounded-xl bg-red-500 text-white text-xs font-mono font-bold cursor-pointer"
                >
                  Confirm
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => setConfirmRowDeleteId(p.id)}
                  className="w-11 h-11 rounded-xl border border-red-500/30 text-red-400 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Product Table */}
      <div className="hidden md:block rounded-2xl glass-card overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[color:var(--border-subtle)] font-mono uppercase text-[color:var(--text-muted)]">
            <tr>
              <th className="py-3 px-4 w-8">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedIds.length === filtered.length
                  }
                  onChange={(e) =>
                    setSelectedIds(
                      e.target.checked ? filtered.map((p) => p.id) : []
                    )
                  }
                  className="accent-[#C6F432]"
                />
              </th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Inventory</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border-subtle)]">
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-black/5 dark:hover:bg-white/[0.03]"
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="accent-[#C6F432]"
                  />
                </td>
                <td
                  onClick={() => setEditing(p)}
                  className="py-3 px-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/15 shrink-0 border border-[color:var(--border-subtle)]">
                      {p.media?.[0]?.url && (
                        <img
                          src={p.media[0].url}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm hover:text-[color:var(--accent-text)]">
                        {p.title}
                      </div>
                      <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                        {p.sku} · {p.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono uppercase">
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      p.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : p.status === 'draft'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-black/15 text-[color:var(--text-muted)]'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono tabular-nums">
                  {p.trackInventory ? `${p.stockQuantity} in stock` : 'Unlimited'}
                </td>
                <td className="py-3 px-4 font-mono font-bold tabular-nums">
                  {fmt(p.price)}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      title="Duplicate"
                      onClick={() => handleDuplicate(p)}
                      className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      title="Archive"
                      onClick={async () => {
                        await saveProduct({ ...p, status: 'archived' });
                        await onRefresh();
                        onToast('Archived product');
                      }}
                      className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <Archive size={14} />
                    </button>
                    {confirmRowDeleteId === p.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteProduct(p.id);
                            setConfirmRowDeleteId(null);
                            await onRefresh();
                            onToast('Deleted product');
                          }}
                          className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRowDeleteId(null)}
                          className="px-1.5 py-1 rounded-md border border-[color:var(--border-subtle)] text-[10px] font-mono cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setConfirmRowDeleteId(p.id)}
                        className="p-2 rounded-lg hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
