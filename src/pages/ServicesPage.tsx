import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Box, Code2, Film, Layout, Search, Share2, Sparkles, Video } from 'lucide-react';
import { SERVICE_BENEFITS, SERVICES } from '../data/studioData';
import { useIsReducedMotion, usePageMeta } from '../hooks/usePortfolioHelpers';
import { ServicesHallway3D } from '../components/ServicesHallway3D';
import { AmbientVideo } from '../components/BackgroundVideos';
import { MobileReadMore } from '../components/MobileReadMore';

function getServiceListIcon(slug: string) {
  switch (slug) {
    case 'web-development':
      return <Code2 size={20} className="text-[#4C7A00]" />;
    case 'seo':
      return <Search size={20} className="text-[#4C7A00]" />;
    case 'social-media-management':
      return <Share2 size={20} className="text-[#4C7A00]" />;
    case 'ui-ux-graphic-design':
      return <Layout size={20} className="text-[#4C7A00]" />;
    case 'video-editing':
      return <Video size={20} className="text-[#4C7A00]" />;
    case 'motion-graphics':
      return <Film size={20} className="text-[#4C7A00]" />;
    case '3d-blender':
      return <Box size={20} className="text-[#4C7A00]" />;
    case 'ai-automation':
      return <Bot size={20} className="text-[#4C7A00]" />;
    default:
      return <Sparkles size={20} className="text-[#4C7A00]" />;
  }
}

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const isReducedMotion = useIsReducedMotion();

  usePageMeta({
    title: 'Services & Capabilities | Mushaf Khan',
    description:
      'Explore 8 creative services: Web Development, SEO, Social Media, UI/UX Design, Video Editing, Motion Graphics, 3D and AI Automation.',
    canonicalUrl: 'https://mushafkhan.com/services',
  });

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 selection:bg-[#B6F500] selection:text-[#111111] relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="pb-10 mb-10 md:mb-12 border-b border-[#E7E3DA]">
          <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#4C7A00] mb-2 font-bold">
            My 8 Core Specializations
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#111111] tracking-tight leading-[1.1] mb-4">
            One creative partner across code, search, visuals &{' '}
            <span className="sage-underline font-semibold">AI</span>.
          </h1>
          <MobileReadMore lines={2}>
            <p className="font-sans text-sm sm:text-base text-[#5B5B56] max-w-2xl leading-relaxed">
              Skip the confusion of coordinating between four disconnected freelancers. I handle your website, organic Google ranking, video assets, 3D product visuals, and automated workflows directly.
            </p>
          </MobileReadMore>
        </header>

        <div className="mb-16 -mx-4 sm:-mx-6 lg:-mx-8">
          <ServicesHallway3D
            services={SERVICES}
            benefits={SERVICE_BENEFITS}
            onNavigate={(path) => navigate(path)}
            isReducedMotion={isReducedMotion}
          />
        </div>

        <div className="pb-6 mb-8 border-b border-[#E7E3DA] flex items-baseline justify-between">
          <div>
            <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#4C7A00] mb-1 font-bold">
              Full Service Scopes
            </span>
            <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#111111]">
              What Every Engagement Delivers
            </h2>
          </div>
          <span className="hidden md:inline font-mono text-xs text-[#5B5B56]">
            8 Turnkey Deliverables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((svc, idx) => (
            <motion.div
              key={svc.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl glass hover:border-[#6BAA00]/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-45 group-hover:opacity-85 transition-opacity duration-300 blur-2xl"
                style={{
                  background:
                    idx % 2 === 0
                      ? 'radial-gradient(circle, rgba(182, 245, 0, 0.28), transparent 70%)'
                      : 'radial-gradient(circle, rgba(20, 184, 166, 0.22), transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl glass-pill flex items-center justify-center group-hover:scale-105 transition-all">
                    {getServiceListIcon(svc.slug)}
                  </div>
                  <span className="font-mono text-[10px] text-[#5B5B56] uppercase tracking-widest font-semibold">
                    {svc.badge.replace(/^\d+\s*\/\s*/, '')}
                  </span>
                </div>

                <AmbientVideo
                  mp4Src={`/videos/services/${svc.slug}.mp4`}
                  webmSrc={`/videos/services/${svc.slug}.webm`}
                  posterSrc="/videos/hero-ambient-light-poster.webp"
                  aspectRatioClass="aspect-[16/9]"
                  playOnHover
                  overlayClassName="bg-white/40"
                  className="rounded-2xl border border-[#E7E3DA] mb-5"
                />

                <h2 className="font-display font-medium text-xl sm:text-2xl text-[#111111] group-hover:text-[#4C7A00] transition-colors mb-2 md:mb-3 leading-snug">
                  {svc.name}
                </h2>
                <p className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed line-clamp-2 md:line-clamp-none mb-4 md:mb-6">
                  {svc.description}
                </p>

                <div className="hidden md:block space-y-2 mb-6 pt-4 border-t border-[#E7E3DA]">
                  {svc.included.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 font-mono text-xs text-[#5B5B56]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00] mt-1.5 shrink-0" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-[#E7E3DA]">
                <Link
                  to={`/services/${svc.slug}`}
                  className="inline-flex items-center justify-between w-full min-h-[44px] py-3 px-4 rounded-xl glass-pill hover:bg-[#B6F500] hover:border-[#96CF00] text-[#111111] font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200"
                >
                  <span>Explore service scope</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
