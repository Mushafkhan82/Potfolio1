export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'GBP' | 'EUR';

export interface MediaGalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  options: Record<string, string>; // e.g. { Size: 'M', Color: 'Charcoal' }
  price: number; // stored in base currency PKR
  sku: string;
  stockQuantity: number;
  image?: string;
}

export interface ProductOptionDefinition {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string; // HTML rich text
  media: MediaGalleryItem[];
  price: number; // PKR base price
  compareAtPrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  stockQuantity: number;
  trackInventory: boolean;
  variants: ProductVariant[];
  optionDefinitions: ProductOptionDefinition[];
  weight: number; // grams
  tags: string[];
  collectionIds: string[];
  category: string;
  status: 'active' | 'draft' | 'archived';
  seoTitle: string;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  sortOrder: 'manual' | 'price-asc' | 'price-desc' | 'newest' | 'alpha';
  published: boolean;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface OrderItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  country: string;
  zone: 'pakistan' | 'international';
}

export interface Order {
  id: string;
  orderNumber: string;
  customerUid?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency: CurrencyCode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  trackingNumber?: string;
  courierName?: string;
  internalNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  ordersCount: number;
  totalSpent: number;
  notes: string;
  lastOrderAt?: string;
  createdAt: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount: number;
  usageLimit: number;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML rich text
  published: boolean;
  seoTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML rich text
  coverImage: string;
  author: string;
  tags: string[];
  published: boolean;
  seoTitle: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
}

export interface NavLinkItem {
  id: string;
  label: string;
  url: string;
  children?: NavLinkItem[];
}

export interface NavigationMenu {
  id: 'header' | 'footer' | string;
  title: string;
  items: NavLinkItem[];
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export type HomeSectionType =
  | 'announcement'
  | 'hero'
  | 'featured_collection'
  | 'product_grid'
  | 'banner'
  | 'testimonials'
  | 'services'
  | 'portfolio'
  | 'faq'
  | 'newsletter'
  | 'contact'
  | 'footer';

export interface QuickActionItem {
  id: string;
  label: string;
  subtitle?: string;
  url: string;
  icon:
    | 'briefcase'
    | 'calendar'
    | 'shopping-bag'
    | 'layers'
    | 'message-circle'
    | 'sparkles'
    | 'compass'
    | 'truck'
    | 'external-link';
  external?: boolean;
  enabled: boolean;
  accent?: boolean;
}

export interface HomeSectionConfig {
  id: string;
  type: HomeSectionType;
  label: string;
  visible: boolean;
  settings: {
    heading?: string;
    subheading?: string;
    body?: string;
    buttonLabel?: string;
    buttonLink?: string;
    secondaryButtonLabel?: string;
    secondaryButtonLink?: string;
    imageUrl?: string;
    portraitUrl?: string;
    portraitAlt?: string;
    portraitFocalPoint?: string;
    videoUrl?: string;
    collectionHandle?: string;
    itemLimit?: number;
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

export interface GlobalThemeSettings {
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  displayFont: string;
  bodyFont: string;
  buttonRadius: 'rounded-full' | 'rounded-xl' | 'rounded-none';
  defaultMode: 'dark' | 'light';
}

export interface PageSeoEntry {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface SiteContentDoc {
  id: 'draft' | 'published';
  theme: GlobalThemeSettings;
  sections: HomeSectionConfig[];
  quickActions?: QuickActionItem[];
  pageSeo?: Record<string, PageSeoEntry>;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  id: 'cod' | 'bank_transfer' | 'jazzcash_easypaisa' | 'stripe';
  name: string;
  enabled: boolean;
  instructions: string;
  accountTitle?: string;
  accountNumber?: string;
  publishableKeyHint?: string;
}

export interface ShippingZoneConfig {
  id: 'pakistan' | 'international';
  name: string;
  enabled: boolean;
  flatRate: number; // in PKR
  freeOverAmount: number; // 0 disables free shipping threshold
  estimatedDays: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  email: string;
  phone: string;
  address: string;
  whatsappNumber: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  defaultCurrency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>; // relative to 1 PKR
  payments: PaymentMethodConfig[];
  shippingZones: ShippingZoneConfig[];
  taxRatePercent: number;
  taxIncludedInPrice: boolean;
  orderNotificationEmail: string;
  notifyOnNewOrder: boolean;
  allowGuestCheckout: boolean;
  enableWhatsappOrder: boolean;
  legalRefundSummary: string;
  legalPrivacySummary: string;
  legalTermsSummary: string;
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  gaMeasurementId: string;
  metaPixelId: string;
  customHeadCode: string;
  updatedAt: string;
}

export interface RolesConfig {
  ownerEmail: string;
  staffEmails: string[];
  updatedAt: string;
}

export interface CartItem {
  key: string; // `${productId}::${variantId || 'default'}`
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku: string;
  image: string;
  price: number; // PKR
  quantity: number;
  maxStock?: number;
  trackInventory?: boolean;
}
