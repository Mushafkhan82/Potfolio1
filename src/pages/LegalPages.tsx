import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePortfolioHelpers';

export const PrivacyPage: React.FC = () => {
  usePageMeta({
    title: 'Privacy Policy | Mushaf Khan',
    description: 'How this site handles the information you send through its forms.',
    canonicalUrl: 'https://mushafkhan.com/privacy',
  });

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto bg-white border border-[#E7E3DA] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 text-[#5B5B56] leading-relaxed">
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-[#111111]">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-[#5B5B56]">Last updated: November 2026</p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          What I collect
        </h2>
        <p>
          Only what you send me: the name, email, message and project details you enter in the contact, brief or newsletter forms.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          How it is used
        </h2>
        <p>
          To reply to you, scope your project and, if you subscribed, send occasional notes. I do not sell your information.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Stored in your browser
        </h2>
        <p>
          Your theme and currency choices are saved in your browser so the site remembers them. No advertising trackers are used by this site.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Third-party services
        </h2>
        <p>
          The site is served by a hosting provider, and messages may pass through email or messaging services you choose to use to contact me.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Your choices
        </h2>
        <p>You can ask me to correct or delete anything you have sent me at any time.</p>

        <p>
          Questions? Use the{' '}
          <Link to="/contact" className="text-[#4C7A00] underline font-semibold">
            contact page
          </Link>
          .
        </p>
      </article>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  usePageMeta({
    title: 'Terms of Use | Mushaf Khan',
    description: 'Terms for using this site and how project work is agreed.',
    canonicalUrl: 'https://mushafkhan.com/terms',
  });

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111111] pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto bg-white border border-[#E7E3DA] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 text-[#5B5B56] leading-relaxed">
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-[#111111]">
          Terms of Use
        </h1>
        <p className="font-mono text-xs text-[#5B5B56]">Last updated: November 2026</p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Using this site
        </h2>
        <p>
          The content here is for information about my services. You may browse and share links to it, but please do not copy the design, text or imagery without permission.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Project work
        </h2>
        <p>
          Paid work is governed by a separate written agreement or quote that sets scope, deliverables, timeline and payment.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Portfolio material
        </h2>
        <p>
          Project examples are shown to illustrate my work. Client names and results are shared with their permission where applicable.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Liability
        </h2>
        <p>
          The site is provided as is, without guarantees of uninterrupted availability. To the extent the law allows, I am not liable for losses arising from its use.
        </p>

        <h2 className="font-display text-xl font-semibold text-[#111111]">
          Changes
        </h2>
        <p>I may update these terms from time to time. The date above shows the latest version.</p>

        <p>
          Questions? Use the{' '}
          <Link to="/contact" className="text-[#4C7A00] underline font-semibold">
            contact page
          </Link>
          .
        </p>
      </article>
    </div>
  );
};
