/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DoorMaterialPreset {
  id: string;
  name: string;
  doorColor: string;
  frameColor: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  isWood: boolean;
  grainIntensity: number;
  handleFinish: 'brass' | 'black-steel' | 'satin-nickel';
  handleColor: string;
}

export interface ServiceDoorItem {
  index: string;
  slug: string;
  name: string;
  shortTitle: string;
  badge: string;
  benefit: string;
  headline: string;
  deliverables: string[];
  stat: string;
  preset: DoorMaterialPreset;
}

export const DOOR_MATERIAL_PRESETS: Record<string, DoorMaterialPreset> = {
  'charcoal-ash': {
    id: 'charcoal-ash',
    name: 'Charcoal Ash',
    doorColor: '#1e2024',
    frameColor: '#17181a',
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.28,
    clearcoatRoughness: 0.25,
    isWood: true,
    grainIntensity: 0.018,
    handleFinish: 'brass',
    handleColor: '#cfb57a',
  },
  'black-walnut': {
    id: 'black-walnut',
    name: 'Black Walnut',
    doorColor: '#2b211a',
    frameColor: '#1c1511',
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    isWood: true,
    grainIntensity: 0.022,
    handleFinish: 'brass',
    handleColor: '#d6be85',
  },
  'graphite-grey': {
    id: 'graphite-grey',
    name: 'Graphite Grey',
    doorColor: '#25272a',
    frameColor: '#1a1b1d',
    roughness: 0.52,
    metalness: 0.08,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
    isWood: false,
    grainIntensity: 0.008,
    handleFinish: 'satin-nickel',
    handleColor: '#a8adb4',
  },
  'espresso-oak': {
    id: 'espresso-oak',
    name: 'Espresso Oak',
    doorColor: '#201814',
    frameColor: '#16100d',
    roughness: 0.36,
    metalness: 0.02,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    isWood: true,
    grainIntensity: 0.02,
    handleFinish: 'brass',
    handleColor: '#c8aa68',
  },
  'matte-black': {
    id: 'matte-black',
    name: 'Matte Black',
    doorColor: '#141415',
    frameColor: '#0d0d0e',
    roughness: 0.6,
    metalness: 0.05,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    isWood: false,
    grainIntensity: 0.006,
    handleFinish: 'black-steel',
    handleColor: '#3a3a3e',
  },
  'smoked-oak': {
    id: 'smoked-oak',
    name: 'Smoked Oak',
    doorColor: '#2c221b',
    frameColor: '#1e1712',
    roughness: 0.35,
    metalness: 0.02,
    clearcoat: 0.32,
    clearcoatRoughness: 0.22,
    isWood: true,
    grainIntensity: 0.022,
    handleFinish: 'brass',
    handleColor: '#d1b87a',
  },
  'dark-walnut': {
    id: 'dark-walnut',
    name: 'Dark Walnut',
    doorColor: '#251b15',
    frameColor: '#19120e',
    roughness: 0.33,
    metalness: 0.02,
    clearcoat: 0.36,
    clearcoatRoughness: 0.18,
    isWood: true,
    grainIntensity: 0.024,
    handleFinish: 'brass',
    handleColor: '#d6be85',
  },
  'slate-grey': {
    id: 'slate-grey',
    name: 'Slate Grey',
    doorColor: '#282c31',
    frameColor: '#1c1f23',
    roughness: 0.48,
    metalness: 0.06,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    isWood: false,
    grainIntensity: 0.009,
    handleFinish: 'satin-nickel',
    handleColor: '#a2a7af',
  },
};

export const SERVICES_DOORS_DATA: ServiceDoorItem[] = [
  {
    index: '01',
    slug: 'web-development',
    name: 'Web Development',
    shortTitle: 'Web Development',
    badge: '01 / Engineering',
    headline: 'Fast, bespoke websites & web applications that convert visitors into paying clients.',
    benefit: 'Sub-second React sites that convert phone visitors into booked tables.',
    deliverables: [
      'React 19 & TypeScript frontend',
      'Sub-second 98+ mobile performance',
      'Direct WhatsApp & booking checkout',
    ],
    stat: '+44% Direct Bookings',
    preset: DOOR_MATERIAL_PRESETS['charcoal-ash'],
  },
  {
    index: '02',
    slug: 'seo',
    name: 'Search Optimization',
    shortTitle: 'Search Optimization',
    badge: '02 / Organic Growth',
    headline: 'Dominating search intent where your high-intent local buyers are searching.',
    benefit: 'High-ranking Google Maps presence and clean structured data.',
    deliverables: [
      'Google Maps & LocalBusiness pack',
      'Structured Schema JSON-LD markup',
      'Technical Core Web Vitals audit',
    ],
    stat: '#1 Local Maps Rank',
    preset: DOOR_MATERIAL_PRESETS['black-walnut'],
  },
  {
    index: '03',
    slug: 'social-media-management',
    name: 'Social Media',
    shortTitle: 'Social Media',
    badge: '03 / Audience',
    headline: 'Consistent editorial curation that turns passive scrollers into recurring clients.',
    benefit: 'Consistent editorial photography and recurring local client engagement.',
    deliverables: [
      'Editorial content pipeline',
      'Reels & carousel templates',
      'Monthly engagement & growth reporting',
    ],
    stat: '+180% Engagement',
    preset: DOOR_MATERIAL_PRESETS['graphite-grey'],
  },
  {
    index: '04',
    slug: 'ui-ux-graphic-design',
    name: 'UI/UX & Branding',
    shortTitle: 'UI/UX & Design',
    badge: '04 / Identity',
    headline: 'Cohesive brand identities, Figma design systems, and tactile menus.',
    benefit: 'Figma design systems and cohesive menus from print to screen.',
    deliverables: [
      'Complete Figma design system',
      'Typography & color architecture',
      'Physical print & packaging assets',
    ],
    stat: '3x Faster Iterations',
    preset: DOOR_MATERIAL_PRESETS['espresso-oak'],
  },
  {
    index: '05',
    slug: 'video-editing',
    name: 'Video Production',
    shortTitle: 'Video Production',
    badge: '05 / Motion',
    headline: 'High-retention commercial cuts, documentary storytelling, and warm color grading.',
    benefit: 'High-retention commercial cuts and warm color grading.',
    deliverables: [
      'Commercial cuts for social & web',
      'Warm filmic color grading',
      'Custom Foley sound design',
    ],
    stat: '82% Avg Watch Time',
    preset: DOOR_MATERIAL_PRESETS['matte-black'],
  },
  {
    index: '06',
    slug: 'motion-graphics',
    name: 'Motion Graphics',
    shortTitle: 'Motion Graphics',
    badge: '06 / Animation',
    headline: 'Fluid 2D logo animation, kinetic typography, and tactile UI micro-interactions.',
    benefit: 'Fluid 2D logo animation and tactile micro-interactions.',
    deliverables: [
      'Logo & brand reveal animation',
      'Kinetic typography promos',
      'Lightweight Lottie & WebGL assets',
    ],
    stat: 'Award-winning craft',
    preset: DOOR_MATERIAL_PRESETS['smoked-oak'],
  },
  {
    index: '07',
    slug: '3d-blender',
    name: '3D & Blender',
    shortTitle: '3D & Blender',
    badge: '07 / Spatial',
    headline: 'Photoreal product models, procedural materials, and interactive WebGL scenes.',
    benefit: 'Spatial product visualizations and photoreal procedural renders.',
    deliverables: [
      'Procedural PBR materials & lighting',
      'Photoreal product visualizers',
      'Interactive 60fps Three.js models',
    ],
    stat: '60 FPS WebGL',
    preset: DOOR_MATERIAL_PRESETS['dark-walnut'],
  },
  {
    index: '08',
    slug: 'ai-automation',
    name: 'AI Automation',
    shortTitle: 'AI Automation',
    badge: '08 / Systems',
    headline: 'Automated WhatsApp inquiry pipelines and LLM systems that eliminate busywork.',
    benefit: 'Automated WhatsApp inquiry pipelines that eliminate daily busywork.',
    deliverables: [
      'Automated WhatsApp lead triage',
      'CRM & Google Sheets synchronization',
      'Custom LLM document assistants',
    ],
    stat: '15 hrs/wk Saved',
    preset: DOOR_MATERIAL_PRESETS['slate-grey'],
  },
];

export const TIMELINE = {
  // Normalized segment thresholds within each door turn (p: 0 -> 1)
  APPEAR_END: 0.10,
  HANDLE_LATCH_START: 0.10,
  HANDLE_LATCH_END: 0.20,
  DOOR_SWING_START: 0.20,
  DOOR_SWING_END: 0.60,
  PREVIEW_FADE_START: 0.22,
  PREVIEW_CRISP: 0.60,
  HOLD_START: 0.60,
  HOLD_END: 0.80,
  CLOSE_START: 0.80,
  CLOSE_END: 0.95,
  TRANSITION_SWAP: 0.95,
  // Angle constants
  MAX_DOOR_ANGLE: -1.82, // ~104 degrees open toward camera
  AJAR_HOVER_ANGLE: -0.07, // ~4 degrees open on hover
  HANDLE_LATCH_ANGLE: 0.44, // ~25 degrees handle tilt
};
