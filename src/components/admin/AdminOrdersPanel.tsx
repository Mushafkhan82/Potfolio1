import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Printer,
  ArrowLeft,
  Save,
  Package,
} from 'lucide-react';
import { updateOrderAdmin } from '../../lib/storeService';
import { formatMoney } from '../../lib/currency';
import { downloadCsv } from './AdminShared';
import type {
  CurrencyCode,
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../types/store';

interface AdminOrdersPanelProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
  currency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  storeName: string;
  onToast: (msg: string) => void;
}

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({
  orders,
  onRefresh,
  currency,
  exchangeRates,
  storeName,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [editStatus, setEditStatus] = useState<OrderStatus>('pending');
  const [editPaymentStatus, setEditPaymentStatus] =
    useState<PaymentStatus>('pending');
  const [editTracking, setEditTracking] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fmt = (pkr: number) => formatMoney(pkr, currency, exchangeRates);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter)
        return false;
      if (dateFilter && !o.createdAt.startsWith(dateFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, dateFilter, search]);

  const openDetail = (o: Order) => {
    setSelectedOrder(o);
    setEditStatus(o.status);
    setEditPaymentStatus(o.paymentStatus);
    setEditTracking(o.trackingNumber || '');
    setEditCourier(o.courierName || '');
    setEditNotes(o.internalNotes || '');
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateOrderAdmin(selectedOrder.id, {
        status: editStatus,
        paymentStatus: editPaymentStatus,
        trackingNumber: editTracking.trim(),
        courierName: editCourier.trim(),
        internalNotes: editNotes,
      });
      await onRefresh();
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: editStatus,
              paymentStatus: editPaymentStatus,
              trackingNumber: editTracking.trim(),
              courierName: editCourier.trim(),
              internalNotes: editNotes,
            }
          : null
      );
      onToast(`Order #${selectedOrder.orderNumber} updated`);
    } catch (err: any) {
      onToast(err?.message || 'Could not update order');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'OrderNumber',
        'Date',
        'Customer',
        'Email',
        'Phone',
        'City',
        'Country',
        'Status',
        'PaymentStatus',
        'PaymentMethod',
        'SubtotalPKR',
        'ShippingPKR',
        'DiscountPKR',
        'TotalPKR',
        'TrackingNumber',
      ],
      filtered.map((o) => [
        o.orderNumber,
        o.createdAt,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.shippingAddress?.city,
        o.shippingAddress?.country,
        o.status,
        o.paymentStatus,
        o.paymentMethod,
        o.subtotal,
        o.shippingCost,
        o.discountAmount,
        o.total,
        o.trackingNumber || '',
      ])
    );
    onToast('Exported orders CSV');
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="min-h-[44px] px-2 inline-flex items-center gap-2 text-xs font-mono hover:text-[color:var(--accent-text)] cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 hover:border-[#C6F432] cursor-pointer flex-1 sm:flex-initial"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveOrder}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Order'}</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice + Admin Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Invoice / Packing Slip View */}
          <div className="lg:col-span-7 rounded-2xl glass-card p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-[color:var(--border-subtle)] pb-4">
              <div>
                <div className="font-mono text-xs uppercase text-[color:var(--accent-text)]">
                  {storeName} · Packing Slip &amp; Invoice
                </div>
                <h2 className="font-display text-3xl mt-1">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <p className="text-xs font-mono text-[color:var(--text-muted)]">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold uppercase">{editStatus}</div>
                <div className="text-[color:var(--text-muted)]">
                  Payment: {editPaymentStatus}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-mono uppercase text-[color:var(--text-muted)]">
                  Customer
                </div>
                <div className="font-semibold text-sm">
                  {selectedOrder.customerName}
                </div>
                <div>{selectedOrder.customerEmail}</div>
                <div>{selectedOrder.customerPhone}</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono uppercase text-[color:var(--text-muted)]">
                  Shipping Address
                </div>
                <div>{selectedOrder.shippingAddress?.addressLine1}</div>
                <div>
                  {selectedOrder.shippingAddress?.city},{' '}
                  {selectedOrder.shippingAddress?.postalCode}{' '}
                  {selectedOrder.shippingAddress?.country}
                </div>
                <div className="font-mono text-[color:var(--accent-text)]">
                  {selectedOrder.paymentMethod}
                </div>
              </div>
            </div>

            <div className="border-t border-[color:var(--border-subtle)] pt-4 space-y-3">
              <div className="font-mono text-xs uppercase text-[color:var(--text-muted)]">
                Items ({selectedOrder.items.length})
              </div>
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 py-2 border-b border-[color:var(--border-subtle)] last:border-none text-sm"
                >
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs font-mono text-[color:var(--text-muted)]">
                      {item.variantTitle || 'Standard'} · SKU {item.sku || 'N/A'} · Qty{' '}
                      {item.quantity}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold tabular-nums">
                    {fmt(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[color:var(--border-subtle)] pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--text-secondary)]">Subtotal</span>
                <span className="font-mono tabular-nums">
                  {fmt(selectedOrder.subtotal)}
                </span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[color:var(--accent-text)]">
                  <span>Discount ({selectedOrder.discountCode})</span>
                  <span className="font-mono tabular-nums">
                    -{fmt(selectedOrder.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[color:var(--text-secondary)]">Shipping</span>
                <span className="font-mono tabular-nums">
                  {selectedOrder.shippingCost === 0
                    ? 'Free'
                    : fmt(selectedOrder.shippingCost)}
                </span>
              </div>
              {selectedOrder.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[color:var(--text-secondary)]">Tax</span>
                  <span className="font-mono tabular-nums">
                    {fmt(selectedOrder.taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[color:var(--border-subtle)] text-base font-bold">
                <span>Total</span>
                <span className="font-mono tabular-nums text-[color:var(--accent-text)]">
                  {fmt(selectedOrder.total)}
                </span>
              </div>
            </div>

            {selectedOrder.customerNotes && (
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.04] text-xs">
                <span className="font-mono uppercase text-[color:var(--text-muted)] block mb-1">
                  Customer Note:
                </span>
                {selectedOrder.customerNotes}
              </div>
            )}
          </div>

          {/* Right Fulfillment Controls */}
          <div className="lg:col-span-5 rounded-2xl glass-card p-5 sm:p-6 space-y-4 print:hidden">
            <h3 className="font-display text-2xl">Fulfillment &amp; Notes</h3>

            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">Order Status</span>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">Payment Status</span>
              <select
                value={editPaymentStatus}
                onChange={(e) =>
                  setEditPaymentStatus(e.target.value as PaymentStatus)
                }
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">Courier Name</span>
              <input
                value={editCourier}
                onChange={(e) => setEditCourier(e.target.value)}
                placeholder="e.g. TCS, Leopards, DHL"
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>

            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">
                Tracking Number
              </span>
              <input
                value={editTracking}
                onChange={(e) => setEditTracking(e.target.value)}
                placeholder="Courier consignment number"
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>

            <label className="block space-y-1 text-xs font-mono">
              <span className="text-[color:var(--text-muted)]">
                Internal Staff Notes (Private)
              </span>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Payment verification reference or packing notes..."
                className="w-full px-3 py-2.5 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Orders</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            {filtered.length} matching orders
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono font-semibold flex items-center gap-1.5 hover:border-[#C6F432] cursor-pointer"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="relative sm:col-span-2 lg:flex-1 lg:min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone, email..."
            className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl text-base sm:text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
          />
        </div>

        <select
          aria-label="Filter order status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full lg:w-auto min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          aria-label="Filter payment status"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full lg:w-auto min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        >
          <option value="all">All Payments</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="date"
          aria-label="Filter by date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full lg:w-auto min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        />
      </div>

      {/* Orders List / Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] space-y-2">
          <Package size={28} className="mx-auto text-[color:var(--text-muted)]" />
          <p className="text-sm font-medium">No orders found</p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Orders placed at /checkout appear here in real time.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Order Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => openDetail(ord)}
                className="w-full text-left rounded-2xl glass-card p-4 space-y-2.5 cursor-pointer hover:border-[#C6F432] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">
                    #{ord.orderNumber}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--accent-text)]">
                    {fmt(ord.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium truncate">
                    {ord.customerName}
                    {ord.shippingAddress?.city ? ` · ${ord.shippingAddress.city}` : ''}
                  </span>
                  <span className="font-mono text-[11px] text-[color:var(--text-muted)] shrink-0">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase">
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      ord.paymentStatus === 'paid'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {ord.paymentStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                    {ord.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl glass-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[color:var(--border-subtle)] font-mono uppercase text-[color:var(--text-muted)]">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border-subtle)]">
                {filtered.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => openDetail(ord)}
                    className="hover:bg-black/5 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[color:var(--text-muted)]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{ord.customerName}</div>
                      <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                        {ord.shippingAddress?.city}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase">
                      <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {fmt(ord.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
