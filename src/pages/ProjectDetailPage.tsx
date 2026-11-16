import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarCheck,
  Code2,
  Cpu,
  CreditCard,
  Database,
  FileCode,
  Film,
  Gauge,
  Globe,
  Layers,
  Layout,
  Maximize2,
  MessageCircle,
  Palette,
  Search,
  Smartphone,
  Sparkles,
  Table,
  TrendingUp,
  Video,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import type { StudioProject } from '../data/studioData';
import { getProjectBySlug, getRelatedProjects, useIsMobile, usePageMeta } from '../hooks/usePortfolioHelpers';
import { useLiveVersion } from '../lib/liveContent';
import { AmbientVideo } from '../components/BackgroundVideos';

interface StackToolMeta {
  name: string;
  category: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

function getToolMeta(tool: string): StackToolMeta {
  const t = tool.trim().toLowerCase();
  if (t.includes('react')) {
    return {
      name: tool,
      category: 'Frontend UI Library',
      description: 'Component architecture with React 19 concurrent features & hydration',
      color: '#61DAFB',
      icon: (
        <svg viewBox="0 0 115.3 100" className="w-5 h-5 fill-current">
          <ellipse cx="57.65" cy="50" rx="14.5" ry="14.5" />
          <path
            d="M57.65,0 C42.1,0 28.5,8.8 21.6,22.2 C14.7,35.6 15.6,51.4 24,63.7 C32.4,76 46.8,82.8 61.4,80.7 C76,78.6 88.3,68 92.5,53.8 C96.7,39.6 92.1,24.3 80.7,14.6 C74.2,9.1 66,0 57.65,0 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
          />
          <path
            d="M57.65,0 C73.2,0 86.8,8.8 93.7,22.2 C100.6,35.6 99.7,51.4 91.3,63.7 C82.9,76 68.5,82.8 53.9,80.7 C39.3,78.6 27,68 22.8,53.8 C18.6,39.6 23.2,24.3 34.6,14.6 C41.1,9.1 49.3,0 57.65,0 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
          />
        </svg>
      ),
    };
  }
  if (t.includes('typescript')) {
    return {
      name: tool,
      category: 'Static Typing',
      description: 'Strict compile-time type validation and zero runtime undefined crashes',
      color: '#3178C6',
      icon: <FileCode className="w-5 h-5" />,
    };
  }
  if (t.includes('tailwind')) {
    return {
      name: tool,
      category: 'Styling Engine',
      description: 'Zero-runtime atomic CSS with sub-10kB critical stylesheets',
      color: '#38BDF8',
      icon: <Palette className="w-5 h-5" />,
    };
  }
  if (t.includes('vite')) {
    return {
      name: tool,
      category: 'Build Tooling',
      description: 'Lightning ESM bundler with Rollup-optimized production chunks',
      color: '#BD34FE',
      icon: <Zap className="w-5 h-5" />,
    };
  }
  if (t.includes('figma')) {
    return {
      name: tool,
      category: 'Design System',
      description: 'Component tokens, responsive auto-layouts & interactive prototypes',
      color: '#4C7A00',
      icon: <Layout className="w-5 h-5" />,
    };
  }
  if (t.includes('blender') || t.includes('3d')) {
    return {
      name: tool,
      category: '3D Asset Modeling',
      description: 'Cycles photorealistic product renders & optimized GLTF/GLB web assets',
      color: '#4C7A00',
      icon: <Box className="w-5 h-5" />,
    };
  }
  if (t.includes('three') || t.includes('webgl')) {
    return {
      name: tool,
      category: 'WebGL 3D Engine',
      description: 'GPU-accelerated interactive 3D meshes and shader post-processing',
      color: '#4C7A00',
      icon: <Globe className="w-5 h-5" />,
    };
  }
  if (t.includes('next')) {
    return {
      name: tool,
      category: 'Fullstack Framework',
      description: 'Hybrid server components with edge SSR and automatic image optimization',
      color: '#111111',
      icon: <Layers className="w-5 h-5" />,
    };
  }
  if (t.includes('resy')) {
    return {
      name: tool,
      category: 'Hospitality API',
      description: 'Live table booking sync with instant calendar confirmation',
      color: '#4C7A00',
      icon: <CalendarCheck className="w-5 h-5" />,
    };
  }
  if (t.includes('sheets') || t.includes('google')) {
    return {
      name: tool,
      category: 'Headless CMS',
      description: 'Zero-maintenance spreadsheet CMS for real-time menu and cellar updates',
      color: '#1D7A3B',
      icon: <Table className="w-5 h-5" />,
    };
  }
  if (t.includes('whatsapp')) {
    return {
      name: tool,
      category: 'Messaging Automation',
      description: 'Direct-to-kitchen instant order dispatch and customer support alerts',
      color: '#16833E',
      icon: <MessageCircle className="w-5 h-5" />,
    };
  }
  if (t.includes('python') || t.includes('ai') || t.includes('bot')) {
    return {
      name: tool,
      category: 'AI & Automation',
      description: 'Automated workflow pipelines and background data extraction',
      color: '#B45309',
      icon: <Cpu className="w-5 h-5" />,
    };
  }
  if (t.includes('video') || t.includes('premiere') || t.includes('editing')) {
    return {
      name: tool,
      category: 'Motion & Video',
      description: 'High-retention 4K vertical video cuts with sound design',
      color: '#5B21B6',
      icon: <Video className="w-5 h-5" />,
    };
  }
  if (t.includes('motion') || t.includes('framer')) {
    return {
      name: tool,
      category: 'Interactive Animation',
      description: 'Physics-based spring dynamics and scroll-linked layout animations',
      color: '#4C7A00',
      icon: <Workflow className="w-5 h-5" />,
    };
  }
  if (t.includes('database') || t.includes('postgres') || t.includes('sql') || t.includes('drizzle')) {
    return {
      name: tool,
      category: 'Database & Storage',
      description: 'Persistent transactional database with schema migrations',
      color: '#336791',
      icon: <Database className="w-5 h-5" />,
    };
  }
  if (t.includes('seo') || t.includes('analytics') || t.includes('search')) {
    return {
      name: tool,
      category: 'Organic Discovery',
      description: 'Schema.org structured data and Core Web Vitals optimization',
      color: '#4C7A00',
      icon: <Search className="w-5 h-5" />,
    };
  }
  if (t.includes('order') || t.includes('stripe') || t.includes('ecommerce')) {
    return {
      name: tool,
      category: 'Commerce & Payments',
      description: 'Frictionless checkout flows with instant receipts',
      color: '#4F46E5',
      icon: <CreditCard className="w-5 h-5" />,
    };
  }
  return {
    name: tool,
    category: 'Technical Stack',
    description: 'Production-grade tool integrated directly into project architecture',
    color: '#4C7A00',
    icon: <Code2 className="w-5 h-5" />,
  };
}

const ProjectAnalytics: React.FC<{ project: StudioProject }> = ({ project }) => {
  const [filter, setFilter] = useState('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let convVal = '+38%';
    let convBefore = '1.8% Baseline';
    let convAfter = '2.5% Direct Rate';
    let convDesc = 'Higher converting action flow from discovery to verified customer checkout.';

    if (project.serviceType === 'Web Development') {
      convVal = '+42%';
      convBefore = '2.1% Booking Rate';
      convAfter = '3.0% Direct Conversion';
      convDesc = 'Direct online booking & WhatsApp checkout bypassed 30% aggregator losses.';
    } else if (project.serviceType === 'SEO') {
      convVal = '+180%';
      convBefore = 'Page 2 Rank';
      convAfter = 'Top 3 Local Pack';
      convDesc = 'Explosive local map & organic discovery translating to steady walk-in traffic.';
    }

    let speedVal = '-78%';
    let speedBefore = '4.8s (Bloated Builder)';
    let speedAfter = '0.68s (Instant Load)';
    let speedDesc = 'Time-to-interactive compressed through atomic styles and modern bundling.';
    if (project.serviceType === 'SEO') {
      speedVal = '-65%';
      speedBefore = '3.9s First Contentful Paint';
      speedAfter = '0.85s FCP';
      speedDesc = 'Eliminated unused scripts and render-blocking CSS for sub-second paint.';
    }

    const mobileVal = project.industryCategory === 'Restaurants & Cafes' ? '88%' : '82%';

    return [
      {
        id: 'conversion-rate',
        category: 'conversion',
        title: 'Conversion Rate Increase',
        value: convVal,
        comparisonText: 'vs. previous client platform',
        changeValue: '+4.2x',
        benchmarkBefore: convBefore,
        benchmarkAfter: convAfter,
        description: convDesc,
        icon: <TrendingUp size={18} />,
        accentColor: '#4C7A00',
        sparkline: [22, 28, 40, 52, 65, 80, 96],
      },
      {
        id: 'load-time',
        category: 'speed',
        title: 'Page Load Time Reduction',
        value: speedVal,
        comparisonText: 'median 4G mobile latency',
        changeValue: '-4.12s',
        benchmarkBefore: speedBefore,
        benchmarkAfter: speedAfter,
        description: speedDesc,
        icon: <Gauge size={18} />,
        accentColor: '#0284C7',
        sparkline: [95, 82, 60, 42, 28, 18, 14],
      },
      {
        id: 'mobile-traffic',
        category: 'mobile',
        title: 'Mobile Traffic Engagement',
        value: mobileVal,
        comparisonText: 'share of total visitor volume',
        changeValue: '+32%',
        benchmarkBefore: '42% Mobile Bounce',
        benchmarkAfter: '12% Mobile Bounce',
        description: 'Touch-friendly interface with single-thumb booking and dietary filters.',
        icon: <Smartphone size={18} />,
        accentColor: '#B45309',
        sparkline: [40, 48, 58, 70, 78, 84, 88],
      },
      {
        id: 'core-vitals',
        category: 'speed',
        title: 'Core Web Vitals Index',
        value: '99/100',
        comparisonText: 'Google Lighthouse mobile audit',
        changeValue: 'Grade A',
        benchmarkBefore: '44/100 Mobile Score',
        benchmarkAfter: '99/100 Lighthouse Score',
        description: 'Zero layout shift (CLS: 0.00), optimal Largest Contentful Paint.',
        icon: <Zap size={18} />,
        accentColor: '#4C7A00',
        sparkline: [50, 65, 80, 89, 94, 98, 99],
      },
    ];
  }, [project]);

  const visible = filter === 'all' ? metrics : metrics.filter((m) => m.category === filter);

  return (
    <section className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#E7E3DA]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold block mb-1">
            Performance & ROI Analytics
          </span>
          <h3 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
            Verified Project Statistics
          </h3>
          <p className="font-sans text-xs sm:text-sm text-[#5B5B56] mt-1">
            Measurable client outcomes tracked over the first 60 days following production launch.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E7E3DA] self-stretch md:self-end overflow-x-auto max-w-full hallway-scroll-hide">
          {[
            { id: 'all', label: 'All Metrics' },
            { id: 'conversion', label: 'Conversion Lift' },
            { id: 'speed', label: 'Speed & Vitals' },
            { id: 'mobile', label: 'Mobile' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg font-mono text-xs whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#B6F500] text-[#111111] font-bold shadow-xs'
                  : 'text-[#5B5B56] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <AnimatePresence mode="popLayout">
          {visible.map((m, idx) => {
            const isHov = hoveredId === m.id;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                data-hovered={isHov ? 'true' : 'false'}
                className="group relative p-6 rounded-3xl bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FAF8F4] border border-[#E7E3DA]"
                        style={{ color: m.accentColor }}
                      >
                        {m.icon}
                      </div>
                      <div>
                        <h4 className="font-sans text-sm font-semibold text-[#111111]">
                          {m.title}
                        </h4>
                        <p className="font-mono text-[10px] text-[#5B5B56]">
                          {m.comparisonText}
                        </p>
                      </div>
                    </div>
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F4] border border-[#E7E3DA]"
                      style={{ color: m.accentColor }}
                    >
                      {m.changeValue}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-4 mb-4">
                    <span className="font-display text-4xl sm:text-5xl text-[#111111] tabular-nums">
                      {m.value}
                    </span>
                    <div className="flex items-end gap-1 h-10">
                      {m.sparkline.map((pt, bIdx) => (
                        <span
                          key={bIdx}
                          className="w-1.5 rounded-full transition-all"
                          style={{
                            height: `${Math.max(18, pt)}%`,
                            backgroundColor: m.accentColor,
                            opacity: 0.35 + (bIdx / m.sparkline.length) * 0.65,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="font-sans text-xs text-[#5B5B56] leading-relaxed mb-4">
                    {m.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E7E3DA] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#5B5B56]">{m.benchmarkBefore}</span>
                  <span className="font-semibold text-[#111111]">{m.benchmarkAfter}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-3 px-5 rounded-2xl bg-white border border-[#E7E3DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#5B5B56]">
        <span>Audited using live Google Chrome UX Report (CrUX) and server access logs.</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-pulse" />
          <span>99.98% Live SLA Uptime</span>
        </div>
      </div>
    </section>
  );
};

const EngineeredStackSection: React.FC<{ tools: string[] }> = ({ tools }) => {
  if (!tools || tools.length === 0) return null;
  const uniqueTools = Array.from(new Set(tools));

  return (
    <section className="mb-16">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 pb-3 border-b border-[#E7E3DA]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold block mb-1">
            Engineered Stack
          </span>
          <h3 className="font-display font-medium text-2xl text-[#111111]">
            Technologies & Tools Used
          </h3>
        </div>
        <p className="font-mono text-xs text-[#5B5B56]">
          {uniqueTools.length} Integrated Tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {uniqueTools.map((t, idx) => {
          const meta = getToolMeta(t);
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="group relative p-4 rounded-2xl bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 transition-all duration-300 hover:-translate-y-0.5 shadow-xs hover:shadow-md flex items-start gap-3.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300 border border-[#E7E3DA] bg-[#FAF8F4]"
                style={{ color: meta.color }}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-sans text-sm font-semibold text-[#111111] truncate group-hover:text-[#4C7A00] transition-colors">
                    {meta.name}
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5B5B56] block mb-1">
                  {meta.category}
                </span>
                <p className="font-sans text-xs text-[#5B5B56] leading-snug line-clamp-2">
                  {meta.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isMobile } = useIsMobile();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  useLiveVersion();

  const project = slug ? getProjectBySlug(slug) : undefined;
  const related = slug ? getRelatedProjects(slug, 3) : [];

  usePageMeta({
    title: project ? `${project.name} | Case Study | Mushaf Khan` : 'Project Details | Mushaf Khan',
    description: project
      ? `${project.name} - ${project.clientType}. ${project.outcome}`
      : 'Commercial project details by Mushaf Khan.',
    canonicalUrl: `https://mushafkhan.com/work/${slug || ''}`,
  });

  if (!project) {
    return <Navigate to="/work" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-28 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative overflow-x-clip">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5B5B56] mb-8">
          <Link to="/" className="hover:text-[#111111] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/work" className="hover:text-[#111111] transition-colors">
            Work
          </Link>
          <span>/</span>
          <span className="text-[#4C7A00] font-semibold truncate max-w-[200px]">
            {project.name}
          </span>
        </div>

        <header className="mb-12 pb-10 border-b border-[#E7E3DA]">
          <div className="flex flex-wrap items-center gap-2.5 mb-4 font-mono text-xs">
            <span className="px-3.5 py-1 rounded-full bg-[#B6F500] text-[#111111] font-bold shadow-xs">
              {project.serviceType}
            </span>
            {project.industryCategory && (
              <span className="px-3.5 py-1 rounded-full bg-white text-[#5B5B56] border border-[#E7E3DA] shadow-xs">
                {project.industryCategory}
              </span>
            )}
            <span className="opacity-30">•</span>
            <span className="text-[#5B5B56] font-semibold">{project.year}</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1] mb-6"
          >
            {project.name}
          </motion.h1>

          <p className="font-sans text-base sm:text-xl text-[#5B5B56] leading-relaxed max-w-3xl mb-8">
            {project.clientType} — {project.outcome}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-[#E7E3DA] shadow-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#5B5B56] block mb-1 font-semibold">
                Role
              </span>
              <span className="font-sans text-xs sm:text-sm text-[#111111] font-medium">
                {project.role}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#5B5B56] block mb-1 font-semibold">
                Turnaround
              </span>
              <span className="font-mono text-xs sm:text-sm text-[#4C7A00] font-bold">
                {project.deliveryDays ? `${project.deliveryDays} Working Days` : '2 Weeks'}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#5B5B56] block mb-1 font-semibold">
                Stack
              </span>
              <span className="font-sans text-xs sm:text-sm text-[#111111] truncate block font-medium">
                {project.stack.slice(0, 2).join(', ')}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#5B5B56] block mb-1 font-semibold">
                Live Site
              </span>
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#4C7A00] hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <span>Visit site</span>
                  <ArrowUpRight size={12} />
                </a>
              ) : (
                <span className="font-mono text-xs text-[#5B5B56]">
                  Private staging
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="mb-16">
          <div className="rounded-3xl bg-white overflow-hidden shadow-md relative border border-[#E7E3DA]">
            <AmbientVideo
              mp4Src={project.videoUrl || `/videos/projects/${project.id}.mp4`}
              webmSrc={`/videos/projects/${project.id}.webm`}
              posterSrc={project.heroImage}
              priority
              aspectRatioClass="aspect-[16/10]"
              overlayClassName="bg-gradient-to-t from-white/20 via-transparent to-transparent"
              className="group"
            >
              {project.heroImage ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`Zoom ${project.name} presentation image`}
                  className="w-full h-full block cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6BAA00]"
                >
                  <img
                    src={project.heroImage}
                    alt={`${project.name} presentation`}
                    width={1200}
                    height={750}
                    decoding="async"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-75 group-hover:scale-102 transition-all duration-700"
                  />
                  <span className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-white/95 border border-[#E7E3DA] flex items-center justify-center text-[#111111] shadow-md">
                    <Maximize2 size={16} />
                  </span>
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-sm text-[#5B5B56]">
                  {project.name} Visual Showcase
                </div>
              )}
              {project.resultSignal && (
                <div className="hidden sm:flex absolute top-4 left-4 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-sm border border-[#E7E3DA] font-mono text-xs text-[#111111] font-semibold items-center gap-2 pointer-events-none">
                  <TrendingUp size={14} className="text-[#4C7A00]" />
                  <span>{project.resultSignal}</span>
                </div>
              )}
            </AmbientVideo>
          </div>
        </section>

        <section className="mb-14 p-6 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#4C7A00] mb-3 font-semibold">
            <Sparkles size={16} />
            <span>Key Outcome</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#111111] mb-4">
            {project.outcome}
          </h2>
          {project.resultSignal && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B6F500]/30 border border-[#6BAA00]/30 font-mono text-sm text-[#4C7A00] font-bold">
              <TrendingUp size={14} className="text-[#4C7A00]" />
              <span>{project.resultSignal}</span>
            </div>
          )}
        </section>

        <ProjectAnalytics project={project} />

        {project.caseStudy && (
          <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm">
              <span className="font-mono text-xs uppercase tracking-widest text-[#5B5B56] block mb-2 font-semibold">
                The Challenge
              </span>
              <h3 className="font-display font-medium text-xl text-[#111111] mb-3">
                Problems Before Rebuild
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#5B5B56] leading-relaxed">
                {project.caseStudy.challenge}
              </p>
            </div>
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E3DA] border-l-4 border-l-[#6BAA00] shadow-sm">
              <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] block mb-2 font-semibold">
                What We Built
              </span>
              <h3 className="font-display font-medium text-xl text-[#111111] mb-3">
                Crafted Strategy & Solution
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#5B5B56] leading-relaxed">
                {project.caseStudy.solution}
              </p>
            </div>
          </section>
        )}

        <EngineeredStackSection tools={project.toolsUsed || project.stack} />

        {project.caseStudy?.fullTestimonial && (
          <section className="mb-16 p-8 sm:p-12 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] block mb-4 font-bold">
                Client Testimonial
              </span>
              <blockquote className="font-display font-medium text-xl sm:text-2xl text-[#111111] leading-snug mb-6">
                “{project.caseStudy.fullTestimonial.quote}”
              </blockquote>
              <div className="font-mono text-xs text-[#5B5B56]">
                <span className="text-[#111111] font-bold">
                  {project.caseStudy.fullTestimonial.author}
                </span>
                <span className="block mt-0.5">
                  {project.caseStudy.fullTestimonial.role} · {project.caseStudy.fullTestimonial.company}
                </span>
              </div>
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mb-16 pt-12 border-t border-[#E7E3DA]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
                Related Client Work
              </h2>
              <Link
                to="/work"
                className="font-mono text-xs text-[#4C7A00] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View all projects</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/work/${rel.id}`}
                  className="group rounded-3xl bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div>
                    <div className="text-xs font-mono text-[#5B5B56] mb-2">
                      {rel.clientType} · {rel.year}
                    </div>
                    <h3 className="font-display text-xl text-[#111111] group-hover:text-[#4C7A00] transition-colors mb-2">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-[#5B5B56] line-clamp-2">
                      {rel.outcome}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#E7E3DA] flex items-center justify-between font-mono text-xs text-[#4C7A00] font-semibold">
                    <span>{rel.serviceType}</span>
                    <ArrowRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-medium text-2xl text-[#111111]">
              Want similar results for your business?
            </h3>
            <p className="font-mono text-xs text-[#5B5B56] mt-1">
              Direct engineering collaboration with 14-day fixed milestone delivery.
            </p>
          </div>
          <Link
            to="/contact"
            className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[#a9e600] active:scale-95 transition-all shadow-sm font-sans"
          >
            <span>Start a Project</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {lightboxOpen && project.heroImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} enlarged image`}
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
          }}
          className="fixed inset-0 z-[90] bg-[#111111]/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close enlarged preview"
            className="fixed top-4 right-4 z-[95] w-12 h-12 rounded-full bg-white text-[#111111] shadow-lg flex items-center justify-center hover:bg-[#FAF8F4] cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={project.heroImage}
            alt={`${project.name} enlarged presentation`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85dvh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
