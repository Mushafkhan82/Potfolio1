import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Search, X } from 'lucide-react';
import { PROJECTS } from '../data/studioData';
import { useIsMobile, usePageMeta } from '../hooks/usePortfolioHelpers';
import { useLiveVersion } from '../lib/liveContent';
import { CustomBriefSection } from '../components/HomeSections';
import { ProjectCard } from '../components/ProjectCard';

const SERVICE_FILTERS = [
  'All',
  'Web Development',
  'SEO',
  'Social Media',
  'UI/UX & Design',
  'Video Editing',
  'Motion Graphics',
  '3D & Blender',
  'AI Automation',
];

const INDUSTRY_FILTERS = [
  { label: 'All Categories', value: 'All Industries' },
  { label: 'Restaurants', value: 'Restaurants & Cafes' },
  { label: 'Clinics', value: 'Clinics & Wellness' },
  { label: 'Retail', value: 'Retail & Fashion' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Fitness', value: 'Fitness' },
];

export const WorkPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);
  useLiveVersion();

  const initialService = searchParams.get('service') || 'All';
  const initialIndustry = searchParams.get('industry') || 'All Industries';

  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedIndustry, setSelectedIndustry] = useState(initialIndustry);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  usePageMeta({
    title: 'Portfolio & Client Projects | Mushaf Khan',
    description:
      'Explore commercial projects across Web Development, SEO, Social Media, UI/UX Design, Video Editing, Motion Graphics, 3D and AI Automation.',
    canonicalUrl: 'https://mushafkhan.com/work',
  });

  const scrollToGridTop = () => {
    if (!gridTopRef.current) return;
    gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleServiceChange = (srv: string) => {
    hasInteractedRef.current = true;
    setSelectedService(srv);
    const next = new URLSearchParams(searchParams);
    if (srv === 'All') next.delete('service');
    else next.set('service', srv);
    setSearchParams(next, { replace: true });
    window.requestAnimationFrame(scrollToGridTop);
  };

  const handleIndustryChange = (ind: string) => {
    hasInteractedRef.current = true;
    setSelectedIndustry(ind);
    const next = new URLSearchParams(searchParams);
    if (ind === 'All Industries') next.delete('industry');
    else next.set('industry', ind);
    setSearchParams(next, { replace: true });
    window.requestAnimationFrame(scrollToGridTop);
  };

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    const t = window.setTimeout(scrollToGridTop, 180);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      if (selectedService !== 'All' && p.serviceType !== selectedService) return false;
      if (selectedIndustry !== 'All Industries' && p.industryCategory !== selectedIndustry) {
        return false;
      }
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.clientType.toLowerCase().includes(q) ||
          Boolean(p.serviceType?.toLowerCase().includes(q)) ||
          Boolean(p.industryCategory?.toLowerCase().includes(q)) ||
          p.stack.some((s) => s.toLowerCase().includes(q)) ||
          p.outcome.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedService, selectedIndustry]);

  const resetAll = () => {
    hasInteractedRef.current = true;
    setSearchQuery('');
    setSelectedService('All');
    setSelectedIndustry('All Industries');
    setSearchParams({}, { replace: true });
    window.requestAnimationFrame(scrollToGridTop);
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative overflow-x-clip">
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="pb-6 md:pb-8 mb-6 border-b border-[#E7E3DA]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
            <div>
              <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#6BAA00] mb-2 font-bold">
                Delivered Client Work · {PROJECTS.length} Projects
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1]">
                All Projects & <span className="sage-underline font-semibold">Results</span>
              </h1>
            </div>
            <p className="hidden md:block font-sans text-xs sm:text-sm text-[#5B5B56] max-w-sm leading-relaxed">
              Commercial projects delivered for growing brands, clinics, and businesses. Filter by category or search by keyword.
            </p>
          </div>
        </header>

        {/* Filter Bar: static normal flow below 1024px, compact sticky on lg+ */}
        <div
          aria-label="Project filters"
          className="static lg:sticky lg:top-[84px] z-30 glass-strong rounded-2xl px-4 py-3 mb-6 lg:max-h-[120px]"
        >
          {/* Row 1: Search + Category Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 mb-2">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B5B56] pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  hasInteractedRef.current = true;
                  setSearchQuery(e.target.value);
                }}
                placeholder='Search client, industry, stack (press "/")...'
                aria-label="Search all projects"
                className="w-full pl-10 pr-12 py-2 min-h-[42px] rounded-xl glass-pill text-[#111111] placeholder-[#5B5B56]/75 text-base sm:text-xs font-sans focus:outline-none focus:border-[#6BAA00] focus:bg-white/80 transition-all touch-manipulation"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      hasInteractedRef.current = true;
                      setSearchQuery('');
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#5B5B56] hover:text-[#111111] hover:bg-[#E7E3DA]/50 transition-colors cursor-pointer"
                    aria-label="Clear search text"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block font-mono text-[10px] text-[#5B5B56] px-1.5 py-0.5 rounded glass-pill">
                    /
                  </kbd>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap scrollbar-none min-w-0 flex-1 py-0.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#6BAA00] font-bold shrink-0 pr-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                Category:
              </span>
              {INDUSTRY_FILTERS.map((item) => {
                const active = selectedIndustry === item.value;
                const count =
                  item.value === 'All Industries'
                    ? PROJECTS.length
                    : PROJECTS.filter((p) => p.industryCategory === item.value).length;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleIndustryChange(item.value)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full font-mono text-xs whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                      active
                        ? 'bg-[#B6F500] text-[#111111] font-bold shadow-xs border border-[#96CF00]'
                        : 'glass-pill text-[#5B5B56] hover:text-[#111111] hover:border-[#6BAA00]/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-[#111111]/15 text-[#111111]' : 'bg-white/60 text-[#5B5B56]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Service Pills (single horizontally scrollable row) */}
          <div className="pt-2 border-t border-[#E7E3DA] flex items-center gap-1.5 overflow-x-auto flex-nowrap scrollbar-none">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5B5B56] font-semibold shrink-0 pr-1">
              Service:
            </span>
            {SERVICE_FILTERS.map((srv) => {
              const active = selectedService === srv;
              const count =
                srv === 'All'
                  ? PROJECTS.length
                  : PROJECTS.filter((p) => p.serviceType === srv).length;
              return (
                <button
                  key={srv}
                  type="button"
                  onClick={() => handleServiceChange(srv)}
                  className={`min-h-[34px] px-3 py-1 rounded-full font-mono text-[11px] whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer flex items-center gap-1 touch-manipulation ${
                    active
                      ? 'bg-[#111111] text-white font-semibold shadow-xs border border-[#111111]'
                      : 'glass-pill text-[#5B5B56] hover:border-[#6BAA00]/50 hover:text-[#111111]'
                  }`}
                >
                  <span>{srv}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Top Anchor + Result Count */}
        <div
          ref={gridTopRef}
          className="scroll-mt-[140px] lg:scroll-mt-[220px] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#5B5B56] mb-8 pb-3 border-b border-[#E7E3DA]"
        >
          <span>
            Showing <strong className="text-[#111111]">{filteredProjects.length}</strong> of {PROJECTS.length} projects
          </span>
          {(searchQuery || selectedService !== 'All' || selectedIndustry !== 'All Industries') && (
            <button
              type="button"
              onClick={resetAll}
              className="min-h-[36px] px-3 inline-flex items-center gap-1.5 rounded-full glass-pill text-[#4C7A00] hover:border-[#6BAA00] cursor-pointer font-semibold"
            >
              <RotateCcw size={12} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="py-20 px-6 text-center border border-dashed border-[#E7E3DA] rounded-3xl glass">
            <h3 className="font-display font-medium text-2xl text-[#111111] mb-2">
              No projects matched your criteria.
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#5B5B56] max-w-md mx-auto mb-6">
              Try searching with broader terms or clearing your active category and service filters.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="min-h-[44px] px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs hover:opacity-90"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={idx}
                isMobile={isMobile}
                hovered={hoveredId === project.id}
                onHoverChange={(id) =>
                  setHoveredId((prev) => (id ? id : prev === project.id ? null : prev))
                }
              />
            ))}
          </div>
        )}

        <CustomBriefSection />
      </div>
    </div>
  );
};

export default WorkPage;
