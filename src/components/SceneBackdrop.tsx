import React, { useEffect, useRef, useState } from 'react';
import { BACKDROP_POSTERS, BACKDROP_VIDEOS } from '../data/studioData';
import { useTheme } from '../context/ThemeContext';
import { useIsReducedMotion } from '../hooks/usePortfolioHelpers';

const BackdropVideo: React.FC = () => {
  const { theme } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [videoReadyToAttach, setVideoReadyToAttach] = useState(false);
  const reducedMotion = useIsReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setVideoReadyToAttach(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => setVideoReadyToAttach(true), 600);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const mode = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    setHasError(false);
    setPosterError(false);
  }, [mode]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {reducedMotion || hasError || !videoReadyToAttach ? (
        !posterError && (
          <img
            src={BACKDROP_POSTERS[mode]}
            alt=""
            className="w-full h-full object-cover"
            width={960}
            height={540}
            loading="lazy"
            decoding="async"
            onError={() => setPosterError(true)}
          />
        )
      ) : (
        <video
          key={mode}
          src={BACKDROP_VIDEOS[mode]}
          poster={BACKDROP_POSTERS[mode]}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export const SceneBackdrop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useIsReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.style.setProperty('--p', '0.2');
      return;
    }

    let rafId = 0;
    let current = 0;
    let target = 0;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    const tick = () => {
      if (!document.hidden) {
        const delta = target - current;
        if (Math.abs(delta) > 0.0004) {
          current += delta * 0.06;
          el.style.setProperty('--p', current.toFixed(4));
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} aria-hidden="true" className="scene-backdrop">
      <BackdropVideo />
      <div className="sb-beam" />
      <div className="sb-core" />
      <div className="sb-glow-top" />
      <div className="sb-grid" />
      <div className="sb-vig" />
    </div>
  );
};
