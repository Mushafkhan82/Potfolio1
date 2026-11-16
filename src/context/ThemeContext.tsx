import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (x?: number, y?: number) => void;
  setTheme: (next: Theme) => void;
}

const THEME_STORAGE_KEY = 'mushaf_portfolio_theme';

let sharedAudioCtx: AudioContext | null = null;

function isAmbientSoundEnabled(): boolean {
  try {
    return localStorage.getItem('mushaf_ambient_sound') === 'true';
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playThemeSwitchSound() {
  if (!isAmbientSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function playFlipTickSound() {
  if (!isAmbientSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.045);
}

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return 'light';
}

function applyThemeToDom(next: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(next);
  root.setAttribute('data-theme', next);
  root.style.colorScheme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', next === 'dark' ? '#090B08' : '#FAF8F4');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {}
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToDom(next);
  }, []);

  const toggleTheme = useCallback(
    (x?: number, y?: number) => {
      playThemeSwitchSound();
      const next: Theme = theme === 'light' ? 'dark' : 'light';
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };

      if (
        !prefersReduced &&
        typeof doc.startViewTransition === 'function' &&
        typeof x === 'number' &&
        typeof y === 'number'
      ) {
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
        const transition = doc.startViewTransition(() => {
          setThemeState(next);
          applyThemeToDom(next);
        });
        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 480,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          })
          .catch(() => {});
        return;
      }

      setThemeState(next);
      applyThemeToDom(next);
    },
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
