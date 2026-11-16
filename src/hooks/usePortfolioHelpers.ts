import { useEffect, useState } from 'react';
import { PROJECTS, SITE_META, type StudioProject } from '../data/studioData';
import { useOptionalStore } from '../context/StoreContext';

export function useIsReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useIsMobile(): { isTouch: boolean; isMobile: boolean } {
  const [state, setState] = useState<{ isTouch: boolean; isMobile: boolean }>({
    isTouch: false,
    isMobile: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      const isTouch =
        !finePointer.matches ||
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      setState({ isTouch: Boolean(isTouch), isMobile: window.innerWidth < 768 });
    };
    update();
    finePointer.addEventListener?.('change', update);
    window.addEventListener('resize', update, { passive: true });
    return () => {
      finePointer.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return state;
}

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export function getPerformanceTier(): 'full' | 'lite' {
  if (typeof window === 'undefined') return 'full';
  if (useIsReducedMotion()) return 'lite';
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory && nav.deviceMemory <= 2) return 'lite';
  return 'full';
}

export function usePerformanceTier() {
  const [tier] = useState<'full' | 'lite'>(() => getPerformanceTier());
  return { tier, isLite: tier === 'lite' };
}

export interface PageMetaOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
}

function upsertMeta(selector: string, attrName: string, attrValue: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  return el;
}

function upsertLink(rel: string): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  return el;
}

export function usePageMeta(meta: PageMetaOptions) {
  const store = useOptionalStore();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageOverride = store?.siteContent?.pageSeo?.[pathname];

  const resolvedTitle = pageOverride?.title?.trim() || meta.title;
  const resolvedDescription = pageOverride?.description?.trim() || meta.description;
  const resolvedOgImage = pageOverride?.ogImage?.trim() || meta.ogImage || SITE_META.ogImage;
  const resolvedCanonical =
    meta.canonicalUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', 'name', 'description').content = resolvedDescription;
    upsertMeta('meta[property="og:title"]', 'property', 'og:title').content = resolvedTitle;
    upsertMeta('meta[property="og:description"]', 'property', 'og:description').content = resolvedDescription;
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title').content = resolvedTitle;
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description').content = resolvedDescription;
    if (resolvedCanonical) {
      upsertLink('canonical').href = resolvedCanonical;
      upsertMeta('meta[property="og:url"]', 'property', 'og:url').content = resolvedCanonical;
    }
    if (meta.ogType) {
      upsertMeta('meta[property="og:type"]', 'property', 'og:type').content = meta.ogType;
    }
    if (resolvedOgImage) {
      const originBase =
        (import.meta.env.VITE_APP_URL as string | undefined)?.trim().replace(/\/+$/, '') ||
        (typeof window !== 'undefined' ? window.location.origin : 'https://mushafkhan.com');
      const absoluteOgImage =
        resolvedOgImage.startsWith('http://') || resolvedOgImage.startsWith('https://')
          ? resolvedOgImage
          : `${originBase}${resolvedOgImage.startsWith('/') ? resolvedOgImage : `/${resolvedOgImage}`}`;
      upsertMeta('meta[property="og:image"]', 'property', 'og:image').content = absoluteOgImage;
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image').content = absoluteOgImage;
    }
    const robots = upsertMeta('meta[name="robots"]', 'name', 'robots');
    robots.content = meta.noIndex ? 'noindex, nofollow' : 'index, follow';
  }, [
    resolvedTitle,
    resolvedDescription,
    resolvedCanonical,
    meta.noIndex,
    meta.ogType,
    resolvedOgImage,
  ]);
}

export function getProjectBySlug(slug: string): StudioProject | undefined {
  return PROJECTS.find((p) => p.id === slug);
}

export function getRelatedProjects(slug: string, count = 3): StudioProject[] {
  const current = getProjectBySlug(slug);
  const others = PROJECTS.filter((p) => p.id !== slug);
  if (!current) return others.slice(0, count);
  const sameCategory = others.filter(
    (p) => p.serviceType === current.serviceType || p.industryCategory === current.industryCategory
  );
  const rest = others.filter(
    (p) => p.serviceType !== current.serviceType && p.industryCategory !== current.industryCategory
  );
  return [...sameCategory, ...rest].slice(0, count);
}

/**
 * Safely opens an external URL using a transient anchor element instead of window.open
 * to comply with iframe sandbox policies and avoid popup blocker blocks.
 */
export function openExternalUrl(url: string) {
  if (typeof document === 'undefined' || !url) return;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
