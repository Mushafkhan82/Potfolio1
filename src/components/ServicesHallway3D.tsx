import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import {
  DOOR_THEMES,
  DoorTopicPreview,
  getServiceIcon,
  type ServiceTopic,
} from './DoorTopicPreview';

export interface ServiceBenefitSummary {
  slug: string;
  name: string;
  benefit: string;
  index: string;
}

export interface ServicesHallway3DProps {
  services: ServiceTopic[];
  benefits?: ServiceBenefitSummary[];
  onNavigate: (path: string) => void;
  isReducedMotion?: boolean;
}

interface MainDoorCategory {
  id: string;
  title: string;
  subtitle: string;
  primarySlug: string;
  includedSlugs: string[];
}

const MAIN_DOOR_CATEGORIES: MainDoorCategory[] = [
  {
    id: 'web-dev',
    title: 'Web Development',
    subtitle: 'Custom Web Apps & AI Automation',
    primarySlug: 'web-development',
    includedSlugs: ['web-development', 'ai-automation'],
  },
  {
    id: 'seo',
    title: 'Search Optimization',
    subtitle: 'Local Maps & Technical SEO',
    primarySlug: 'seo',
    includedSlugs: ['seo'],
  },
  {
    id: 'social-media',
    title: 'Social Media & Motion',
    subtitle: 'Social Growth, Video Editing & Motion',
    primarySlug: 'social-media-management',
    includedSlugs: ['social-media-management', 'video-editing', 'motion-graphics'],
  },
  {
    id: 'ui-ux',
    title: 'UI/UX & Branding',
    subtitle: 'Design Systems & 3D Visuals',
    primarySlug: 'ui-ux-graphic-design',
    includedSlugs: ['ui-ux-graphic-design', '3d-blender'],
  },
];

export const ServicesHallway3D: React.FC<ServicesHallway3DProps> = ({
  services,
  onNavigate,
  isReducedMotion = false,
}) => {
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const navTimerRef = useRef<number | null>(null);

  const [prefersReduced, setPrefersReduced] = useState<boolean>(isReducedMotion);
  const [enteringSlug, setEnteringSlug] = useState<string | null>(null);
  const [enteringDoorId, setEnteringDoorId] = useState<string | null>(null);
  const [mobileScrollIndex, setMobileScrollIndex] = useState<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(isReducedMotion || mq.matches);
    const onMqChange = (e: MediaQueryListEvent) =>
      setPrefersReduced(isReducedMotion || e.matches);
    mq.addEventListener('change', onMqChange);

    return () => {
      mq.removeEventListener('change', onMqChange);
      if (navTimerRef.current !== null) {
        window.clearTimeout(navTimerRef.current);
      }
    };
  }, [isReducedMotion]);

  const handleMobileScroll = useCallback(() => {
    const track = mobileTrackRef.current;
    if (!track) return;
    const maxScroll = Math.max(1, track.scrollWidth - track.clientWidth);
    const ratio = track.scrollLeft / maxScroll;
    setMobileScrollIndex(ratio > 0.45 ? 1 : 0);
  }, []);

  const scrollMobileTo = (pageIdx: number) => {
    const track = mobileTrackRef.current;
    if (!track) return;
    const targetLeft = pageIdx === 0 ? 0 : track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: targetLeft,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  /**
   * Clicking or tapping any door:
   * 1. Swings that door completely open in realistic 3D (-102deg on left hinges)
   * 2. Navigates smoothly to the corresponding real /services/:slug page
   */
  const handleDoorClick = useCallback(
    (doorId: string, slug: string) => {
      if (enteringSlug) return;

      if (prefersReduced) {
        onNavigate(`/services/${slug}`);
        return;
      }

      setEnteringDoorId(doorId);
      setEnteringSlug(slug);

      if (navTimerRef.current !== null) {
        window.clearTimeout(navTimerRef.current);
      }
      navTimerRef.current = window.setTimeout(() => {
        onNavigate(`/services/${slug}`);
      }, 480);
    },
    [enteringSlug, prefersReduced, onNavigate]
  );

  // Map the 4 main categories to real existing ServiceTopic records
  const doorItems = MAIN_DOOR_CATEGORIES.map((cat) => {
    const primary =
      services.find((s) => s.slug === cat.primarySlug) || services[0];
    const subTopics = cat.includedSlugs
      .filter((s) => s !== cat.primarySlug)
      .map((s) => services.find((svc) => svc.slug === s))
      .filter((s): s is ServiceTopic => Boolean(s));
    return { cat, primary, subTopics };
  }).filter((item) => Boolean(item.primary));

  return (
    <section
      id="services-hallway"
      aria-labelledby="doors-hallway-heading"
      className="relative w-full min-h-[100dvh] flex flex-col justify-between pt-20 sm:pt-24 pb-8 sm:pb-10 overflow-x-clip border-y border-[color:var(--border-subtle)] hallway-stage hallway-corridor-bg"
    >
      {/* Subtle Full-Width Corridor Baseboard Molding */}
      <div
        className="absolute inset-x-0 bottom-[22%] h-3 pointer-events-none hallway-baseboard"
        aria-hidden="true"
      />

      {/* Full-Width Gallery Heading */}
      <div className="relative z-20 w-full px-5 sm:px-8 lg:px-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] mb-1.5 font-semibold">
              <span>Interactive Studio Doors</span>
              <span aria-hidden="true">·</span>
              <span>01 — 0{doorItems.length}</span>
            </div>
            <h2
              id="doors-hallway-heading"
              className="font-display text-3xl sm:text-5xl text-[color:var(--text-primary)] leading-[1.04] tracking-tight"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Choose a door to explore.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[color:var(--text-secondary)] max-w-md md:text-right">
            Hover over a door to peek inside, or click to swing it open and enter the full service page.
          </p>
        </div>
      </div>

      {/* Main 3D Doors Stage: 4 Grand Doors on Desktop / 2 Large Doors + Horizontal Scroll on Mobile */}
      <div className="relative z-10 w-full my-auto py-4 sm:py-6">
        {/* Desktop & Tablet (>= 768px): All 4 Grand Doors Side by Side, Full Width, No Horizontal Scroll */}
        <div className="hidden md:grid md:grid-cols-4 gap-5 lg:gap-9 xl:gap-12 items-end w-full px-6 lg:px-12 xl:px-16">
          {doorItems.map(({ cat, primary, subTopics }, idx) => (
            <GrandArchedDoor
              key={cat.id}
              index={idx}
              category={cat}
              primaryService={primary}
              subTopics={subTopics}
              isEntering={enteringDoorId === cat.id}
              onEnterSlug={(slug) => handleDoorClick(cat.id, slug)}
            />
          ))}
        </div>

        {/* Mobile (< 768px): Strictly 2 Large Doors Visible, Remaining Doors Smoothly Scrollable Horizontally */}
        <div className="md:hidden relative w-full">
          <div
            ref={mobileTrackRef}
            onScroll={handleMobileScroll}
            className="flex flex-row flex-nowrap items-end gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-3 hallway-scroll-hide"
          >
            {doorItems.map(({ cat, primary, subTopics }, idx) => (
              <div
                key={cat.id}
                className="shrink-0 w-[calc(50%-8px)] min-w-[calc(50%-8px)] snap-start"
              >
                <GrandArchedDoor
                  index={idx}
                  category={cat}
                  primaryService={primary}
                  subTopics={subTopics}
                  isEntering={enteringDoorId === cat.id}
                  onEnterSlug={(slug) => handleDoorClick(cat.id, slug)}
                />
              </div>
            ))}
          </div>

          {/* Subtle Right-Edge Indicator & Touch Pagination Cue on Mobile */}
          {mobileScrollIndex === 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 bottom-12 w-10 bg-gradient-to-l from-[#FAF8F4]/90 to-transparent"
            />
          )}

          <div className="mt-3 px-4 flex items-center justify-between text-xs font-mono text-[color:var(--text-secondary)]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollMobileTo(0)}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  mobileScrollIndex === 0
                    ? 'text-[color:var(--text-primary)] font-semibold'
                    : 'text-[color:var(--text-muted)]'
                }`}
              >
                01–02
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => scrollMobileTo(1)}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  mobileScrollIndex === 1
                    ? 'text-[color:var(--text-primary)] font-semibold'
                    : 'text-[color:var(--text-muted)]'
                }`}
              >
                03–04
              </button>
            </div>

            <button
              type="button"
              onClick={() => scrollMobileTo(mobileScrollIndex === 0 ? 1 : 0)}
              className="min-h-[44px] inline-flex items-center gap-1 px-3 py-2 text-[color:var(--accent-text)] font-semibold cursor-pointer whitespace-nowrap"
            >
              <span>
                {mobileScrollIndex === 0 ? 'More doors' : 'Back to start'}
              </span>
              <ChevronRight
                size={14}
                className={mobileScrollIndex === 1 ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Preserved Discipline Directory Strip (keeps all 8 topic links directly reachable) */}
      <div className="relative z-20 w-full px-5 sm:px-8 lg:px-14">
        <div className="pt-3 border-t border-[color:var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[color:var(--text-secondary)]">
          <span className="text-[color:var(--text-muted)]">All disciplines:</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {services.map((svc) => (
              <button
                key={svc.slug}
                type="button"
                onClick={() => {
                  const hostDoor =
                    doorItems.find(
                      (d) =>
                        d.cat.primarySlug === svc.slug ||
                        d.cat.includedSlugs.includes(svc.slug)
                    ) || doorItems[0];
                  handleDoorClick(hostDoor.cat.id, svc.slug);
                }}
                className="min-h-[44px] px-2 inline-flex items-center hover:text-[color:var(--accent-text)] hover:underline transition-colors cursor-pointer whitespace-nowrap"
              >
                {svc.shortTitle || svc.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface GrandArchedDoorProps {
  index: number;
  category: MainDoorCategory;
  primaryService: ServiceTopic;
  subTopics: ServiceTopic[];
  isEntering: boolean;
  onEnterSlug: (slug: string) => void;
}

const GrandArchedDoor: React.FC<GrandArchedDoorProps> = ({
  index,
  category,
  primaryService,
  subTopics,
  isEntering,
  onEnterSlug,
}) => {
  const palette =
    DOOR_THEMES[primaryService.slug] || DOOR_THEMES['web-development'];
  const indexLabel = String(index + 1).padStart(2, '0');

  return (
    <div
      className="door-unit group flex flex-col items-center w-full select-none"
      data-entering={isEntering ? 'true' : 'false'}
    >
      {/* Warm Overhead Wall Spotlight above Door Arch */}
      <div
        aria-hidden="true"
        className="w-3/4 h-7 -mb-2 rounded-full blur-lg pointer-events-none opacity-35 group-hover:opacity-95 transition-opacity duration-400"
        style={{ background: palette.roomGlow }}
      />

      {/* Stationary Architectural Frame + 3D Swinging Door Leaf */}
      <div className="relative w-full h-[350px] sm:h-[430px] md:h-[clamp(390px,58vh,620px)]">
        <div className="door-casing w-full h-full">
          <div className="door-aperture">
            {/* Illuminated Room Preview revealed behind Door on Hover / Click */}
            <DoorTopicPreview
              categoryTitle={category.title}
              primaryService={primaryService}
              subTopics={subTopics}
              palette={palette}
              indexLabel={indexLabel}
              onEnterSlug={onEnterSlug}
            />

            {/* 3D Swinging Arched Wooden Door Leaf */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onEnterSlug(category.primarySlug)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEnterSlug(category.primarySlug);
                }
              }}
              aria-label={`Open ${category.title} (${category.subtitle})`}
              className="door-leaf-3d focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00] focus-visible:ring-offset-4"
              style={{
                ['--door-base' as string]: palette.base,
                ['--door-light' as string]: palette.light,
                ['--door-dark' as string]: palette.dark,
              }}
            >
              {/* Front Sculpted Timber Face */}
              <div className="door-face-front flex flex-col justify-between p-3.5 sm:p-4 pt-6 sm:pt-8">
                {/* Golden Barrel Hinges along Left Edge */}
                <div
                  aria-hidden="true"
                  className="absolute left-0.5 top-[27%] door-hinge-barrel"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-0.5 bottom-[16%] door-hinge-barrel"
                />

                {/* Engraved Golden Plaque on the Door */}
                <div className="relative z-10 mx-auto mb-2 px-2.5 py-1 rounded border border-[#f3dc93]/55 bg-black/40 text-[10px] sm:text-[11px] font-mono tracking-wider text-[#fae8af] flex items-center gap-1.5 max-w-full shadow-md">
                  <span className="tabular-nums font-semibold shrink-0">{indexLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate font-medium">{category.title}</span>
                </div>

                {/* Upper Recessed Arched Timber Panel */}
                <div className="door-molding-arch relative flex-1 mx-1.5 sm:mx-2 mb-3 flex flex-col items-center justify-center p-2 text-center">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 bg-black/25 flex items-center justify-center text-white/90 shadow-inner mb-2"
                    aria-hidden="true"
                  >
                    {getServiceIcon(primaryService.slug, 20)}
                  </div>
                  <span className="font-display text-base sm:text-xl text-white/95 leading-tight drop-shadow">
                    {category.title}
                  </span>
                </div>

                {/* Lock Rail & Golden Lever Handle */}
                <div className="relative h-9 flex items-center justify-end pr-1.5 my-0.5">
                  <div className="relative flex items-center">
                    <div className="door-handle-plate" aria-hidden="true" />
                    <div
                      className="door-handle-lever absolute right-0.5 top-2.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Lower Twin Beveled Molding Panels */}
                <div className="grid grid-cols-2 gap-2.5 mx-1.5 sm:mx-2 h-[78px] sm:h-[100px] lg:h-[116px] mb-1.5">
                  <div className="door-molding-rect" />
                  <div className="door-molding-rect" />
                </div>
              </div>

              {/* Inner Door Face visible during 3D rotation */}
              <div className="door-face-back" />

              {/* Solid 14px 3D Door Slab Edge */}
              <div className="door-slab-edge" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Threshold Sill */}
        <div className="door-threshold-sill w-[104%] -ml-[2%]" aria-hidden="true" />

        {/* Projected Light Spill Carpet on Floor */}
        <div
          aria-hidden="true"
          className="door-floor-spill pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-[116%] h-12 blur-md"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${palette.roomGlow} 0%, transparent 78%)`,
          }}
        />
      </div>

      {/* Topic Title & Click Action under Door */}
      <div className="mt-4 text-center px-1 w-full">
        <div className="font-mono text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider truncate">
          {category.subtitle}
        </div>
        <h3 className="font-display text-lg sm:text-2xl text-[color:var(--text-primary)] leading-tight truncate mt-0.5">
          {category.title}
        </h3>
        <button
          type="button"
          onClick={() => onEnterSlug(category.primarySlug)}
          className="mt-1 min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-[color:var(--accent-text)] hover:underline cursor-pointer"
        >
          <span>Explore</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default ServicesHallway3D;
