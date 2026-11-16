import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Briefcase,
  Clock,
  Command,
  ExternalLink,
  FolderKanban,
  Home,
  Layers,
  Mail,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Moon,
  User,
  X,
} from 'lucide-react';
import { PROJECTS, SERVICES, STUDIO_INFO } from '../data/studioData';
import { useCurrency } from '../context/CurrencyContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { openExternalUrl } from '../hooks/usePortfolioHelpers';

interface PaletteAction {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  shortcut?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const { isCartOpen, setCartOpen } = useStore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const editable = isEditableElement(e.target);

      if (mod && key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (editable) return;

      if (mod && !e.altKey && !e.shiftKey) {
        const routeMap: Record<string, string> = {
          '1': '/',
          '2': '/work',
          '3': '/services',
          '4': '/shop',
          '5': '/about',
          '6': '/contact',
        };
        if (routeMap[key]) {
          e.preventDefault();
          navigate(routeMap[key]);
          setOpen(false);
          return;
        }
        if (key === 'b') {
          e.preventDefault();
          setOpen(false);
          setCartOpen(!isCartOpen);
          return;
        }
      }

      if (e.key === '?' && !mod && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, navigate, isCartOpen, setCartOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [open]);

  const actions = useMemo<PaletteAction[]>(() => {
    const closeAndGo = (path: string) => () => {
      navigate(path);
      setOpen(false);
    };
    return [
      { id: 'nav-home', title: 'Home', category: 'Navigation', subtitle: 'Main studio showcase & hero', shortcut: '⌘1', icon: Home, action: closeAndGo('/') },
      { id: 'nav-work', title: 'Work Gallery', category: 'Navigation', subtitle: `Explore all ${PROJECTS.length} commercial projects`, shortcut: '⌘2', icon: Briefcase, action: closeAndGo('/work') },
      { id: 'nav-services', title: 'Services Hub', category: 'Navigation', subtitle: '8 core capabilities and 3D hallway doors', shortcut: '⌘3', icon: Layers, action: closeAndGo('/services') },
      { id: 'nav-shop', title: 'Studio Store', category: 'Navigation', subtitle: 'Hardware, digital kits, and apparel', shortcut: '⌘4', icon: ShoppingBag, action: closeAndGo('/shop') },
      { id: 'nav-about', title: 'About Mushaf', category: 'Navigation', subtitle: 'One-partner story and journey', shortcut: '⌘5', icon: User, action: closeAndGo('/about') },
      { id: 'nav-contact', title: 'Contact & Brief', category: 'Workflows', subtitle: 'Start a project or request fixed pricing', shortcut: '⌘6', icon: Mail, action: closeAndGo('/contact') },
      {
        id: 'action-bag',
        title: isCartOpen ? 'Close Shopping Bag' : 'Open Shopping Bag',
        category: 'Workflows',
        subtitle: 'Toggle studio merchandise & kit bag',
        shortcut: '⌘B',
        icon: ShoppingBag,
        action: () => {
          setCartOpen(!isCartOpen);
          setOpen(false);
        },
      },
      { id: 'nav-pricing', title: 'Pricing & Sprints', category: 'Navigation', subtitle: '14-day fixed-scope packages & estimates', icon: Sparkles, action: closeAndGo('/pricing') },
      { id: 'nav-track', title: 'Track Order', category: 'Workflows', subtitle: 'Check live fulfillment & courier tracking', icon: Clock, action: closeAndGo('/track-order') },
      { id: 'nav-book', title: 'Book Strategy Call', category: 'Workflows', subtitle: 'Schedule a 30-minute project scoping call', icon: Clock, action: closeAndGo('/book') },
      { id: 'nav-process', title: '14-Day Sprint Process', category: 'Navigation', subtitle: 'Rapid fixed-schedule delivery milestones', icon: Clock, action: closeAndGo('/process') },
      { id: 'nav-admin', title: 'Studio Admin Portal', category: 'Apps', subtitle: 'Manage store, orders, customizer & portfolio', icon: Command, action: closeAndGo('/admin') },
      {
        id: 'pref-theme',
        title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        category: 'Preferences',
        subtitle: theme === 'dark' ? 'Currently Dark Studio mode' : 'Currently Clean Light mode',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          toggleTheme(window.innerWidth - 48, 32);
          setOpen(false);
        },
      },
      {
        id: 'pref-currency-usd',
        title: 'Switch Currency to USD ($)',
        category: 'Preferences',
        subtitle: currency === 'USD' ? 'Currently active' : 'Set pricing currency to US Dollars',
        icon: Sparkles,
        action: () => {
          setCurrency('USD');
          setOpen(false);
        },
      },
      {
        id: 'pref-currency-pkr',
        title: 'Switch Currency to PKR (₨)',
        category: 'Preferences',
        subtitle: currency === 'PKR' ? 'Currently active' : 'Set pricing currency to Pakistani Rupees',
        icon: Sparkles,
        action: () => {
          setCurrency('PKR');
          setOpen(false);
        },
      },
      {
        id: 'ext-fiverr',
        title: 'Visit Fiverr Studio Profile',
        category: 'External',
        subtitle: 'Order vetted creative sprints on Fiverr Pro',
        icon: ExternalLink,
        action: () => {
          openExternalUrl(STUDIO_INFO.fiverr);
          setOpen(false);
        },
      },
      ...SERVICES.map((svc) => ({
        id: `service-${svc.slug}`,
        title: svc.name,
        category: 'Services',
        subtitle: svc.headline,
        icon: Sparkles,
        action: closeAndGo(`/services/${svc.slug}`),
      })),
      ...PROJECTS.map((proj) => ({
        id: `project-${proj.id}`,
        title: proj.name,
        category: 'Projects',
        subtitle: `${proj.clientType} · ${proj.outcome}`,
        icon: FolderKanban,
        action: closeAndGo(`/work/${proj.id}`),
      })),
    ];
  }, [navigate, currency, setCurrency, isCartOpen, setCartOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 12);
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [actions, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (Ctrl+K)"
        className="hidden md:inline-flex fixed bottom-5 left-5 z-[65] items-center gap-2 px-3.5 py-2 rounded-full glass-strong text-xs font-mono text-[#5B5B56] hover:text-[#111111] hover:border-[#6BAA00] transition-all cursor-pointer"
      >
        <Command size={13} className="text-[#6BAA00]" />
        <span>Quick Find</span>
        <kbd className="px-1.5 py-0.5 rounded glass-pill text-[10px] text-[#111111]">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation command palette"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-[#111111]/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl glass-strong text-[#111111] rounded-3xl overflow-hidden shadow-[0_24px_60px_-15px_rgba(17,17,17,0.22)] z-10"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E3DA]">
                <Search size={18} className="text-[#6BAA00] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex((i) => Math.max(0, i - 1));
                    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
                      e.preventDefault();
                      filtered[selectedIndex].action();
                    }
                  }}
                  placeholder="Jump to project, service, shop, or press ⌘1-⌘6..."
                  className="w-full bg-transparent text-sm text-[#111111] placeholder:text-[#5B5B56] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close palette"
                  className="p-1.5 rounded-full hover:bg-[#FAF8F4] text-[#5B5B56] hover:text-[#111111] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-xs font-mono text-[#5B5B56]">
                    No matching results for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  filtered.map((item, idx) => {
                    const Icon = item.icon;
                    const active = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#B6F500]/25 text-[#111111] border border-[#6BAA00]/40'
                            : 'text-[#5B5B56] hover:bg-[#FAF8F4] border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl glass-pill flex items-center justify-center shrink-0 text-[#6BAA00]">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-sans text-sm font-medium truncate text-[#111111]">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.shortcut && (
                                <kbd className="px-1.5 py-0.5 rounded glass-pill font-mono text-[10px] text-[#111111]">
                                  {item.shortcut}
                                </kbd>
                              )}
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5B5B56]">
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#5B5B56] truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-[#E7E3DA] bg-white/40 dark:bg-black/25 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#5B5B56]">
                <div className="flex flex-wrap items-center gap-3">
                  <span><strong className="text-[#111111]">⌘1–6</strong> Navigate</span>
                  <span><strong className="text-[#111111]">⌘B</strong> Bag</span>
                  <span><strong className="text-[#111111]">/</strong> Filter Search</span>
                  <span><strong className="text-[#111111]">?</strong> Help</span>
                </div>
                <span>Esc to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
