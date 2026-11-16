import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Download,
  Image as ImageIcon,
  Tag,
  Users,
  Layers,
  Boxes,
  ArrowLeft,
} from 'lucide-react';
import {
  deleteCollection,
  deleteDiscount,
  saveCollection,
  saveDiscount,
  saveProduct,
  slugify,
  updateCustomerNotes,
} from '../../lib/storeService';
import { formatMoney } from '../../lib/currency';
import { downloadCsv, MediaPickerModal } from './AdminShared';
import type {
  Collection,
  CurrencyCode,
  Customer,
  Discount,
  Order,
  Product,
} from '../../types/store';

// ======================= COLLECTIONS PANEL =======================

export const AdminCollectionsPanel: React.FC<{
  collections: Collection[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onToast: (m: string) => void;
}> = ({ collections, products, onRefresh, onToast }) => {
  const [editing, setEditing] = useState<Collection | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await saveCollection({
        ...editing,
        handle: editing.handle || slugify(editing.title),
      });
      await onRefresh();
      setEditing(null);
      onToast('Collection saved');
    } catch (err: any) {
      onToast(err?.message || 'Error saving collection');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="min-h-[44px] px-2 inline-flex items-center gap-2 text-xs font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Collections</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Collection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-2xl glass-card p-5 space-y-4">
            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">Title *</span>
              <input
                required
                value={editing.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    title: e.target.value,
                    handle: editing.handle || slugify(e.target.value),
                  })
                }
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-base sm:text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">URL Handle</span>
              <input
                value={editing.handle}
                onChange={(e) =>
                  setEditing({ ...editing, handle: slugify(e.target.value) })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">Description</span>
              <textarea
                rows={3}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-[color:var(--text-muted)] block">
                Product Picker ({editing.productIds.length} selected)
              </span>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {products.map((p) => {
                  const checked = editing.productIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="min-h-[44px] flex items-center justify-between p-2.5 rounded-xl border border-[color:var(--border-subtle)] cursor-pointer hover:border-[#C6F432]"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditing({
                              ...editing,
                              productIds: checked
                                ? editing.productIds.filter((x) => x !== p.id)
                                : [...editing.productIds, p.id],
                            })
                          }
                          className="w-4 h-4 accent-[#C6F432]"
                        />
                        <span className="text-xs font-medium">{p.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[color:var(--text-muted)]">
                        {p.sku}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl glass-card p-5 space-y-4 text-xs font-mono">
            <div className="space-y-2">
              <span className="text-[color:var(--text-muted)] block">
                Collection Cover Image
              </span>
              {editing.imageUrl && (
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-black/15 border border-[color:var(--border-subtle)]">
                  <img
                    src={editing.imageUrl}
                    alt={editing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center gap-2 hover:border-[#C6F432] cursor-pointer"
              >
                <ImageIcon size={14} />
                <span>Select / Upload Image</span>
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-[color:var(--text-muted)]">Sort Order</span>
              <select
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    sortOrder: e.target.value as Collection['sortOrder'],
                  })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              >
                <option value="manual">Manual Selection</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </label>

            <label className="min-h-[44px] inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) =>
                  setEditing({ ...editing, published: e.target.checked })
                }
                className="w-4 h-4 accent-[#C6F432]"
              />
              <span>Published on Storefront</span>
            </label>
          </div>
        </div>

        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) =>
            setEditing({ ...editing, imageUrl: asset.url })
          }
        />
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Collections</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Curate product groupings &amp; collection landing pages
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              id: `col-${Date.now()}`,
              title: '',
              handle: '',
              description: '',
              imageUrl: '',
              productIds: [],
              sortOrder: 'manual',
              published: true,
              updatedAt: new Date().toISOString(),
            })
          }
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Create Collection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl glass-card overflow-hidden flex flex-col justify-between"
          >
            <div
              onClick={() => setEditing(c)}
              className="cursor-pointer group"
            >
              <div className="aspect-[16/9] bg-black/15 overflow-hidden">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[color:var(--text-muted)]">
                    <Layers size={24} />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-display text-2xl">{c.title}</h3>
                <p className="text-xs font-mono text-[color:var(--text-muted)]">
                  /collections/{c.handle} · {c.productIds.length} items
                </p>
              </div>
            </div>
            <div className="px-4 pb-4 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase">
                {c.published ? 'Published' : 'Draft'}
              </span>
              {confirmDeleteId === c.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteCollection(c.id);
                      setConfirmDeleteId(null);
                      await onRefresh();
                      onToast('Collection deleted');
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[color:var(--border-subtle)] text-[10px] font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(c.id)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 cursor-pointer"
                  aria-label={`Delete collection ${c.title}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ======================= CUSTOMERS PANEL =======================

export const AdminCustomersPanel: React.FC<{
  customers: Customer[];
  orders: Order[];
  currency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  onRefresh: () => Promise<void>;
  onToast: (m: string) => void;
}> = ({ customers, orders, currency, exchangeRates, onRefresh, onToast }) => {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fmt = (pkr: number) => formatMoney(pkr, currency, exchangeRates);

  const customerOrders = useMemo(() => {
    if (!selected) return [];
    return orders.filter(
      (o) =>
        o.customerEmail.toLowerCase() === selected.email.toLowerCase() ||
        (selected.uid && o.customerUid === selected.uid)
    );
  }, [selected, orders]);

  const handleExport = () => {
    downloadCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Name', 'Email', 'Phone', 'City', 'Country', 'Orders', 'TotalSpentPKR', 'Notes'],
      customers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.city,
        c.country,
        c.ordersCount,
        c.totalSpent,
        c.notes,
      ])
    );
    onToast('Exported customers CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Customers</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            {customers.length} profiles · Lifetime spend &amp; order history
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[#C6F432]"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] space-y-2">
          <Users size={28} className="mx-auto text-[color:var(--text-muted)]" />
          <p className="text-sm font-medium">No customers recorded yet</p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Customer records are automatically created when checkout orders arrive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            {/* Mobile Customer Cards */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelected(c);
                    setNotes(c.notes || '');
                  }}
                  className={`w-full text-left rounded-2xl glass-card p-4 space-y-1.5 cursor-pointer transition-colors ${
                    selected?.id === c.id ? 'border-[#C6F432] bg-[#C6F432]/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="font-mono text-xs font-bold tabular-nums text-[color:var(--accent-text)]">
                      {fmt(c.totalSpent)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[color:var(--text-muted)] truncate">
                    {c.email}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[color:var(--text-muted)] pt-1">
                    <span>
                      {c.city}, {c.country}
                    </span>
                    <span>{c.ordersCount} orders</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop Customer Table */}
            <div className="hidden md:block rounded-2xl glass-card overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[color:var(--border-subtle)] font-mono uppercase text-[color:var(--text-muted)]">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4 text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border-subtle)]">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelected(c);
                        setNotes(c.notes || '');
                      }}
                      className={`cursor-pointer hover:bg-black/5 dark:hover:bg-white/[0.04] ${
                        selected?.id === c.id ? 'bg-[#C6F432]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                          {c.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {c.city}, {c.country}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {c.ordersCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {fmt(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl glass-card p-5 space-y-4">
            {!selected ? (
              <p className="text-xs font-mono text-[color:var(--text-muted)] py-8 text-center">
                Select a customer row to inspect order history and notes.
              </p>
            ) : (
              <>
                <div>
                  <h3 className="font-display text-2xl">{selected.name}</h3>
                  <p className="text-xs font-mono text-[color:var(--text-muted)] break-all">
                    {selected.email} · {selected.phone}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-[color:var(--text-muted)] block">
                    Internal Notes
                  </span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      await updateCustomerNotes(selected.id, notes);
                      await onRefresh();
                      setSaving(false);
                      onToast('Customer notes saved');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>

                <div className="pt-3 border-t border-[color:var(--border-subtle)] space-y-2">
                  <div className="text-xs font-mono uppercase text-[color:var(--text-muted)]">
                    Order History ({customerOrders.length})
                  </div>
                  {customerOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/[0.04] text-xs font-mono"
                    >
                      <span>
                        #{o.orderNumber} ({o.status})
                      </span>
                      <span className="font-bold tabular-nums">{fmt(o.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ======================= DISCOUNTS PANEL =======================

export const AdminDiscountsPanel: React.FC<{
  discounts: Discount[];
  onRefresh: () => Promise<void>;
  onToast: (m: string) => void;
}> = ({ discounts, onRefresh, onToast }) => {
  const [form, setForm] = useState<Discount>({
    id: '',
    code: '',
    type: 'percentage',
    value: 10,
    minOrderAmount: 0,
    usageLimit: 100,
    usedCount: 0,
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: '2027-12-31',
    active: true,
    createdAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDiscount(form);
      await onRefresh();
      setForm({
        ...form,
        id: '',
        code: '',
      });
      onToast('Discount code saved');
    } catch (err: any) {
      onToast(err?.message || 'Error saving discount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Discounts</h1>
        <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
          Create percentage, fixed amount, and free shipping promo codes
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl glass-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end text-xs font-mono"
      >
        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Promo Code *</span>
          <input
            required
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            placeholder="EID20"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs uppercase bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Discount Type</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as Discount['type'] })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (PKR)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Value</span>
          <input
            type="number"
            disabled={form.type === 'free_shipping'}
            value={form.value}
            onChange={(e) =>
              setForm({ ...form, value: Number(e.target.value) })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Min Order (PKR)</span>
          <input
            type="number"
            value={form.minOrderAmount}
            onChange={(e) =>
              setForm({ ...form, minOrderAmount: Number(e.target.value) })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Starts Date</span>
          <input
            type="date"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Ends Date</span>
          <input
            type="date"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[color:var(--text-muted)]">Usage Limit</span>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) =>
              setForm({ ...form, usageLimit: Number(e.target.value) })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#C6F432] text-[#050505] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Tag size={13} />
          <span>{saving ? 'Saving...' : 'Save Code'}</span>
        </button>
      </form>

      {/* Mobile Discount Cards */}
      <div className="md:hidden space-y-3 font-mono text-xs">
        {discounts.map((d) => (
          <div key={d.code} className="rounded-2xl glass-card p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-[color:var(--accent-text)]">
                {d.code}
              </span>
              <span className="font-semibold">
                {d.type === 'percentage'
                  ? `${d.value}% off`
                  : d.type === 'fixed'
                    ? `Rs ${d.value.toLocaleString()} off`
                    : 'Free Shipping'}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[color:var(--text-muted)]">
              <span>Min Rs {d.minOrderAmount.toLocaleString()}</span>
              <span>
                {d.usedCount} / {d.usageLimit || '∞'} used
              </span>
            </div>
            <div className="text-[11px] text-[color:var(--text-muted)]">
              {d.startsAt} → {d.endsAt}
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={async () => {
                  await saveDiscount({ ...d, active: !d.active });
                  await onRefresh();
                }}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg cursor-pointer ${
                  d.active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-black/15 text-[color:var(--text-muted)]'
                }`}
              >
                {d.active ? 'Active' : 'Paused'}
              </button>
              <button
                type="button"
                aria-label={`Delete discount ${d.code}`}
                onClick={async () => {
                  await deleteDiscount(d.code);
                  await onRefresh();
                  onToast('Discount deleted');
                }}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Discounts Table */}
      <div className="hidden md:block rounded-2xl glass-card overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-[color:var(--border-subtle)] uppercase text-[color:var(--text-muted)]">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Benefit</th>
              <th className="py-3 px-4">Min Order</th>
              <th className="py-3 px-4">Usage</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border-subtle)]">
            {discounts.map((d) => (
              <tr key={d.code}>
                <td className="py-3 px-4 font-bold text-[color:var(--accent-text)]">
                  {d.code}
                </td>
                <td className="py-3 px-4">
                  {d.type === 'percentage'
                    ? `${d.value}% off`
                    : d.type === 'fixed'
                      ? `Rs ${d.value.toLocaleString()} off`
                      : 'Free Shipping'}
                </td>
                <td className="py-3 px-4 tabular-nums">
                  Rs {d.minOrderAmount.toLocaleString()}
                </td>
                <td className="py-3 px-4 tabular-nums">
                  {d.usedCount} / {d.usageLimit || '∞'}
                </td>
                <td className="py-3 px-4 text-[color:var(--text-muted)]">
                  {d.startsAt} → {d.endsAt}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveDiscount({ ...d, active: !d.active });
                      await onRefresh();
                    }}
                    className={`min-h-[36px] px-2.5 py-1 rounded cursor-pointer ${
                      d.active
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-black/15 text-[color:var(--text-muted)]'
                    }`}
                  >
                    {d.active ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    aria-label={`Delete discount ${d.code}`}
                    onClick={async () => {
                      await deleteDiscount(d.code);
                      await onRefresh();
                      onToast('Discount deleted');
                    }}
                    className="text-red-400 p-2 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ======================= INVENTORY QUICK TABLE =======================

export const AdminInventoryPanel: React.FC<{
  products: Product[];
  onRefresh: () => Promise<void>;
  onToast: (m: string) => void;
}> = ({ products, onRefresh, onToast }) => {
  const [draftStock, setDraftStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSaveRow = async (p: Product) => {
    const qty = draftStock[p.id] ?? p.stockQuantity;
    setSavingId(p.id);
    await saveProduct({ ...p, stockQuantity: qty });
    await onRefresh();
    setSavingId(null);
    onToast(`Updated stock for ${p.sku}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Inventory</h1>
        <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
          Quick stock level adjustment table across all SKUs
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] space-y-2">
          <Boxes size={28} className="mx-auto text-[color:var(--text-muted)]" />
          <p className="text-sm font-medium">No products in inventory</p>
        </div>
      ) : (
        <>
          {/* Mobile Inventory Cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => {
              const currentQty = draftStock[p.id] ?? p.stockQuantity;
              const dirty =
                draftStock[p.id] !== undefined &&
                draftStock[p.id] !== p.stockQuantity;
              return (
                <div key={p.id} className="rounded-2xl glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                        {p.sku} · {p.trackInventory ? 'Tracked' : 'Digital'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      aria-label={`Stock quantity for ${p.title}`}
                      value={currentQty}
                      onChange={(e) =>
                        setDraftStock({
                          ...draftStock,
                          [p.id]: Number(e.target.value),
                        })
                      }
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-base font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] tabular-nums"
                    />
                    <button
                      type="button"
                      disabled={!dirty || savingId === p.id}
                      onClick={() => handleSaveRow(p)}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold disabled:opacity-35 cursor-pointer"
                    >
                      {savingId === p.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden md:block rounded-2xl glass-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[color:var(--border-subtle)] font-mono uppercase text-[color:var(--text-muted)]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Tracked</th>
                  <th className="py-3 px-4">On Hand</th>
                  <th className="py-3 px-4 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border-subtle)]">
                {products.map((p) => {
                  const currentQty = draftStock[p.id] ?? p.stockQuantity;
                  const dirty =
                    draftStock[p.id] !== undefined &&
                    draftStock[p.id] !== p.stockQuantity;
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold">{p.title}</td>
                      <td className="py-3 px-4 font-mono">{p.sku}</td>
                      <td className="py-3 px-4 font-mono">
                        {p.trackInventory ? 'Yes' : 'Digital'}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={currentQty}
                          onChange={(e) =>
                            setDraftStock({
                              ...draftStock,
                              [p.id]: Number(e.target.value),
                            })
                          }
                          className="w-24 min-h-[38px] px-2.5 py-1.5 rounded-lg font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={!dirty || savingId === p.id}
                          onClick={() => handleSaveRow(p)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#C6F432] text-[#050505] font-mono font-bold disabled:opacity-35 cursor-pointer"
                        >
                          {savingId === p.id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
