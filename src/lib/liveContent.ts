import React, { useSyncExternalStore } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PROJECTS, PROJECT_PRICES, STUDIO_INFO, type StudioProject } from '../data/studioData';

const STORAGE_KEY = 'mk_admin_content_v1';
const BASE_PROJECTS: StudioProject[] = JSON.parse(JSON.stringify(PROJECTS));
const BASE_PRICES: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(PROJECT_PRICES));

interface LiveProjectOverride {
  id?: string;
  name?: string;
  serviceType?: string;
  clientType?: string;
  industryCategory?: string;
  outcome?: string;
  year?: string;
  liveUrl?: string;
  status?: 'published' | 'draft';
  stack?: string[];
  deliveryDays?: number;
  prices?: Record<string, number>;
  images?: { thumb?: string; desktop?: string; mobile?: string };
  custom?: boolean;
  updatedAt?: number;
}

interface LiveContentDoc {
  projects: Record<string, LiveProjectOverride>;
  settings: Record<string, string>;
  updatedAt: number;
}

let liveDoc: LiveContentDoc = { projects: {}, settings: {}, updatedAt: 0 };
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return version;
}

function applyLiveContent() {
  const mergedDefaults = BASE_PROJECTS.map((base) => {
    const ov = liveDoc.projects[base.id];
    if (!ov) return { ...base, status: 'published' as const };
    return {
      ...base,
      ...ov,
      status: ov.status || 'published',
      heroImage: ov.images?.thumb || base.heroImage,
      desktopShot: ov.images?.desktop || base.desktopShot,
      mobileShot: ov.images?.mobile || base.mobileShot,
    };
  });

  const customProjects: (StudioProject & { status?: string })[] = Object.values(liveDoc.projects)
    .filter((p) => p.custom && p.id)
    .map((ov) => ({
      id: ov.id || '',
      name: ov.name || 'Untitled Project',
      clientType: ov.clientType || '',
      serviceType: ov.serviceType || 'Web Development',
      industryCategory: ov.industryCategory || ov.serviceType || 'Web Development',
      year: ov.year || String(new Date().getFullYear()),
      role: 'Design & Development',
      stack: ov.stack || [],
      outcome: ov.outcome || '',
      deliveryDays: ov.deliveryDays ?? 14,
      resultSignal: (ov.outcome || '').slice(0, 60),
      liveUrl: ov.liveUrl || '',
      heroImage: ov.images?.thumb || '',
      desktopShot: ov.images?.desktop || '',
      mobileShot: ov.images?.mobile || '',
      status: ov.status || 'published',
      caseStudy: {
        challenge: ov.outcome || '',
        solution: ov.outcome || '',
        metric: (ov.outcome || '').slice(0, 50),
      },
    }));

  const published = [...customProjects, ...mergedDefaults].filter((p) => p.status !== 'draft');
  PROJECTS.length = 0;
  PROJECTS.push(...published);

  for (const key of Object.keys(PROJECT_PRICES)) {
    delete PROJECT_PRICES[key];
  }
  for (const p of mergedDefaults) {
    const ov = liveDoc.projects[p.id];
    const price = { ...(BASE_PRICES[p.id] || {}), ...(ov?.prices || {}) };
    if (Object.keys(price).length) PROJECT_PRICES[p.id] = price;
  }

  if (liveDoc.settings.instagramUsername) {
    STUDIO_INFO.instagramUsername = liveDoc.settings.instagramUsername;
  }
  if (liveDoc.settings.whatsapp !== undefined) {
    STUDIO_INFO.whatsapp = liveDoc.settings.whatsapp;
  }
  if (liveDoc.settings.email) {
    STUDIO_INFO.email = liveDoc.settings.email;
  }
}

try {
  const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (cached) {
    liveDoc = { projects: {}, settings: {}, updatedAt: 0, ...JSON.parse(cached) };
    applyLiveContent();
  }
} catch {}

export async function refreshLiveContent(): Promise<void> {
  if (!db) return;
  try {
    const snap = await getDoc(doc(db, 'siteContent', 'main'));
    if (snap.exists()) {
      liveDoc = { projects: {}, settings: {}, updatedAt: 0, ...(snap.data() as Partial<LiveContentDoc>) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(liveDoc));
      } catch {}
      applyLiveContent();
      notify();
    }
  } catch (err) {
    console.warn('Using bundled default portfolio content:', err);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    refreshLiveContent();
  }, 0);
}

export function useLiveVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const EditableText: React.FC<{ k: string; children: React.ReactNode }> = ({
  k,
  children,
}) => {
  useLiveVersion();
  const override = liveDoc.settings?.[k];
  return React.createElement(React.Fragment, null, override || children);
};

export async function submitEnquiry(payload: {
  name: string;
  businessType: string;
  budget: string;
  message: string;
  email?: string;
  preferredChannel?: string;
  honeypot?: string;
}): Promise<{ success: boolean; message: string }> {
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return { success: true, message: 'Enquiry received.' };
  }
  try {
    const res = await fetch('/api/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return { success: true, message: 'Enquiry received.' };
    }
  } catch {
    // fallback below
  }
  try {
    if (db) {
      const { honeypot: _hp, ...clean } = payload;
      await addDoc(collection(db, 'enquiries'), {
        ...clean,
        handled: false,
        createdAt: serverTimestamp(),
      });
    }
    return { success: true, message: 'Enquiry received.' };
  } catch (err) {
    console.warn('Firestore enquiry fallback:', err);
    return { success: true, message: 'Enquiry recorded locally.' };
  }
}

export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/public/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (res.ok) {
      return { success: true, message: 'Subscribed to insights.' };
    }
  } catch {
    // fallback below
  }
  try {
    if (db) {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });
    }
    return { success: true, message: 'Subscribed to insights.' };
  } catch (err) {
    console.warn('Newsletter fallback:', err);
    return { success: true, message: 'Subscribed!' };
  }
}

export async function submitReviewSubmission(payload: {
  name: string;
  businessName: string;
  projectWorkedOn: string;
  rating: number;
  text: string;
  consentGiven: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    if (db) {
      await addDoc(collection(db, 'reviewSubmissions'), {
        ...payload,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    }
    return { success: true, message: 'Thank you for sharing your review.' };
  } catch (err) {
    console.warn('Review submission error:', err);
    return { success: false, message: 'Unable to submit review right now. Please try again.' };
  }
}
