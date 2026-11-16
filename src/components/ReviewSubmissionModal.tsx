import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Star, X } from 'lucide-react';
import { PROJECTS } from '../data/studioData';
import { submitReviewSubmission } from '../lib/liveContent';

export const ReviewSubmissionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    projectWorkedOn: PROJECTS[0]?.name || '',
    rating: 5,
    text: '',
    consentGiven: true,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.businessName.trim() || !form.text.trim()) {
      setError('Please fill in your name, business, and review text.');
      return;
    }
    if (!form.consentGiven) {
      setError('Please check the permission box to allow quoting on the website.');
      return;
    }
    setError('');
    setBusy(true);
    const res = await submitReviewSubmission(form);
    setBusy(false);
    if (res.success) {
      setDone(true);
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Client Review Submission"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/35 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-[#E7E3DA] shadow-[0_24px_60px_-15px_rgba(17,17,17,0.22)] rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-bold">
              Client Feedback
            </span>
            <h2 className="font-display text-3xl text-[#111111]">
              Share your experience
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="w-9 h-9 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-center text-[#111111] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#B6F500] text-[#111111] flex items-center justify-center">
              <Check size={22} />
            </div>
            <h3 className="font-display text-2xl text-[#111111]">
              Thank you for the review.
            </h3>
            <p className="text-sm text-[#5B5B56]">
              Your feedback has been submitted for studio moderation.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00]"
              />
              <input
                type="text"
                placeholder="Company or venture"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#5B5B56]">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  aria-label={`Rate ${star} stars`}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    size={18}
                    className={
                      star <= form.rating ? 'fill-[#6BAA00] text-[#6BAA00]' : 'text-[#E7E3DA]'
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              placeholder="What improved for your customers or workflow?"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] outline-none focus:border-[#6BAA00] resize-none"
            />

            <label className="flex items-start gap-2.5 text-xs text-[#5B5B56] cursor-pointer">
              <input
                type="checkbox"
                checked={form.consentGiven}
                onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })}
                className="mt-0.5 accent-[#6BAA00]"
              />
              <span>I permit Mushaf Khan Digital Studio to quote this testimonial publicly.</span>
            </label>

            {error && (
              <p role="alert" className="text-xs text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-full bg-[#B6F500] text-[#111111] text-sm font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
