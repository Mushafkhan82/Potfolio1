import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CmsPageViewer: React.FC<{
  slug: string;
  onNavigate: (p: string) => void;
}> = ({ slug, onNavigate }) => {
  const { pages, settings } = useStore();
  const page = pages.find((p) => p.slug === slug || p.id === slug);

  useEffect(() => {
    if (page) {
      document.title = page.seoTitle || `${page.title} | ${settings.storeName}`;
    }
  }, [page, settings.storeName]);

  if (!page) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 text-center space-y-4">
        <h1 className="font-display text-4xl">Page not found</h1>
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

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => onNavigate('/shop')}
          className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-xs font-mono text-[#5B5B56] hover:text-[#111111] cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Store</span>
        </button>
        <h1 className="font-display text-4xl sm:text-6xl leading-tight text-[#111111]">
          {page.title}
        </h1>
        <div
          className="prose prose-base max-w-none bg-white border border-[#E7E3DA] rounded-3xl p-6 sm:p-10 text-[#5B5B56] leading-relaxed break-words shadow-xs"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
};

export const BlogListPage: React.FC<{ onNavigate: (p: string) => void }> = ({
  onNavigate,
}) => {
  const { posts, settings } = useStore();

  useEffect(() => {
    document.title = `Journal | ${settings.storeName}`;
  }, [settings.storeName]);

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#4C7A00] font-semibold">
            Studio Journal
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-[#111111]">
            Notes on Design, Craft & Production.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onNavigate(`/blog/${post.slug}`)}
              className="rounded-2xl bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 shadow-xs hover:shadow-md transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {post.coverImage && (
                  <div className="aspect-[16/10] bg-[#FAF8F4] border-b border-[#E7E3DA] overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      width={800}
                      height={500}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-mono text-[#5B5B56]">
                    {post.author} · {new Date(post.publishedAt).toLocaleDateString()}
                  </div>
                  <h2 className="font-display text-2xl text-[#111111] group-hover:text-[#4C7A00] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-[#5B5B56] line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 flex items-center gap-1.5 text-xs font-mono font-semibold text-[#4C7A00]">
                <span>Read Dispatch</span>
                <ArrowRight size={12} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BlogDetailPage: React.FC<{
  slug: string;
  onNavigate: (p: string) => void;
}> = ({ slug, onNavigate }) => {
  const { posts, settings } = useStore();
  const post = posts.find((p) => p.slug === slug || p.id === slug);

  useEffect(() => {
    if (post) {
      document.title = post.seoTitle || `${post.title} | ${settings.storeName}`;
    }
  }, [post, settings.storeName]);

  if (!post) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 text-center space-y-4">
        <h1 className="font-display text-4xl">Article not found</h1>
        <button
          type="button"
          onClick={() => onNavigate('/blog')}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-xs font-mono font-bold hover:bg-[#a9e600] cursor-pointer"
        >
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-xs font-mono text-[#5B5B56] hover:text-[#111111] cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>All Articles</span>
        </button>
        <div className="text-xs font-mono text-[#5B5B56]">
          {post.author} · {new Date(post.publishedAt).toLocaleDateString()}
        </div>
        <h1 className="font-display text-4xl sm:text-6xl leading-tight text-[#111111]">
          {post.title}
        </h1>
        {post.coverImage && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[#E7E3DA] bg-white">
            <img
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={675}
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div
          className="prose prose-base max-w-none bg-white border border-[#E7E3DA] rounded-3xl p-6 sm:p-10 text-[#5B5B56] leading-relaxed break-words shadow-xs"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
};

/**
 * Dynamic Storefront Section mounted on the Homepage driven by Admin > Customize (siteContent/published).
 */
export const HomeStoreSection: React.FC<{ onNavigate: (p: string) => void }> = ({
  onNavigate,
}) => {
  const { products, siteContent, formatPrice, addToCart, setCartOpen, cartCount } =
    useStore();

  const announcement = siteContent.sections.find(
    (s) => s.type === 'announcement' && s.visible
  );
  const gridSection =
    siteContent.sections.find((s) => s.type === 'product_grid' && s.visible) ||
    siteContent.sections.find((s) => s.type === 'featured_collection' && s.visible);

  if (!gridSection && !announcement) return null;

  const limit = gridSection?.settings.itemLimit || 6;
  const shown = products.slice(0, limit);

  return (
    <section
      id="studio-store-showcase"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-[#FAF8F4] text-[#111111] border-t border-[#E7E3DA]"
    >
      {announcement && (
        <div
          className="max-w-7xl mx-auto mb-10 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-semibold border border-[#96CF00]"
          style={{
            backgroundColor: announcement.settings.bgColor || '#B6F500',
            color: announcement.settings.textColor || '#111111',
          }}
        >
          <span>{announcement.settings.heading}</span>
          {announcement.settings.buttonLabel && (
            <button
              type="button"
              onClick={() =>
                onNavigate(announcement.settings.buttonLink || '/shop')
              }
              className="underline font-bold cursor-pointer"
            >
              {announcement.settings.buttonLabel} →
            </button>
          )}
        </div>
      )}

      {gridSection && (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-widest text-[#4C7A00] font-semibold">
                Studio Editions Store
              </div>
              <h2 className="font-display text-3xl sm:text-5xl text-[#111111]">
                {gridSection.settings.heading || 'Shop the Studio Drop'}
              </h2>
              {gridSection.settings.subheading && (
                <p className="text-sm text-[#5B5B56]">
                  {gridSection.settings.subheading}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-full bg-white border border-[#E7E3DA] text-[#111111] text-xs font-mono font-semibold flex items-center gap-1.5 hover:border-[#6BAA00] transition-colors cursor-pointer"
              >
                <ShoppingBag size={14} className="text-[#4C7A00]" />
                <span>Bag ({cartCount})</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(gridSection.settings.buttonLink || '/shop')}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{gridSection.settings.buttonLabel || 'View Store'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((product) => {
              const img = product.media?.[0]?.url || '';
              return (
                <article
                  key={product.id}
                  className="rounded-2xl bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div
                    onClick={() => onNavigate(`/product/${product.handle}`)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-[#FAF8F4] border-b border-[#E7E3DA] overflow-hidden">
                      {img && (
                        <img
                          src={img}
                          alt={product.title}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-5 pb-3 space-y-1">
                      <div className="text-[11px] font-mono text-[#5B5B56] uppercase">
                        {product.category}
                      </div>
                      <h3 className="font-display text-2xl text-[#111111] group-hover:text-[#4C7A00] transition-colors">
                        {product.title}
                      </h3>
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold tabular-nums text-[#111111]">
                      {formatPrice(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          productId: product.id,
                          variantId: product.variants[0]?.id,
                          title: product.title,
                          variantTitle: product.variants[0]?.title,
                          sku: product.sku,
                          image: img,
                          price: product.variants[0]?.price || product.price,
                          quantity: 1,
                        })
                      }
                      className="min-h-[44px] px-4 py-2 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      Add to Bag
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
