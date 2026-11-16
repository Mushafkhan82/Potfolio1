import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  AlertTriangle,
  Plus,
  Sparkles,
  Paintbrush,
  Database,
} from 'lucide-react';
import { formatMoney } from '../../lib/currency';
import type { CurrencyCode, Order, Product } from '../../types/store';

interface AdminHomeDashboardProps {
  orders: Order[];
  products: Product[];
  inquiries: any[];
  currency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  onNavigateTab: (tab: string) => void;
  onSeedSampleData: () => Promise<void>;
  seeding: boolean;
}

export const AdminHomeDashboard: React.FC<AdminHomeDashboardProps> = ({
  orders,
  products,
  inquiries,
  currency,
  exchangeRates,
  onNavigateTab,
  onSeedSampleData,
  seeding,
}) => {
  const [chartDays, setChartDays] = useState<7 | 30>(7);

  const fmt = (pkr: number) => formatMoney(pkr, currency, exchangeRates);

  const metrics = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayKey));
    const todaySales = todayOrders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((s, o) => s + (o.total || 0), 0);

    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((s, o) => s + (o.total || 0), 0);

    const unreadInquiries = inquiries.filter((i) =>
      i.source === 'quote_requests' ? i.status === 'submitted' : !i.handled
    ).length;

    const lowStockProducts = products.filter(
      (p) => p.trackInventory && p.stockQuantity <= 5
    );

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      totalRevenue,
      totalOrders: orders.length,
      unreadInquiries,
      lowStockProducts,
    };
  }, [orders, inquiries, products]);

  // Build daily revenue series for 7 or 30 days
  const chartSeries = useMemo(() => {
    const days: { date: string; label: string; revenue: number; count: number }[] =
      [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter(
        (o) =>
          o.createdAt.startsWith(iso) &&
          o.status !== 'cancelled' &&
          o.status !== 'refunded'
      );
      days.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        count: dayOrders.length,
      });
    }
    return days;
  }, [orders, chartDays]);

  const maxRev = Math.max(1, ...chartSeries.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Store Overview</h1>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mt-1">
            Live commerce telemetry, studio inquiries & inventory health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSeedSampleData}
            disabled={seeding}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono hover:border-[#C6F432] flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
          >
            <Database size={13} />
            <span>{seeding ? 'Seeding...' : 'Seed Sample'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('customize')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[color:var(--border-subtle)] text-xs font-mono hover:border-[#C6F432] flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
          >
            <Paintbrush size={13} />
            <span>Customize</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[color:var(--text-muted)]">
            <span>Today&apos;s Sales</span>
            <TrendingUp size={15} className="text-[color:var(--accent-text)]" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {fmt(metrics.todaySales)}
          </div>
          <p className="text-[11px] font-mono text-[color:var(--text-muted)] tabular-nums">
            Lifetime: {fmt(metrics.totalRevenue)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('orders')}
          className="rounded-2xl glass-card p-5 space-y-2 text-left hover:border-[#C6F432] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[color:var(--text-muted)]">
            <span>Orders</span>
            <ShoppingBag size={15} className="text-[color:var(--accent-text)]" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {metrics.totalOrders}
          </div>
          <p className="text-[11px] font-mono text-[color:var(--text-muted)] tabular-nums">
            {metrics.todayOrdersCount} placed today
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('portfolio')}
          className="rounded-2xl glass-card p-5 space-y-2 text-left hover:border-[#C6F432] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[color:var(--text-muted)]">
            <span>New Inquiries</span>
            <MessageSquare size={15} className="text-[color:var(--accent-text)]" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {metrics.unreadInquiries}
          </div>
          <p className="text-[11px] font-mono text-[color:var(--text-muted)] tabular-nums">
            {inquiries.length} total client leads
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('inventory')}
          className="rounded-2xl glass-card p-5 space-y-2 text-left hover:border-[#C6F432] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[color:var(--text-muted)]">
            <span>Low-Stock Alerts</span>
            <AlertTriangle
              size={15}
              className={
                metrics.lowStockProducts.length > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {metrics.lowStockProducts.length}
          </div>
          <p className="text-[11px] font-mono text-[color:var(--text-muted)] tabular-nums">
            {products.length} catalog products active
          </p>
        </button>
      </div>

      {/* Revenue Chart (7 / 30 days) */}
      <div className="rounded-2xl glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Sales & Order Volume</h2>
            <p className="text-xs font-mono text-[color:var(--text-muted)]">
              Daily store turnover in {currency}
            </p>
          </div>
          <div className="inline-flex rounded-xl p-1 bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setChartDays(7)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg cursor-pointer ${
                chartDays === 7
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setChartDays(30)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg cursor-pointer ${
                chartDays === 30
                  ? 'bg-[#C6F432] text-[#050505] font-bold'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="h-48 flex items-end gap-1.5 pt-4">
          {chartSeries.map((pt) => {
            const hPct = Math.max(4, Math.round((pt.revenue / maxRev) * 100));
            return (
              <div
                key={pt.date}
                title={`${pt.label}: ${fmt(pt.revenue)} (${pt.count} orders)`}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full group"
              >
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      pt.revenue > 0
                        ? 'bg-[#C6F432] group-hover:opacity-80'
                        : 'bg-black/10 dark:bg-white/[0.07]'
                    }`}
                    style={{ height: `${hPct}%` }}
                  />
                </div>
                {(chartDays === 7 || chartSeries.indexOf(pt) % 5 === 0) && (
                  <span className="text-[9px] font-mono text-[color:var(--text-muted)] truncate max-w-full">
                    {pt.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Two Columns: Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent Orders</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="min-h-[44px] px-2 text-xs font-mono text-[color:var(--accent-text)] hover:underline cursor-pointer inline-flex items-center"
            >
              View all →
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[color:var(--text-muted)]">
              No storefront orders yet. Orders placed via /checkout appear here immediately.
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onNavigateTab('orders')}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-[color:var(--border-subtle)] cursor-pointer hover:border-[#C6F432]"
                >
                  <div>
                    <div className="font-mono text-xs font-bold">
                      #{ord.orderNumber} · {ord.customerName}
                    </div>
                    <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                      {ord.status.toUpperCase()} · {ord.paymentMethod}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold tabular-nums text-[color:var(--accent-text)]">
                    {fmt(ord.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Low-Stock Monitor</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="min-h-[44px] px-2 text-xs font-mono text-[color:var(--accent-text)] hover:underline cursor-pointer inline-flex items-center"
            >
              Adjust stock →
            </button>
          </div>
          {metrics.lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[color:var(--text-muted)] flex flex-col items-center gap-2">
              <Sparkles size={18} className="text-[color:var(--accent-text)]" />
              <span>All tracked SKUs have healthy stock levels.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigateTab('inventory')}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="text-[11px] font-mono text-[color:var(--text-muted)]">
                      SKU: {p.sku}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                    {p.stockQuantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
