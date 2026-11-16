/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Check, Sparkles, TrendingUp } from 'lucide-react';
import { ServiceDoorItem } from './doorsConfig.ts';
import { DoorwayBounds } from './DoorScene.ts';

interface DoorPagePreviewProps {
  service: ServiceDoorItem;
  bounds: DoorwayBounds | null;
  onEnterService: () => void;
  isDarkMode: boolean;
}

export function DoorPagePreview({
  service,
  bounds,
  onEnterService,
  isDarkMode,
}: DoorPagePreviewProps) {
  if (!bounds || bounds.width <= 10 || bounds.height <= 10) return null;

  // Opacity & Blur transition based on door open progress
  // Starts translucent and frosted, becomes crisp by p=0.60
  const openProgress = bounds.progress; // 0 (closed) -> 1 (fully open)
  const isVisible = openProgress > 0.05;

  if (!isVisible) return null;

  const blurAmount = Math.max(0, (1 - Math.min(1, openProgress / 0.85)) * 14);
  const opacity = Math.min(1, Math.max(0, (openProgress - 0.08) / 0.5));

  // Compute CSS style positioned directly inside the doorway opening
  const portalStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    opacity,
    filter: blurAmount > 0.5 ? `blur(${blurAmount}px)` : 'none',
    transition: 'filter 0.12s ease-out',
    pointerEvents: openProgress > 0.55 ? 'auto' : 'none',
    overflow: 'hidden',
  };

  return (
    <div
      style={portalStyle}
      className="z-10 rounded-sm select-none shadow-2xl flex flex-col justify-between"
      aria-hidden={openProgress < 0.4}
    >
      {/* Rich Room / Portal Interior Background */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#181a1f] via-[#121316] to-[#0c0d0f] text-white'
            : 'bg-gradient-to-b from-[#f8f6f0] via-[#ede9e0] to-[#ded9cd] text-[#1a1917]'
        }`}
      >
        {/* Subtle interior lighting glow */}
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#C6F432]/12 via-[#C6F432]/04 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(198,244,50,0.08),transparent_70%)] pointer-events-none" />
      </div>

      {/* Scaled-Down Content Layout */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col h-full justify-between overflow-y-auto">
        {/* Header Badge */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase font-bold text-[#C6F432] bg-[#C6F432]/15 px-2.5 py-1 rounded-full border border-[#C6F432]/30">
              {service.badge}
            </span>
            <span className="font-mono text-[10px] tracking-wider uppercase opacity-60">
              DISCIPLINE {service.index}
            </span>
          </div>

          <h3 className="font-display font-medium text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight mb-2">
            {service.name}
          </h3>

          <p className="font-sans text-xs sm:text-sm opacity-80 leading-relaxed mb-4 line-clamp-2">
            {service.headline}
          </p>

          {/* Key Deliverables Pills */}
          <div className="space-y-1.5 my-3">
            <span className="font-mono text-[9px] uppercase tracking-wider opacity-50 block font-semibold">
              Deliverables Included:
            </span>
            {service.deliverables.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] sm:text-xs">
                <span className="w-3.5 h-3.5 rounded-full bg-[#C6F432] text-[#050505] flex items-center justify-center shrink-0">
                  <Check size={9} strokeWidth={3} />
                </span>
                <span className="font-sans font-medium line-clamp-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Highlight Stat & Action */}
        <div className="pt-3 border-t border-black/10 dark:border-white/10 mt-auto space-y-3">
          {/* Growth Stat Badge */}
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-[#C6F432]" />
              <span className="font-mono text-[10px] opacity-70 uppercase tracking-wider">Outcome</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#C6F432]">{service.stat}</span>
          </div>

          {/* Enter Service Button */}
          <button
            type="button"
            onClick={onEnterService}
            className="w-full py-2.5 px-4 rounded-full bg-[#C6F432] hover:bg-[#b5e028] text-[#050505] font-sans font-semibold text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md group"
          >
            <span>Open Service Page</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default DoorPagePreview;
