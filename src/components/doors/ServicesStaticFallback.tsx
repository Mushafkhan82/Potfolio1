/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SERVICES_DOORS_DATA, ServiceDoorItem } from './doorsConfig.ts';

interface ServicesStaticFallbackProps {
  onSelectService: (slug: string) => void;
}

export function ServicesStaticFallback({ onSelectService }: ServicesStaticFallbackProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-[color:var(--divider)]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] mb-3">
            Services
          </p>
          <h2 className="font-display text-5xl sm:text-6xl text-[color:var(--text-primary)] mb-4">
            Pick a door.
          </h2>
          <p className="text-base sm:text-lg text-[color:var(--text-secondary)]">
            Eight specialized disciplines under one single-partner roof. Step into any door to review deliverables, timelines, and real project results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES_DOORS_DATA.map((door: ServiceDoorItem) => (
            <div
              key={door.slug}
              className="group relative rounded-3xl p-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#C6F432]/40"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[color:var(--accent-text)] bg-[#C6F432]/10 px-2.5 py-1 rounded-full border border-[#C6F432]/30">
                    {door.index}
                  </span>
                  <span className="font-mono text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">
                    {door.preset.name}
                  </span>
                </div>

                <h3 className="font-display text-2xl text-[color:var(--text-primary)] mb-2">
                  {door.name}
                </h3>

                <p className="text-sm text-[color:var(--text-secondary)] mb-5 leading-relaxed">
                  {door.benefit}
                </p>

                <div className="space-y-1.5 mb-6">
                  {door.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                      <Check size={12} className="text-[#C6F432] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[color:var(--border-subtle)] flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#C6F432]">
                  {door.stat}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectService(door.slug)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider font-semibold text-[color:var(--text-primary)] hover:text-[#C6F432] transition-colors"
                >
                  <span>Open service</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default ServicesStaticFallback;
