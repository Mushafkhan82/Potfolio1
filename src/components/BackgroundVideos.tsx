import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return reducedMotion;
}

export function useSaveDataPreference(): boolean {
  const [saveData] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return Boolean(conn?.saveData);
  });
  return saveData;
}

/**
 * Coordinates simultaneous active playing ambient videos across the viewport,
 * enforcing a hard cap of 3 active playing videos at any time so mobile GPUs stay responsive.
 */
const MAX_ACTIVE_AMBIENT_VIDEOS = 3;
const activeVideoRegistry = new Map<string, HTMLVideoElement>();
const activeVideoOrder: string[] = [];

function requestPlaySlot(id: string, video: HTMLVideoElement) {
  const existingIdx = activeVideoOrder.indexOf(id);
  if (existingIdx !== -1) {
    activeVideoOrder.splice(existingIdx, 1);
  }
  activeVideoOrder.push(id);
  activeVideoRegistry.set(id, video);

  while (activeVideoOrder.length > MAX_ACTIVE_AMBIENT_VIDEOS) {
    const oldestId = activeVideoOrder.shift();
    if (oldestId) {
      const oldestVideo = activeVideoRegistry.get(oldestId);
      if (oldestVideo && !oldestVideo.paused) {
        oldestVideo.pause();
      }
      activeVideoRegistry.delete(oldestId);
    }
  }

  video.muted = true;
  video.defaultMuted = true;
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Ignore autoplay restrictions in power-saving modes; poster or CSS gradient stays visible
    });
  }
}

function releasePlaySlot(id: string, video?: HTMLVideoElement | null) {
  const idx = activeVideoOrder.indexOf(id);
  if (idx !== -1) {
    activeVideoOrder.splice(idx, 1);
  }
  activeVideoRegistry.delete(id);
  if (video && !video.paused) {
    video.pause();
  }
}

export interface AmbientVideoProps {
  mp4Src: string;
  webmSrc?: string;
  posterSrc?: string;
  aspectRatioClass?: string;
  className?: string;
  videoClassName?: string;
  overlayClassName?: string;
  playOnHover?: boolean;
  isHovered?: boolean;
  priority?: boolean;
  fallbackGradient?: string;
  children?: React.ReactNode;
}

export const AmbientVideo: React.FC<AmbientVideoProps> = ({
  mp4Src,
  webmSrc,
  posterSrc,
  aspectRatioClass = '',
  className = '',
  videoClassName = 'opacity-100',
  overlayClassName = 'bg-white/65',
  playOnHover = false,
  isHovered = false,
  priority = false,
  fallbackGradient,
  children,
}) => {
  const instanceId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const saveData = useSaveDataPreference();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [nearViewport, setNearViewport] = useState(priority);
  const [inViewport, setInViewport] = useState(priority);
  const [isMobileOrTouch, setIsMobileOrTouch] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [localHovered, setLocalHovered] = useState(false);

  const posterOnly = reducedMotion || saveData || videoFailed;
  const effectiveHover = isHovered || localHovered;

  useEffect(() => {
    setVideoFailed(false);
    setPosterFailed(false);
  }, [mp4Src, webmSrc, posterSrc]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const hoverMq = window.matchMedia('(hover: none), (max-width: 1023px)');
    const sync = () => setIsMobileOrTouch(hoverMq.matches);
    sync();
    if (typeof hoverMq.addEventListener === 'function') {
      hoverMq.addEventListener('change', sync);
      return () => hoverMq.removeEventListener('change', sync);
    }
    hoverMq.addListener(sync);
    return () => hoverMq.removeListener(sync);
  }, []);

  // Lazy-load below-the-fold videos when within 200px of viewport
  useEffect(() => {
    if (priority || posterOnly) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      setInViewport(true);
      return;
    }

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0.12 }
    );

    preloadObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [priority, posterOnly]);

  // Coordinate play/pause cleanly respecting intersection & 3-video concurrent ceiling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || posterOnly) return;

    const shouldPlay = playOnHover
      ? (isMobileOrTouch && inViewport) || effectiveHover
      : inViewport;

    if (shouldPlay && nearViewport) {
      requestPlaySlot(instanceId, video);
    } else {
      releasePlaySlot(instanceId, video);
    }

    return () => {
      releasePlaySlot(instanceId, video);
    };
  }, [
    instanceId,
    posterOnly,
    playOnHover,
    isMobileOrTouch,
    inViewport,
    effectiveHover,
    nearViewport,
  ]);

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => playOnHover && setLocalHovered(true)}
      onMouseLeave={() => playOnHover && setLocalHovered(false)}
      className={`relative overflow-hidden ${aspectRatioClass} ${className}`.trim()}
    >
      {/* Fallback soft CSS gradient when poster or video is unavailable */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 light-video-fallback"
        style={fallbackGradient ? { background: fallbackGradient } : undefined}
      />

      {posterSrc && !posterFailed && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setPosterFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {!posterOnly && nearViewport && (
        <video
          key={`${mp4Src}|${webmSrc || ''}`}
          ref={videoRef}
          muted
          loop
          playsInline
          preload={nearViewport ? 'metadata' : 'none'}
          poster={posterSrc}
          aria-hidden="true"
          onError={handleVideoError}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transform-gpu transition-opacity duration-500 ${videoClassName}`}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={mp4Src} type="video/mp4" onError={handleVideoError} />
        </video>
      )}

      {overlayClassName && (
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${overlayClassName}`} />
      )}

      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
};

export const HeroVideoBackground: React.FC = () => {
  const { theme } = useTheme();
  const variant = theme === 'dark' ? 'dark' : 'light';
  const webmSrc = `/videos/hero-ambient-${variant}.webm`;
  const mp4Src = `/videos/hero-ambient-${variant}.mp4`;
  const posterSrc = `/videos/hero-ambient-${variant}-poster.webp`;

  const overlayClassName =
    variant === 'dark'
      ? 'bg-gradient-to-r from-[#090B08]/90 via-[#090B08]/68 to-[#090B08]/40'
      : 'bg-gradient-to-r from-[#FAF8F4]/92 via-[#FAF8F4]/72 to-[#FAF8F4]/45';

  return (
    <AmbientVideo
      mp4Src={mp4Src}
      webmSrc={webmSrc}
      posterSrc={posterSrc}
      priority
      overlayClassName={overlayClassName}
      className="pointer-events-none !absolute inset-0 -z-10 select-none"
    />
  );
};

interface ScrollScrubVideoProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollScrubVideo: React.FC<ScrollScrubVideoProps> = ({
  children,
  className = '',
}) => {
  const { theme } = useTheme();
  const variant = theme === 'dark' ? 'dark' : 'light';
  const reducedMotion = usePrefersReducedMotion();
  const saveData = useSaveDataPreference();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const webmSrc = `/videos/work-scroll-${variant}.webm`;
  const mp4Src = `/videos/work-scroll-${variant}.mp4`;
  const posterSrc = `/videos/work-scroll-${variant}-poster.webp`;
  const posterOnly = reducedMotion || saveData || videoFailed;

  useEffect(() => {
    setVideoFailed(false);
  }, [variant]);

  useEffect(() => {
    if (posterOnly) return;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.pause();

    let rafId = 0;
    let pendingTarget: number | null = null;

    const applySeek = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const trackDistance = rect.height - viewportH;
      const rawProgress =
        trackDistance > 0
          ? -rect.top / trackDistance
          : (viewportH - rect.top) / (viewportH + rect.height);
      const progress = Math.max(0, Math.min(1, rawProgress));
      const targetTime = progress * Math.max(0, duration - 0.04);

      if (video.seeking) {
        pendingTarget = targetTime;
        return;
      }

      if (Math.abs(video.currentTime - targetTime) > 0.016) {
        video.currentTime = targetTime;
      }
    };

    const scheduleSync = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        applySeek();
      });
    };

    const handleSeeked = () => {
      if (pendingTarget !== null && !video.seeking) {
        const next = pendingTarget;
        pendingTarget = null;
        if (Math.abs(video.currentTime - next) > 0.016) {
          video.currentTime = next;
        }
      }
    };

    const handleLoadedMetadata = () => {
      video.pause();
      applySeek();
    };

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    if (video.readyState >= 1) {
      applySeek();
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [posterOnly]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate w-full min-h-[100vh] supports-[height:100dvh]:min-h-[100dvh] ${className}`.trim()}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 h-[100vh] supports-[height:100dvh]:h-[100dvh] -mb-[100vh] supports-[height:100dvh]:-mb-[100dvh] w-full overflow-hidden -z-10 select-none"
      >
        {posterOnly ? (
          <img
            src={posterSrc}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            key={variant}
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster={posterSrc}
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover transform-gpu"
          >
            <source src={webmSrc} type="video/webm" />
            <source src={mp4Src} type="video/mp4" />
          </video>
        )}
        <div
          className={`absolute inset-0 ${
            variant === 'dark' ? 'bg-[#090B08]/68' : 'bg-[#FAF8F4]/72'
          }`}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
