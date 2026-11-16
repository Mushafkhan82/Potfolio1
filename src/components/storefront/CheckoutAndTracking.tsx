import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MessageCircle,
  Tag,
  Printer,
  Heart,
  ShoppingBag,
  Search,
  Lock,
} from 'lucide-react';
import { auth, signInWithGooglePopup } from '../../lib/firebase';
import {
  createStorefrontOrder,
  lookupOrderTracking,
  validateDiscountCode,
} from '../../lib/storeService';
import { useStore } from '../../context/StoreContext';
import { openExternalUrl } from '../../hooks/usePortfolioHelpers';
import type { Discount, Order } from '../../types/store';

// ======================= CHECKOUT PAGE =======================

export const CheckoutPage: React.FC<{ onNavigate: (p: string) => void }> = ({
  onNavigate,
}) => {
  const { cart, cartSubtotalPKR, formatPrice, currency, settings, clearCart } =
    useStore();

  const currentUser = auth.currentUser;
  const [customerName, setCustomerName] = useState(
    currentUser?.displayName || ''
  );
  const [customerEmail, setCustomerEmail] = useState(
    currentUser?.email || ''
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('Karachi');
  const [postalCode, setPostalCode] = useState('');
  const [zone, setZone] = useState<'pakistan' | 'international'>('pakistan');
  const [country, setCountry] = useState('Pakistan');
  const [customerNotes, setCustomerNotes] = useState('');

  const enabledPayments = settings.payments.filter((p) => p.enabled);
  const [paymentMethodId, setPaymentMethodId] = useState<string>(
    enabledPayments[0]?.id || 'cod'
  );

  const [promoInput, setPromoInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedZone =
    settings.shippingZones.find((z) => z.id === zone) ||
    settings.shippingZones[0];

  const baseShipping = selectedZone
    ? selectedZone.freeOverAmount > 0 &&
      cartSubtotalPKR >= selectedZone.freeOverAmount
      ? 0
      : selectedZone.flatRate
    : 0;

  let discountPKR = 0;
  let effectiveShipping = baseShipping;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountPKR = Math.round((cartSubtotalPKR * appliedDiscount.value) / 100);
    } else if (appliedDiscount.type === 'fixed') {
      discountPKR = Math.min(cartSubtotalPKR, appliedDiscount.value);
    } else if (appliedDiscount.type === 'free_shipping') {
      effectiveShipping = 0;
    }
  }

  const taxable = Math.max(0, cartSubtotalPKR - discountPKR);
  const taxPKR =
    settings.taxRatePercent > 0 && !settings.taxIncludedInPrice
      ? Math.round((taxable * settings.taxRatePercent) / 100)
      : 0;
  const totalPKR = taxable + effectiveShipping + taxPKR;

  const handleApplyPromo = async () => {
    setPromoMsg('');
    const res = await validateDiscountCode(promoInput, cartSubtotalPKR);
    if (!res.valid || !res.discount) {
      setAppliedDiscount(null);
      setPromoMsg(res.error || 'Invalid code');
      return;
    }
    setAppliedDiscount(res.discount);
    setPromoMsg(`Applied ${res.discount.code}`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const selectedPayObj = enabledPayments.find(
        (p) => p.id === paymentMethodId
      );
      const created = await createStorefrontOrder({
        customerUid: auth.currentUser?.uid || '',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: {
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: zone === 'pakistan' ? 'Pakistan' : country.trim(),
          zone,
        },
        items: cart.map((c) => ({
          productId: c.productId,
          variantId: c.variantId || '',
          title: c.title,
          variantTitle: c.variantTitle || '',
          sku: c.sku,
          image: c.image,
          price: c.price,
          quantity: c.quantity,
        })),
        subtotal: cartSubtotalPKR,
        discountCode: appliedDiscount?.code || '',
        discountAmount: discountPKR,
        shippingCost: effectiveShipping,
        taxAmount: taxPKR,
        total: totalPKR,
        currency,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: selectedPayObj?.name || 'Cash on Delivery',
        customerNotes: customerNotes.trim(),
      });

      sessionStorage.setItem(
        `mk_last_order_${created.orderNumber}`,
        JSON.stringify(created)
      );
      clearCart();
      onNavigate(`/order-confirmation/${created.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Could not place order. Please check details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activePaymentObj = enabledPayments.find((p) => p.id === paymentMethodId);

  if (cart.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#FAF8F4] text-[#111111] pt-32 pb-32 px-4 text-center space-y-4">
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <button
          type="button"
          onClick={() => onNavigate('/shop')}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-mono font-bold hover:bg-[#a9e600] cursor-pointer"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-28 pb-32 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-[#E7E3DA]">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#4C7A00] font-semibold">
              Checkout
            </span>
            <h1 className="font-display text-4xl sm:text-5xl mt-1 text-[#111111]">
              Complete Your Order
            </h1>
          </div>

          {!currentUser ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await signInWithGooglePopup();
                  if (res?.user.email) setCustomerEmail(res.user.email);
                  if (res?.user.displayName) setCustomerName(res.user.displayName);
                } catch {}
              }}
              className="min-h-[44px] px-4 py-2 rounded-full bg-white border border-[#E7E3DA] text-[#111111] text-xs font-mono font-semibold hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              Sign in with Google for faster checkout
            </button>
          ) : (
            <div className="text-xs font-mono text-[#5B5B56]">
              Signed in as <strong className="text-[#111111]">{currentUser.email}</strong>
            </div>
          )}
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
        >
          {/* Left Shipping & Payment Form */}
          <div className="lg:col-span-7 space-y-8">
            <div className="rounded-2xl bg-white border border-[#E7E3DA] shadow-xs p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-2xl text-[#111111]">1. Contact & Delivery</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">Full Name *</span>
                  <input
                    required
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">Email *</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">
                    Phone / WhatsApp *
                  </span>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">Shipping Region</span>
                  <select
                    value={zone}
                    onChange={(e) => {
                      const next = e.target.value as 'pakistan' | 'international';
                      setZone(next);
                      if (next === 'pakistan') setCountry('Pakistan');
                      else if (country === 'Pakistan') setCountry('United Arab Emirates');
                    }}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  >
                    <option value="pakistan">Pakistan Nationwide</option>
                    <option value="international">International Express</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-xs font-mono">
                <span className="text-[#5B5B56]">Street Address *</span>
                <input
                  required
                  autoComplete="street-address"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House / Office, Street, Sector/Block"
                  className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                />
              </label>

              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">City *</span>
                  <input
                    required
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">Country *</span>
                  <input
                    required
                    disabled={zone === 'pakistan'}
                    value={zone === 'pakistan' ? 'Pakistan' : country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white disabled:opacity-60"
                  />
                </label>
                <label className="block space-y-1 text-xs font-mono">
                  <span className="text-[#5B5B56]">Postal Code</span>
                  <input
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl bg-white border border-[#E7E3DA] shadow-xs p-6 space-y-4">
              <h2 className="font-display text-2xl text-[#111111]">2. Payment Method</h2>
              <div className="grid gap-3">
                {enabledPayments.map((method) => {
                  const selected = paymentMethodId === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#6BAA00] bg-[#B6F500]/20'
                          : 'border-[#E7E3DA] bg-[#FAF8F4] hover:border-[#6BAA00]/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={selected}
                        onChange={() => setPaymentMethodId(method.id)}
                        className="mt-1 accent-[#6BAA00]"
                      />
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold text-[#111111]">{method.name}</div>
                        <p className="text-xs text-[#5B5B56]">
                          {method.instructions}
                        </p>
                        {selected && method.accountNumber && (
                          <div className="pt-1 font-mono text-xs font-semibold text-[#4C7A00]">
                            {method.accountTitle ? `${method.accountTitle} · ` : ''}
                            {method.accountNumber}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <label className="block space-y-1 text-xs font-mono pt-2">
                <span className="text-[#5B5B56]">
                  Delivery Notes (Optional)
                </span>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any preferred delivery window or sizing instructions..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                />
              </label>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E7E3DA] shadow-xs p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl text-[#111111]">Order Summary</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E7E3DA] bg-[#FAF8F4]"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-[#111111]">{item.title}</p>
                      <p className="text-xs font-mono text-[#5B5B56]">
                        {item.variantTitle || 'Standard'} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums shrink-0 text-[#111111]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div className="pt-3 border-t border-[#E7E3DA] space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B5B56]"
                  />
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. STUDIO10)"
                    className="w-full min-h-[44px] pl-8 pr-3 py-2 rounded-xl text-base sm:text-xs font-mono uppercase bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-[#111111] text-xs font-mono font-semibold hover:border-[#6BAA00] transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className="text-xs font-mono text-[#4C7A00] font-semibold">
                  {promoMsg}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#E7E3DA] text-sm">
              <div className="flex justify-between">
                <span className="text-[#5B5B56]">Subtotal</span>
                <span className="font-mono tabular-nums text-[#111111]">{formatPrice(cartSubtotalPKR)}</span>
              </div>
              {discountPKR > 0 && (
                <div className="flex justify-between text-[#4C7A00] font-semibold">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span className="font-mono tabular-nums">-{formatPrice(discountPKR)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#5B5B56]">
                  Shipping ({selectedZone?.name})
                </span>
                <span className="font-mono tabular-nums text-[#111111]">
                  {effectiveShipping === 0 ? 'Free' : formatPrice(effectiveShipping)}
                </span>
              </div>
              {taxPKR > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5B5B56]">
                    Tax ({settings.taxRatePercent}%)
                  </span>
                  <span className="font-mono tabular-nums text-[#111111]">{formatPrice(taxPKR)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-[#E7E3DA] text-lg font-bold">
                <span className="text-[#111111]">Total</span>
                <span className="font-mono tabular-nums text-[#4C7A00]">
                  {formatPrice(totalPKR)}
                </span>
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-mono text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Lock size={14} />
              <span>
                {submitting
                  ? 'Placing Order...'
                  : `Place Order · ${activePaymentObj?.id === 'cod' ? 'COD' : formatPrice(totalPKR)}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================= ORDER CONFIRMATION PAGE =======================

export const OrderConfirmationPage: React.FC<{
  orderNumber: string;
  onNavigate: (p: string) => void;
}> = ({ orderNumber, onNavigate }) => {
  const { formatPrice, settings } = useStore();
  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const raw = sessionStorage.getItem(`mk_last_order_${orderNumber}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!order && orderNumber) {
      lookupOrderTracking(orderNumber).then((t) => {
        if (t) {
          setOrder({
            id: t.orderNumber,
            orderNumber: t.orderNumber,
            customerName: 'Valued Customer',
            customerEmail: '',
            customerPhone: '',
            shippingAddress: {
              fullName: 'Valued Customer',
              phone: '',
              email: '',
              addressLine1: '',
              city: '',
              country: '',
              zone: 'pakistan',
            },
            items: [],
            subtotal: t.total,
            discountAmount: 0,
            shippingCost: 0,
            taxAmount: 0,
            total: t.total,
            currency: (t.currency as any) || 'PKR',
            status: t.status,
            paymentStatus: (t.paymentStatus as any) || 'pending',
            paymentMethod: 'Recorded Order',
            trackingNumber: t.trackingNumber,
            createdAt: t.updatedAt,
            updatedAt: t.updatedAt,
          });
        }
      });
    }
  }, [order, orderNumber]);

  return (
    <div className="w-full min-h-screen bg-[#FAF8F4] text-[#111111] pt-32 pb-32 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl bg-white border border-[#E7E3DA] shadow-xs p-7 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-[#4C7A00]">
            <CheckCircle2 size={32} />
            <div>
              <p className="text-xs font-mono uppercase tracking-widest font-semibold">
                Order Confirmed
              </p>
              <h1 className="font-display text-3xl sm:text-4xl text-[#111111]">
                #{orderNumber} Confirmed — Preparing Dispatch
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#5B5B56]">
            Thank you for your order with {settings.storeName}. Save your Order Number{' '}
            <strong className="font-mono text-[#111111]">
              {orderNumber}
            </strong>{' '}
            to track delivery updates anytime.
          </p>

          {order && order.items.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#E7E3DA]">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-[#111111]">
                  <span>
                    {item.title} {item.variantTitle ? `(${item.variantTitle})` : ''} ×{' '}
                    {item.quantity}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t border-[#E7E3DA] font-bold">
                <span className="text-[#111111]">Total ({order.paymentMethod})</span>
                <span className="font-mono tabular-nums text-[#4C7A00]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] text-xs font-mono font-semibold flex items-center gap-2 hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/track-order')}
              className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] text-xs font-mono font-semibold flex items-center gap-2 hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              <Truck size={14} />
              <span>Track Order</span>
            </button>

            {settings.enableWhatsappOrder && (
              <button
                type="button"
                onClick={() => {
                  const phone = (settings.whatsappNumber || '923000000000').replace(
                    /[^0-9]/g,
                    ''
                  );
                  openExternalUrl(
                    `https://wa.me/${phone}?text=${encodeURIComponent(`Hi, checking on my order ${orderNumber}.`)}`
                  );
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Message on WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================= ORDER TRACKING PAGE =======================

export const OrderTrackingPage: React.FC<{ onNavigate: (p: string) => void }> = () => {
  const { formatPrice } = useStore();
  const [orderInput, setOrderInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof lookupOrderTracking>
  > | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    const data = await lookupOrderTracking(orderInput.trim());
    setResult(data);
    if (!data) setNotFound(true);
    setLoading(false);
  };

  const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#4C7A00] font-semibold">
            Dispatch Tracker
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-[#111111]">Track Your Order</h1>
          <p className="text-sm text-[#5B5B56]">
            Enter your order reference (for example, <span className="font-mono text-[#111111]">MK-2611-4821</span>).
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B5B56]"
            />
            <input
              required
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              placeholder="Order Number (MK-...)"
              className="w-full min-h-[44px] pl-10 pr-4 py-3 rounded-full bg-white border border-[#E7E3DA] text-[#111111] font-mono text-base sm:text-sm uppercase focus:outline-none focus:border-[#6BAA00]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            {loading ? 'Checking...' : 'Track'}
          </button>
        </form>

        {notFound && (
          <div className="rounded-2xl bg-white border border-[#E7E3DA] shadow-xs p-6 text-center text-sm text-[#5B5B56]">
            No order found matching that reference number.
          </div>
        )}

        {result && (
          <div className="rounded-2xl bg-white border border-[#E7E3DA] shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-[#5B5B56]">
                  Order Reference
                </div>
                <div className="font-mono text-xl font-bold text-[#111111]">{result.orderNumber}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-[#5B5B56]">
                  {result.itemCount} items
                </div>
                <div className="font-mono text-lg font-bold text-[#4C7A00] tabular-nums">
                  {formatPrice(result.total)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {STEPS.map((st, idx) => {
                const activeIdx = STEPS.indexOf(result.status);
                const done = activeIdx >= idx;
                return (
                  <div key={st} className="space-y-1.5 text-center">
                    <div
                      className={`h-2 rounded-full ${
                        done ? 'bg-[#6BAA00]' : 'bg-[#E7E3DA]'
                      }`}
                    />
                    <div className="font-mono text-[10px] uppercase text-[#5B5B56]">{st}</div>
                  </div>
                );
              })}
            </div>

            {result.trackingNumber && (
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between text-xs font-mono text-[#111111]">
                <span className="flex items-center gap-2">
                  <Package size={14} className="text-[#4C7A00]" />
                  Courier Tracking ({result.courierName || 'Dispatch'})
                </span>
                <span className="font-bold">{result.trackingNumber}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ======================= WISHLIST PAGE =======================

export const WishlistPage: React.FC<{ onNavigate: (p: string) => void }> = ({
  onNavigate,
}) => {
  const { products, wishlist, toggleWishlist, formatPrice, addToCart } =
    useStore();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl mb-8 text-[#111111]">Saved Wishlist</h1>
        {saved.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[#E7E3DA] space-y-4">
            <Heart size={28} className="mx-auto text-[#5B5B56]" />
            <p className="text-sm text-[#5B5B56]">
              No saved items yet.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/shop')}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-mono font-bold hover:bg-[#a9e600] cursor-pointer"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {saved.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white border border-[#E7E3DA] shadow-xs overflow-hidden flex flex-col justify-between">
                <div
                  onClick={() => onNavigate(`/product/${p.handle}`)}
                  className="cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-[#FAF8F4] border-b border-[#E7E3DA] overflow-hidden">
                    {p.media[0]?.url && (
                      <img
                        src={p.media[0].url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-display text-xl text-[#111111]">{p.title}</h3>
                    <p className="font-mono text-sm font-bold text-[#4C7A00] tabular-nums">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        productId: p.id,
                        variantId: p.variants[0]?.id,
                        title: p.title,
                        variantTitle: p.variants[0]?.title,
                        sku: p.sku,
                        image: p.media[0]?.url || '',
                        price: p.price,
                        quantity: 1,
                      })
                    }
                    className="flex-1 min-h-[44px] py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag size={13} />
                    <span>Move to Bag</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(p.id)}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] text-xs font-mono hover:border-rose-300 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
