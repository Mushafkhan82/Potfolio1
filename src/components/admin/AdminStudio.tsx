import React, { useCallback, useEffect, useState } from 'react';
import {
  Home,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  Boxes,
  Paintbrush,
  FileText,
  Menu as MenuIcon,
  Briefcase,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import {
  fetchAdminSession,
  loginAdminWithPassword,
  logoutAdminSession,
  logoutAllAdminSessions,
} from '../../lib/adminAuth';
import {
  fetchAllProductsAdmin,
  fetchBlogPosts,
  fetchCmsPages,
  fetchCollections,
  fetchCustomersAdmin,
  fetchDiscountsAdmin,
  fetchLegacyInquiries,
  fetchNavigationMenus,
  fetchOrdersAdmin,
  fetchRolesConfig,
  fetchSiteContent,
  fetchStoreSettings,
  listMediaAssets,
  seedStoreDataIfEmpty,
} from '../../lib/storeService';
import {
  SEED_COLLECTIONS,
  SEED_DISCOUNTS,
  SEED_NAVIGATION,
  SEED_PAGES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_ROLES,
  SEED_SETTINGS,
  SEED_SITE_CONTENT,
} from '../../lib/seedData';
import { AdminHomeDashboard } from './AdminHomeDashboard';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminProductsPanel } from './AdminProductsPanel';
import {
  AdminCollectionsPanel,
  AdminCustomersPanel,
  AdminDiscountsPanel,
  AdminInventoryPanel,
} from './AdminCatalogOpsPanels';
import {
  AdminCustomizerPanel,
  AdminNavigationPanel,
  AdminPagesAndBlogPanel,
} from './AdminOnlineStorePanels';
import {
  AdminMediaLibraryPanel,
  AdminPortfolioMergedPanel,
  AdminSettingsPanel,
} from './AdminPortfolioMediaSettings';
import type {
  BlogPost,
  CmsPage,
  Collection,
  CurrencyCode,
  Customer,
  Discount,
  MediaAsset,
  NavigationMenu,
  Order,
  Product,
  RolesConfig,
  SiteContentDoc,
  StoreSettings,
} from '../../types/store';

export type AdminTabId =
  | 'home'
  | 'orders'
  | 'products'
  | 'collections'
  | 'customers'
  | 'discounts'
  | 'inventory'
  | 'customize'
  | 'pages'
  | 'navigation'
  | 'portfolio'
  | 'media'
  | 'settings';

export type AdminWorkspaceMode = 'commerce' | 'studio';

const COMMERCE_TABS: AdminTabId[] = [
  'home',
  'orders',
  'products',
  'collections',
  'customers',
  'discounts',
  'inventory',
];

const STUDIO_TABS: AdminTabId[] = [
  'customize',
  'pages',
  'navigation',
  'portfolio',
  'media',
  'settings',
];

const VALID_TABS = new Set<AdminTabId>([...COMMERCE_TABS, ...STUDIO_TABS]);

const NAV_GROUPS: {
  group: string;
  workspace: AdminWorkspaceMode;
  items: { id: AdminTabId; label: string; Icon: any }[];
}[] = [
  {
    group: 'Commerce',
    workspace: 'commerce',
    items: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'orders', label: 'Orders', Icon: ShoppingBag },
      { id: 'products', label: 'Products', Icon: Package },
      { id: 'collections', label: 'Collections', Icon: Layers },
      { id: 'customers', label: 'Customers', Icon: Users },
      { id: 'discounts', label: 'Discounts', Icon: Tag },
      { id: 'inventory', label: 'Inventory', Icon: Boxes },
    ],
  },
  {
    group: 'Online Store',
    workspace: 'studio',
    items: [
      { id: 'customize', label: 'Customize', Icon: Paintbrush },
      { id: 'pages', label: 'Pages & Blog', Icon: FileText },
      { id: 'navigation', label: 'Navigation', Icon: MenuIcon },
    ],
  },
  {
    group: 'Studio & System',
    workspace: 'studio',
    items: [
      { id: 'portfolio', label: 'Portfolio', Icon: Briefcase },
      { id: 'media', label: 'Media Library', Icon: ImageIcon },
      { id: 'settings', label: 'Settings', Icon: Settings },
    ],
  },
];

function resolveTabFromRoute(explicitTab?: string): AdminTabId {
  const fromProp = (explicitTab || '').trim().toLowerCase();
  if (fromProp === 'commerce') return 'home';
  if (fromProp === 'studio') return 'portfolio';
  if (VALID_TABS.has(fromProp as AdminTabId)) return fromProp as AdminTabId;

  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '');
    const path = hash.startsWith('/') ? hash : window.location.pathname;
    const match = path.match(/^\/admin\/([^/?#]+)/i);
    if (match?.[1]) {
      const segment = match[1].toLowerCase();
      if (segment === 'commerce') return 'home';
      if (segment === 'studio') return 'portfolio';
      if (VALID_TABS.has(segment as AdminTabId)) return segment as AdminTabId;
    }
  }
  return 'home';
}

function getWorkspaceForTab(tab: AdminTabId): AdminWorkspaceMode {
  return STUDIO_TABS.includes(tab) ? 'studio' : 'commerce';
}

export interface AdminStudioProps {
  onNavigateStore: (path: string) => void;
  initialTab?: string;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  onNavigateStore,
  initialTab,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionConfigured, setSessionConfigured] = useState(true);
  const [sessionConfigMessage, setSessionConfigMessage] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roles, setRoles] = useState<RolesConfig>(SEED_ROLES);

  const [loginPassword, setLoginPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTabId>(() =>
    resolveTabFromRoute(initialTab)
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [collections, setCollections] =
    useState<Collection[]>(SEED_COLLECTIONS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>(SEED_DISCOUNTS);
  const [pages, setPages] = useState<CmsPage[]>(SEED_PAGES);
  const [posts, setPosts] = useState<BlogPost[]>(SEED_POSTS);
  const [menus, setMenus] = useState<NavigationMenu[]>(SEED_NAVIGATION);
  const [draftSiteContent, setDraftSiteContent] =
    useState<SiteContentDoc>(SEED_SITE_CONTENT);
  const [settings, setSettings] = useState<StoreSettings>(SEED_SETTINGS);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');

  const activeWorkspace = getWorkspaceForTab(activeTab);

  const selectTab = useCallback(
    (tab: AdminTabId) => {
      setActiveTab(tab);
      setMobileDrawerOpen(false);
      const targetRoute = tab === 'home' ? '/admin' : `/admin/${tab}`;
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== targetRoute) {
          onNavigateStore(targetRoute);
        }
      }
    },
    [onNavigateStore]
  );

  const switchWorkspace = useCallback(
    (mode: AdminWorkspaceMode) => {
      if (mode === 'commerce') {
        selectTab(COMMERCE_TABS.includes(activeTab) ? activeTab : 'home');
      } else {
        selectTab(STUDIO_TABS.includes(activeTab) ? activeTab : 'portfolio');
      }
    },
    [activeTab, selectTab]
  );

  useEffect(() => {
    const syncFromHash = () => {
      const next = resolveTabFromRoute();
      setActiveTab((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => {
    document.title = 'Admin Studio | Mushaf Khan';
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const createdMeta = !metaRobots;
    const prevContent = metaRobots?.getAttribute('content') || '';
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, nofollow';

    let mounted = true;
    fetchAdminSession()
      .then((status) => {
        if (!mounted) return;
        setSessionConfigured(status.configured);
        setSessionConfigMessage(status.statusMessage || null);
        setAuthenticated(status.authenticated);
        setSessionExpiresAt(status.expiresAt);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthenticated(false);
        setAuthLoading(false);
      });

    return () => {
      mounted = false;
      if (metaRobots) {
        if (createdMeta) {
          metaRobots.remove();
        } else if (prevContent) {
          metaRobots.content = prevContent;
        }
      }
    };
  }, []);

  // Close mobile admin drawer on Escape
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileDrawerOpen]);

  // Unsaved-changes browser guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const authorized = authenticated && sessionConfigured;

  const loadAllAdminData = useCallback(async () => {
    if (!authorized) return;
    setDataLoading(true);
    try {
      const [
        ord,
        prod,
        col,
        cust,
        disc,
        pg,
        pst,
        nav,
        draft,
        st,
        med,
        inq,
        rl,
      ] = await Promise.all([
        fetchOrdersAdmin().catch(() => []),
        fetchAllProductsAdmin().catch(() => []),
        fetchCollections(false).catch(() => SEED_COLLECTIONS),
        fetchCustomersAdmin().catch(() => []),
        fetchDiscountsAdmin().catch(() => SEED_DISCOUNTS),
        fetchCmsPages(false).catch(() => SEED_PAGES),
        fetchBlogPosts(false).catch(() => SEED_POSTS),
        fetchNavigationMenus().catch(() => SEED_NAVIGATION),
        fetchSiteContent('draft').catch(() => SEED_SITE_CONTENT),
        fetchStoreSettings().catch(() => SEED_SETTINGS),
        listMediaAssets().catch(() => []),
        fetchLegacyInquiries().catch(() => []),
        fetchRolesConfig().catch(() => SEED_ROLES),
      ]);

      setOrders(ord);
      setProducts(prod.length > 0 ? prod : SEED_PRODUCTS);
      setCollections(col);
      setCustomers(cust);
      setDiscounts(disc.length > 0 ? disc : SEED_DISCOUNTS);
      setPages(pg);
      setPosts(pst);
      setMenus(nav);
      setDraftSiteContent(draft);
      setSettings(st);
      setCurrency(st.defaultCurrency || 'PKR');
      setMedia(med);
      setInquiries(inq);
      setRoles(rl);

      // Automatically seed initial Firestore docs on first admin login if empty
      if (prod.length === 0) {
        await seedStoreDataIfEmpty(false).catch(() => {});
        const seededProds = await fetchAllProductsAdmin().catch(() => []);
        if (seededProds.length > 0) setProducts(seededProds);
      }
    } finally {
      setDataLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    if (authorized) loadAllAdminData();
  }, [authorized, loadAllAdminData]);

  const handleSeedNow = async () => {
    setSeeding(true);
    try {
      await seedStoreDataIfEmpty(true);
      await loadAllAdminData();
      window.dispatchEvent(new CustomEvent('storefront-published'));
      showToast('Seeded 6 sample products, collections & site settings into Firestore!');
    } catch (err: any) {
      showToast(err?.message || 'Seeding error — check Firestore rules');
    } finally {
      setSeeding(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[color:var(--bg-canvas)]">
        <div className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-muted)]">
          <Loader2 size={16} className="animate-spin text-[#C6F432]" />
          <span>Verifying Studio Admin session...</span>
        </div>
      </div>
    );
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword) {
      setAuthError('Please enter your studio admin password.');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const result = await loginAdminWithPassword(loginPassword, rememberDevice);
      if (!result.ok) {
        if (result.status === 503) setSessionConfigured(false);
        setAuthError(result.error);
        return;
      }
      setAuthenticated(true);
      setSessionExpiresAt(result.expiresAt);
      setLoginPassword('');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await logoutAdminSession();
    setAuthenticated(false);
    setSessionExpiresAt(null);
    setAuthNotice('Signed out cleanly from this device.');
  };

  const handleSignOutAll = async () => {
    await logoutAllAdminSessions();
    setAuthenticated(false);
    setSessionExpiresAt(null);
    setAuthNotice('All active studio admin sessions have been revoked.');
  };

  if (!authorized) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-[color:var(--bg-canvas)] text-[color:var(--text-primary)]">
        <div className="w-full max-w-md rounded-3xl glass-card p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#C6F432]/15 border border-[#C6F432]/40 flex items-center justify-center mx-auto text-[#C6F432] mb-2">
              <Lock size={20} />
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)]">
              Mushaf Khan Digital Studio
            </div>
            <h1 className="font-display text-3xl sm:text-4xl">Store &amp; Studio Admin</h1>
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
              Enter the studio admin password to unlock store operations, orders, products, visual customizer, and portfolio settings.
            </p>
          </div>

          {!sessionConfigured && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-xs font-mono text-amber-300 space-y-1.5"
            >
              <div className="font-bold flex items-center gap-2">
                <ShieldAlert size={15} className="shrink-0" />
                <span>Admin Login Unavailable</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {sessionConfigMessage ||
                  'ADMIN_PASSWORD is not set in server environment secrets. Admin access is locked by default until configured in Settings > Secrets.'}
              </p>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 flex items-start gap-2.5"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authNotice && (
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-[#C6F432]/15 border border-[#C6F432]/40 text-xs font-mono text-[color:var(--text-primary)] flex items-start gap-2.5"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#C6F432]" />
              <span>{authNotice}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSignIn} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-password"
                className="block text-[11px] font-mono uppercase tracking-wider text-[color:var(--text-muted)]"
              >
                Studio Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter studio password"
                  disabled={authBusy || !sessionConfigured}
                  className="w-full min-h-[48px] px-3.5 py-3 pr-12 rounded-xl text-base sm:text-sm bg-black/5 dark:bg-white/[0.06] border border-[color:var(--border-subtle)] text-[color:var(--text-primary)] outline-none focus:border-[#C6F432] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg flex items-center justify-center text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="min-h-[44px] flex items-center gap-2.5 text-xs font-mono text-[color:var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={authBusy || !sessionConfigured}
                className="w-4 h-4 rounded accent-[#C6F432]"
              />
              <span>Remember this device (30 days)</span>
            </label>

            <button
              type="submit"
              disabled={authBusy || !sessionConfigured}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#C6F432] text-[#050505] font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-45 cursor-pointer flex items-center justify-center gap-2"
            >
              {authBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Unlock Studio Admin</span>
            </button>
          </form>

          <p className="text-[11px] font-mono text-center text-[color:var(--text-muted)]">
            Protected with server-signed HttpOnly cookies &amp; rate limiting.
          </p>

          <button
            type="button"
            onClick={() => onNavigateStore('/')}
            className="min-h-[44px] px-4 text-xs font-mono text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] underline cursor-pointer inline-flex items-center justify-center mx-auto w-full"
          >
            ← Return to public website
          </button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto">
      <div className="px-2 pt-1 flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-bold leading-none">
            M<span className="text-[color:var(--accent-text)]">.</span>{' '}
            {activeWorkspace === 'commerce' ? 'Commerce' : 'Studio'}
          </div>
          <div className="text-[10px] font-mono text-[color:var(--text-muted)] mt-1 truncate max-w-[160px]">
            {sessionExpiresAt
              ? `Session until ${new Date(sessionExpiresAt).toLocaleDateString()}`
              : 'Studio Admin Session'}
          </div>
        </div>
      </div>

      {/* Workspace Mode Switcher: Commerce vs Studio */}
      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
        role="tablist"
        aria-label="Admin workspace mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeWorkspace === 'commerce'}
          onClick={() => switchWorkspace('commerce')}
          className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
            activeWorkspace === 'commerce'
              ? 'bg-[#C6F432] text-[#050505]'
              : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
          }`}
        >
          Commerce
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeWorkspace === 'studio'}
          onClick={() => switchWorkspace('studio')}
          className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
            activeWorkspace === 'studio'
              ? 'bg-[#C6F432] text-[#050505]'
              : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
          }`}
        >
          Studio
        </button>
      </div>

      <nav className="space-y-5 flex-1" aria-label="Admin Navigation">
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[color:var(--text-muted)] font-bold">
              {grp.group}
            </div>
            {grp.items.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C6F432] text-[#050505] font-bold'
                      : 'text-[color:var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="pt-3 border-t border-[color:var(--border-subtle)] space-y-1">
        <button
          type="button"
          onClick={() => onNavigateStore('/shop')}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono hover:bg-black/5 dark:hover:bg-white/[0.06] cursor-pointer"
        >
          <ExternalLink size={15} />
          <span>View Storefront</span>
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono text-red-400 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
        <button
          type="button"
          onClick={handleSignOutAll}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-mono text-[color:var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
        >
          <ShieldAlert size={14} />
          <span>Sign Out All Devices</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[color:var(--bg-canvas)] text-[color:var(--text-primary)] flex overflow-x-clip">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-[color:var(--border-subtle)] bg-[color:var(--bg-canvas)] z-40 print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin Navigation Drawer"
          className="lg:hidden fixed inset-0 z-[150] flex"
        >
          <div
            className="fixed inset-0 bg-black/65"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-[min(85vw,320px)] h-full bg-[color:var(--bg-canvas)] border-r border-[color:var(--border-subtle)] shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-2.5 right-2.5 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
              aria-label="Close admin sidebar"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-30 min-h-[56px] py-2 px-3 sm:px-6 border-b border-[color:var(--border-subtle)] bg-[color:var(--bg-canvas)]/90 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-3 print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden w-11 h-11 rounded-xl border border-[color:var(--border-subtle)] flex items-center justify-center cursor-pointer shrink-0"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs font-mono uppercase tracking-wider text-[color:var(--text-muted)] truncate">
              <span className="hidden sm:inline">Admin / {activeWorkspace} / </span>
              {activeTab}
            </span>
            {isDirty && (
              <span className="hidden md:inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-mono shrink-0">
                Unsaved draft changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Compact Header Mode Toggle for quick switching */}
            <div className="hidden md:inline-flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => switchWorkspace('commerce')}
                className={`px-2.5 py-1.5 rounded-md cursor-pointer ${
                  activeWorkspace === 'commerce'
                    ? 'bg-[#C6F432] text-[#050505] font-bold'
                    : 'text-[color:var(--text-secondary)]'
                }`}
              >
                Commerce
              </button>
              <button
                type="button"
                onClick={() => switchWorkspace('studio')}
                className={`px-2.5 py-1.5 rounded-md cursor-pointer ${
                  activeWorkspace === 'studio'
                    ? 'bg-[#C6F432] text-[#050505] font-bold'
                    : 'text-[color:var(--text-secondary)]'
                }`}
              >
                Studio
              </button>
            </div>

            <select
              aria-label="Admin display currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="min-h-[44px] px-2.5 py-1.5 rounded-lg text-base sm:text-xs font-mono bg-black/5 dark:bg-white/[0.06] border border-[color:var(--border-subtle)] cursor-pointer"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>

            <button
              type="button"
              onClick={() => onNavigateStore('/')}
              className="hidden sm:inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[color:var(--border-subtle)] text-xs font-mono hover:border-[#C6F432] cursor-pointer"
            >
              <span>Site</span>
              <ExternalLink size={12} />
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-mono cursor-pointer"
              title="Log out of studio admin"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {dataLoading && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] text-xs font-mono text-[color:var(--text-muted)] flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-[#C6F432]" />
              <span>Syncing Firestore store data...</span>
            </div>
          )}

          {activeTab === 'home' && (
            <AdminHomeDashboard
              orders={orders}
              products={products}
              inquiries={inquiries}
              currency={currency}
              exchangeRates={settings.exchangeRates}
              onNavigateTab={(t) => selectTab(t as AdminTabId)}
              onSeedSampleData={handleSeedNow}
              seeding={seeding}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersPanel
              orders={orders}
              onRefresh={loadAllAdminData}
              currency={currency}
              exchangeRates={settings.exchangeRates}
              storeName={settings.storeName}
              onToast={showToast}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsPanel
              products={products}
              collections={collections}
              onRefresh={loadAllAdminData}
              currency={currency}
              exchangeRates={settings.exchangeRates}
              onToast={showToast}
            />
          )}

          {activeTab === 'collections' && (
            <AdminCollectionsPanel
              collections={collections}
              products={products}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersPanel
              customers={customers}
              orders={orders}
              currency={currency}
              exchangeRates={settings.exchangeRates}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'discounts' && (
            <AdminDiscountsPanel
              discounts={discounts}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryPanel
              products={products}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'customize' && (
            <AdminCustomizerPanel
              initialDraft={draftSiteContent}
              onDirtyChange={setIsDirty}
              onToast={showToast}
            />
          )}

          {activeTab === 'pages' && (
            <AdminPagesAndBlogPanel
              pages={pages}
              posts={posts}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'navigation' && (
            <AdminNavigationPanel
              menus={menus}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'portfolio' && (
            <AdminPortfolioMergedPanel
              inquiries={inquiries}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'media' && (
            <AdminMediaLibraryPanel
              media={media}
              products={products}
              collections={collections}
              posts={posts}
              siteContent={draftSiteContent}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsPanel
              initialSettings={settings}
              initialRoles={roles}
              products={products}
              pages={pages}
              posts={posts}
              onNavigateTab={(t) => selectTab(t as AdminTabId)}
              onRefresh={loadAllAdminData}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Floating Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 z-[250] px-4 py-3 rounded-2xl bg-[#050505] text-[#C6F432] border border-[#C6F432]/40 shadow-2xl font-mono text-xs flex items-center gap-2"
        >
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default AdminStudio;
