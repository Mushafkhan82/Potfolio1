import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import { SERVICES } from '../data/studioData';
import { usePageMeta } from '../hooks/usePortfolioHelpers';
import { MobileReadMore } from '../components/MobileReadMore';

export const SkillsPage: React.FC = () => {
  const navigate = useNavigate();

  usePageMeta({
    title: 'Skills | Mushaf Khan',
    description:
      'Everything Mushaf Khan does: web development, SEO, social media, UI/UX and graphic design, video editing, motion graphics, 3D and AI automation.',
    canonicalUrl: 'https://mushafkhan.com/skills',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-28 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="min-h-[44px] inline-flex items-center gap-2 mb-8 md:mb-10 px-4 py-2.5 rounded-full bg-white border border-[#E7E3DA] text-[#111111] text-sm font-semibold hover:border-[#6BAA00] transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <p className="hidden md:block font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold mb-3">
          Skills
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-[#111111] leading-[1.02] mb-5">
          Eight disciplines,
          <br />
          one partner.
        </h1>
        <MobileReadMore lines={2} className="mb-10 md:mb-14">
          <p className="text-lg text-[#5B5B56] max-w-2xl">
            Everything below is work I do directly, from the first sketch to the finished result. Pick any area to see what it includes.
          </p>
        </MobileReadMore>

        <div className="grid gap-5 md:grid-cols-2">
          {SERVICES.map((svc, idx) => (
            <motion.article
              key={svc.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (idx % 2) * 0.08 }}
              className="bg-white border border-[#E7E3DA] hover:border-[#6BAA00]/60 transition-colors rounded-3xl p-6 sm:p-8 flex flex-col shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="font-mono text-xs text-[#4C7A00] font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <Link
                  to={`/services/${svc.slug}`}
                  aria-label={`Open ${svc.name}`}
                  className="w-11 h-11 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] flex items-center justify-center hover:bg-[#B6F500] hover:border-[#96CF00] transition-colors"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <h2 className="font-display text-3xl text-[#111111] mb-2">{svc.name}</h2>
              <p className="text-sm text-[#5B5B56] mb-4 md:mb-5 line-clamp-2 md:line-clamp-none">{svc.headline}</p>
              <ul className="hidden md:block space-y-2.5 text-sm text-[#111111]">
                {(svc.included || []).slice(0, 5).map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#4C7A00]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            to="/work"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-sm font-bold shadow-xs transition-colors"
          >
            See the work
          </Link>
          <Link
            to="/contact"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-[#111111] text-sm font-semibold transition-colors"
          >
            Start a project
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;
