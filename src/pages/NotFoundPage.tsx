import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePortfolioHelpers';

export const NotFoundPage: React.FC = () => {
  usePageMeta({
    title: 'Page not found | Mushaf Khan',
    description: 'This page does not exist.',
    noIndex: true,
  });

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-28 sm:pt-40 pb-32 px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold mb-3">
        Error 404
      </p>
      <h1 className="font-display text-4xl sm:text-7xl font-medium text-[#111111] tracking-tight mb-4">
        This door leads nowhere.
      </h1>
      <p className="text-[#5B5B56] mb-8 max-w-md mx-auto">
        The page you are looking for moved or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] hover:bg-[#a9e600] text-sm font-bold shadow-xs transition-colors"
        >
          Back home
        </Link>
        <Link
          to="/work"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-[#111111] text-sm font-semibold transition-colors"
        >
          See the work
        </Link>
        <Link
          to="/contact"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-[#111111] text-sm font-semibold transition-colors"
        >
          Contact
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
