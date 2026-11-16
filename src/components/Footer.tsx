import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, Code2, Lock } from 'lucide-react';
import { PROJECTS, SERVICES, STUDIO_INFO } from '../data/studioData';
import { NewsletterBar } from './NewsletterBar';
import { CurrencySelector } from './CurrencySelector';
import { AmbientSoundToggle } from './ShellChrome';
import { FaqSchemaModal } from './FaqSchemaModal';
import { AmbientVideo } from './BackgroundVideos';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <footer
        ref={footerRef}
        className="relative w-full bg-[#FAF8F4] text-[#111111] pt-16 sm:pt-24 pb-32 md:pb-24 px-4 sm:px-6 lg:px-8 border-t border-[#E7E3DA] overflow-hidden select-none"
      >
        <AmbientVideo
          mp4Src="/videos/testimonials-ambient-light.mp4"
          webmSrc="/videos/hero-ambient-light.webm"
          posterSrc="/videos/hero-ambient-light-poster.webp"
          className="pointer-events-none !absolute inset-0 z-0"
          videoClassName="opacity-20 blur-[2px]"
          overlayClassName="bg-[#FAF8F4]/78"
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-16">
            <NewsletterBar />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-[color:var(--border-subtle)]">
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] font-semibold">
                Selected Work
              </h4>
              <p className="text-xs text-[color:var(--text-muted)] font-mono leading-relaxed">
                Production web applications, SEO, 3D interactive assets and high-conversion video.
              </p>
              <ul className="space-y-2 font-mono text-xs text-[color:var(--text-secondary)] list-none p-0 m-0">
                {PROJECTS.slice(0, 4).map((proj) => (
                  <li key={proj.id}>
                    <Link
                      to={`/work/${proj.id}`}
                      onClick={scrollTop}
                      className="hover:text-[color:var(--text-primary)] transition-colors flex items-center justify-between group"
                    >
                      <span>{proj.name}</span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    to="/work"
                    onClick={scrollTop}
                    className="text-[color:var(--accent-text)] font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Explore all {PROJECTS.length} projects</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent-text)] font-semibold">
                Navigate
              </h4>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-[color:var(--text-secondary)]">
                <div>
                  <span className="text-[10px] uppercase text-[color:var(--text-muted)] block mb-2 font-bold">
                    Studio
                  </span>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    <li><Link to="/" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Home</Link></li>
                    <li><Link to="/work" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Work</Link></li>
                    <li><Link to="/services" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Services Hub</Link></li>
                    <li><Link to="/about" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">About</Link></li>
                    <li><Link to="/process" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">14-Day Sprint</Link></li>
                    <li><Link to="/contact" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Contact</Link></li>
                    <li><Link to="/skills" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Skills</Link></li>
                    <li><Link to="/pricing" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Pricing</Link></li>
                    <li><Link to="/shop" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors text-[color:var(--accent-text)] font-semibold">Shop</Link></li>
                    <li><Link to="/track-order" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Track Order</Link></li>
                    <li><Link to="/blog" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Journal</Link></li>
                    <li><Link to="/book" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Book a call</Link></li>
                    <li><Link to="/privacy" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Privacy</Link></li>
                    <li><Link to="/terms" onClick={scrollTop} className="hover:text-[color:var(--text-primary)] transition-colors">Terms</Link></li>
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[color:var(--text-muted)] block mb-2 font-bold">
                    Services
                  </span>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    {SERVICES.slice(0, 6).map((svc) => (
                      <li key={svc.slug}>
                        <Link
                          to={`/services/${svc.slug}`}
                          onClick={scrollTop}
                          className="hover:text-[color:var(--text-primary)] transition-colors truncate block"
                        >
                          {svc.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 space-y-4">
              <Link
                to="/"
                onClick={scrollTop}
                className="font-display font-bold text-3xl sm:text-4xl text-[color:var(--text-primary)] tracking-tight inline-block group"
              >
                Mushaf
                <span className="text-[color:var(--accent-text)] inline-block transition-transform group-hover:scale-125">
                  .
                </span>
              </Link>
              <p className="font-mono text-xs text-[color:var(--text-muted)] leading-relaxed">
                Working directly with founders and growing businesses worldwide.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={STUDIO_INFO.fiverr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00B22D]/15 border border-[#00B22D]/40 text-[#00B22D] font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#00B22D]/25 transition-colors"
                >
                  <span>Fiverr: Mushaf Khan</span>
                  <ArrowUpRight size={11} />
                </a>
                <a
                  href={`https://instagram.com/${STUDIO_INFO.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-pill text-[#5B5B56] font-mono text-[11px] hover:text-[#6BAA00] hover:border-[#6BAA00]/60 transition-colors"
                >
                  <span>@{STUDIO_INFO.instagramUsername}</span>
                  <ArrowUpRight size={11} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 text-[11px] font-mono text-[#5B5B56]">
            <div className="flex flex-wrap items-center gap-3">
              <p>&copy; {year} Mushaf Khan. All rights reserved.</p>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="min-h-[44px] px-2 hover:text-[#111111] transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Studio Admin Portal"
              >
                <Lock size={10} />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setSchemaOpen((v) => !v)}
                className="min-h-[44px] group inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill hover:bg-[#B6F500]/20 hover:border-[#6BAA00]/50 text-[#5B5B56] hover:text-[#111111] transition-all duration-200 cursor-pointer"
                title="Toggle FAQ Schema (JSON-LD) for SEO verification"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00]" />
                <Code2 size={10} className="text-[#6BAA00]" />
                <span>FAQ Schema</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">
                  Currency:
                </span>
                <CurrencySelector variant="footer" align="right" />
              </div>
              <AmbientSoundToggle />
              <button
                type="button"
                onClick={scrollTop}
                className="min-h-[44px] px-2 inline-flex items-center gap-1 text-[color:var(--text-primary)] hover:text-[color:var(--accent-text)] transition-colors cursor-pointer"
              >
                <span>Back to top</span>
                <ArrowUp size={11} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      <FaqSchemaModal isOpen={schemaOpen} onClose={() => setSchemaOpen(false)} />
    </>
  );
};
