import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import type { StudioProject } from '../data/studioData';
import { AmbientVideo } from './BackgroundVideos';
import { DeviceMockup, ProjectStartingPrice } from './HomeSections';

export function getIndustryGlow(industry?: string): string {
  switch (industry) {
    case 'Fitness':
      return 'radial-gradient(circle at 75% 20%, rgba(182, 245, 0, 0.38), rgba(107, 170, 0, 0.16) 52%, transparent 80%)';
    case 'Restaurants & Cafes':
      return 'radial-gradient(circle at 75% 20%, rgba(245, 158, 11, 0.30), rgba(234, 88, 12, 0.12) 52%, transparent 80%)';
    case 'Clinics & Wellness':
      return 'radial-gradient(circle at 75% 20%, rgba(20, 184, 166, 0.30), rgba(13, 148, 136, 0.12) 52%, transparent 80%)';
    case 'Retail & Fashion':
      return 'radial-gradient(circle at 75% 20%, rgba(139, 92, 246, 0.28), rgba(236, 72, 153, 0.12) 52%, transparent 80%)';
    case 'Real Estate':
      return 'radial-gradient(circle at 75% 20%, rgba(14, 165, 233, 0.30), rgba(2, 132, 199, 0.12) 52%, transparent 80%)';
    default:
      return 'radial-gradient(circle at 75% 20%, rgba(182, 245, 0, 0.30), rgba(107, 170, 0, 0.12) 52%, transparent 80%)';
  }
}

export interface ProjectCardProps {
  project: StudioProject;
  index?: number;
  isMobile?: boolean;
  hovered?: boolean;
  onHoverChange?: (id: string | null) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index = 0,
  isMobile = false,
  hovered,
  onHoverChange,
}) => {
  const [localHovered, setLocalHovered] = useState(false);
  const isHovered = hovered ?? localHovered;

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onHoverChange?.(project.id);
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onHoverChange?.(null);
  };

  return (
    <div className="group relative h-full">
      {/* Industry-specific ambient glow behind the frosted glass card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1.5 rounded-[2rem] opacity-55 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{ background: getIndustryGlow(project.industryCategory) }}
      />

      <motion.article
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: isMobile ? 0 : index * 0.05 }}
        data-hovered={isHovered ? 'true' : 'false'}
        data-cursor="view"
        className="project-card relative z-10 flex h-full flex-col justify-between rounded-3xl glass-card hover:border-[#6BAA00]/60 group-hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-14px_rgba(17,17,17,0.16)] transition-all duration-300 overflow-hidden p-5"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 group-hover:opacity-70 transition-opacity duration-300"
          style={{ background: getIndustryGlow(project.industryCategory) }}
        />

        <div className="relative z-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/60 bg-[#FAF8F4]/50 mb-4 md:mb-5">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
              <AmbientVideo
                mp4Src={`/videos/projects/${project.id}.mp4`}
                webmSrc={`/videos/projects/${project.id}.webm`}
                posterSrc={project.heroImage}
                playOnHover
                isHovered={isHovered}
                className="w-full h-full"
                overlayClassName="bg-white/10"
              >
                <DeviceMockup
                  project={project}
                  hovered={isHovered}
                  subtleBackdrop
                />
              </AmbientVideo>
            </div>

            {project.resultSignal && (
              <div className="absolute top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] px-3 py-1.5 rounded-xl glass-strong font-mono text-[11px] text-[#111111] font-semibold flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[#6BAA00] shrink-0" />
                <span className="truncate">{project.resultSignal}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="hidden md:flex items-center justify-between font-mono text-[11px] text-[#5B5B56] mb-1">
              <span>{project.clientType}</span>
              <span>{project.year}</span>
            </div>
            <h2 className="font-display font-medium text-xl sm:text-2xl text-[#111111] group-hover:text-[#4C7A00] transition-colors mb-1.5 md:mb-2 leading-snug">
              {project.name}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#5B5B56] leading-relaxed line-clamp-2 md:line-clamp-3 mb-3 md:mb-4">
              {project.outcome}
            </p>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <ProjectStartingPrice projectId={project.id} />
              <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest text-[#5B5B56]">
                Starting price
              </span>
            </div>
            <div className="hidden md:flex flex-wrap gap-1.5 pt-3 border-t border-[#E7E3DA]">
              {project.stack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[10px] px-2.5 py-0.5 rounded-lg glass-pill text-[#5B5B56]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 mt-4 border-t border-[#E7E3DA]">
          <Link
            to={`/work/${project.id}`}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl glass-pill hover:bg-[#B6F500] hover:border-[#96CF00] text-[#111111] font-mono text-xs flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation group/btn font-semibold"
          >
            <span>View Project Details</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.article>
    </div>
  );
};

export default ProjectCard;
