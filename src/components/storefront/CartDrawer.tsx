import React, { useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
  Truck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { openExternalUrl } from '../../hooks/usePortfolioHelpers';
import type { CurrencyCode } from '../../types/store';

interface CartDrawerProps {
  onNavigate: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    cart,
    cartCount,
    cartSubtotalPKR,
    isCartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    formatPrice,
    currency,
    setCurrency,
    settings,
  } = useStore();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mk-overlay-state', { detail: { cartOpen: isCartOpen } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent('mk-overlay-state', { detail: { cartOpen: false } })
      );
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen, setCartOpen]);

  if (!isCartOpen) return null;

  const pkZone = settings.shippingZones.find((z) => z.id === 'pakistan');
  const freeThreshold = pkZone?.freeOverAmount || 15000;
  const remainingForFree = Math.max(0, freeThreshold - cartSubtotalPKR);
  const freePct = Math.min(100, Math.round((cartSubtotalPKR / freeThreshold) * 100));

  const handleWhatsappOrder = () => {
    const phone = (settings.whatsappNumber || '923000000000').replace(/[^0-9]/g, '');
    const lines = cart.map(
      (item, idx) =>
        `${idx + 1}. ${item.title}${item.variantTitle ? ` (${item.variantTitle})` : ''} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`
    );
    const text = encodeURIComponent(
      `Hello ${settings.storeName},\nI'd like to place an order:\n\n${lines.join('\n')}\n\nSubtotal: ${formatPrice(cartSubtotalPKR)}`
    );
    openExternalUrl(`https://wa.me/${phone}?text=${text}`);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#111111]/45 backdrop-blur-xs"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md h-[100dvh] bg-white text-[#111111] border-l border-[#E7E3DA] flex flex-col shadow-2xl">
        {/* Top Bar */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#E7E3DA] flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} className="text-[#4C7A00]" />
            <h2 className="font-display text-2xl leading-none text-[#111111]">
              Your Bag
            </h2>
            <span className="font-mono text-xs text-[#5B5B56] tabular-nums">
              ({cartCount})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="min-h-[44px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs font-mono bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] cursor-pointer"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close bag"
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Free Shipping Bar */}
        {pkZone?.enabled && freeThreshold > 0 && cart.length > 0 && (
          <div className="px-5 py-3 bg-[#FAF8F4] border-b border-[#E7E3DA]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#5B5B56] mb-1.5">
              <Truck size={14} className="text-[#4C7A00] shrink-0" />
              {remainingForFree === 0 ? (
                <span className="text-[#4C7A00] font-semibold">
                  Unlocked free nationwide Pakistan shipping
                </span>
              ) : (
                <span>
                  Add <strong className="tabular-nums text-[#111111]">{formatPrice(remainingForFree)}</strong> more for free shipping
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#E7E3DA] overflow-hidden">
              <div
                className="h-full bg-[#6BAA00] transition-all duration-300"
                style={{ width: `${freePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-center text-[#5B5B56]">
                <ShoppingBag size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl text-[#111111]">Your bag is empty</p>
                <p className="text-xs text-[#5B5B56] max-w-xs">
                  Explore studio hardware objects, Figma systems, 3D shaders, and atelier apparel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  onNavigate('/shop');
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Browse Store
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.key}
                className="flex gap-3.5 pb-4 border-b border-[#E7E3DA]"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F4] shrink-0 border border-[#E7E3DA]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-[#111111]">
                        {item.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        aria-label={`Remove ${item.title}`}
                        className="text-[#5B5B56] hover:text-rose-700 w-11 h-11 -mr-2 -mt-2 inline-flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {item.variantTitle && (
                      <p className="text-xs font-mono text-[#5B5B56] mt-0.5 truncate">
                        {item.variantTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="inline-flex items-center rounded-lg border border-[#E7E3DA] bg-[#FAF8F4]">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-11 h-11 flex items-center justify-center text-[#111111] hover:bg-white rounded-l-lg transition-colors cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-2.5 text-xs font-mono tabular-nums text-[#111111]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-11 h-11 flex items-center justify-center text-[#111111] hover:bg-white rounded-r-lg transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="font-mono text-sm font-semibold tabular-nums text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals & Actions */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-[#E7E3DA] space-y-3 bg-[#FAF8F4]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B5B56]">
                Subtotal
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-[#111111]">
                {formatPrice(cartSubtotalPKR)}
              </span>
            </div>
            <p className="text-[11px] text-[#5B5B56]">
              Shipping rates, promo codes, and taxes calculated at checkout.
            </p>

            <div className="grid gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  onNavigate('/checkout');
                }}
                className="w-full min-h-[48px] py-3 px-4 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>

              {settings.enableWhatsappOrder && (
                <button
                  type="button"
                  onClick={handleWhatsappOrder}
                  className="w-full min-h-[48px] py-3 px-4 rounded-full border border-[#E7E3DA] bg-white text-[#111111] font-mono text-xs font-semibold flex items-center justify-center gap-2 hover:border-[#6BAA00] transition-colors cursor-pointer"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  <span>Order via WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
