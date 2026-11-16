import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CURRENCIES } from '../data/studioData';
import { useCurrency } from '../context/CurrencyContext';

export const CurrencySelector: React.FC<{
  className?: string;
  variant?: 'navbar' | 'footer';
  align?: 'left' | 'right';
}> = ({ className = '', variant = 'navbar', align = 'right' }) => {
  const { currency, setCurrency, activeCurrencyInfo } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Select currency, current is ${activeCurrencyInfo.name} (${activeCurrencyInfo.code})`}
        className={`group inline-flex items-center gap-1.5 font-mono text-xs transition-all duration-200 rounded-full min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00] cursor-pointer select-none border border-[#E7E3DA] bg-white hover:bg-[#FAF8F4] ${
          variant === 'navbar'
            ? 'text-[#111111] px-2.5 sm:px-3 py-1.5 shadow-xs active:scale-95'
            : 'text-[#111111] px-3 py-1.5'
        }`}
      >
        <span aria-hidden="true">{activeCurrencyInfo.flag}</span>
        <span className="font-semibold tracking-tight">{activeCurrencyInfo.code}</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? 'rotate-180 text-[#6BAA00]' : 'text-[#5B5B56]'}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Currency options"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${
            variant === 'footer' ? 'bottom-full mb-2' : 'top-full mt-2'
          } w-56 max-h-72 overflow-y-auto rounded-2xl bg-white border border-[#E7E3DA] p-1.5 z-[80] shadow-xl`}
        >
          {CURRENCIES.map((item) => {
            const active = item.code === currency;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setCurrency(item.code);
                  setOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-mono transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#B6F500]/25 text-[#111111] font-bold'
                    : 'text-[#5B5B56] hover:bg-[#FAF8F4] hover:text-[#111111]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true">{item.flag}</span>
                  <span className="font-semibold text-[#111111]">{item.code}</span>
                  <span className="truncate text-[#5B5B56]">{item.name}</span>
                </span>
                {active && <Check size={13} className="shrink-0 text-[#6BAA00]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
