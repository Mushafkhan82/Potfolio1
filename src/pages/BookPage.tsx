import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '../data/studioData';
import { usePageMeta } from '../hooks/usePortfolioHelpers';

export const BookPage: React.FC = () => {
  usePageMeta({
    title: 'Book a Call | Mushaf Khan',
    description: 'Book a short intro call to talk through your project, scope and timeline.',
    canonicalUrl: 'https://mushafkhan.com/book',
  });

  const bookingUrl = SITE_META.bookingUrl;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-[#4C7A00] font-bold mb-3">
          Book a call
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-medium text-[#111111] tracking-tight mb-8">
          Let's talk through your project.
        </h1>

        {bookingUrl ? (
          <iframe
            src={bookingUrl}
            title="Book a call"
            loading="lazy"
            className="w-full h-[520px] sm:h-[680px] lg:h-[720px] rounded-3xl bg-white border border-[#E7E3DA] shadow-sm"
          />
        ) : (
          <div className="bg-white border border-[#E7E3DA] rounded-3xl p-8 max-w-xl shadow-sm">
            <p className="text-[#5B5B56] mb-5">
              Online booking is being set up. In the meantime, send a short brief and I will reply with available times.
            </p>
            <Link
              to="/contact"
              className="min-h-[44px] inline-flex items-center px-6 py-3 rounded-full bg-[#B6F500] text-[#111111] border border-[#96CF00] text-sm font-bold hover:bg-[#a9e600] transition"
            >
              Send a brief
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPage;
