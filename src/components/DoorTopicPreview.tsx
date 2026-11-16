import React from 'react';
import {
  ArrowRight,
  Check,
  Code2,
  Search,
  Share2,
  Layout,
  Video,
  Film,
  Box,
  Bot,
  Sparkles,
} from 'lucide-react';
import { AmbientVideo } from './BackgroundVideos';

export interface ServicePortfolioItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  thumbnail?: string;
  image?: string;
  tags?: string[];
  growthStat?: string;
  beforeMetric?: string;
  afterMetric?: string;
}

export interface ServiceTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface ServiceTopic {
  slug: string;
  name: string;
  shortTitle?: string;
  icon?: string;
  badge: string;
  headline: string;
  description: string;
  solutionSummary: string;
  included: string[];
  tools: string[];
  portfolio: ServicePortfolioItem[];
  testimonial?: ServiceTestimonial;
}

export interface DoorThemePalette {
  base: string;
  light: string;
  dark: string;
  roomBg: string;
  roomGlow: string;
  accentHex: string;
  label: string;
}

export const DOOR_THEMES: Record<string, DoorThemePalette> = {
  'web-development': {
    base: '#1E4D3B',
    light: '#2D7257',
    dark: '#102B20',
    roomBg: 'linear-gradient(180deg, #FFFFFF 0%, #F4F8EC 65%, #EAF2DC 100%)',
    roomGlow: 'rgba(107, 170, 0, 0.25)',
    accentHex: '#4C7A00',
    label: 'Heritage Emerald',
  },
  seo: {
    base: '#A44829',
    light: '#C65E3B',
    dark: '#692914',
    roomBg: 'linear-gradient(180deg, #FFFFFF 0%, #FBF4EC 65%, #F7E8D8 100%)',
    roomGlow: 'rgba(180, 83, 9, 0.22)',
    accentHex: '#B45309',
    label: 'Terracotta Ochre',
  },
  'social-media-management': {
    base: '#224976',
    light: '#3267A3',
    dark: '#132945',
    roomBg: 'linear-gradient(180deg, #FFFFFF 0%, #EFF5FC 65%, #E0ECF9 100%)',
    roomGlow: 'rgba(29, 78, 216, 0.22)',
    accentHex: '#1D4ED8',
    label: 'Aegean Cobalt',
  },
  'ui-ux-graphic-design': {
    base: '#612842',
    light: '#85395B',
    dark: '#3B1627',
    roomBg: 'linear-gradient(180deg, #FFFFFF 0%, #FBF1F5 65%, #F5E1EA 100%)',
    roomGlow: 'rgba(157, 23, 77, 0.22)',
    accentHex: '#9D174D',
    label: 'Venetian Plum',
  },
};

export function getServiceIcon(slug: string, size = 16) {
  switch (slug) {
    case 'web-development':
      return <Code2 size={size} />;
    case 'seo':
      return <Search size={size} />;
    case 'social-media-management':
      return <Share2 size={size} />;
    case 'ui-ux-graphic-design':
      return <Layout size={size} />;
    case 'video-editing':
      return <Video size={size} />;
    case 'motion-graphics':
      return <Film size={size} />;
    case '3d-blender':
      return <Box size={size} />;
    case 'ai-automation':
      return <Bot size={size} />;
    default:
      return <Sparkles size={size} />;
  }
}

interface DoorTopicPreviewProps {
  categoryTitle: string;
  primaryService: ServiceTopic;
  subTopics: ServiceTopic[];
  palette: DoorThemePalette;
  indexLabel: string;
  onEnterSlug: (slug: string) => void;
}

/**
 * Illuminated doorway interior revealed as the visitor hovers (-45deg) or clicks (-102deg).
 */
export const DoorTopicPreview: React.FC<DoorTopicPreviewProps> = ({
  categoryTitle,
  primaryService,
  subTopics,
  palette,
  indexLabel,
  onEnterSlug,
}) => {
  return (
    <div
      onClick={() => onEnterSlug(primaryService.slug)}
      className="door-room-interior flex flex-col justify-between p-4 pt-9 sm:p-5 sm:pt-11 text-[#111111] select-none cursor-pointer"
      style={{
        background: palette.roomBg,
        ['--room-glow' as string]: palette.roomGlow,
      }}
    >
      <AmbientVideo
        mp4Src={`/videos/services/${primaryService.slug}.mp4`}
        webmSrc={`/videos/services/${primaryService.slug}.webm`}
        playOnHover
        overlayClassName="bg-white/80"
        className="!absolute inset-0 z-0"
      />
      <div className="door-room-lightbeam" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#5B5B56] border-b border-[#E7E3DA] pb-1.5">
            <span
              className="flex items-center gap-1.5 truncate font-semibold"
              style={{ color: palette.accentHex }}
            >
              {getServiceIcon(primaryService.slug, 12)}
              <span className="truncate">{categoryTitle}</span>
            </span>
            <span className="tabular-nums text-[#5B5B56] shrink-0">{indexLabel}</span>
          </div>

          <h4 className="font-display text-lg sm:text-xl leading-tight text-[#111111] font-medium">
            {primaryService.name}
          </h4>

          <p className="text-xs leading-snug text-[#5B5B56] line-clamp-2">
            {primaryService.headline}
          </p>
        </div>

        {/* Preserved included deliverables & companion topic links */}
        <div className="space-y-2.5 my-2">
          <ul className="space-y-1.5">
            {primaryService.included.slice(0, 3).map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] leading-tight text-[#111111]"
              >
                <Check
                  size={11}
                  className="shrink-0 mt-0.5"
                  style={{ color: palette.accentHex }}
                />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>

          {subTopics.length > 0 && (
            <div className="pt-2 border-t border-[#E7E3DA] space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5B5B56]">
                Also in this room
              </div>
              <div className="flex flex-col gap-1">
                {subTopics.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnterSlug(sub.slug);
                    }}
                    className="text-left text-[11px] font-mono text-[#111111] hover:text-[#4C7A00] flex items-center justify-between gap-1 transition-colors cursor-pointer"
                  >
                    <span className="truncate">{sub.name}</span>
                    <ArrowRight size={10} className="shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnterSlug(primaryService.slug);
          }}
          className="w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold tracking-wide flex items-center justify-between transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap bg-[#B6F500] text-[#111111] shadow-xs"
        >
          <span>Open Topic</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
