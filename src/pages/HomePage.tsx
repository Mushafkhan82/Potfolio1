import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PROJECTS, SERVICES, SERVICE_BENEFITS, STUDIO_INFO } from '../data/studioData';
import { usePageMeta, useIsReducedMotion } from '../hooks/usePortfolioHelpers';
import { EditableText, useLiveVersion } from '../lib/liveContent';
import {
  RoleFlipper,
  HeroPortrait,
  StickyCaseStudies,
  MeasuredOutcomes,
  TestimonialsCarousel,
  FaqSection,
} from '../components/HomeSections';
import { NewsletterBar } from '../components/NewsletterBar';
import { QuickActions } from '../components/QuickActions';
import { ServicesHallway3D } from '../components/ServicesHallway3D';
import { ProjectsGallery } from '../components/ProjectsGallery';
import { HomeStoreSection } from '../components/storefront/CmsAndBlogPages';
import { HeroVideoBackground } from '../components/BackgroundVideos';
import { MobileReadMore } from '../components/MobileReadMore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const isReducedMotion = useIsReducedMotion();
  useLiveVersion();

  usePageMeta({
    title: 'Mushaf Khan | Independent Web Developer & Creative Partner',
    description:
      'Crafting high-speed custom websites, local SEO architecture, 3D visuals, video, and AI automation for high-converting businesses. Direct collaboration with 14-day turnaround.',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] selection:bg-[#B6F500] selection:text-[#111111]">
      {/* Hero */}
      <section className="relative isolate pt-24 pb-12 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#E7E3DA] overflow-hidden">
        <HeroVideoBackground />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2.5 mb-5 md:mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#111111] font-bold">
                    M. Studio
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E3DA] shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-pulse" />
                  <span className="font-mono text-xs text-[#5B5B56] font-medium">
                    Available for new projects
                  </span>
                </motion.div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-display font-medium text-[color:var(--text-primary)] tracking-tight leading-[1.08] mb-5 md:mb-6"
              >
                I build digital work that gets{' '}
                <span className="sage-underline font-semibold">customers</span>{' '}
                through the door.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="hidden md:block mb-8"
              >
                <RoleFlipper />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mb-6 md:mb-8"
              >
                <MobileReadMore lines={2}>
                  <p className="font-sans text-base sm:text-lg text-[color:var(--text-secondary)] max-w-xl leading-relaxed">
                    <EditableText k="heroIntro">
                      I am{' '}
                      <strong className="text-[color:var(--text-primary)] font-semibold">
                        Mushaf Khan
                      </strong>{' '}
                      — a multi-skilled digital creator and developer. I build websites and apps, design brands and interfaces, edit video, make motion graphics and 3D visuals, grow search and social reach, and automate repetitive work with AI.
                    </EditableText>
                  </p>
                </MobileReadMore>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="flex flex-wrap items-center gap-3 sm:gap-4"
              >
                <Link
                  to="/contact"
                  className="min-h-[44px] w-full sm:w-auto justify-center px-6 py-3.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-sans text-sm font-bold hover:bg-[#a9e600] transition-all duration-300 flex items-center gap-2 shadow-sm hover:-translate-y-0.5 active:scale-95 group"
                >
                  <span>Start a Project</span>
                  <span className="w-5 h-5 rounded-full bg-[#111111] text-[#B6F500] flex items-center justify-center text-xs group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  to="/work"
                  className="hidden md:inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center px-5 py-3.5 rounded-full bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-[#111111] font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-xs active:scale-95"
                >
                  <span>Explore {PROJECTS.length} Projects</span>
                </Link>

                <Link
                  to="/services"
                  className="hidden md:inline-flex min-h-[44px] items-center justify-center px-4 py-3.5 rounded-full text-[#5B5B56] hover:text-[#111111] font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <span>All 8 Services</span>
                </Link>
              </motion.div>
            </div>

            <div className="lg:col-span-5 flex items-center justify-center">
              <HeroPortrait />
            </div>
          </div>
        </div>
      </section>

      {/* One-Tap Quick Actions */}
      <div className="pt-8 sm:pt-10">
        <QuickActions onNavigate={(path) => navigate(path)} />
      </div>

      {/* Interactive 3D Doors Hallway */}
      <ServicesHallway3D
        services={SERVICES}
        benefits={SERVICE_BENEFITS}
        onNavigate={(path) => navigate(path)}
        isReducedMotion={isReducedMotion}
      />

      {/* Sticky Case Studies */}
      <StickyCaseStudies />

      {/* Projects Gallery with Conversion Rate + Sorting */}
      <ProjectsGallery
        projects={PROJECTS}
        onNavigate={(path) => navigate(path)}
      />

      {/* Measured Outcomes & Testimonials & FAQ */}
      <MeasuredOutcomes />
      <TestimonialsCarousel />
      <FaqSection />

      {/* Newsletter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NewsletterBar />
      </div>

      {/* Storefront Preview Section */}
      <HomeStoreSection onNavigate={(path) => navigate(path)} />

      {/* Final Direct CTA */}
      <section className="py-20 pb-32 sm:py-24 sm:pb-36 px-4 sm:px-6 lg:px-8 border-t border-[#E7E3DA] bg-white text-[#111111]">
        <div className="max-w-3xl mx-auto text-center space-y-5 md:space-y-6">
          <span className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold">
            Ready to grow your venture?
          </span>
          <h2 className="font-display font-medium text-4xl sm:text-5xl text-[#111111] tracking-tight">
            Work with me directly.{' '}
            <span className="sage-underline">No agency middlemen.</span>
          </h2>
          <MobileReadMore lines={2} buttonClassName="mx-auto justify-center">
            <p className="font-sans text-sm sm:text-base text-[#5B5B56] max-w-xl mx-auto leading-relaxed">
              Skip the endless agency meetings. Work directly with me and get your project delivered in a clean, structured 14-day turnaround.
            </p>
          </MobileReadMore>
          <div className="pt-2 md:pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] font-sans text-xs sm:text-sm font-bold hover:bg-[#a9e600] transition-all shadow-sm group"
            >
              <span>Start a Project</span>
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href={STUDIO_INFO.fiverr}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex min-h-[44px] w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#00B22D]/10 border border-[#00B22D]/35 text-[#007D1F] font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#00B22D]/20 transition-colors items-center justify-center gap-1.5"
            >
              <span>Order on Fiverr</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
