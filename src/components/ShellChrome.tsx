import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Home, Briefcase, Layers, Mail, VolumeX, ShoppingBag, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isCoarsePointer, useIsReducedMotion, usePerformanceTier } from '../hooks/usePortfolioHelpers';

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

export const CustomCursor: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'pointer' | 'view'>('default');
  const { isLite } = usePerformanceTier();
  const reducedMotion = useIsReducedMotion();

  const springOuter = { damping: 28, stiffness: 350, mass: 0.5 };
  const outerX = useSpring(-100, springOuter);
  const outerY = useSpring(-100, springOuter);
  const innerX = useSpring(-100, { damping: 45, stiffness: 800 });
  const innerY = useSpring(-100, { damping: 45, stiffness: 800 });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      isLite ||
      reducedMotion
    ) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      outerX.set(e.clientX);
      outerY.set(e.clientY);
      innerX.set(e.clientX);
      innerY.set(e.clientY);
      setVisible(true);
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-cursor='view']") || target.closest('.project-card')) {
        setCursorMode('view');
      } else if (
        target.closest(
          "a, button, input, textarea, select, [role='slider'], [data-cursor='pointer']"
        )
      ) {
        setCursorMode('pointer');
      } else {
        setCursorMode('default');
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [outerX, outerY, innerX, innerY, isLite, reducedMotion]);

  if (isLite || reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      <motion.div
        style={{ x: outerX, y: outerY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: cursorMode === 'view' ? 76 : cursorMode === 'pointer' ? 44 : 26,
          height: cursorMode === 'view' ? 76 : cursorMode === 'pointer' ? 44 : 26,
          backgroundColor:
            cursorMode === 'view'
              ? 'rgba(182,245,0,0.95)'
              : cursorMode === 'pointer'
                ? 'rgba(255,255,255,0.72)'
                : 'rgba(255,255,255,0.45)',
          borderColor:
            cursorMode === 'view'
              ? 'transparent'
              : cursorMode === 'pointer'
                ? 'rgba(107,170,0,0.85)'
                : 'rgba(17,17,17,0.28)',
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-full border flex items-center justify-center select-none"
      >
        {cursorMode === 'view' && (
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#111111]">
            VIEW
          </span>
        )}
      </motion.div>
      <motion.div
        style={{ x: innerX, y: innerY, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible && cursorMode !== 'view' ? 1 : 0 }}
        className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]"
      />
    </div>
  );
};

export const Preloader: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isCoarsePointer()) {
      onComplete?.();
      return;
    }
    try {
      if (sessionStorage.getItem('mushaf_preloader_seen') === 'true') {
        onComplete?.();
        return;
      }
    } catch {}

    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem('mushaf_preloader_seen', 'true');
      } catch {}
      onComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{
            clipPath: 'inset(0% 0% 100% 0%)',
            transition: { duration: 0.65, ease: [0.77, 0, 0.18, 1] },
          }}
          className="fixed inset-0 z-[9999] bg-[#FAF8F4] flex flex-col items-center justify-center select-none overflow-hidden pointer-events-none"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <span className="font-display text-4xl sm:text-5xl text-[#111111] tracking-tight mb-4">
            Mushaf<span className="text-[#6BAA00]">.</span>
          </span>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-36 h-[2px] bg-[#6BAA00] origin-left rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ThemePullTag: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [pulling, setPulling] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  const isDark = theme === 'dark';

  const handlePull = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPulling(true);
    setTimeout(() => setPulling(false), 320);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    toggleTheme(x, y);
  };

  return (
    <div
      data-theme-pull
      className="fixed top-0 right-1.5 sm:right-6 lg:right-10 z-[55] flex flex-col items-center pointer-events-none select-none"
    >
      <motion.button
        type="button"
        onClick={handlePull}
        initial={false}
        animate={{ y: pulling ? 12 : 0 }}
        whileHover={{ y: 4 }}
        whileTap={{ y: 12 }}
        transition={{ type: 'spring', stiffness: 460, damping: 20 }}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Pull for Light Theme' : 'Pull for Dark Theme'}
        className="pointer-events-auto group flex flex-col items-center focus:outline-none cursor-pointer touch-manipulation"
      >
        {/* Hanging Cord anchored to top viewport edge */}
        <span
          aria-hidden="true"
          className={`block w-[1.5px] h-3.5 sm:h-6 transition-colors ${
            isDark
              ? 'bg-[#C6F432]/70 group-hover:bg-[#C6F432]'
              : 'bg-[#111111]/35 group-hover:bg-[#6BAA00]'
          }`}
        />

        {/* Brass / Lime Eyelet Ring */}
        <span
          aria-hidden="true"
          className={`w-2.5 h-2.5 rounded-full border-[1.5px] -my-0.5 z-10 transition-colors ${
            isDark
              ? 'bg-[#090B08] border-[#C6F432]'
              : 'bg-[#FAF8F4] border-[#111111]/45 group-hover:border-[#6BAA00]'
          }`}
        />

        {/* Tactile Hanging Pull Tag */}
        <span
          className={`min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 py-1.5 rounded-b-2xl rounded-t-md flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all ${
            isDark
              ? 'glass-strong !border-[#C6F432]/45 text-[#C6F432] shadow-[0_10px_24px_-6px_rgba(0,0,0,0.7)] hover:!border-[#C6F432]'
              : 'glass-strong text-[#111111] hover:border-[#6BAA00]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-[0_0_10px_rgba(182,245,0,0.55)] ${
              isDark
                ? 'bg-[#C6F432] text-[#111111]'
                : 'bg-[#B6F500] text-[#111111]'
            }`}
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
          </span>
          <span className="hidden sm:inline">
            {isDark ? 'M. DARK' : 'M. LIGHT'}
          </span>
        </span>
      </motion.button>
    </div>
  );
};

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/work', label: 'Work', Icon: Briefcase },
  { to: '/services', label: 'Services', Icon: Layers },
  { to: '/shop', label: 'Shop', Icon: ShoppingBag },
  { to: '/contact', label: 'Contact', Icon: Mail },
];

export const MobileTabBar: React.FC = () => {
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      setHidden(currentY > lastY && currentY > 120);
      lastY = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const state = { navOpen: false, cartOpen: false, chatOpen: false };
    const onOverlay = (e: Event) => {
      const detail = (e as CustomEvent<{ navOpen?: boolean; cartOpen?: boolean; chatOpen?: boolean }>).detail || {};
      if (typeof detail.navOpen === 'boolean') state.navOpen = detail.navOpen;
      if (typeof detail.cartOpen === 'boolean') state.cartOpen = detail.cartOpen;
      if (typeof detail.chatOpen === 'boolean') state.chatOpen = detail.chatOpen;
      setOverlayHidden(state.navOpen || state.cartOpen || state.chatOpen);
    };
    window.addEventListener('mk-overlay-state', onOverlay);
    return () => window.removeEventListener('mk-overlay-state', onOverlay);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  const activePath = MOBILE_NAV_ITEMS.filter((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  ).pop()?.to;

  return (
    <nav
      aria-label="Quick navigation"
      className={`md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 z-40 glass-strong rounded-full px-1.5 py-1 flex items-center justify-between isolate transition-transform duration-300 ${
        hidden || overlayHidden ? 'translate-y-[160%] pointer-events-none' : 'translate-y-0'
      }`}
    >
      {MOBILE_NAV_ITEMS.map(({ to, label, Icon }) => {
        const isActive = to === activePath;
        return (
          <Link
            key={to}
            to={to}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium text-[#5B5B56]"
          >
            {isActive && (
              <motion.span
                layoutId="tabbar-lens"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-x-1 inset-y-0.5 rounded-full"
                style={{
                  zIndex: -1,
                  background: 'rgba(182,245,0,0.28)',
                  boxShadow: 'inset 0 0 0 1px rgba(107,170,0,0.45)',
                }}
              />
            )}
            <Icon size={17} className={isActive ? 'text-[#6BAA00]' : ''} />
            <span className={isActive ? 'text-[#111111] font-semibold' : ''}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export const AmbientSoundToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);

  const stop = () => {
    if (gainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const gain = gainRef.current;
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
      setTimeout(() => {
        oscsRef.current.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {}
        });
        oscsRef.current = [];
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
        }
        audioCtxRef.current = null;
        gainRef.current = null;
      }, 850);
    }
    setEnabled(false);
    try {
      localStorage.setItem('mushaf_ambient_sound', 'false');
    } catch {}
  };

  useEffect(() => {
    return () => stop();
  }, []);

  const start = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.connect(masterGain);

      const freqs = [87.31, 130.81, 174.61, 220];
      const created: OscillatorNode[] = [];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.03, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25 / freqs.length, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        created.push(osc, lfo);
      });

      oscsRef.current = created;
      setEnabled(true);
      try {
        localStorage.setItem('mushaf_ambient_sound', 'true');
      } catch {}
    } catch (err) {
      console.warn('Could not start ambient audio:', err);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Mute ambient sound' : 'Play subtle ambient sound'}
      onClick={() => (enabled ? stop() : start())}
      className={`group min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
        enabled
          ? 'bg-[#B6F500]/25 border-[#6BAA00] text-[#111111] shadow-sm'
          : 'glass-pill text-[#5B5B56] hover:text-[#111111] hover:border-[#6BAA00]/60'
      }`}
    >
      {enabled ? (
        <>
          <span className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 h-2 bg-[#6BAA00]" />
            <span className="w-0.5 h-3 bg-[#6BAA00]" />
            <span className="w-0.5 h-1.5 bg-[#6BAA00]" />
          </span>
          <span className="text-[#111111] font-semibold">Audio On</span>
        </>
      ) : (
        <>
          <VolumeX
            size={12}
            className="text-[#5B5B56] group-hover:text-[#111111]"
          />
          <span>Audio Off</span>
        </>
      )}
    </button>
  );
};
