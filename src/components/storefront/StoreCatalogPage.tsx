import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  ArrowUpDown,
  PackageOpen,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CurrencyCode } from '../../types/store';

interface StoreCatalogPageProps {
  collectionSlug?: string;
  onNavigate: (path: string) => void;
}

export const StoreCatalogPage: React.FC<StoreCatalogPageProps> = ({
  collectionSlug,
  onNavigate,
}) => {
  const {
    products,
    collections,
    formatPrice,
    currency,
    setCurrency,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setCartOpen,
    cartCount,
    settings,
  } = useStore();

  const [selectedCollection, setSelectedCollection] = useState<string>(
    collectionSlug || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    'featured' | 'price-asc' | 'price-desc' | 'alpha'
  >('featured');

  useEffect(() => {
    setSelectedCollection(collectionSlug || 'all');
  }, [collectionSlug]);

  const activeCollectionObj = useMemo(
    () =>
      selectedCollection === 'all'
        ? null
        : collections.find(
            (c) => c.handle === selectedCollection || c.id === selectedCollection
          ),
    [collections, selectedCollection]
  );

  // Sync SEO page title & description
  useEffect(() => {
    document.title = activeCollectionObj
      ? `${activeCollectionObj.title} | ${settings.storeName}`
      : `Studio Store | ${settings.storeName}`;
  }, [activeCollectionObj, settings.storeName]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCollectionObj) {
      list = list.filter(
        (p) =>
          p.collectionIds.includes(activeCollectionObj.id) ||
          activeCollectionObj.productIds.includes(p.id)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (onlyInStock) {
      list = list.filter((p) => !p.trackInventory || p.stockQuantity > 0);
    }

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'alpha')
      list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [products, activeCollectionObj, searchQuery, onlyInStock, sortBy]);

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-28 pb-32 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E7E3DA]">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#4C7A00] font-semibold">
              <span>Studio Store</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{filteredProducts.length} Items</span>
            </div>
            <h1
              className="font-display text-4xl sm:text-6xl tracking-tight leading-[1.04] text-[#111111]"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {activeCollectionObj
                ? activeCollectionObj.title
                : 'Studio Objects & Digital Kits.'}
            </h1>
            <p className="text-sm sm:text-base text-[#5B5B56]">
              {activeCollectionObj
                ? activeCollectionObj.description
                : 'Physical workspace objects, Figma design kits, film LUT suites, and architectural 3D materials.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-xs font-mono bg-white border border-[#E7E3DA] text-[#111111] focus:outline-none focus:border-[#6BAA00] cursor-pointer"
            >
              <option value="PKR">PKR (Rs)</option>
              <option value="USD">USD ($)</option>
              <option value="AED">AED</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>

            <button
              type="button"
              onClick={() => onNavigate('/wishlist')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono bg-white border border-[#E7E3DA] text-[#111111] hover:border-[#6BAA00] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Heart size={13} className="text-[#4C7A00]" />
              <span>Wishlist</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/track-order')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono bg-white border border-[#E7E3DA] text-[#111111] hover:border-[#6BAA00] transition-colors cursor-pointer"
            >
              Track Order
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Collections Tabs */}
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E7E3DA] self-start overflow-x-auto max-w-full no-scrollbar"
            role="tablist"
            aria-label="Product Collections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCollection === 'all'}
              onClick={() => setSelectedCollection('all')}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCollection === 'all'
                  ? 'bg-[#B6F500] text-[#111111] font-bold'
                  : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
              }`}
            >
              All Products
            </button>
            {collections.map((col) => {
              const active =
                selectedCollection === col.handle || selectedCollection === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCollection(col.handle)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#B6F500] text-[#111111] font-bold'
                      : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                  }`}
                >
                  {col.title}
                </button>
              );
            })}
          </div>

          {/* Search, In Stock & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B5B56]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU..."
                aria-label="Search store products"
                className="w-full sm:w-56 min-h-[44px] pl-9 pr-3 py-2 rounded-xl text-base sm:text-xs bg-white border border-[#E7E3DA] text-[#111111] placeholder:text-[#5B5B56]/70 focus:outline-none focus:border-[#6BAA00]"
              />
            </div>

            <label className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono bg-white border border-[#E7E3DA] text-[#111111] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 accent-[#6BAA00]"
              />
              <span>In stock</span>
            </label>

            <div className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-white border border-[#E7E3DA]">
              <ArrowUpDown size={13} className="text-[#5B5B56]" />
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-base sm:text-xs font-mono font-semibold text-[#111111] focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white border border-dashed border-[#E7E3DA] rounded-2xl">
            <PackageOpen size={28} className="mx-auto text-[#5B5B56]" />
            <p className="font-display text-2xl text-[#111111]">No products match those filters</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCollection('all');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-mono font-bold hover:bg-[#a9e600] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const primaryImg = product.media?.[0]?.url || '';
              const wishlisted = isWishlisted(product.id);
              const outOfStock = product.trackInventory && product.stockQuantity <= 0;

              return (
                <article
                  key={product.id}
                  className="group rounded-2xl bg-white border border-[#E7E3DA] shadow-xs overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:border-[#6BAA00]/60 hover:shadow-lg transition-all duration-200"
                >
                  <div>
                    <div
                      onClick={() => onNavigate(`/product/${product.handle}`)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF8F4] border-b border-[#E7E3DA] cursor-pointer"
                    >
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={product.media?.[0]?.alt || product.title}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center text-[#5B5B56]">
                          <span className="font-display text-xl">{product.title}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        aria-label={
                          wishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                        }
                        className="absolute top-2.5 right-2.5 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] text-[#111111] shadow-sm flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Heart
                          size={16}
                          className={wishlisted ? 'fill-[#6BAA00] text-[#6BAA00]' : ''}
                        />
                      </button>
                    </div>

                    <div
                      onClick={() => onNavigate(`/product/${product.handle}`)}
                      className="p-5 pb-3 space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5B5B56]">
                        <span className="uppercase tracking-wider truncate">
                          {product.category}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {outOfStock
                            ? 'Sold Out'
                            : product.variants.length > 1
                              ? `${product.variants.length} options`
                              : 'In Stock'}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl leading-snug text-[#111111] group-hover:text-[#4C7A00] transition-colors">
                        {product.title}
                      </h2>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-base font-bold tabular-nums text-[#111111]">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="font-mono text-xs text-[#5B5B56] line-through tabular-nums">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={outOfStock}
                      onClick={() => {
                        const firstVar = product.variants[0];
                        addToCart({
                          productId: product.id,
                          variantId: firstVar?.id,
                          title: product.title,
                          variantTitle: firstVar?.title,
                          sku: firstVar?.sku || product.sku,
                          image: firstVar?.image || primaryImg,
                          price: firstVar ? firstVar.price : product.price,
                          quantity: 1,
                          maxStock: firstVar ? firstVar.stockQuantity : product.stockQuantity,
                          trackInventory: product.trackInventory,
                        });
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {outOfStock ? 'Out of Stock' : 'Add to Bag'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
