import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Compass,
  ExternalLink,
  Layers,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_QUICK_ACTIONS } from '../lib/seedData';
import type { QuickActionItem } from '../types/store';

interface QuickActionsProps {
  onNavigate?: (path: string) => void;
  className?: string;
}

const ICON_MAP: Record<QuickActionItem['icon'], React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  calendar: Calendar,
  'shopping-bag': ShoppingBag,
  layers: Layers,
  'message-circle': MessageCircle,
  sparkles: Sparkles,
  compass: Compass,
  truck: Truck,
  'external-link': ExternalLink,
};

function isExternalUrl(url: string, explicitExternal?: boolean): boolean {
  if (explicitExternal) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(url.trim());
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate, className = '' }) => {
  const { siteContent, settings } = useStore();
  const rawActions =
    siteContent?.quickActions && siteContent.quickActions.length > 0
      ? siteContent.quickActions
      : DEFAULT_QUICK_ACTIONS;

  const whatsappDigits = (settings?.whatsappNumber || '').replace(/[^\d]/g, '');

  const visibleActions = rawActions
    .filter((item) => item.enabled !== false && item.label.trim().length > 0)
    .map((item) => {
      // Sync WhatsApp shortcut dynamically with active store settings if using default placeholder
      if (
        item.id === 'qa-whatsapp' &&
        whatsappDigits &&
        item.url.includes('wa.me/923000000000')
      ) {
        return { ...item, url: `https://wa.me/${whatsappDigits}` };
      }
      return item;
    });

  if (visibleActions.length === 0) return null;

  const renderCardContent = (item: QuickActionItem) => {
    const Icon = ICON_MAP[item.icon] || Sparkles;
    const isExt = isExternalUrl(item.url, item.external);

    return (
      <>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            item.accent
              ? 'bg-[#B6F500] text-[#111111] shadow-xs'
              : 'bg-[#FAF8F4] text-[#6BAA00] border border-[#E7E3DA]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[#111111] truncate">
              {item.label}
            </span>
            {isExt && (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[#5B5B56] group-hover:text-[#6BAA00] transition-colors" />
            )}
          </div>
          {item.subtitle && (
            <p className="text-xs text-[#5B5B56] truncate mt-0.5">
              {item.subtitle}
            </p>
          )}
        </div>
      </>
    );
  };

  const baseCardClass =
    'group min-h-[56px] rounded-2xl px-4 py-3 flex items-center gap-3.5 transition-all bg-white border border-[#E7E3DA] shadow-xs hover:border-[#6BAA00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00] active:scale-[0.98]';

  return (
    <section
      aria-label="Quick Actions"
      className={`px-4 sm:px-6 max-w-6xl mx-auto pb-8 sm:pb-12 relative z-10 ${className}`}
    >
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#5B5B56] font-semibold">
            Quick Actions · 1-Tap Launch
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] md:hidden">
          Swipe →
        </span>
      </div>

      {/* Mobile horizontal snap rail (< 768px) */}
      <div className="flex md:hidden gap-3 overflow-x-auto snap-x snap-mandatory hallway-scroll-hide pb-2 -mx-4 px-4">
        {visibleActions.map((item) => {
          const isExt = isExternalUrl(item.url, item.external);
          const mobileWidth = 'min-w-[230px] max-w-[260px] shrink-0 snap-start';
          if (isExt) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseCardClass} ${mobileWidth}`}
              >
                {renderCardContent(item)}
              </a>
            );
          }
          if (onNavigate) {
            return (
              <a
                key={item.id}
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.url);
                }}
                className={`${baseCardClass} ${mobileWidth}`}
              >
                {renderCardContent(item)}
              </a>
            );
          }
          return (
            <Link key={item.id} to={item.url} className={`${baseCardClass} ${mobileWidth}`}>
              {renderCardContent(item)}
            </Link>
          );
        })}
      </div>

      {/* Tablet & Desktop responsive grid (>= 768px) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleActions.map((item) => {
          const isExt = isExternalUrl(item.url, item.external);
          if (isExt) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={baseCardClass}
              >
                {renderCardContent(item)}
              </a>
            );
          }
          if (onNavigate) {
            return (
              <a
                key={item.id}
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.url);
                }}
                className={baseCardClass}
              >
                {renderCardContent(item)}
              </a>
            );
          }
          return (
            <Link key={item.id} to={item.url} className={baseCardClass}>
              {renderCardContent(item)}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
