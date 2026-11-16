import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { StoreProvider } from './context/StoreContext';
import { SceneBackdrop } from './components/SceneBackdrop';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import {
  AmbientSoundToggle,
  CustomCursor,
  MobileTabBar,
  Preloader,
  ScrollToTop,
  ThemePullTag,
} from './components/ShellChrome';
import { CommandPalette } from './components/CommandPalette';
import HomePage from './pages/HomePage';
import { testFirestoreConnection } from './lib/firebase';

// Lazy-loaded pages & heavy interactive bundles
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const WorkPage = lazy(() => import('./pages/WorkPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ProcessPage = lazy(() => import('./pages/ProcessPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const BookPage = lazy(() => import('./pages/BookPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.TermsPage }))
);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const StoreCatalogPage = lazy(() =>
  import('./components/storefront/StoreCatalogPage').then((m) => ({
    default: m.StoreCatalogPage,
  }))
);
const ProductDetailPage = lazy(() =>
  import('./components/storefront/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  }))
);
const CheckoutPage = lazy(() =>
  import('./components/storefront/CheckoutAndTracking').then((m) => ({
    default: m.CheckoutPage,
  }))
);
const OrderConfirmationPage = lazy(() =>
  import('./components/storefront/CheckoutAndTracking').then((m) => ({
    default: m.OrderConfirmationPage,
  }))
);
const OrderTrackingPage = lazy(() =>
  import('./components/storefront/CheckoutAndTracking').then((m) => ({
    default: m.OrderTrackingPage,
  }))
);
const WishlistPage = lazy(() =>
  import('./components/storefront/CheckoutAndTracking').then((m) => ({
    default: m.WishlistPage,
  }))
);
const BlogListPage = lazy(() =>
  import('./components/storefront/CmsAndBlogPages').then((m) => ({
    default: m.BlogListPage,
  }))
);
const BlogDetailPage = lazy(() =>
  import('./components/storefront/CmsAndBlogPages').then((m) => ({
    default: m.BlogDetailPage,
  }))
);
const CmsPageViewer = lazy(() =>
  import('./components/storefront/CmsAndBlogPages').then((m) => ({
    default: m.CmsPageViewer,
  }))
);
const AdminStudio = lazy(() =>
  import('./components/admin/AdminStudio').then((m) => ({
    default: m.AdminStudio,
  }))
);
const CartDrawer = lazy(() =>
  import('./components/storefront/CartDrawer').then((m) => ({
    default: m.CartDrawer,
  }))
);
const GeminiChatbot = lazy(() =>
  import('./components/GeminiChatbot').then((m) => ({
    default: m.GeminiChatbot,
  }))
);
const FaqSchemaModal = lazy(() =>
  import('./components/FaqSchemaModal').then((m) => ({
    default: m.FaqSchemaModal,
  }))
);
const ReviewSubmissionModal = lazy(() =>
  import('./components/ReviewSubmissionModal').then((m) => ({
    default: m.ReviewSubmissionModal,
  }))
);

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[color:var(--text-muted)]">
      <span className="w-2 h-2 rounded-full bg-[#6BAA00]" />
      <span>Loading view...</span>
    </div>
  </div>
);

const CollectionRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return <StoreCatalogPage collectionSlug={slug} onNavigate={navigate} />;
};

const ProductRoute: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  return <ProductDetailPage handle={handle || ''} onNavigate={navigate} />;
};

const OrderConfirmationRoute: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  return (
    <OrderConfirmationPage orderNumber={orderId || ''} onNavigate={navigate} />
  );
};

const CmsPageRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return <CmsPageViewer slug={slug || ''} onNavigate={navigate} />;
};

const BlogDetailRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return <BlogDetailPage slug={slug || ''} onNavigate={navigate} />;
};

const AdminRoute: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  return <AdminStudio initialTab={tab} onNavigateStore={navigate} />;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Preserve #admin, #admin-tools, and #review hash shortcuts
  useEffect(() => {
    const hash = location.hash.toLowerCase();
    if (hash === '#admin') {
      navigate('/admin', { replace: true });
    } else if (hash === '#admin-tools') {
      setFaqModalOpen(true);
    } else if (hash === '#review') {
      setReviewModalOpen(true);
    }
  }, [location.hash, navigate]);

  const closeHashModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    if (location.hash) {
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <ScrollToTop />
      {!isAdminRoute && <SceneBackdrop />}
      {!isAdminRoute && <CustomCursor />}
      {!isAdminRoute && <Preloader />}
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <ThemePullTag />}

      <main id="main-content" className="relative z-10 flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/work/:slug" element={<ProjectDetailPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Storefront & CMS Routes */}
            <Route path="/shop" element={<StoreCatalogPage onNavigate={navigate} />} />
            <Route path="/collections" element={<StoreCatalogPage onNavigate={navigate} />} />
            <Route path="/collections/:slug" element={<CollectionRoute />} />
            <Route path="/product/:handle" element={<ProductRoute />} />
            <Route path="/checkout" element={<CheckoutPage onNavigate={navigate} />} />
            <Route
              path="/order-confirmation/:orderId"
              element={<OrderConfirmationRoute />}
            />
            <Route
              path="/track-order"
              element={<OrderTrackingPage onNavigate={navigate} />}
            />
            <Route
              path="/wishlist"
              element={<WishlistPage onNavigate={navigate} />}
            />
            <Route path="/pages/:slug" element={<CmsPageRoute />} />
            <Route path="/blog" element={<BlogListPage onNavigate={navigate} />} />
            <Route path="/blog/:slug" element={<BlogDetailRoute />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/admin/:tab" element={<AdminRoute />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileTabBar />}
      {!isAdminRoute && <CommandPalette />}
      {!isAdminRoute && (
        <div className="hidden md:block fixed bottom-5 right-[16.5rem] z-[65]">
          <AmbientSoundToggle />
        </div>
      )}
      {!isAdminRoute && (
        <Suspense fallback={null}>
          <CartDrawer onNavigate={navigate} />
          <GeminiChatbot />
        </Suspense>
      )}

      {faqModalOpen && (
        <Suspense fallback={null}>
          <FaqSchemaModal
            isOpen={faqModalOpen}
            onClose={() => closeHashModal(setFaqModalOpen)}
          />
        </Suspense>
      )}
      {reviewModalOpen && (
        <Suspense fallback={null}>
          <ReviewSubmissionModal
            onClose={() => closeHashModal(setReviewModalOpen)}
          />
        </Suspense>
      )}
    </div>
  );
};

export function App() {
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <CurrencyProvider>
            <StoreProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </StoreProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
