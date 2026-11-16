import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Code2, Copy, HelpCircle, ShieldCheck, X, Zap } from 'lucide-react';
import { FAQ_ITEMS, STUDIO_INFO } from '../data/studioData';

export const FaqSchemaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    publisher: {
      '@type': 'Person',
      name: STUDIO_INFO.name,
      url: 'https://mushafkhan.com',
    },
  };

  const jsonString = JSON.stringify(schemaData, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="FAQ Schema Inspector"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#111111]/35 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E7E3DA] shadow-[0_24px_60px_-15px_rgba(17,17,17,0.22)] text-[#111111] overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-[#E7E3DA] flex items-start justify-between gap-4 bg-[#FAF8F4]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-[#6BAA00] font-bold">
                    Schema.org &middot; Google Rich Results Ready
                  </span>
                </div>
                <h3 className="font-display italic text-2xl sm:text-3xl text-[#111111]">
                  FAQ Schema Inspector{' '}
                  <span className="not-italic text-[#6BAA00] font-mono text-sm">(JSON-LD)</span>
                </h3>
                <p className="font-sans text-xs text-[#5B5B56] mt-1 max-w-lg">
                  Structured data payload embedded for Google Search rich FAQ accordion cards.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close schema inspector"
                className="p-2 rounded-xl bg-white hover:bg-[#E7E3DA]/40 text-[#5B5B56] hover:text-[#111111] transition-colors cursor-pointer border border-[#E7E3DA]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 bg-[#FAF8F4] border-b border-[#E7E3DA] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E7E3DA] text-[#111111]">
                  <ShieldCheck size={13} className="text-[#6BAA00]" />
                  <span>@type: FAQPage</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E7E3DA] text-[#111111]">
                  <Zap size={13} className="text-[#6BAA00]" />
                  <span>AskAction CTA: /contact</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E7E3DA] text-[#111111]">
                  <HelpCircle size={13} className="text-amber-600" />
                  <span>{schemaData.mainEntity.length} Entities</span>
                </span>
              </div>
              <button
                type="button"
                onClick={copyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B6F500] text-[#111111] font-semibold hover:opacity-90 transition cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy JSON-LD'}</span>
              </button>
            </div>

            <pre className="p-6 overflow-auto text-xs font-mono text-[#111111] bg-white leading-relaxed flex-1">
              <code>
                <Code2 size={12} className="inline mr-1.5 text-[#6BAA00]" />
                {jsonString}
              </code>
            </pre>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
