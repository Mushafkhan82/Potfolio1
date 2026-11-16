import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, ChevronDown, ShoppingBag, X } from 'lucide-react';
import { SERVICES, STUDIO_INFO } from '../data/studioData';
import { useStore } from '../context/StoreContext';
import { CurrencySelector } from './CurrencySelector';

const PILL_ROUTES = ['/', '/work', '/services', '/about', '/process', '/contact', '/shop'];

const SlidingNavHighlight: React.FC<{
  containerRef: React.RefObject<HTMLElement | null>;
  path: string;
}> = ({ containerRef, path }) => {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const activeRoute =
    PILL_ROUTES.filter((r) => (r === '/' ? path === '/' : path.startsWith(r))).pop() || null;
  const targetRoute = hoveredHref || activeRoute;

  const updateRect = useCallback(() => {
    const container = containerRef.current;
    if (!container || !targetRoute) {
      setRect(null);
      return;
    }
    const anchor = container.querySelector<HTMLElement>(`a[href="${targetRoute}"]`);
    if (!anchor) {
      setRect(null);
      return;
    }
    const cBox = container.getBoundingClientRect();
    const aBox = anchor.getBoundingClientRect();
    setRect({
      x: aBox.left - cBox.left - 8,
      y: aBox.top - cBox.top - 4,
      w: aBox.width + 16,
      h: aBox.height + 8,
    });
  }, [targetRoute, containerRef]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect, path]);

  useEffect(() => {
    const container = containerRef.current;
    const onOver = (e: Event) => {
      const a = (e.target as HTMLElement | null)?.closest('a');
      const href = a?.getAttribute('href') || null;
      setHoveredHref(href && PILL_ROUTES.includes(href) ? href : null);
    };
    const onLeave = () => setHoveredHref(null);
    window.addEventListener('resize', updateRect);
    container?.addEventListener('mouseover', onOver);
    container?.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('resize', updateRect);
      container?.removeEventListener('mouseover', onOver);
      container?.removeEventListener('mouseleave', onLeave);
    };
  }, [updateRect, containerRef]);

  if (!rect) return null;

  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="hidden md:block absolute left-0 top-0 rounded-full pointer-events-none"
      style={{
        zIndex: -1,
        background: 'rgba(182,245,0,0.22)',
        boxShadow: 'inset 0 0 0 1px rgba(107,170,0,0.4)',
      }}
    />
  );
};

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { cartCount, setCartOpen } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (servicesOpen || mobileOpen) {
        setVisible(true);
        setLastY(currentY);
        return;
      }
      if (currentY <= 80) {
        setVisible(true);
      } else if (currentY > lastY && currentY - lastY > 6) {
        setVisible(false);
        setServicesOpen(false);
      } else if (lastY - currentY > 6) {
        setVisible(true);
      }
      setLastY(currentY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [servicesOpen, mobileOpen, lastY]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (servicesOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [servicesOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    window.dispatchEvent(
      new CustomEvent('mk-overlay-state', { detail: { navOpen: mobileOpen } })
    );
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      firstFocusable?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        prevFocus.focus();
      }
    };
  }, [mobileOpen]);

  if (pathname.startsWith('/admin')) return null;

  const handleEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => setServicesOpen(true), 100);
  };

  const handleLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setServicesOpen(false), 180);
  };

  const isActive = (prefix: string) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix);

  return (
    <>
      <motion.div
        style={{ scaleX }}
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#6BAA00] z-[100] origin-left pointer-events-none"
      />

      <header
        className={`fixed top-3 sm:top-6 inset-x-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? 'translate-y-0' : '-translate-y-28'
        }`}
      >
        <nav
          ref={navRef}
          aria-label="Main Navigation"
          className="pointer-events-auto relative isolate flex items-center justify-between gap-1.5 sm:gap-4 bg-white/95 backdrop-blur-md border border-[#E7E3DA] px-3 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-[0_8px_28px_-10px_rgba(17,17,17,0.12)] max-w-[calc(100vw-1rem)] md:max-w-fit transition-all duration-300"
        >
          <SlidingNavHighlight containerRef={navRef} path={pathname} />

          <Link
            to="/"
            className="flex items-baseline font-display text-xl sm:text-2xl text-[#111111] font-semibold tracking-tight group pr-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00] rounded-full"
            aria-label="Mushaf Khan Home"
          >
            <span>M</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6BAA00] ml-0.5 group-hover:scale-125 transition-transform" />
          </Link>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[11px] font-mono text-[#5B5B56] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
            <span>Available for projects</span>
          </div>

          <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0 font-mono text-xs tracking-wide uppercase">
            <li>
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname === '/'
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>Home</span>
                {pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />}
              </Link>
            </li>

            <li>
              <Link
                to="/work"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive('/work')
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>Work</span>
                {isActive('/work') && <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />}
              </Link>
            </li>

            <li className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
              <div className="flex items-center rounded-full px-2 py-1 hover:bg-[#FAF8F4] transition-colors">
                <Link
                  to="/services"
                  className={`flex items-center gap-1 px-1 transition-colors ${
                    isActive('/services')
                      ? 'text-[#111111] font-semibold'
                      : 'text-[#5B5B56] hover:text-[#111111]'
                  }`}
                >
                  <span>Services</span>
                  {isActive('/services') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                  )}
                </Link>
                <button
                  type="button"
                  aria-expanded={servicesOpen}
                  aria-label="Toggle Services Menu"
                  onClick={() => setServicesOpen((prev) => !prev)}
                  className="p-1 text-[#5B5B56] hover:text-[#111111] focus:outline-none rounded-full cursor-pointer"
                >
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 ${
                      servicesOpen ? 'rotate-180 text-[#6BAA00]' : ''
                    }`}
                  />
                </button>
              </div>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 mt-3 w-80 rounded-2xl bg-white border border-[#E7E3DA] shadow-[0_18px_48px_-12px_rgba(17,17,17,0.16)] p-2.5 z-[70] text-[#111111]"
                  >
                    <div className="absolute -top-3 left-0 right-0 h-3" />
                    <div className="px-3 py-2 border-b border-[#E7E3DA] flex items-center justify-between">
                      <Link
                        to="/services"
                        onClick={() => setServicesOpen(false)}
                        className="text-[11px] font-mono uppercase tracking-wider text-[#6BAA00] font-semibold hover:underline"
                      >
                        All 8 Services Hub &rarr;
                      </Link>
                      <span className="text-[10px] font-mono text-[#5B5B56]">
                        Specializations
                      </span>
                    </div>
                    <ul className="space-y-1 list-none p-0 mt-1.5 m-0">
                      {SERVICES.map((svc) => (
                        <li key={svc.slug}>
                          <Link
                            to={`/services/${svc.slug}`}
                            onClick={() => setServicesOpen(false)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${
                              pathname === `/services/${svc.slug}`
                                ? 'bg-[#B6F500]/25 text-[#111111]'
                                : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4] active:scale-[0.98]'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="font-sans text-xs font-medium block text-[#111111]">
                                {svc.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#5B5B56] lowercase block truncate max-w-[200px]">
                                {svc.headline}
                              </span>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            <li>
              <Link
                to="/about"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive('/about')
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>About</span>
                {isActive('/about') && <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />}
              </Link>
            </li>

            <li>
              <Link
                to="/process"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive('/process')
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>Process</span>
                {isActive('/process') && <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />}
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive('/contact')
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>Contact</span>
                {isActive('/contact') && <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />}
              </Link>
            </li>

            <li>
              <Link
                to="/shop"
                className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive('/shop') || isActive('/collections') || isActive('/product')
                    ? 'text-[#111111] font-semibold bg-[#B6F500]/25'
                    : 'text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4]'
                }`}
              >
                <span>Shop</span>
                {(isActive('/shop') || isActive('/collections') || isActive('/product')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                )}
              </Link>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border border-[#E7E3DA] bg-[#FAF8F4] text-[#111111] text-xs font-mono flex items-center justify-center gap-1.5 hover:border-[#6BAA00] transition-colors cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>{cartCount}</span>
          </button>

          <CurrencySelector variant="navbar" align="right" />

          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111111] text-[#FAF8F4] font-sans text-xs font-semibold hover:opacity-90 transition-all duration-200 shadow-sm active:scale-95 group"
          >
            <span>Let&apos;s talk</span>
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden relative flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00] ml-0.5 touch-manipulation cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <span
              className={`absolute block h-[2px] rounded-full bg-[#111111] transition-all duration-300 ${
                mobileOpen ? 'w-5 rotate-45' : 'w-5 -translate-y-[6px]'
              }`}
            />
            <span
              className={`absolute block h-[2px] rounded-full bg-[#111111] transition-all duration-300 ${
                mobileOpen ? 'w-0 opacity-0' : 'w-3.5 translate-x-[3px]'
              }`}
            />
            <span
              className={`absolute block h-[2px] rounded-full bg-[#111111] transition-all duration-300 ${
                mobileOpen ? 'w-5 -rotate-45' : 'w-5 translate-y-[6px]'
              }`}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-[#111111]/25 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              ref={drawerRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Drawer"
              className="fixed top-0 right-0 bottom-0 h-[100dvh] w-[88vw] max-w-sm bg-[#FAF8F4] border-l border-[#E7E3DA] text-[#111111] shadow-2xl z-[60] md:hidden flex flex-col p-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-[#E7E3DA] shrink-0">
                <span className="font-display text-2xl font-semibold text-[#111111]">
                  Mushaf<span className="text-[#6BAA00]">.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-[#E7E3DA] text-[#111111] hover:border-[#6BAA00] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-1 font-display text-2xl">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/work', label: 'Work' },
                  { to: '/services', label: 'Services Hub' },
                  { to: '/shop', label: 'Studio Store' },
                  { to: '/about', label: 'About' },
                  { to: '/process', label: '14-Day Process' },
                  { to: '/pricing', label: 'Pricing' },
                  { to: '/contact', label: 'Contact & Brief' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`min-h-[48px] flex items-center px-4 py-2 rounded-2xl transition-colors ${
                      pathname === link.to
                        ? 'bg-[#B6F500]/25 text-[#111111] font-semibold'
                        : 'text-[#111111] hover:bg-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-5 pt-5 border-t border-[#E7E3DA] space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#5B5B56] px-2 mb-2">
                  Specializations
                </p>
                {SERVICES.map((svc) => (
                  <Link
                    key={svc.slug}
                    to={`/services/${svc.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="min-h-[44px] flex items-center px-3 py-2 rounded-xl text-xs font-mono text-[#5B5B56] hover:text-[#111111] hover:bg-white"
                  >
                    {svc.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#E7E3DA] space-y-3">
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-full bg-[#B6F500] text-[#111111] font-sans text-sm font-semibold shadow-sm"
                >
                  <span>Start a Project</span>
                  <span>&rarr;</span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={STUDIO_INFO.fiverr}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center justify-center gap-1 rounded-full bg-[#00B22D]/15 border border-[#00B22D]/40 text-[#00B22D] font-mono text-[11px] font-bold"
                  >
                    <span>Fiverr</span>
                    <ArrowUpRight size={12} />
                  </a>
                  <a
                    href={`https://instagram.com/${STUDIO_INFO.instagramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center justify-center gap-1 rounded-full border border-[color:var(--border-subtle)] text-[color:var(--text-secondary)] font-mono text-[11px]"
                  >
                    <span>Instagram</span>
                    <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
