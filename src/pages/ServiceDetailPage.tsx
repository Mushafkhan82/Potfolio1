import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Play, RotateCw, Sparkles, TrendingUp, X } from 'lucide-react';
import { SERVICES, STUDIO_INFO } from '../data/studioData';
import { useIsMobile, usePageMeta } from '../hooks/usePortfolioHelpers';
import { MobileReadMore } from '../components/MobileReadMore';

export const ServiceDetailPage: React.FC = () => {
  const { slug: serviceSlug } = useParams<{ slug: string }>();
  const { isMobile } = useIsMobile();
  const service = SERVICES.find((s) => s.slug === serviceSlug);

  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [turntableId, setTurntableId] = useState<string | null>(null);

  usePageMeta({
    title: service ? `${service.name} Services | Mushaf Khan` : 'Service | Mushaf Khan',
    description: service
      ? service.description.slice(0, 155)
      : 'Multi-disciplinary creative services by Mushaf Khan.',
    canonicalUrl: `https://mushafkhan.com/services/${serviceSlug || ''}`,
  });

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-28 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative">
      <Link
        to="/services"
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-4 md:bottom-6 md:left-6 z-30 min-h-[44px] px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] text-[#111111] font-mono text-xs font-semibold shadow-md hover:border-[#6BAA00] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
        aria-label="Back to 8 services doors hallway"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        <span>Back to the doors</span>
      </Link>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#5B5B56] mb-8">
          <Link to="/" className="hover:text-[#111111] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/services" className="hover:text-[#111111] transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-[#4C7A00] font-semibold">{service.name}</span>
        </div>

        <header className="border-b border-[#E7E3DA] pb-10 md:pb-12 mb-12 md:mb-14">
          <div className="hidden md:flex items-center gap-3 mb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] px-3.5 py-1 rounded-full bg-white border border-[#E7E3DA] font-semibold shadow-xs">
              {service.badge.replace(/^\d+\s*\/\s*/, '')}
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1] mb-5 md:mb-6"
          >
            {service.headline}
          </motion.h1>

          <MobileReadMore lines={2} className="mb-6 md:mb-8">
            <p className="font-sans text-base sm:text-xl text-[#5B5B56] leading-relaxed max-w-3xl">
              {service.description}
            </p>
          </MobileReadMore>

          <div className="hidden md:flex p-5 rounded-2xl bg-white border border-[#E7E3DA] items-start gap-3 max-w-3xl shadow-xs">
            <Sparkles size={18} className="text-[#4C7A00] mt-1 shrink-0" />
            <p className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed">
              <strong className="text-[#111111] font-semibold">
                Why it matters:{' '}
              </strong>
              {service.solutionSummary}
            </p>
          </div>
        </header>

        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-[#E7E3DA]">
            <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
              What's Included
            </h2>
            <span className="font-mono text-xs text-[#5B5B56]">Turnkey Scope</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.included.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E7E3DA] shadow-xs flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#B6F500]/40 border border-[#6BAA00]/30 text-[#4C7A00] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <Check size={12} />
                </div>
                <span className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-[#E7E3DA]">
            <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
              Software & Tools
            </h2>
            <span className="font-mono text-xs text-[#5B5B56]">Production Stack</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {service.tools.map((tool) => (
              <span
                key={tool}
                className="font-mono text-xs px-4 py-2 rounded-full bg-white text-[#5B5B56] border border-[#E7E3DA] shadow-xs font-medium"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-8 pb-2 border-b border-[#E7E3DA]">
            <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
              Work Highlights
            </h2>
            <span className="font-mono text-xs text-[#5B5B56]">
              Verified Commercial Proof
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.portfolio.map((item) => (
              <article
                key={item.id}
                className="group rounded-3xl bg-white border border-[#E7E3DA] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-5"
              >
                <div>
                  <div className="relative rounded-2xl overflow-hidden border border-[#E7E3DA] bg-[#FAF8F4] mb-5">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {item.thumbnail || item.image ? (
                        <img
                          src={item.thumbnail || item.image}
                          alt={item.title}
                          width={800}
                          height={500}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#5B5B56]">
                          {item.title}
                        </div>
                      )}
                      {item.growthStat && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-sm border border-[#E7E3DA] font-mono text-xs text-[#111111] font-semibold flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-[#4C7A00]" />
                          <span>{item.growthStat}</span>
                        </div>
                      )}
                      {item.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveVideo({ url: item.videoUrl!, title: item.title })}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                          aria-label={`Play ${item.title}`}
                        >
                          <Play size={18} className="fill-current ml-0.5" />
                        </button>
                      )}
                      {item.turntableImages && item.turntableImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTurntableId((prev) => (prev === item.id ? null : item.id))}
                          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/95 text-[#111111] font-mono text-[10px] font-semibold flex items-center gap-1.5 border border-[#E7E3DA] shadow-sm"
                        >
                          <RotateCw size={12} className={turntableId === item.id ? 'animate-spin' : ''} />
                          <span>360° Turntable</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[#5B5B56] font-semibold">
                      {item.category}
                    </div>
                    <h3 className="font-display font-medium text-xl sm:text-2xl text-[#111111] group-hover:text-[#4C7A00] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed mb-4">
                      {item.caption}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E7E3DA] flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-2.5 py-0.5 rounded-md bg-[#FAF8F4] text-[#5B5B56] border border-[#E7E3DA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {service.testimonial && (
          <section className="mb-20 p-8 sm:p-12 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm">
            <span className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] block mb-3 font-bold">
              Client Proof
            </span>
            <blockquote className="font-display text-2xl sm:text-3xl text-[#111111] leading-snug mb-6">
              “{service.testimonial.quote}”
            </blockquote>
            <div className="font-mono text-xs text-[#5B5B56]">
              <strong className="text-[#111111]">{service.testimonial.author}</strong> —{' '}
              {service.testimonial.role}
            </div>
          </section>
        )}

        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7E3DA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-medium text-2xl text-[#111111]">
              Ready to launch your {service.shortTitle} project?
            </h3>
            <p className="font-mono text-xs text-[#5B5B56] mt-1">
              Turnaround in 14 days or book directly on Fiverr Pro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/contact?service=${service.slug}`}
              className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[#a9e600] active:scale-95 transition-all shadow-sm font-sans"
            >
              <span>Start a Project</span>
              <ArrowRight size={15} />
            </Link>
            <a
              href={STUDIO_INFO.fiverr}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#00B22D]/10 border border-[#00B22D]/35 text-[#007D1F] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00B22D]/20 transition-colors"
            >
              Order on Fiverr
            </a>
          </div>
        </div>
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl overflow-hidden bg-white border border-[#E7E3DA] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E3DA]">
              <h4 className="font-display font-medium text-lg text-[#111111]">
                {activeVideo.title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#5B5B56] hover:text-[#111111] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                aria-label="Close video modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-[#111111] flex items-center justify-center">
              <video
                src={activeVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;
