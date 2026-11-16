/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Volume2, VolumeX, Eye, Grid, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { SERVICES_DOORS_DATA, ServiceDoorItem } from './doorsConfig.ts';
import { ArchedDoorsScene } from './ArchedDoorsScene.ts';
import { doorAudio } from './DoorAudio.ts';
import { ServicesStaticFallback } from './ServicesStaticFallback.tsx';

interface ServicesDoorsProps {
  onNavigate: (slug: string) => void;
}

export function ServicesDoors({ onNavigate }: ServicesDoorsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ArchedDoorsScene | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isOverview, setIsOverview] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Check prefers-reduced-motion or missing WebGL
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasWebGL = (() => {
      try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    })();

    if (prefersReducedMotion || !hasWebGL) {
      setUseFallback(true);
    }
  }, []);

  // Initialize Arched Doors Scene with Zoom-Out capability
  useEffect(() => {
    if (useFallback || !canvasRef.current) return;

    // Check if returning from a service page for the cinematic zoom-out effect
    let startWithZoomOut = false;
    try {
      if (sessionStorage.getItem('doors_zoom_out') === 'true') {
        startWithZoomOut = true;
        sessionStorage.removeItem('doors_zoom_out');
      }
    } catch {}

    const dark = true; // Video theme is dark, sleek aesthetic
    const scene = new ArchedDoorsScene(canvasRef.current, dark, startWithZoomOut);
    sceneRef.current = scene;

    scene.onActiveIndexChange = (idx) => {
      setActiveIndex(idx);
    };

    scene.onDoorClick = (service) => {
      handleOpenService(service.slug);
    };

    // If starting with zoom-out, focus on the first door or stored active door
    if (!startWithZoomOut) {
      scene.focusDoor(0);
    }

    // IntersectionObserver to pause rendering when offscreen
    const io = new IntersectionObserver(
      ([entry]) => {
        scene.setVisibility(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) io.observe(containerRef.current);

    return () => {
      io.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [useFallback]);

  // Handle scroll progress
  useEffect(() => {
    if (useFallback || isOverview) return;

    let rafId = 0;
    const handleScroll = () => {
      if (!containerRef.current || !sceneRef.current || isTransitioning) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = -rect.top;
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollY / totalScrollable));
      sceneRef.current.setScrollProgress(progress);
    };

    const onScrollTick = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScrollTick, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollTick);
    };
  }, [isOverview, isTransitioning, useFallback]);

  // Open active service with transition
  const handleOpenService = useCallback(
    (slugOverride?: string) => {
      const activeDoor = SERVICES_DOORS_DATA[activeIndex];
      const targetSlug = slugOverride || activeDoor?.slug;
      if (!targetSlug || isTransitioning) return;

      setIsTransitioning(true);
      if (sceneRef.current) {
        sceneRef.current.startWalkthroughTransition(() => {
          onNavigate(targetSlug);
        });
      } else {
        onNavigate(targetSlug);
      }
    },
    [activeIndex, isTransitioning, onNavigate]
  );

  // Jump to specific door
  const handleSelectDoor = (index: number) => {
    setIsOverview(false);
    if (sceneRef.current) {
      sceneRef.current.focusDoor(index);
    }
    setActiveIndex(index);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    const doorProgress = (index + 0.5) / SERVICES_DOORS_DATA.length;
    const targetY = window.scrollY + rect.top + doorProgress * totalScrollable;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });
  };

  // Toggle Overview Mode (All Doors View vs Focused Door View)
  const toggleOverview = () => {
    const next = !isOverview;
    setIsOverview(next);
    if (sceneRef.current) {
      sceneRef.current.setOverviewMode(next);
    }
  };

  // Audio Toggle
  const toggleSound = () => {
    const muted = doorAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      doorAudio.playDoorOpen();
    }
  };

  if (useFallback) {
    return <ServicesStaticFallback onSelectService={onNavigate} />;
  }

  const currentService = SERVICES_DOORS_DATA[activeIndex] || SERVICES_DOORS_DATA[0];

  return (
    <section
      ref={containerRef}
      id="services-doors-section"
      aria-label="Magic happens behind the doors"
      className="relative w-full"
      style={{
        // 8 doors scroll track for smooth corridor scrubbing
        height: isOverview ? '100dvh' : 'calc(8 * 110vh)',
      }}
    >
      {/* Pinned Sticky Viewport Container */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex flex-col justify-between select-none bg-[#0a0a0d]">
        {/* Full-bleed 3D WebGL Canvas */}
        <div className="absolute inset-0 w-full h-full z-10 touch-pan-y">
          <canvas
            ref={canvasRef}
            className={`w-full h-full block touch-pan-y ${isTransitioning ? 'pointer-events-none' : 'cursor-pointer'}`}
            title="Click door or scroll to explore"
          />
        </div>

        {/* Top Header Overlay: "Magic happens behind the doors" (exact to video) */}
        <div className="relative z-20 pt-6 sm:pt-10 px-4 sm:px-12 flex flex-col gap-3">
          {/* Top Video Sub-Bar (matching 00:04 in video) */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-white/50 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F432] animate-pulse" />
              <span>Available for work</span>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="hidden sm:inline text-white/70">Services and more</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden xs:inline">Scroll to explore ↓</span>
              {/* Audio Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
                className="w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white transition-all cursor-pointer"
                title={isMuted ? 'Sound Muted' : 'Sound Enabled'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#C6F432]" />}
              </button>
              {/* Overview / Focus Switcher */}
              <button
                type="button"
                onClick={toggleOverview}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-mono text-white/90 hover:text-white transition-all cursor-pointer"
              >
                <Grid size={13} className={isOverview ? 'text-[#C6F432]' : ''} />
                <span>{isOverview ? 'Focus Door' : 'All Doors'}</span>
              </button>
            </div>
          </div>

          {/* Heading with Mirrored Floor Reflection (exact to video at 00:04 & 00:06) */}
          <div className="relative self-center text-center mt-2 pointer-events-none">
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] drop-shadow-xl">
              Magic happens behind the doors
            </h2>
            <h2
              aria-hidden="true"
              className="font-display text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] opacity-25 -scale-y-100 blur-[2px] mt-0.5 select-none"
              style={{
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              }}
            >
              Magic happens behind the doors
            </h2>
          </div>
        </div>

        {/* Right Wall Context Panel (Exact to Video at 00:05) */}
        {!isOverview && (
          <div className="relative z-20 self-center sm:self-end mx-4 sm:mx-0 sm:mr-12 lg:mr-20 max-w-sm sm:max-w-md pointer-events-auto transition-all duration-500">
            <div className="p-4 sm:p-6 rounded-3xl bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl">
              {/* Service Title */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-[11px] font-bold text-[#C6F432] bg-[#C6F432]/15 px-2.5 py-0.5 rounded-full border border-[#C6F432]/30">
                  DOOR {currentService.index} // 08
                </span>
                <span className="font-mono text-xs text-white/60">
                  {currentService.stat}
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-white font-medium mb-2">
                {currentService.name}
              </h3>

              <p className="font-sans text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
                {currentService.benefit}
              </p>

              {/* Scope & Deliverables Checklist with Icons (Exact to Video at 00:05) */}
              <div className="space-y-2 mb-5">
                {currentService.deliverables.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-mono">
                    <CheckCircle2 size={14} className="text-[#C6F432] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Enter Service CTA */}
              <button
                type="button"
                onClick={() => handleOpenService()}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#C6F432] hover:bg-[#b5e028] text-[#050505] font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg group cursor-pointer"
              >
                <span>Open service</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Horizontal All-Doors Category Rail */}
        <div className="relative z-20 pb-6 sm:pb-8 px-4 sm:px-12 flex flex-col items-center gap-3">
          <div className="w-full max-w-5xl overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 min-w-max mx-auto justify-center bg-black/70 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              {SERVICES_DOORS_DATA.map((door, idx) => {
                const isActive = idx === activeIndex && !isOverview;
                return (
                  <button
                    key={door.slug}
                    type="button"
                    onClick={() => handleSelectDoor(idx)}
                    className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl font-mono text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#C6F432] text-[#050505] font-bold shadow-md scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">{door.index}</span>
                    <span className="whitespace-nowrap">{door.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Walkthrough Flash Overlay */}
        {isTransitioning && (
          <div
            className="fixed inset-0 z-50 bg-[#C6F432] pointer-events-none transition-opacity duration-700"
            style={{
              opacity: 0.9,
              animation: 'doorFlash 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          />
        )}
      </div>
    </section>
  );
}

export default ServicesDoors;
