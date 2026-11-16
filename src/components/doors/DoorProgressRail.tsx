/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SERVICES_DOORS_DATA } from './doorsConfig.ts';

interface DoorProgressRailProps {
  activeIndex: number;
  onSelectDoor: (index: number) => void;
  isDarkMode: boolean;
}

export function DoorProgressRail({
  activeIndex,
  onSelectDoor,
  isDarkMode,
}: DoorProgressRailProps) {
  return (
    <>
      {/* Desktop Vertical Progress Rail (Right Side) */}
      <div
        className="hidden md:flex fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3.5 select-none"
        aria-label="Services door navigation"
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--text-muted)] rotate-90 origin-right translate-x-2 mb-4 font-bold">
          8 DOORS
        </span>

        {SERVICES_DOORS_DATA.map((door, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={door.slug}
              type="button"
              onClick={() => onSelectDoor(idx)}
              aria-label={`Jump to Door ${door.index}: ${door.name}`}
              className="group flex items-center gap-2.5 py-1 text-right focus:outline-none cursor-pointer"
            >
              {/* Tooltip on hover */}
              <span
                className={`text-xs font-mono tracking-wider transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 ${
                  isActive
                    ? 'text-[color:var(--accent-text)] font-bold'
                    : 'text-[color:var(--text-secondary)]'
                }`}
              >
                {door.name}
              </span>

              {/* Number indicator */}
              <span
                className={`font-mono text-xs transition-colors duration-300 ${
                  isActive
                    ? 'text-[color:var(--text-primary)] font-bold scale-110'
                    : 'text-[color:var(--text-muted)] group-hover:text-[color:var(--text-primary)]'
                }`}
              >
                {door.index}
              </span>

              {/* Dot pill */}
              <span
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-7 h-1.5 bg-[#C6F432] shadow-[0_0_12px_rgba(198,244,50,0.6)]'
                    : 'w-2 h-1.5 bg-black/20 dark:bg-white/20 group-hover:bg-black/40 dark:group-hover:bg-white/40'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Mobile Horizontal Bottom Dots */}
      <div className="md:hidden fixed bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 dark:bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
          {SERVICES_DOORS_DATA.map((door, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={door.slug}
                type="button"
                onClick={() => onSelectDoor(idx)}
                aria-label={`Door ${door.index}: ${door.name}`}
                className="p-1 cursor-pointer focus:outline-none"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-5 h-2 bg-[#C6F432]'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
export default DoorProgressRail;
