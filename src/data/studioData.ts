// Studio portfolio data, services, projects, and default configuration

export interface ServicePortfolioItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  thumbnail?: string;
  image?: string;
  tags: string[];
  growthStat?: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeMetric?: string;
  afterMetric?: string;
  videoDuration?: string;
  videoUrl?: string;
  turntableGif?: string;
  turntableImages?: string[];
  timeSaved?: string;
}

export interface StudioService {
  slug: string;
  name: string;
  shortTitle: string;
  icon: string;
  badge: string;
  headline: string;
  description: string;
  solutionSummary: string;
  included: string[];
  tools: string[];
  portfolioType: string;
  portfolio: ServicePortfolioItem[];
  testimonial: { quote: string; author: string; role: string; company: string };
  fiverrGigUrl: string;
}

export interface StudioProject {
  id: string;
  name: string;
  clientType: string;
  serviceType: string;
  industryCategory: string;
  year: string;
  role: string;
  stack: string[];
  toolsUsed?: string[];
  outcome: string;
  deliveryDays: number;
  resultSignal: string;
  liveUrl?: string;
  clientInstagram?: string;
  googleMapsUrl?: string;
  videoUrl?: string;
  desktopShot?: string;
  mobileShot?: string;
  heroImage?: string;
  caseStudy: {
    challenge: string;
    solution: string;
    metric: string;
    fullTestimonial?: { quote: string; author: string; role: string; company: string };
  };
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  defaultRateToUSD: number;
}

export const PORTRAIT_URL = "/assets/studio/mushaf-khan-portrait.webp";
export const BACKDROP_VIDEOS = {
  dark: "/assets/studio/backdrop-dark.mp4",
  light: "/assets/studio/backdrop-light.mp4",
};
export const BACKDROP_POSTERS = {
  dark: "/assets/studio/embedded-2.jpg",
  light: "/assets/studio/embedded-3.jpg",
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "PKR", symbol: "\u20A8", name: "Pakistani Rupee", flag: "\u{1F1F5}\u{1F1F0}", defaultRateToUSD: 280 },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "\u{1F1FA}\u{1F1F8}", defaultRateToUSD: 1 },
  { code: "GBP", symbol: "\u00A3", name: "British Pound", flag: "\u{1F1EC}\u{1F1E7}", defaultRateToUSD: 0.79 },
  { code: "EUR", symbol: "\u20AC", name: "Euro", flag: "\u{1F1EA}\u{1F1FA}", defaultRateToUSD: 0.92 },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", flag: "\u{1F1E6}\u{1F1EA}", defaultRateToUSD: 3.67 },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal", flag: "\u{1F1F8}\u{1F1E6}", defaultRateToUSD: 3.75 },
  { code: "INR", symbol: "\u20B9", name: "Indian Rupee", flag: "\u{1F1EE}\u{1F1F3}", defaultRateToUSD: 83 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "\u{1F1E8}\u{1F1E6}", defaultRateToUSD: 1.37 },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar", flag: "\u{1F1E6}\u{1F1FA}", defaultRateToUSD: 1.52 },
  { code: "CNY", symbol: "\u00A5", name: "Chinese Yuan", flag: "\u{1F1E8}\u{1F1F3}", defaultRateToUSD: 7.24 },
];

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1, PKR: 280, GBP: 0.79, EUR: 0.92, AED: 3.67, SAR: 3.75, INR: 83, CAD: 1.37, AUD: 1.52, CNY: 7.24,
};

export const PROJECT_PRICES: Record<string, Record<string, number>> = {
  "osteria-fontana": { USD: 1800, PKR: 120000 },
  "bar-kanso": { USD: 2050, PKR: 140000 },
  "manoir-patisserie": { USD: 2350, PKR: 155000 },
  "taqueria-norte": { USD: 2600, PKR: 175000 },
  "soma-movement": { USD: 1800, PKR: 120000 },
  "harbor-dental": { USD: 2050, PKR: 140000 },
  "kollektiv-goods": { USD: 2350, PKR: 155000 },
  "atelier-v": { USD: 2600, PKR: 175000 },
  "sloane-properties": { USD: 1800, PKR: 120000 },
  "forge-strength": { USD: 2050, PKR: 140000 },
  "pechs-dental-seo": { USD: 1000, PKR: 70000 },
  "clifton-bistro-seo": { USD: 1150, PKR: 80000 },
  "crumb-co-social": { USD: 1000, PKR: 70000 },
  "kollektiv-design-system": { USD: 1000, PKR: 70000 },
  "ceramicist-studio-video": { USD: 600, PKR: 40000 },
  "osteria-kinetic-reveal": { USD: 800, PKR: 55000 },
  "kollektiv-carafe-3d": { USD: 1500, PKR: 100000 },
  "clinic-intake-automation": { USD: 1600, PKR: 110000 },
};

export const BUDGET_TIERS: Record<string, [number, number | null][]> = {
  USD: [[500, 1500], [1500, 3500], [3500, 7500], [7500, null]],
  PKR: [[50000, 120000], [120000, 300000], [300000, 700000], [700000, null]],
};

export const SERVICES: StudioService[] = [
  {
    "slug": "web-development",
    "name": "Web Development",
    "shortTitle": "Web Development",
    "icon": "Code2",
    "badge": "01 / Engineering",
    "headline": "Fast, custom websites & web applications that convert visitors into paying clients.",
    "description": "Every website is handcrafted with React, TypeScript, and modern edge performance. No bloated WordPress themes, no fragile page-builders, and no 8-second page loads that leak revenue.",
    "solutionSummary": "I design and code bespoke digital storefronts, booking systems, and custom web applications that load in under 800 milliseconds and turn passersby into regulars.",
    "included": [
      "React 19 & TypeScript frontend",
      "Sub-second 98+ mobile speed",
      "Direct WhatsApp & booking checkout",
      "Headless CMS or Google Sheets real-time menu/inventory synchronization",
      "Cross-browser cross-device compatibility testing down to 360px viewports",
      "Structured SEO Schema.org LocalBusiness JSON-LD markup included by default"
    ],
    "tools": [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vite",
      "Next.js",
      "Firebase",
      "PostgreSQL",
      "Cloudflare"
    ],
    "portfolioType": "web",
    "portfolio": [
      {
        "id": "web-osteria",
        "title": "Osteria Fontana Digital Flagship",
        "caption": "Sub-700ms digital wine cellar list with direct Resy table booking integration.",
        "category": "Fine-Casual Dining",
        "thumbnail": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "React",
          "Resy API",
          "Speed Optimization"
        ],
        "growthStat": "+44% Direct Bookings"
      },
      {
        "id": "web-soma",
        "title": "Soma Movement Studio Booking Platform",
        "caption": "Physiotherapy intake & clinician schedule management eliminating morning reception phone queues.",
        "category": "Healthcare & Wellness",
        "thumbnail": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "TypeScript",
          "Intake Workflows",
          "Mindbody Sync"
        ],
        "growthStat": "2 hrs/day Desk Time Saved"
      },
      {
        "id": "web-kollektiv",
        "title": "Kollektiv Goods Editorial Storefront",
        "caption": "Editorial ceramic catalog with instant client-side filtering and zero-lag mobile transitions.",
        "category": "Retail & Homeware",
        "thumbnail": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "E-commerce",
          "Tailwind",
          "Sub-900ms"
        ],
        "growthStat": "+64% Mobile Catalog Browse"
      }
    ],
    "testimonial": {
      "quote": "Mushaf built a bespoke web app that loads eight times faster than our previous agency site. Direct table reservations jumped 44% in six weeks.",
      "author": "Marco Valenti",
      "role": "Owner & Restaurateur",
      "company": "Osteria Fontana"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "seo",
    "name": "SEO Optimization",
    "shortTitle": "SEO Optimization",
    "icon": "Search",
    "badge": "02 / Search Growth",
    "headline": "Dominate Google search results and local Maps pins without burning cash on ads.",
    "description": "Deep technical site optimization, competitive keyword research, Schema.org rich snippet architecture, and LocalBusiness verification that turn searchers into organic customers.",
    "solutionSummary": "Stop paying for pay-per-click traffic that evaporates the moment you stop spending. I build technical SEO moats that rank your venue at the very top of local search packs.",
    "included": [
      "Local Google Maps ranking",
      "Schema structured business markup",
      "Zero-spam backlink defense",
      "Google Business Profile optimization, local citations, & Google Maps pin synchronization",
      "On-page heading hierarchy, semantic internal linking, & meta description engineering",
      "Monthly keyword ranking tracker and organic impression dashboard"
    ],
    "tools": [
      "Google Search Console",
      "Ahrefs",
      "SEMrush",
      "Screaming Frog",
      "Schema Validator",
      "Google Analytics 4"
    ],
    "portfolioType": "seo",
    "portfolio": [
      {
        "id": "seo-clinic",
        "title": "PECHS Dental Practice Search Takeover",
        "caption": "Scaled organic impressions from 420/month to 11,800/month by fixing crawl bottlenecks and adding medical schema.",
        "category": "Local Healthcare SEO",
        "beforeLabel": "Position #24 (280 Monthly Impressions)",
        "afterLabel": "Position #1 Local 3-Pack (11,800 Monthly Impressions)",
        "beforeMetric": "Rank #24",
        "afterMetric": "Rank #1 Pack",
        "tags": [
          "Local SEO",
          "Medical Schema",
          "Google Maps"
        ]
      },
      {
        "id": "seo-dining-bistro",
        "title": "Meridian Bistro 'Best Italian Dinner' Ranking",
        "caption": "Captured top spot on Google for high-intent culinary searches, generating 65+ weekly reservations directly from search results.",
        "category": "Hospitality SEO",
        "beforeLabel": "8 Weekly Google Phone Inquiries",
        "afterLabel": "74 Weekly Direct Search Bookings",
        "beforeMetric": "8 Calls/wk",
        "afterMetric": "74 Bookings/wk",
        "tags": [
          "Rich Snippets",
          "Restaurant Schema",
          "Cuisine Keywords"
        ]
      },
      {
        "id": "seo-luxury-homeware",
        "title": "Artisan Leather Boutique E-Commerce SEO",
        "caption": "Ranked bespoke leather accessories nationally for 38 transactional keywords with zero paid search expenditure.",
        "category": "E-Commerce SEO",
        "beforeLabel": "Unranked (Page 6+)",
        "afterLabel": "Page 1 Top 3 Across 38 Keywords",
        "beforeMetric": "Page 6+",
        "afterMetric": "Top 3 Spots",
        "tags": [
          "E-Commerce SEO",
          "Product Schema",
          "Category Architecture"
        ]
      }
    ],
    "testimonial": {
      "quote": "We spent $1,200 a month on Google Ads for mediocre leads. Mushaf rebuilt our schema and local citations; we now rank #1 on Google Maps in Meridian completely organically.",
      "author": "Tariq Mansoor",
      "role": "Managing Partner",
      "company": "Meridian Orthodontics & Dental"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "social-media-management",
    "name": "Social Media Management",
    "shortTitle": "Social Media",
    "icon": "Share2",
    "badge": "03 / Brand Audience",
    "headline": "Strategic content planning, viral reel concepts, and predictable follower growth.",
    "description": "Transform passive social accounts into high-engagement customer acquisition channels. Concrete posting schedules, custom-designed visual assets, and authentic brand storytelling.",
    "solutionSummary": "Social media shouldn't feel like guessing what to post at 6 PM. I establish a calculated content rhythm that builds genuine community authority and converts viewers into loyal customers.",
    "included": [
      "High-retention video Reels",
      "Daily grid content cadence",
      "Active audience engagement",
      "Active community engagement management & DM routing to customer support",
      "Influencer and local partnership outreach strategy",
      "Bi-weekly engagement reports tracking follower growth, profile visits, and link clicks"
    ],
    "tools": [
      "Meta Business Suite",
      "Buffer",
      "Figma",
      "CapCut Pro",
      "Notion",
      "Lightroom"
    ],
    "portfolioType": "social",
    "portfolio": [
      {
        "id": "social-artisan-bakery",
        "title": "Sourdough Bakery Growth Engine",
        "caption": "Scaled local bakery Instagram from 2,100 to 24,800 followers with process-focused morning bake reels.",
        "category": "Artisan Bakery",
        "thumbnail": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "growthStat": "+22,700 Followers (+340% Engagement)",
        "tags": [
          "Viral Reels",
          "Content Calendar",
          "Morning Drops"
        ]
      },
      {
        "id": "social-pilates-studio",
        "title": "Pilates & Movement Studio Audience Build",
        "caption": "Positioned studio as the premier posture and rehabilitation clinic in Dubai through educational biomechanics carousels.",
        "category": "Wellness & Fitness",
        "thumbnail": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
        "growthStat": "100% Class Waitlists via Bio Links",
        "tags": [
          "Educational Carousels",
          "Lead Generation",
          "Brand Voice"
        ]
      },
      {
        "id": "social-lifestyle-apparel",
        "title": "Minimalist Streetwear Brand Launch",
        "caption": "Generated 14,000 email waitlist signups ahead of drop through moodboard teasers and BTS fabric manufacturing reels.",
        "category": "Fashion & Retail",
        "thumbnail": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
        "growthStat": "Drop Sold Out in 42 Minutes",
        "tags": [
          "Drop Strategy",
          "Visual Storytelling",
          "Audience Nurturing"
        ]
      }
    ],
    "testimonial": {
      "quote": "Mushaf took over our Instagram content and posting schedule. Our reel views jumped past 150k each and we sold out our entire weekend batch in forty minutes.",
      "author": "Farah Qureshi",
      "role": "Head Baker & Founder",
      "company": "Crumb & Co. Artisan Bakes"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "ui-ux-graphic-design",
    "name": "UI/UX & Graphic Design",
    "shortTitle": "UI/UX & Design",
    "icon": "Layout",
    "badge": "04 / Visual Identity",
    "headline": "Distinctive brand identities, Figma design systems, and intuitive user experiences.",
    "description": "Every pixel is intentional. I design clean typographic systems, memorable brand identities, interactive app prototypes, and packaging collateral that exude quality.",
    "solutionSummary": "First impressions are decided in 50 milliseconds. I replace clunky, generic templates with high-end editorial layouts and unified design systems that command premium pricing.",
    "included": [
      "Interactive Figma design systems",
      "Print-ready menus & branding",
      "Custom typography & palette",
      "Component Design System: Reusable atomic tokens, button states, input variants, and icon sets",
      "Marketing Collateral: Physical packaging, business cards, menu boards, & digital advertising kits",
      "Cross-Platform UI Specifications ready for seamless developer handoff with zero guesswork"
    ],
    "tools": [
      "Figma",
      "Adobe Illustrator",
      "Adobe Photoshop",
      "FontBase",
      "Procreate",
      "InDesign"
    ],
    "portfolioType": "design",
    "portfolio": [
      {
        "id": "design-nordic-chair",
        "title": "Kollektiv Architectural Homeware UI System",
        "caption": "Full Figma design system featuring warm brutalist typography, fluid mobile layouts, and custom ceramic iconography.",
        "category": "Design System & UI",
        "thumbnail": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Figma Tokens",
          "Design System",
          "Editorial Layout"
        ]
      },
      {
        "id": "design-botanical-brand",
        "title": "Verdant Organics Packaging & Identity",
        "caption": "Luxury botanical brand identity with bespoke embossing dies, metallic foil packaging specs, and typographic hierarchy.",
        "category": "Branding & Packaging",
        "thumbnail": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Logo Design",
          "Packaging",
          "Brand Identity"
        ]
      },
      {
        "id": "design-fintech-app",
        "title": "Vaultpay Mobile Banking Wireframe & Prototype",
        "caption": "Minimalist zero-friction mobile transaction dashboard designed for rapid thumb comprehension on small viewports.",
        "category": "Mobile App UI/UX",
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Mobile UX",
          "User Flow",
          "Interactive Prototype"
        ]
      }
    ],
    "testimonial": {
      "quote": "Mushaf's Figma files are the cleanest I have ever seen. He delivered a brand system that elevated our product from a local boutique to an international luxury label.",
      "author": "Elena Rostova",
      "role": "Creative Director",
      "company": "Atelier V"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "video-editing",
    "name": "Video Editing",
    "shortTitle": "Video Editing",
    "icon": "Video",
    "badge": "05 / Post-Production",
    "headline": "Rhythm-driven, cinematic video editing that stops the scroll and holds attention.",
    "description": "High-retention video post-production for social media, YouTube, commercial brand campaigns, and event recaps. Clean sound design, color grading, and dynamic pacing.",
    "solutionSummary": "Viewers scroll past 95% of social videos within 1.5 seconds. I craft sharp visual rhythms, punchy hooks, and seamless soundscapes that keep audiences watching until the final call-to-action.",
    "included": [
      "Cinema-grade color grading",
      "Dynamic subtitle animation",
      "Punchy sound design & cuts",
      "Long-form documentary, podcast, & interview editing with multi-cam synchronization",
      "Professional sound design, ambient Foley layering, and balanced audio mastering",
      "Platform-specific exports optimized for zero compression artifacts"
    ],
    "tools": [
      "Premiere Pro",
      "DaVinci Resolve",
      "After Effects",
      "Topaz Video AI",
      "Audition"
    ],
    "portfolioType": "video",
    "portfolio": [
      {
        "id": "video-espresso-reel",
        "title": "Ceramicist Wheel Session Reel",
        "caption": "Sensory ASMR video edit celebrating the rhythm of clay turning with organic sound design and film grain emulation.",
        "category": "Short-Form Social",
        "videoDuration": "0:45",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-potter-shaping-a-clay-vase-41718-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Sound Design",
          "ASMR Foley",
          "Color Grade"
        ]
      },
      {
        "id": "video-culinary-commercial",
        "title": "Charcoal Grill Restaurant Commercial",
        "caption": "High-energy 30-second restaurant commercial with sizzling audio cuts, speed ramping, and dramatic fire transitions.",
        "category": "Brand Commercial",
        "videoDuration": "0:30",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-vegetables-in-a-pan-43480-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Speed Ramps",
          "Commercial Cut",
          "Audio Sync"
        ]
      },
      {
        "id": "video-fitness-promo",
        "title": "Forge Strength Club Brand Film",
        "caption": "Moody, black-and-white athletic promotional video highlighting raw barbell training and intense coaching focus.",
        "category": "Athletic Promo",
        "videoDuration": "1:00",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-weights-in-a-gym-43759-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Monochrome Grade",
          "Pacing",
          "Music Cut"
        ]
      }
    ],
    "testimonial": {
      "quote": "Our video engagement tripled on our very first reel edited by Mushaf. The sound design and cuts made our kitchen footage look like a Netflix documentary.",
      "author": "Chef Rayyan Shah",
      "role": "Executive Chef & Partner",
      "company": "Taqueria Norte"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "motion-graphics",
    "name": "Motion Graphics",
    "shortTitle": "Motion Graphics",
    "icon": "Film",
    "badge": "06 / Animation",
    "headline": "Kinetic typography, animated logo reveals, and UI micro-interactions.",
    "description": "Bringing static graphic design into kinetic life. Smooth 60fps vector animations, explainer sequences, product feature callouts, and Lottie assets for interactive web apps.",
    "solutionSummary": "Static images get overlooked; purposeful motion arrests the eye. I design kinetic visual systems that explain intricate product benefits in seconds while reinforcing brand prestige.",
    "included": [
      "Animated 60fps logo reveals",
      "Kinetic typography sequences",
      "Lightweight web Lottie assets",
      "Dynamic animated logo stings & brand intros for video campaigns and presentations",
      "Explainer video animations breaking down complex technical concepts",
      "Social motion stickers, looping GIF assets, and dynamic interface transitions"
    ],
    "tools": [
      "After Effects",
      "Cinema 4D",
      "LottieFiles",
      "Cavalry",
      "Illustrator",
      "Bodymovin"
    ],
    "portfolioType": "motion",
    "portfolio": [
      {
        "id": "motion-kinetic-type",
        "title": "Kinetic Manifesto: Speed Is Honest",
        "caption": "High-contrast typographic animation demonstrating editorial pacing, easing curves, and typographic weight shifts.",
        "category": "Kinetic Typography",
        "videoDuration": "0:20",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-abstract-animation-of-golden-rings-42999-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Kinetic Typography",
          "Easing Curves",
          "Title Intro"
        ]
      },
      {
        "id": "motion-logo-reveal",
        "title": "Osteria Fontana Geometric Logo Sting",
        "caption": "Minimalist line-draw vector animation that draws the restaurant's emblem with mechanical precision.",
        "category": "Logo Animation",
        "videoDuration": "0:08",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-lines-forming-a-circuit-board-43183-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Vector Draw",
          "Logo Reveal",
          "60 FPS"
        ]
      },
      {
        "id": "motion-ui-lottie",
        "title": "Fintech Cash Flow Interactive Lottie Set",
        "caption": "Set of 6 lightweight vector micro-animations embedded directly into a mobile web app interface at 8KB each.",
        "category": "Lottie Web Animation",
        "videoDuration": "0:12",
        "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-futuristic-digital-globe-42985-large.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Lottie JSON",
          "Sub-10KB",
          "UI Micro-interaction"
        ]
      }
    ],
    "testimonial": {
      "quote": "Mushaf converted our complex medical referral process into a 15-second animated explainer that reduced patient onboarding questions by half.",
      "author": "Dr. Leila Al-Mansoor",
      "role": "Clinical Director",
      "company": "Soma Movement Studio"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "3d-blender",
    "name": "3D & Blender",
    "shortTitle": "3D & Blender",
    "icon": "Box",
    "badge": "07 / Spatial Craft",
    "headline": "Photorealistic 3D modeling, interactive product turntables, and procedural visuals.",
    "description": "High-fidelity 3D modeling, lighting, photorealistic texturing, and turntable animations in Blender. Perfect for luxury e-commerce, architectural visualization, and interactive WebGL.",
    "solutionSummary": "Stop paying thousands of dollars for physical studio photoshoots every time packaging changes. I build photorealistic 3D assets you can re-light, rotate, and animate forever.",
    "included": [
      "Photorealistic product renders",
      "Interactive 360° turntables",
      "Fast Three.js web 3D models",
      "Photorealistic procedural PBR texturing (glass, brushed metal, leather, ceramics)",
      "Architectural space staging, daylight simulations, & interior visualizations",
      "Blender Python & geometry node automation for rapid asset variations"
    ],
    "tools": [
      "Blender",
      "Cycles / Eevee",
      "Substance 3D Painter",
      "Three.js",
      "Draco",
      "Quixel Megascans"
    ],
    "portfolioType": "3d",
    "portfolio": [
      {
        "id": "3d-ceramic-turntable",
        "title": "Kollektiv Ceramic Carafe Turntable",
        "caption": "Bespoke clay and matte glaze shader setup with 360° rotation loop and realistic light refraction.",
        "category": "Product Turntable",
        "thumbnail": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        "turntableGif": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Cycles Render",
          "360° Turntable",
          "PBR Ceramics"
        ]
      },
      {
        "id": "3d-perfume-bottle",
        "title": "Atelier V Parfum Flacon Visualization",
        "caption": "High-poly cosmetic flacon featuring amber liquid caustics, embossed gold cap, and tactile glass imperfections.",
        "category": "Luxury Packaging",
        "thumbnail": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
        "turntableGif": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Liquid Caustics",
          "Glass Shader",
          "Studio Lighting"
        ]
      },
      {
        "id": "3d-spatial-interior",
        "title": "Sloane Penthouse Architectural Staging",
        "caption": "Photorealistic daylight simulation of a high-ceiling residential interior with natural afternoon sun shadows.",
        "category": "Architectural 3D",
        "thumbnail": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "Daylight Simulation",
          "ArchViz",
          "Photorealism"
        ]
      }
    ],
    "testimonial": {
      "quote": "Mushaf produced 3D bottle renders that looked so real our distributor thought we had already manufactured the final glass batch. Incredible attention to detail.",
      "author": "Julian Croft",
      "role": "Founder",
      "company": "Kollektiv Goods"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  },
  {
    "slug": "ai-automation",
    "name": "AI Automation",
    "shortTitle": "AI Automation",
    "icon": "Bot",
    "badge": "08 / Intelligence",
    "headline": "Intelligent workflows, AI customer agents, and automated data pipelines.",
    "description": "Eliminate repetitive manual tasks, auto-qualify customer inquiries, and build smart operational pipelines with custom LLM integrations, webhooks, and zero-code workflow engines.",
    "solutionSummary": "Running a business shouldn't mean copying data between spreadsheets all day. I connect your customer touchpoints to autonomous AI workflows that run 24/7 without taking a day off.",
    "included": [
      "Instant WhatsApp lead alerts",
      "Automated invoice workflows",
      "Zero manual data entry",
      "Automated lead qualification & routing from web forms to WhatsApp / CRM",
      "API integrations linking Make.com, n8n, OpenAI, and internal databases",
      "Full error-monitoring, retry policies, & human-in-the-loop escalation rules"
    ],
    "tools": [
      "Make.com",
      "n8n",
      "OpenAI / Gemini API",
      "Python",
      "Supabase",
      "Webhooks"
    ],
    "portfolioType": "ai",
    "portfolio": [
      {
        "id": "ai-intake-automation",
        "title": "Clinic Patient Intake to WhatsApp Automation",
        "caption": "Automated booking intake parsing patient symptoms, checking doctor availability, and sending personalized calendar invites.",
        "category": "Operational Automation",
        "timeSaved": "Reduced intake from 2 hours to 5 minutes daily",
        "beforeMetric": "120 min daily manual phone tag",
        "afterMetric": "5 min daily auto-verified appointments",
        "tags": [
          "Make.com",
          "WhatsApp Webhook",
          "Calendar Sync"
        ]
      },
      {
        "id": "ai-support-bot",
        "title": "Restaurant Concierge FAQ Agent",
        "caption": "Fine-tuned AI agent trained on dietary menus and reservation policies, handling 700+ guest queries per week with 99.2% accuracy.",
        "category": "Customer AI Agent",
        "timeSaved": "Automates 88% of common phone queries",
        "beforeMetric": "35 repetitive calls per shift",
        "afterMetric": "4 escalated complex queries only",
        "tags": [
          "Gemini API",
          "Knowledge Base",
          "Instant Res"
        ]
      },
      {
        "id": "ai-content-pipeline",
        "title": "Automated Real Estate Listing Pipeline",
        "caption": "Translates architectural spec sheets into multi-platform marketing copy, social posts, and email newsletters automatically upon upload.",
        "category": "Content Pipeline",
        "timeSaved": "Listing launch time cut from 3 days to 15 minutes",
        "beforeMetric": "3 days copywriting turnaround",
        "afterMetric": "15 minutes end-to-end launch",
        "tags": [
          "LLM Pipeline",
          "Multichannel Output",
          "Zero Manual Copy"
        ]
      }
    ],
    "testimonial": {
      "quote": "Mushaf built an automated intake workflow that freed our front desk from two hours of voicemail hell every morning. It paid for itself in the first two weeks.",
      "author": "Dr. Leila Al-Mansoor",
      "role": "Clinical Director",
      "company": "Soma Movement Studio"
    },
    "fiverrGigUrl": "https://www.fiverr.com/mushafkhan"
  }
];

export const PROJECTS: StudioProject[] = [
  {
    "id": "osteria-fontana",
    "name": "Osteria Fontana",
    "clientType": "Fine-casual Italian",
    "serviceType": "Web Development",
    "industryCategory": "Restaurants & Cafes",
    "year": "2024",
    "role": "Full Design & Frontend Engineering",
    "stack": [
      "React 19",
      "Tailwind CSS",
      "Resy API",
      "Vite"
    ],
    "toolsUsed": [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Figma",
      "Resy API"
    ],
    "outcome": "+44% direct table reservations in 6 weeks, eliminating third-party platform commissions.",
    "deliveryDays": 14,
    "resultSignal": "+44% direct reservations in 6 weeks",
    "liveUrl": "https://osteriafontana.example.com",
    "clientInstagram": "https://instagram.com/osteriafontana",
    "googleMapsUrl": "https://maps.google.com/?q=Osteria+Fontana",
    "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-vegetables-in-a-pan-43480-large.mp4",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Their previous agency site took 8.4 seconds to load over 4G, losing weekend table bookings to nearby bistros on OpenTable.",
      "solution": "Built a stripped-back editorial menu with instant dietary filtering, 680ms time-to-interactive, and a direct Resy booking widget anchored to mobile thumbs.",
      "metric": "+44% direct reservations in 6 weeks",
      "fullTestimonial": {
        "quote": "Our weekend reservation problem was fixed in week one. Our previous agency site took eight seconds to load the cellar list. Mushaf's rebuild opens in the blink of an eye, and our direct bookings jumped 44%.",
        "author": "Marco Valenti",
        "role": "Restaurateur & Founder",
        "company": "Osteria Fontana"
      }
    }
  },
  {
    "id": "bar-kanso",
    "name": "Bar Kanso",
    "clientType": "Natural wine bar & izakaya",
    "serviceType": "Web Development",
    "industryCategory": "Restaurants & Cafes",
    "year": "2024",
    "role": "Design & Custom CMS Build",
    "stack": [
      "TypeScript",
      "Tailwind CSS",
      "Live Cellar CMS"
    ],
    "toolsUsed": [
      "TypeScript",
      "Tailwind CSS",
      "Google Sheets API",
      "Vite"
    ],
    "outcome": "Daily cellar updates managed from phone in 45 seconds.",
    "deliveryDays": 10,
    "resultSignal": "Daily cellar updates in 45s from phone",
    "liveUrl": "https://barkanso.example.com",
    "clientInstagram": "https://instagram.com/barkanso",
    "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-abstract-animation-of-golden-rings-42999-large.mp4",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Natural wine allocations change every 48 hours; their sommelier had no easy way to keep the digital cellar list accurate.",
      "solution": "Created a minimalist mobile-first wine directory hooked up to a private Google Sheets backend that updates the live site in real time.",
      "metric": "Zero out-of-stock orders reported",
      "fullTestimonial": {
        "quote": "Our sommelier can add rare allocations directly from his phone while tasting with importers. Our guests love the instant search.",
        "author": "Kenji Sato",
        "role": "Head Sommelier",
        "company": "Bar Kanso"
      }
    }
  },
  {
    "id": "manoir-patisserie",
    "name": "Manoir Patisserie",
    "clientType": "Artisan bakery & viennoiserie",
    "serviceType": "Web Development",
    "industryCategory": "Restaurants & Cafes",
    "year": "2023",
    "role": "Web Design & Speed Tuning",
    "stack": [
      "Static HTML/JS",
      "Tailwind",
      "Direct Menu Ordering"
    ],
    "toolsUsed": [
      "React",
      "Tailwind CSS",
      "WhatsApp API"
    ],
    "outcome": "Sold out weekly morning catering drops in 18 minutes on average.",
    "deliveryDays": 11,
    "resultSignal": "Catering drops sold out in 18 minutes",
    "liveUrl": "https://manoirpatisserie.example.com",
    "clientInstagram": "https://instagram.com/manoirpatisserie",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Morning pastries have a strict 2-hour delivery window. Phone lines were jammed with orders that could have been handled digitally.",
      "solution": "Deployed a high-speed drop calendar with live inventory counters and single-tap WhatsApp receipt generation.",
      "metric": "Sold out drops in 18 minutes",
      "fullTestimonial": {
        "quote": "No complex shopping carts. Customers select croissants, hit send, and our kitchen printer prints their delivery ticket immediately.",
        "author": "Camille Laurent",
        "role": "Head Baker",
        "company": "Manoir Patisserie"
      }
    }
  },
  {
    "id": "taqueria-norte",
    "name": "Taqueria Norte",
    "clientType": "Baja street food & catering",
    "serviceType": "Web Development",
    "industryCategory": "Restaurants & Cafes",
    "year": "2023",
    "role": "Design & Development",
    "stack": [
      "React",
      "Tailwind CSS",
      "Square POS"
    ],
    "toolsUsed": [
      "React",
      "TypeScript",
      "Square API",
      "Tailwind CSS"
    ],
    "outcome": "Direct event catering inquiries up 3.2x without paid ads.",
    "deliveryDays": 12,
    "resultSignal": "Event catering inquiries up 3.2x",
    "liveUrl": "https://taquerianorte.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Third-party food delivery aggregators were taking 32% of all ticket sales, destroying catering profit margins.",
      "solution": "Created an organic, vibrant direct-order menu and event package calculator with zero middleman commissions.",
      "metric": "Catering inquiries up 3.2x",
      "fullTestimonial": {
        "quote": "We saved thousands in delivery app commissions in our first summer. Working directly with Mushaf was night and day compared to our old agency.",
        "author": "Rayyan Shah",
        "role": "Partner",
        "company": "Taqueria Norte"
      }
    }
  },
  {
    "id": "soma-movement",
    "name": "Soma Movement Studio",
    "clientType": "Physiotherapy & Pilates",
    "serviceType": "Web Development",
    "industryCategory": "Clinics & Wellness",
    "year": "2024",
    "role": "Brand Strategy, UI & Build",
    "stack": [
      "React",
      "TypeScript",
      "Mindbody API"
    ],
    "toolsUsed": [
      "React",
      "Mindbody API",
      "Tailwind CSS",
      "Figma"
    ],
    "outcome": "Eliminated 2 hours of daily reception intake phone calls.",
    "deliveryDays": 9,
    "resultSignal": "72% self-service appointments booked",
    "liveUrl": "https://somamovement.example.com",
    "clientInstagram": "https://instagram.com/somamovement",
    "googleMapsUrl": "https://maps.google.com/?q=Soma+Movement+Studio",
    "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-weights-in-a-gym-43759-large.mp4",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Anxious patients had to play phone tag for appointments, tying up receptionists during morning peak hours.",
      "solution": "Designed a 4-step triage intake form detailing symptoms, preferred physiotherapist, and instant calendar booking.",
      "metric": "72% self-service bookings",
      "fullTestimonial": {
        "quote": "Mushaf asked three practical questions about our consultation intake, then delivered a flawless booking site in nine days. It saves our desk two hours every single morning.",
        "author": "Dr. Leila Al-Mansoor",
        "role": "Clinical Director",
        "company": "Soma Movement Studio"
      }
    }
  },
  {
    "id": "harbor-dental",
    "name": "Harbor Dental Studio",
    "clientType": "Cosmetic dentistry & implants",
    "serviceType": "Web Development",
    "industryCategory": "Clinics & Wellness",
    "year": "2023",
    "role": "UI/UX & Frontend Development",
    "stack": [
      "React",
      "Tailwind CSS",
      "HIPAA Form Sync"
    ],
    "toolsUsed": [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vite"
    ],
    "outcome": "New patient consultation bookings grew by 85% in 3 months.",
    "deliveryDays": 14,
    "resultSignal": "+85% new patient consultations",
    "liveUrl": "https://harbordental.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Patients looking for cosmetic veneer work were discouraged by sterile, scary medical stock photography.",
      "solution": "Redesigned the clinic website with warm natural lighting, before-and-after smile case studies, and transparent payment plans.",
      "metric": "Consultation inquiries grew 85%",
      "fullTestimonial": {
        "quote": "Our patients frequently mention how easy and reassuring our website was before they even stepped into the clinic.",
        "author": "Dr. Harris Vance",
        "role": "Lead Cosmetic Surgeon",
        "company": "Harbor Dental Studio"
      }
    }
  },
  {
    "id": "kollektiv-goods",
    "name": "Kollektiv Goods",
    "clientType": "Ceramics & architectural homeware",
    "serviceType": "Web Development",
    "industryCategory": "Retail & Fashion",
    "year": "2024",
    "role": "Art Direction & Frontend",
    "stack": [
      "React",
      "Shopify Storefront API",
      "Tailwind CSS"
    ],
    "toolsUsed": [
      "React",
      "Shopify Storefront API",
      "Tailwind CSS",
      "Three.js"
    ],
    "outcome": "Sub-900ms page transitions with editorial catalog flow.",
    "deliveryDays": 14,
    "resultSignal": "Sub-900ms mobile transitions",
    "liveUrl": "https://kollektivgoods.example.com",
    "clientInstagram": "https://instagram.com/kollektivgoods",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Heavy Shopify theme took 5.2 seconds to load product catalogs, causing high bounce rates from Instagram ads.",
      "solution": "Rebuilt the frontend as a headless React app connected to Shopify Storefront API with instant client-side transitions.",
      "metric": "Sub-900ms load time",
      "fullTestimonial": {
        "quote": "No fluff, no excuses. He understood our minimalist ceramic line immediately and built an editorial storefront that loads faster than any Shopify template we tested.",
        "author": "Julian Croft",
        "role": "Founder",
        "company": "Kollektiv Goods"
      }
    }
  },
  {
    "id": "atelier-v",
    "name": "Atelier V",
    "clientType": "Bespoke leather accessories",
    "serviceType": "Web Development",
    "industryCategory": "Retail & Fashion",
    "year": "2023",
    "role": "Design & Custom Build",
    "stack": [
      "Vite",
      "TypeScript",
      "Stripe Checkout"
    ],
    "toolsUsed": [
      "Vite",
      "TypeScript",
      "Stripe",
      "Tailwind CSS"
    ],
    "outcome": "Average order value increased from $180 to $295 with custom monogram preview.",
    "deliveryDays": 12,
    "resultSignal": "AOV increased from $180 to $295",
    "liveUrl": "https://atelierv.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Customers couldn't visualize bespoke embossed monograms before purchasing, leading to high cart abandonment.",
      "solution": "Engineered an interactive real-time monogram preview directly on the leather product page with instant checkout.",
      "metric": "AOV increased to $295",
      "fullTestimonial": {
        "quote": "The interactive monogram tool doubled our conversion on personalized leather gifts during the holiday season.",
        "author": "Elena Rostova",
        "role": "Creative Director",
        "company": "Atelier V"
      }
    }
  },
  {
    "id": "sloane-properties",
    "name": "Sloane & Co. Residences",
    "clientType": "Boutique residential developments",
    "serviceType": "Web Development",
    "industryCategory": "Real Estate",
    "year": "2024",
    "role": "Design & Frontend Development",
    "stack": [
      "React",
      "Tailwind CSS",
      "Mapbox Vector"
    ],
    "toolsUsed": [
      "React",
      "TypeScript",
      "Mapbox",
      "Tailwind CSS"
    ],
    "outcome": "100% off-plan penthouse expressions of interest filled in 3 weeks.",
    "deliveryDays": 14,
    "resultSignal": "100% penthouse inquiries filled in 3 weeks",
    "liveUrl": "https://sloaneresidences.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "High-net-worth investors were frustrated by clunky PDF brochures and wanted instant floor plans and neighborhood context.",
      "solution": "Crafted an architectural showcase with interactive vector floor plans, daylight exposure toggles, and private broker booking.",
      "metric": "100% off-plan units claimed in 3 weeks",
      "fullTestimonial": {
        "quote": "Mushaf built a digital presentation that matched the prestige of our $4M penthouses. Every single unit was spoken for in three weeks.",
        "author": "Alistair Sloane",
        "role": "Principal Developer",
        "company": "Sloane & Co."
      }
    }
  },
  {
    "id": "forge-strength",
    "name": "Forge Strength Club",
    "clientType": "Independent barbell gym",
    "serviceType": "Web Development",
    "industryCategory": "Fitness",
    "year": "2023",
    "role": "Design & Build",
    "stack": [
      "React",
      "Tailwind CSS",
      "Stripe Billing"
    ],
    "toolsUsed": [
      "React",
      "Stripe Billing",
      "Tailwind CSS"
    ],
    "outcome": "Waitlist grew from 14 to 120 members before door opening.",
    "deliveryDays": 8,
    "resultSignal": "Waitlist grew from 14 to 120 members",
    "liveUrl": "https://forgestrength.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "New strength club opening had zero brand awareness in a crowded fitness district dominated by corporate commercial gyms.",
      "solution": "Created an uncompromising, high-contrast landing page highlighting head coach credentials, barbell specs, and an early-bird membership cap.",
      "metric": "Waitlist capped at 120 members",
      "fullTestimonial": {
        "quote": "We opened our doors on day one at full capacity with zero empty lockers. The website told our story with absolute authenticity.",
        "author": "Marcus Brody",
        "role": "Founder & Head Coach",
        "company": "Forge Strength Club"
      }
    }
  },
  {
    "id": "pechs-dental-seo",
    "name": "PECHS Dental Clinic Search Takeover",
    "clientType": "Cosmetic & pediatric dentistry",
    "serviceType": "SEO",
    "industryCategory": "Clinics & Wellness",
    "year": "2024",
    "role": "Technical SEO & Schema Architecture",
    "stack": [
      "Schema.org JSON-LD",
      "Google Search Console",
      "Screaming Frog"
    ],
    "toolsUsed": [
      "Google Search Console",
      "Ahrefs",
      "Screaming Frog",
      "Schema.org"
    ],
    "outcome": "+2,800% organic Google Maps impressions, capturing #1 local 3-pack.",
    "deliveryDays": 14,
    "resultSignal": "+2,800% organic impressions in 90 days",
    "liveUrl": "https://pechsdental.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Clinic was buried on Page 3 for local search terms like 'emergency dentist near me' and 'teeth whitening'.",
      "solution": "Audited Core Web Vitals, injected rich MedicalBusiness Schema.org JSON-LD, and mapped 42 localized service pages with verified NAP citations.",
      "metric": "#1 rank across 18 localized dental queries",
      "fullTestimonial": {
        "quote": "We slashed our paid Google Ads budget to zero and our phone still rings non-stop from Google Maps searchers.",
        "author": "Dr. Tariq Mansoor",
        "role": "Medical Director",
        "company": "PECHS Dental Care"
      }
    }
  },
  {
    "id": "clifton-bistro-seo",
    "name": "Meridian Bistro Culinary Search Dominance",
    "clientType": "Mediterranean bistro & cellar",
    "serviceType": "SEO",
    "industryCategory": "Restaurants & Cafes",
    "year": "2024",
    "role": "Local SEO & Rich Snippets",
    "stack": [
      "Restaurant Schema",
      "Google Maps Sync",
      "Ahrefs"
    ],
    "toolsUsed": [
      "Ahrefs",
      "Google Business Profile",
      "Schema Validator"
    ],
    "outcome": "65+ direct weekly table reservations generated directly through search results.",
    "deliveryDays": 10,
    "resultSignal": "65+ weekly bookings from Google search",
    "liveUrl": "https://meridianbistro.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Diners searching for weekend dinner recommendations were getting redirected to third-party discount booking apps.",
      "solution": "Implemented structured Restaurant Menu schema and verified Google Business Profile links directly to their zero-commission table widget.",
      "metric": "65+ direct search bookings weekly",
      "fullTestimonial": {
        "quote": "We now appear with rich menu prices and a 'Reserve a Table' button directly in Google search results.",
        "author": "Zainab Merchant",
        "role": "General Manager",
        "company": "Meridian Bistro"
      }
    }
  },
  {
    "id": "crumb-co-social",
    "name": "Crumb & Co. Sourdough Content Engine",
    "clientType": "Artisan sourdough bakery",
    "serviceType": "Social Media",
    "industryCategory": "Restaurants & Cafes",
    "year": "2024",
    "role": "Content Strategy & Visual Production",
    "stack": [
      "Reels Strategy",
      "Figma",
      "CapCut Pro",
      "Meta Business"
    ],
    "toolsUsed": [
      "Figma",
      "CapCut Pro",
      "Meta Business Suite",
      "Notion"
    ],
    "outcome": "+22,700 followers in 90 days with morning drop sellouts.",
    "deliveryDays": 30,
    "resultSignal": "+22.7k followers & 340% engagement",
    "liveUrl": "https://instagram.com/crumbandco",
    "clientInstagram": "https://instagram.com/crumbandco",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "A traditional bakery with phenomenal bread but zero consistent social voice and sluggish weekday morning footfall.",
      "solution": "Engineered a repeatable 6 AM baking reel series showcasing ear blisters, crust crackle ASMR, and daily sourdough flavors.",
      "metric": "+22,700 real local followers",
      "fullTestimonial": {
        "quote": "People now queue outside at 7:30 AM before we even unlock the doors because they saw our morning proofing reel.",
        "author": "Farah Qureshi",
        "role": "Head Baker & Founder",
        "company": "Crumb & Co."
      }
    }
  },
  {
    "id": "kollektiv-design-system",
    "name": "Kollektiv Architectural Design System",
    "clientType": "Ceramic studio & homeware brand",
    "serviceType": "UI/UX & Design",
    "industryCategory": "Retail & Fashion",
    "year": "2024",
    "role": "Brand Identity, Typography & UI System",
    "stack": [
      "Figma",
      "Design Tokens",
      "Typography Hierarchy"
    ],
    "toolsUsed": [
      "Figma",
      "Adobe Illustrator",
      "FontBase"
    ],
    "outcome": "Unified brand system across packaging, web, and physical print collateral.",
    "deliveryDays": 14,
    "resultSignal": "40+ reusable design tokens & components",
    "liveUrl": "https://kollektivgoods.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Fragmented branding across social media, physical product boxes, and digital storefront made the brand look amateur.",
      "solution": "Developed an uncompromising architectural design system in Figma with warm paper textures, custom typography scale, and packaging die-lines.",
      "metric": "40+ production components",
      "fullTestimonial": {
        "quote": "Our retail stockists in Tokyo and Berlin immediately praised how cohesive and luxury our wholesale catalogs look now.",
        "author": "Julian Croft",
        "role": "Founder",
        "company": "Kollektiv Goods"
      }
    }
  },
  {
    "id": "ceramicist-studio-video",
    "name": "Ceramicist Wheel Session ASMR Reels",
    "clientType": "Independent pottery studio",
    "serviceType": "Video Editing",
    "industryCategory": "Retail & Fashion",
    "year": "2024",
    "role": "Editing, Sound Design & Color Grade",
    "stack": [
      "Premiere Pro",
      "DaVinci Resolve",
      "Audition"
    ],
    "toolsUsed": [
      "Premiere Pro",
      "DaVinci Resolve",
      "Audition",
      "Topaz Video AI"
    ],
    "outcome": "3.4M cumulative views across short-form platforms with 82% average watch time.",
    "deliveryDays": 5,
    "resultSignal": "3.4M short-form views & 82% retention",
    "liveUrl": "https://instagram.com/kollektivgoods",
    "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-potter-shaping-a-clay-vase-41718-large.mp4",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Studio had raw unedited iPhone clips that looked messy, shaky, and had distracting background studio traffic noise.",
      "solution": "Edited rhythmic 45-second Reels with ambient Foley sound design, custom film emulation grade, and dynamic visual hooks.",
      "metric": "3.4M organic views",
      "fullTestimonial": {
        "quote": "The sound editing and color grading made our humble ceramic workshop look like an artisanal documentary.",
        "author": "Ayla Vance",
        "role": "Master Potter",
        "company": "Studio Clay"
      }
    }
  },
  {
    "id": "osteria-kinetic-reveal",
    "name": "Osteria Fontana Kinetic Identity Sting",
    "clientType": "Hospitality & dining group",
    "serviceType": "Motion Graphics",
    "industryCategory": "Restaurants & Cafes",
    "year": "2024",
    "role": "Kinetic Typography & Vector Animation",
    "stack": [
      "After Effects",
      "Cinema 4D",
      "LottieFiles"
    ],
    "toolsUsed": [
      "After Effects",
      "Illustrator",
      "LottieFiles"
    ],
    "outcome": "60fps vector logo reveal running as an 8KB Lottie asset on live digital menus.",
    "deliveryDays": 6,
    "resultSignal": "8KB vector animation running at 60fps",
    "liveUrl": "https://osteriafontana.example.com",
    "videoUrl": "https://assets.mixkit.co/videos/preview/mixkit-lines-forming-a-circuit-board-43183-large.mp4",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Restaurant needed an elegant opening animation for their digital menu tablets that wouldn't slow down the browser.",
      "solution": "Engineered a featherlight 8KB Lottie vector animation that draws the Italian crest with geometric precision at 60fps.",
      "metric": "Sub-10KB payload with zero lag",
      "fullTestimonial": {
        "quote": "Guests consistently compliment the smooth subtle animation when they open our wine tablets at the table.",
        "author": "Marco Valenti",
        "role": "Owner",
        "company": "Osteria Fontana"
      }
    }
  },
  {
    "id": "kollektiv-carafe-3d",
    "name": "Kollektiv 3D Ceramic Carafe Turntable",
    "clientType": "Architectural homeware label",
    "serviceType": "3D & Blender",
    "industryCategory": "Retail & Fashion",
    "year": "2024",
    "role": "3D Modeling, PBR Texturing & Turntable Animation",
    "stack": [
      "Blender Cycles",
      "Substance 3D",
      "Three.js"
    ],
    "toolsUsed": [
      "Blender",
      "Cycles",
      "Substance 3D Painter",
      "Three.js"
    ],
    "outcome": "Photorealistic 360° product turntable eliminating physical photoshoot costs.",
    "deliveryDays": 7,
    "resultSignal": "360° turntable with zero physical studio fees",
    "liveUrl": "https://kollektivgoods.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Manufacturing prototypes in 4 glazes would have cost $3,800 in studio photographer rentals and shipping fees.",
      "solution": "Modeled precision 3D CAD meshes in Blender with procedural glaze shaders and created 360° turntables for pre-orders.",
      "metric": "$3,800 saved in photography costs",
      "fullTestimonial": {
        "quote": "Our retail buyers placed advance wholesale orders based purely on Mushaf's 3D renders before a single kiln was fired.",
        "author": "Julian Croft",
        "role": "Founder",
        "company": "Kollektiv Goods"
      }
    }
  },
  {
    "id": "clinic-intake-automation",
    "name": "Soma Movement Automated Intake & WhatsApp",
    "clientType": "Physiotherapy & rehabilitation clinic",
    "serviceType": "AI Automation",
    "industryCategory": "Clinics & Wellness",
    "year": "2024",
    "role": "Autonomous Intake Pipeline & Webhooks",
    "stack": [
      "Make.com",
      "Gemini API",
      "WhatsApp Business API",
      "Google Calendar"
    ],
    "toolsUsed": [
      "Make.com",
      "Gemini API",
      "WhatsApp API",
      "Google Cloud"
    ],
    "outcome": "Reduced morning receptionist triage from 2 hours to 5 minutes daily.",
    "deliveryDays": 6,
    "resultSignal": "2 hours daily reception desk time saved",
    "liveUrl": "https://somamovement.example.com",
    "desktopShot": "",
    "mobileShot": "",
    "heroImage": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80",
    "caseStudy": {
      "challenge": "Front desk spent 90 minutes each morning calling back patients, verifying symptoms, and re-entering data into spreadsheets.",
      "solution": "Connected the online intake form to a smart AI agent that validates symptom severity, checks practitioner availability, and auto-dispatches WhatsApp calendar links.",
      "metric": "Intake time cut from 120min to 5min",
      "fullTestimonial": {
        "quote": "Our reception desk is calm, organized, and focused on in-person patients. The AI workflow paid for itself within two weeks.",
        "author": "Dr. Leila Al-Mansoor",
        "role": "Clinical Director",
        "company": "Soma Movement Studio"
      }
    }
  }
];

export const SITE_META = {
  "siteUrl": "https://mushafkhan.com",
  "siteName": "Mushaf Khan | Digital Studio",
  "defaultTitle": "Mushaf Khan | Digital Studio, Web Apps, 3D & Store",
  "defaultDescription": "Mushaf Khan Digital Studio: custom React web apps, UI/UX design, video editing, motion graphics, 3D visuals, SEO, AI automation, and studio editions store.",
  "ogImage": "/og-image.png",
  "locale": "en_US",
  "city": "Remote",
  "country": "Worldwide",
  "countryCode": "PK",
  "author": "Mushaf Khan",
  "jobTitle": "Independent Web Developer & Creative Partner",
  "telephone": "",
  "telephoneFormatted": "",
  "googleSearchConsoleToken": "GSC_VERIFICATION_TOKEN_REPLACE_ME",
  "gaId": "",
  "bookingUrl": "",
  "startingPrices": {
    "web-development": "From $1,500",
    "seo": "From $800",
    "social-media-management": "From $700/mo",
    "ui-ux-graphic-design": "From $1,000",
    "video-editing": "From $500",
    "motion-graphics": "From $650",
    "3d-blender": "From $1,200",
    "ai-automation": "From $1,400"
  } as Record<string, string>
};

export const STUDIO_INFO = {
  "name": "MUSHAF",
  "tagline": "Multi-disciplinary creative & engineer across web development, SEO, social media, design, video editing, motion graphics, 3D, and AI automation.",
  "headlineLead": "I build digital engines that get",
  "headlineItalic": "results",
  "headlineTrail": "for ambitious brands.",
  "subline": "One person for your whole digital presence — code, search ranking, social content, video, and 3D visuals. Less back-and-forth, consistent branding, on-time delivery.",
  "city": "Remote",
  "country": "Worldwide",
  "email": "mushafkhan295@gmail.com",
  "instagramUsername": "mushafkhan._.82",
  "facebookPage": "mushaf.studio",
  "whatsapp": "",
  "whatsappFormatted": "",
  "replyTimeNotice": "I usually reply within 24 hours",
  "instagram": "https://instagram.com/mushafkhan._.82",
  "linkedin": "https://linkedin.com/in/mushaf",
  "github": "https://github.com/mushaf",
  "fiverr": "https://www.fiverr.com/mushafkhan",
  "fiverrUsername": "mushafkhan",
  "bioTitle": "One person at the intersection of code, design, marketing and AI.",
  "bioParagraphs": [
    "Most businesses hire five separate people or an expensive agency just to launch their brand: a web developer who doesn't understand SEO, a designer who doesn't write code, a video editor working from disconnected assets, and a social media manager guessing what to post.",
    "I work differently. By operating across the entire creative and technical pipeline — websites, search engine rankings, brand identity, motion graphics, 3D product visuals, and automated AI workflows — I ensure your digital presence is cohesive, lightning-fast, and built to drive actual revenue.",
    "There are no account managers, no junior handoffs, and no endless Zoom consensus decks. When we work together, you get clear communication, guaranteed on-time delivery, and senior craft across every touchpoint."
  ],
  "availability": "Taking 2 projects, November",
  "yearsExperience": 6,
  "sitesShipped": 27
};

export const METRICS = {
  "projectsDelivered": 27,
  "industriesServed": 5,
  "avgDeliveryDays": 12,
  "repeatOrReferralRate": 82
};

export const PROCESS_STEPS = [
  {
    "step": "01",
    "days": "Day 1–2",
    "title": "Our first call",
    "description": "A 30-minute call to understand your business goals. We discuss what your customers need and agree on the plan.",
    "deliverable": "Clear project plan & checklist"
  },
  {
    "step": "02",
    "days": "Day 3–6",
    "title": "Interactive prototype",
    "description": "You test a live preview on your phone. You can tap buttons and review real text before final development.",
    "deliverable": "Live clickable preview on your phone"
  },
  {
    "step": "03",
    "days": "Day 7–11",
    "title": "Handcrafted build",
    "description": "I write clean code for lightning-fast speed. Your site is tested and optimized for all screen sizes.",
    "deliverable": "Finished website ready for review"
  },
  {
    "step": "04",
    "days": "Day 12–14",
    "title": "Launch & handoff",
    "description": "We get your website live on Google. I send a quick 5-minute video showing your team how to update prices.",
    "deliverable": "Live website + 5-minute video tutorial"
  }
];

export const TESTIMONIALS = [
  {
    "id": "osteria-fontana",
    "quote": "Our weekend reservation problem was fixed in week one. Our previous site took eight seconds to load. Mushaf's rebuild opens in the blink of an eye, and our direct bookings jumped 44%.",
    "author": "Marco Valenti",
    "role": "Owner & Chef Patron",
    "company": "Osteria Fontana",
    "location": "London, UK",
    "projectSlug": "osteria-fontana"
  },
  {
    "id": "soma-movement",
    "quote": "Most designers speak in tech jargon. Mushaf asked three practical questions about our clinic, then delivered a flawless booking site in nine days. It saves our desk two hours every morning.",
    "author": "Dr. Leila Al-Mansoor",
    "role": "Clinical Director",
    "company": "Soma Movement Studio",
    "location": "Dubai, UAE",
    "projectSlug": "soma-movement"
  },
  {
    "id": "kollektiv-goods",
    "quote": "No fluff, no excuses. He understood our ceramic line immediately and built an online shop that loads faster than any template we tested.",
    "author": "Julian Croft",
    "role": "Founder",
    "company": "Kollektiv Goods",
    "location": "Berlin, DE",
    "projectSlug": "kollektiv-goods"
  }
];

export const FAQ_ITEMS = [
  {
    "question": "How fast can you build and launch my website?",
    "answer": "Your website goes live in 12 to 14 working days. You work directly with me, so updates happen quickly without waiting on middlemen."
  },
  {
    "question": "How much will it cost?",
    "answer": "Most projects cost between $2,500 and $7,500 (or the PKR equivalent). We agree on a fixed price upfront with zero hidden charges."
  },
  {
    "question": "Can my staff update menu prices and daily specials easily?",
    "answer": "Yes. You or your staff can change food prices and opening hours from your phone in under a minute."
  },
  {
    "question": "Why should I work with you instead of a big agency?",
    "answer": "Agencies charge high fees for managers and office rent. With me, you get direct personal communication and fast loading speed."
  }
];

export const INDUSTRY_CATEGORIES = [
  {
    "slug": "restaurants-cafes",
    "title": "Restaurants & Cafes",
    "countBadge": "4 Projects",
    "insight": "Diners decide where to eat in twenty seconds on a moving train; your menu and table reservations must open before their train enters the tunnel.",
    "intro": "From Meridian and DHA to Gulshan, diners search for menus on spotty mobile data. I engineer restaurant websites that open wine and food lists in under 800 milliseconds, allowing guests to view prices and book tables directly without paying third-party delivery commissions.",
    "projects": [
      {
        "id": "osteria-fontana",
        "name": "Osteria Fontana",
        "clientType": "Fine-casual Italian",
        "year": "2024",
        "role": "Design & Development",
        "stack": [
          "React",
          "Tailwind CSS",
          "Resy API",
          "Vite"
        ],
        "outcome": "+44% direct table reservations, zero third-party platform commissions.",
        "deliveryDays": 14,
        "resultSignal": "+44% direct reservations in 6 weeks",
        "liveUrl": "https://osteriafontana.example.com",
        "clientInstagram": "https://instagram.com/osteriafontana",
        "googleMapsUrl": "https://maps.google.com/?q=Osteria+Fontana",
        "desktopShot": "",
        "mobileShot": "",
        "caseStudy": {
          "challenge": "Their previous agency site took 8.4 seconds to load over 4G, losing weekend table bookings to nearby bistros on OpenTable.",
          "solution": "Built a stripped-back editorial menu with instant dietary filtering, 680ms time-to-interactive, and a direct Resy booking widget anchored to mobile thumbs.",
          "metric": "+44% direct reservations in 6 weeks"
        }
      },
      {
        "id": "bar-kanso",
        "name": "Bar Kanso",
        "clientType": "Natural wine bar & izakaya",
        "year": "2024",
        "role": "Design & Development",
        "stack": [
          "TypeScript",
          "Tailwind CSS",
          "Live Cellar CMS"
        ],
        "outcome": "Daily cellar updates managed from phone in 45 seconds.",
        "deliveryDays": 10,
        "resultSignal": "Daily cellar updates in 45s from phone",
        "liveUrl": "https://barkanso.example.com",
        "clientInstagram": "https://instagram.com/barkanso",
        "desktopShot": "",
        "mobileShot": "",
        "caseStudy": {
          "challenge": "Natural wine allocations change every 48 hours; their sommelier had no easy way to keep the digital cellar list accurate.",
          "solution": "Created a minimalist mobile-first wine directory hooked up to a private Google Sheets backend that updates the live site in real time.",
          "metric": "Zero out-of-stock orders reported"
        }
      },
      {
        "id": "manoir-patisserie",
        "name": "Manoir Patisserie",
        "clientType": "Artisan bakery & viennoiserie",
        "year": "2023",
        "role": "Web Design & Speed Tuning",
        "stack": [
          "Static HTML/JS",
          "Tailwind",
          "Direct Menu Ordering"
        ],
        "outcome": "Sold out weekly morning catering drops in 18 minutes on average.",
        "deliveryDays": 11,
        "resultSignal": "Catering drops sold out in 18 minutes",
        "liveUrl": "https://manoirpatisserie.example.com",
        "clientInstagram": "https://instagram.com/manoirpatisserie",
        "desktopShot": "",
        "mobileShot": ""
      },
      {
        "id": "taqueria-norte",
        "name": "Taqueria Norte",
        "clientType": "Baja street food & catering",
        "year": "2023",
        "role": "Design & Development",
        "stack": [
          "React",
          "Tailwind CSS",
          "Square POS"
        ],
        "outcome": "Direct event catering inquiries up 3.2x without paid ads.",
        "deliveryDays": 12,
        "resultSignal": "Event catering inquiries up 3.2x",
        "liveUrl": "https://taquerianorte.example.com",
        "desktopShot": "",
        "mobileShot": ""
      }
    ]
  },
  {
    "slug": "clinics-wellness",
    "title": "Clinics & Wellness",
    "countBadge": "2 Projects",
    "insight": "Patients booking medical or wellness care are often anxious; clean clarity, practitioner credentials, and transparent pricing build instant trust.",
    "intro": "Whether you run a dental practice or a physiotherapy clinic, patients seek immediate clarity on practitioner credentials, consultation fees, and visiting hours. I design mobile-friendly clinic websites that eliminate repetitive desk calls and streamline online appointments.",
    "projects": [
      {
        "id": "soma-movement",
        "name": "Soma Movement Studio",
        "clientType": "Physiotherapy & Pilates",
        "year": "2024",
        "role": "Brand Strategy, UI & Build",
        "stack": [
          "React",
          "TypeScript",
          "Mindbody API"
        ],
        "outcome": "Eliminated 2 hours of daily reception intake phone calls.",
        "deliveryDays": 9,
        "resultSignal": "72% self-service appointments booked",
        "liveUrl": "https://somamovement.example.com",
        "clientInstagram": "https://instagram.com/somamovement",
        "googleMapsUrl": "https://maps.google.com/?q=Soma+Movement+Studio",
        "desktopShot": "",
        "mobileShot": "",
        "caseStudy": {
          "challenge": "High volume of repetitive calls asking about practitioner specialties and insurance co-pay details.",
          "solution": "Designed a symptom-to-therapist routing questionnaire that guides patients directly into the right practitioner's open calendar slots.",
          "metric": "72% of bookings now self-service"
        }
      },
      {
        "id": "dr-aris-dental",
        "name": "Dr. Aris Dental Studio",
        "clientType": "Cosmetic & implant dentistry",
        "year": "2023",
        "role": "UI Design & Full-stack Build",
        "stack": [
          "React",
          "Tailwind CSS",
          "HIPAA-compliant Intake"
        ],
        "outcome": "Private consultations booked out 6 weeks in advance.",
        "deliveryDays": 13,
        "resultSignal": "Consultations booked out 6 weeks ahead",
        "liveUrl": "https://drarisdental.example.com",
        "desktopShot": "",
        "mobileShot": ""
      }
    ]
  },
  {
    "slug": "retail-fashion",
    "title": "Retail & Fashion",
    "countBadge": "2 Projects",
    "insight": "Independent stores cannot compete on Amazon search; their website must evoke the tactile calm of stepping onto their shop floor.",
    "intro": "Boutique fashion labels, leather artisans, and homeware studios in Pakistan require digital flagships that match the tactile elegance of their retail showroom. I build editorial storefronts and lookbooks that load in under a second and convert social media followers into paying patrons.",
    "projects": [
      {
        "id": "kollektiv-goods",
        "name": "Kollektiv Goods",
        "clientType": "Ceramics & architectural homeware",
        "year": "2024",
        "role": "Art Direction & Frontend",
        "stack": [
          "React",
          "Shopify Storefront API",
          "Tailwind CSS"
        ],
        "outcome": "Sub-900ms page transitions with editorial catalog flow.",
        "deliveryDays": 14,
        "resultSignal": "Sub-900ms mobile transitions",
        "liveUrl": "https://kollektivgoods.example.com",
        "clientInstagram": "https://instagram.com/kollektivgoods",
        "desktopShot": "",
        "mobileShot": ""
      },
      {
        "id": "atelier-v",
        "name": "Atelier V",
        "clientType": "Bespoke leather accessories",
        "year": "2023",
        "role": "Design & Custom Build",
        "stack": [
          "Vite",
          "TypeScript",
          "Stripe Checkout"
        ],
        "outcome": "Average order value increased from $180 to $295 with custom monogram preview.",
        "deliveryDays": 12,
        "resultSignal": "AOV increased from $180 to $295",
        "liveUrl": "https://atelierv.example.com",
        "desktopShot": "",
        "mobileShot": ""
      }
    ]
  },
  {
    "slug": "real-estate",
    "title": "Real Estate & Architecture",
    "countBadge": "1 Project",
    "insight": "High-net-worth buyers skim past bulleted feature lists; they look for floor plan precision, daylight exposure, and neighbourhood pedigree.",
    "intro": "For residential developers and boutique architectural studios, high-net-worth buyers demand clear site plans, daylight renderings, and straightforward specifications. I create fast architectural project showcases that highlight craftsmanship without bloated plugins.",
    "projects": [
      {
        "id": "sloane-properties",
        "name": "Sloane & Co. Residences",
        "clientType": "Boutique residential developments",
        "year": "2024",
        "role": "Design & Frontend Development",
        "stack": [
          "React",
          "Tailwind CSS",
          "Mapbox Vector"
        ],
        "outcome": "100% off-plan penthouse expressions of interest filled in 3 weeks.",
        "deliveryDays": 14,
        "resultSignal": "100% penthouse inquiries filled in 3 weeks",
        "liveUrl": "https://sloaneresidences.example.com",
        "desktopShot": "",
        "mobileShot": ""
      }
    ]
  },
  {
    "slug": "fitness",
    "title": "Fitness & Athletics",
    "countBadge": "1 Project",
    "insight": "Serious gym members despise stock photos of smiling models in pristine workout gear; show the barbells, the chalk, and the coach's credentials.",
    "intro": "Independent strength clubs and athletic conditioning facilities rely on community trust and coach accreditation. I design high-converting gym websites with clear class schedules and membership tiers that convert casual visitors into dedicated regulars.",
    "projects": [
      {
        "id": "forge-strength",
        "name": "Forge Strength Club",
        "clientType": "Independent barbell gym",
        "year": "2023",
        "role": "Design & Build",
        "stack": [
          "React",
          "Tailwind CSS",
          "Stripe Billing"
        ],
        "outcome": "Waitlist grew from 14 to 120 members before door opening.",
        "deliveryDays": 8,
        "resultSignal": "Waitlist grew from 14 to 120 members",
        "liveUrl": "https://forgestrength.example.com",
        "desktopShot": "",
        "mobileShot": ""
      }
    ]
  }
];

export const SEED_REVIEWS = [
  {
    "id": "rev-osteria-fontana",
    "name": "Marco Valenti",
    "businessName": "Osteria Fontana",
    "businessType": "Fine-casual Italian",
    "city": "London, UK",
    "text": "Our weekend reservation problem was fixed in week one. Our previous agency site took eight seconds to load the cellar list. Mushaf's rebuild opens in the blink of an eye, and our direct bookings jumped 44%.",
    "rating": 5,
    "date": "2024-03-12",
    "source": "Direct",
    "sourceUrl": "",
    "projectSlug": "osteria-fontana",
    "featured": true
  },
  {
    "id": "rev-soma-movement",
    "name": "Dr. Leila Al-Mansoor",
    "businessName": "Soma Movement Studio",
    "businessType": "Physiotherapy & Pilates",
    "city": "Dubai, UAE",
    "text": "Most web designers speak in agency jargon. Mushaf asked three practical questions about our consultation intake, then delivered a flawless booking site in nine days. It saves our desk two hours every single morning.",
    "rating": 5,
    "date": "2024-02-04",
    "source": "Email",
    "sourceUrl": "",
    "projectSlug": "soma-movement",
    "featured": false
  },
  {
    "id": "rev-kollektiv-goods",
    "name": "Julian Croft",
    "businessName": "Kollektiv Goods",
    "businessType": "Ceramics & Homeware",
    "city": "Berlin, DE",
    "text": "No fluff, no excuses. He understood our minimalist ceramic line immediately and built an editorial storefront that loads faster than any Shopify template we tested.",
    "rating": 5,
    "date": "2024-01-18",
    "source": "Direct",
    "sourceUrl": "",
    "projectSlug": "kollektiv-goods",
    "featured": false
  }
];

export const SERVICE_BENEFITS = [
  { slug: "web-development", name: "Web Development", benefit: "Sub-second React sites that convert phone visitors into booked tables.", index: "01", art: "red", hue: 0 },
  { slug: "seo", name: "Search Optimization", benefit: "High-ranking Google Maps presence and clean structured data.", index: "02", art: "orange", hue: 0 },
  { slug: "social-media-management", name: "Social Media", benefit: "Consistent editorial photography and recurring local client engagement.", index: "03", art: "wood", hue: 0 },
  { slug: "ui-ux-graphic-design", name: "UI/UX & Branding", benefit: "Figma design systems and cohesive menus from print to screen.", index: "04", art: "orange", hue: 150 },
  { slug: "video-editing", name: "Video Production", benefit: "High-retention commercial cuts and warm color grading.", index: "05", art: "red", hue: 300 },
  { slug: "motion-graphics", name: "Motion Graphics", benefit: "Fluid 2D logo animation and tactile micro-interactions.", index: "06", art: "wood", hue: 1 },
  { slug: "3d-blender", name: "3D & Blender", benefit: "Spatial product visualizations and photoreal procedural renders.", index: "07", art: "orange", hue: 200 },
  { slug: "ai-automation", name: "AI Automation", benefit: "Automated WhatsApp inquiry pipelines that eliminate daily busywork.", index: "08", art: "red", hue: 120 },
];

export const ORIGIN_MILESTONES = [
  { id: "m-2019", year: "2019", index: "01", title: "First restaurant site in 6 days", context: "Built an editorial dining menu for a neighborhood trattoria tired of paying 30% delivery app commissions.", deliverable: "Static-rendered menu + direct WhatsApp table booking.", result: "Booked out Friday tables within 10 days, zero platform commission.", tag: "Origin" },
  { id: "m-2021", year: "2021", index: "02", title: "The $9,000 Figma grave", context: "My first paying independent client was a specialty coffee roaster who spent eight months and $9,000 on an agency that delivered only an unbuildable Figma prototype.", deliverable: "Cut bloated illustrations, coded the menu in pure semantic markup.", result: "Took live customer orders in four days. 680ms time-to-interactive.", tag: "First Client" },
  { id: "m-2023", year: "2023", index: "03", title: "Speed is the only honest metric", context: "Guests on spotty mobile data will not wait four seconds for a hero video to buffer on the curb. If the wine list doesn't open instantly, they walk to the next bistro.", deliverable: "Sub-second edge architecture, local SEO schema, instant dietary filtering.", result: "Average page load under 750ms across all client deployments.", tag: "Standard" },
  { id: "m-2024", year: "2024", index: "04", title: "Multi-disciplinary studio model", context: "Expanding beyond code to cover search rankings, 3D product visuals, short-form video, and automated WhatsApp workflows under one roof.", deliverable: "Single-partner delivery across 8 cohesive commercial capabilities.", result: "27 client projects launched across 5 core industries with 82% retention.", tag: "Evolution" },
  { id: "m-present", year: "Now", index: "05", title: "One person, zero agency markup", context: "Today I design and code directly with founders and business owners who sign their own leases. No account coordinators, no junior subcontractors, no bloated decks.", deliverable: "Fixed 14-day turnaround with direct engineer communication.", result: "100% direct execution, 5.0 Fiverr Pro rating.", tag: "Studio Model" },
];
