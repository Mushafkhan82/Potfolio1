import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { subscribeNewsletter } from '../lib/liveContent';

export const NewsletterBar: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email format (e.g. name@domain.com).');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await subscribeNewsletter(trimmed);
      if (res.success) {
        setDone(true);
        setEmail('');
      } else {
        setError(res.message);
      }
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E7E3DA] shadow-xs rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="max-w-lg">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-bold block mb-1">
          Studio Dispatch
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-[#111111]">
          Monthly notes on speed, conversions &amp; digital craft.
        </h3>
        <p className="text-xs sm:text-sm text-[#5B5B56] mt-1">
          Practical teardowns and store drops. Zero spam, unsubscribe anytime.
        </p>
      </div>

      {done ? (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#B6F500]/25 border border-[#6BAA00]/30 text-xs font-mono text-[#111111] font-semibold">
          <Check size={14} className="text-[#6BAA00]" /> Subscribed to studio notes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full lg:w-auto flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@company.com"
              aria-label="Email address for newsletter"
              className="w-full sm:min-w-[240px] min-h-[44px] rounded-full px-4 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] placeholder:text-[#5B5B56]/70 outline-none focus:border-[#6BAA00] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] font-sans text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-60 shadow-xs"
            >
              <span>{submitting ? 'Joining...' : 'Subscribe'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-rose-600 px-2">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
};
