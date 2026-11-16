import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchBlogPosts,
  fetchCmsPages,
  fetchCollections,
  fetchNavigationMenus,
  fetchProducts,
  fetchSiteContent,
  fetchStoreSettings,
} from '../lib/storeService';
import { formatMoney } from '../lib/currency';
import {
  SEED_COLLECTIONS,
  SEED_NAVIGATION,
  SEED_PAGES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_SETTINGS,
  SEED_SITE_CONTENT,
} from '../lib/seedData';
import type {
  BlogPost,
  CartItem,
  CmsPage,
  Collection,
  CurrencyCode,
  NavigationMenu,
  Product,
  SiteContentDoc,
  StoreSettings,
} from '../types/store';

const CART_STORAGE_KEY = 'mushaf_store_cart_v1';
const WISHLIST_STORAGE_KEY = 'mushaf_store_wishlist_v1';
const CURRENCY_STORAGE_KEY = 'mushaf_store_currency_v1';

interface StoreContextValue {
  products: Product[];
  collections: Collection[];
  pages: CmsPage[];
  posts: BlogPost[];
  navigation: NavigationMenu[];
  siteContent: SiteContentDoc;
  settings: StoreSettings;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (pkrAmount: number) => string;
  cart: CartItem[];
  cartCount: number;
  cartSubtotalPKR: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'key'>) => void;
  updateCartQty: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  refreshStore: () => Promise<void>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS);
  const [pages, setPages] = useState<CmsPage[]>(SEED_PAGES);
  const [posts, setPosts] = useState<BlogPost[]>(SEED_POSTS);
  const [navigation, setNavigation] = useState<NavigationMenu[]>(SEED_NAVIGATION);
  const [siteContent, setSiteContent] = useState<SiteContentDoc>(SEED_SITE_CONTENT);
  const [settings, setSettings] = useState<StoreSettings>(SEED_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCartOpen, setCartOpen] = useState<boolean>(false);

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (saved && ['PKR', 'USD', 'AED', 'GBP', 'EUR'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'PKR';
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const isDraftPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === 'draft';

  const refreshStore = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, pg, po, nav, sc, st] = await Promise.all([
        fetchProducts(true),
        fetchCollections(true),
        fetchCmsPages(true),
        fetchBlogPosts(true),
        fetchNavigationMenus(),
        fetchSiteContent(isDraftPreview ? 'draft' : 'published'),
        fetchStoreSettings(),
      ]);
      setProducts(p);
      setCollections(c);
      setPages(pg);
      setPosts(po);
      setNavigation(nav);
      setSiteContent(sc);
      setSettings(st);
    } catch (err) {
      console.warn('Storefront using offline seed fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [isDraftPreview]);

  useEffect(() => {
    refreshStore();
    const onPublish = () => refreshStore();
    const onOpenCart = () => setCartOpen(true);
    const onSyncCart = () => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return;
        setCart((prev) => (JSON.stringify(prev) === raw ? prev : JSON.parse(raw)));
      } catch {}
    };
    const onPreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'mk-preview-draft' && event.data?.payload) {
        setSiteContent(event.data.payload as SiteContentDoc);
      }
    };
    window.addEventListener('storefront-published', onPublish);
    window.addEventListener('open-store-cart', onOpenCart);
    window.addEventListener('store-cart-sync', onSyncCart);
    if (isDraftPreview) {
      window.addEventListener('message', onPreviewMessage);
    }
    return () => {
      window.removeEventListener('storefront-published', onPublish);
      window.removeEventListener('open-store-cart', onOpenCart);
      window.removeEventListener('store-cart-sync', onSyncCart);
      if (isDraftPreview) {
        window.removeEventListener('message', onPreviewMessage);
      }
    };
  }, [refreshStore, isDraftPreview]);

  // Apply published global theme accent / fonts / favicon safely
  useEffect(() => {
    const theme = siteContent?.theme;
    if (!theme) return;
    const root = document.documentElement;
    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor);
    }
    if (theme.displayFont) {
      root.style.setProperty(
        '--font-display',
        `"${theme.displayFont}", Georgia, serif`
      );
    }
    if (theme.bodyFont) {
      root.style.setProperty(
        '--font-body',
        `"${theme.bodyFont}", system-ui, sans-serif`
      );
    }
    if (theme.faviconUrl) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = theme.faviconUrl;
    }
  }, [siteContent]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(
        new CustomEvent('store-cart-updated', {
          detail: { count: cart.reduce((s, i) => s + i.quantity, 0) },
        })
      );
      window.dispatchEvent(new CustomEvent('store-cart-sync'));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {}
  }, []);

  const formatPrice = useCallback(
    (pkrAmount: number) =>
      formatMoney(pkrAmount, currency, settings.exchangeRates),
    [currency, settings.exchangeRates]
  );

  const addToCart = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = `${item.productId}::${item.variantId || 'default'}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, key }];
    });
    setCartOpen(true);
    try {
      window.dispatchEvent(new CustomEvent('open-store-cart'));
    } catch {}
  }, []);

  const updateCartQty = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.key !== key));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity } : i))
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotalPKR = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const value: StoreContextValue = {
    products,
    collections,
    pages,
    posts,
    navigation,
    siteContent,
    settings,
    currency,
    setCurrency,
    formatPrice,
    cart,
    cartCount,
    cartSubtotalPKR,
    isCartOpen,
    setCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    wishlist,
    toggleWishlist,
    isWishlisted,
    refreshStore,
    loading,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useOptionalStore(): StoreContextValue | null {
  return useContext(StoreContext);
}

