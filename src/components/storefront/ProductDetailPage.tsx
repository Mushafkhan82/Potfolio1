import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  MessageCircle,
  Check,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { openExternalUrl } from '../../hooks/usePortfolioHelpers';
import type { ProductVariant } from '../../types/store';

interface ProductDetailPageProps {
  handle: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  handle,
  onNavigate,
}) => {
  const {
    products,
    formatPrice,
    currency,
    settings,
    addToCart,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.handle === handle || p.id === handle),
    [products, handle]
  );

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!product) return;
    const defaults: Record<string, string> = {};
    product.optionDefinitions.forEach((opt) => {
      if (opt.values[0]) defaults[opt.name] = opt.values[0];
    });
    setSelectedOptions(defaults);
    setActiveMediaIndex(0);
    setQuantity(1);
    setLightboxOpen(false);
  }, [product]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  const activeVariant: ProductVariant | undefined = useMemo(() => {
    if (!product || product.variants.length === 0) return undefined;
    return (
      product.variants.find((v) =>
        Object.entries(selectedOptions).every(
          ([k, val]) => v.options[k] === val
        )
      ) || product.variants[0]
    );
  }, [product, selectedOptions]);

  // Inject SEO Title, Meta Description, & Product Schema.org JSON-LD
  useEffect(() => {
    if (!product) return;
    document.title = product.seoTitle || `${product.title} | ${settings.storeName}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && product.metaDescription) {
      metaDesc.setAttribute('content', product.metaDescription);
    }

    const scriptId = 'store-product-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    const priceVal = activeVariant ? activeVariant.price : product.price;
    const stockAvailable =
      !product.trackInventory ||
      (activeVariant ? activeVariant.stockQuantity : product.stockQuantity) > 0;

    scriptEl.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.metaDescription || product.title,
      sku: activeVariant?.sku || product.sku,
      image: product.media.map((m) => m.url),
      brand: { '@type': 'Brand', name: settings.storeName },
      offers: {
        '@type': 'Offer',
        priceCurrency: currency,
        price: priceVal,
        availability: stockAvailable
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: window.location.href,
      },
    });

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [product, activeVariant, currency, settings.storeName]);

  if (!product) {
    return (
      <div className="w-full min-h-screen bg-[#FAF8F4] text-[#111111] pt-32 pb-32 px-4 text-center space-y-4">
        <h1 className="font-display text-4xl">Product not found</h1>
        <button
          type="button"
          onClick={() => onNavigate('/shop')}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-mono font-bold hover:bg-[#a9e600] cursor-pointer"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const unitPrice = activeVariant ? activeVariant.price : product.price;
  const stockCount = activeVariant
    ? activeVariant.stockQuantity
    : product.stockQuantity;
  const outOfStock = product.trackInventory && stockCount <= 0;
  const currentMedia =
    product.media[activeMediaIndex] || product.media[0];
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      variantId: activeVariant?.id,
      title: product.title,
      variantTitle: activeVariant?.title,
      sku: activeVariant?.sku || product.sku,
      image: activeVariant?.image || currentMedia?.url || '',
      price: unitPrice,
      quantity,
      maxStock: stockCount,
      trackInventory: product.trackInventory,
    });
  };

  const handleWhatsappQuickBuy = () => {
    const phone = (settings.whatsappNumber || '923000000000').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${settings.storeName},\nI'd like to order:\nProduct: ${product.title}\nOption: ${activeVariant?.title || 'Standard'}\nQty: ${quantity}\nTotal: ${formatPrice(unitPrice * quantity)}`
    );
    openExternalUrl(`https://wa.me/${phone}?text=${msg}`);
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-28 pb-36 md:pb-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={() => onNavigate('/shop')}
          className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-xs font-mono text-[#5B5B56] hover:text-[#111111] mb-6 sm:mb-8 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>All Store Products</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Sticky Gallery with Touch Swipe & Lightbox */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:sticky lg:top-24">
            <div
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null || product.media.length <= 1) return;
                const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
                const diff = touchStartX.current - endX;
                if (Math.abs(diff) > 40) {
                  setActiveMediaIndex((prev) =>
                    diff > 0
                      ? (prev + 1) % product.media.length
                      : (prev - 1 + product.media.length) % product.media.length
                  );
                }
                touchStartX.current = null;
              }}
              className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-[#E7E3DA] shadow-xs group"
            >
              {currentMedia?.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  poster={product.media.find((m) => m.type === 'image')?.url}
                  preload="none"
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : currentMedia?.url ? (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.alt || product.title}
                  width={960}
                  height={720}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              ) : null}

              {currentMedia?.type !== 'video' && currentMedia?.url && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Enlarge product image"
                  className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] text-[#111111] shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                >
                  <Maximize2 size={16} />
                </button>
              )}

              {product.media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMediaIndex((prev) =>
                        (prev - 1 + product.media.length) % product.media.length
                      )
                    }
                    aria-label="Previous image"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] text-[#111111] shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMediaIndex((prev) => (prev + 1) % product.media.length)
                    }
                    aria-label="Next image"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] text-[#111111] shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {product.media.length > 1 && (
              <div className="flex sm:grid sm:grid-cols-5 gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
                {product.media.map((m, idx) => (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`w-20 sm:w-auto shrink-0 aspect-[4/3] rounded-xl overflow-hidden border bg-white transition-all cursor-pointer ${
                      activeMediaIndex === idx
                        ? 'border-[#6BAA00] ring-2 ring-[#6BAA00]/30'
                        : 'border-[#E7E3DA] opacity-75 hover:opacity-100'
                    }`}
                  >
                    {m.type === 'video' ? (
                      <div className="w-full h-full bg-[#FAF8F4] text-[#5B5B56] flex items-center justify-center text-[10px] font-mono font-semibold">
                        VIDEO
                      </div>
                    ) : (
                      <img
                        src={m.url}
                        alt={m.alt}
                        width={240}
                        height={180}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Purchase Module */}
          <div className="lg:col-span-5 space-y-6 bg-white rounded-3xl border border-[#E7E3DA] p-6 sm:p-8 shadow-xs">
            <div className="space-y-2 border-b border-[#E7E3DA] pb-5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#5B5B56]">
                <span className="uppercase tracking-wider">{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>SKU {activeVariant?.sku || product.sku}</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl leading-[1.06] text-[#111111]">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-mono text-2xl font-bold tabular-nums text-[#4C7A00]">
                  {formatPrice(unitPrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                  <span className="font-mono text-sm line-through text-[#5B5B56] tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                <span className="ml-auto text-xs font-mono text-[#5B5B56]">
                  {outOfStock
                    ? 'Out of stock'
                    : product.trackInventory
                      ? `${stockCount} in stock`
                      : 'Instant / Ready'}
                </span>
              </div>
            </div>

            {/* Variants Selector */}
            {product.optionDefinitions.length > 0 && (
              <div className="space-y-4">
                {product.optionDefinitions.map((opt) => (
                  <div key={opt.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#5B5B56]">
                        {opt.name}
                      </span>
                      <span className="font-semibold text-[#111111]">
                        {selectedOptions[opt.name]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => {
                        const active = selectedOptions[opt.name] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [opt.name]: val,
                              }))
                            }
                            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#B6F500] text-[#111111] border-[#96CF00] font-bold'
                                : 'bg-[#FAF8F4] text-[#111111] border-[#E7E3DA] hover:border-[#6BAA00]'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + Primary Buy Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-[#E7E3DA] bg-[#FAF8F4] px-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 flex items-center justify-center text-[#111111] cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 font-mono text-sm tabular-nums text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="w-11 h-11 flex items-center justify-center text-[#111111] cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-45 transition-colors cursor-pointer"
                >
                  <ShoppingBag size={15} />
                  <span>{outOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Save to wishlist"
                  className="w-12 h-12 rounded-full border border-[#E7E3DA] bg-[#FAF8F4] text-[#111111] flex items-center justify-center hover:border-[#6BAA00] transition-colors cursor-pointer shrink-0"
                >
                  <Heart
                    size={17}
                    className={wishlisted ? 'fill-[#6BAA00] text-[#6BAA00]' : ''}
                  />
                </button>
              </div>

              {settings.enableWhatsappOrder && (
                <button
                  type="button"
                  onClick={handleWhatsappQuickBuy}
                  className="w-full min-h-[44px] py-3 px-5 rounded-full border border-[#E7E3DA] bg-[#FAF8F4] text-[#111111] text-xs font-mono font-semibold flex items-center justify-center gap-2 hover:border-[#6BAA00] transition-colors cursor-pointer"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  <span>Order via WhatsApp</span>
                </button>
              )}
            </div>

            {/* Rich Text Description */}
            <div
              className="prose prose-sm max-w-none pt-4 border-t border-[#E7E3DA] text-[#5B5B56] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            {/* Delivery & Payment Guarantees */}
            <div className="pt-4 border-t border-[#E7E3DA] space-y-2.5 text-xs text-[#5B5B56]">
              <div className="flex items-center gap-2.5">
                <Truck size={15} className="text-[#4C7A00] shrink-0" />
                <span>
                  Pakistan Cash on Delivery & international DHL courier options
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  size={15}
                  className="text-[#4C7A00] shrink-0"
                />
                <span>JazzCash, Easypaisa, Bank Transfer & COD supported</span>
              </div>
              {product.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#5B5B56]">
                  <Check size={12} className="text-[#4C7A00]" />
                  <span>{product.tags.join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Add to Bag Bar */}
      <div className="md:hidden fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 px-4 py-2.5 bg-white/95 backdrop-blur-xl border-t border-[#E7E3DA] flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate text-[#111111]">{product.title}</div>
          <div className="font-mono text-sm font-bold text-[#4C7A00] tabular-nums">
            {formatPrice(unitPrice)}
          </div>
        </div>
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAddToCart}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-45 shrink-0 cursor-pointer"
        >
          <ShoppingBag size={14} />
          <span>{outOfStock ? 'Sold Out' : 'Add to Bag'}</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentMedia?.url && currentMedia.type !== 'video' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-[150] bg-[#111111]/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image viewer"
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white text-[#111111] shadow-lg hover:bg-[#FAF8F4] flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={currentMedia.url}
            alt={currentMedia.alt || product.title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85dvh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
