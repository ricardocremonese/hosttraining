import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CartProvider } from '@/lib/CartContext';

// Store pages
import Layout from './components/store/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import OrderList from './pages/admin/OrderList';
import CategoryManager from './pages/admin/CategoryManager';
import BannerManager from './pages/admin/BannerManager';
import EditorialManager from './pages/admin/EditorialManager';
import FeaturedCategoryManager from './pages/admin/FeaturedCategoryManager';
import Integrations from './pages/admin/Integrations';
import Coupons from './pages/admin/marketing/Coupons';
import Campaigns from './pages/admin/marketing/Campaigns';
import FollowUp from './pages/admin/marketing/FollowUp';
import AIContent from './pages/admin/marketing/AIContent';
import WhatsAppMarketing from './pages/admin/marketing/WhatsApp';
import Birthdays from './pages/admin/marketing/Birthdays';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <CartProvider>
      <Routes>
        {/* Store Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/rastreio" element={<OrderTracking />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/products" element={<ProductList />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/products/:id/edit" element={<ProductForm />} />
          <Route path="/admin/orders" element={<OrderList />} />
          <Route path="/admin/categories" element={<CategoryManager />} />
          <Route path="/admin/banners" element={<BannerManager />} />
          <Route path="/admin/editorials" element={<EditorialManager />} />
          <Route path="/admin/essentials" element={<FeaturedCategoryManager />} />
          <Route path="/admin/integrations" element={<Integrations />} />
          <Route path="/admin/marketing/coupons" element={<Coupons />} />
          <Route path="/admin/marketing/campaigns" element={<Campaigns />} />
          <Route path="/admin/marketing/followup" element={<FollowUp />} />
          <Route path="/admin/marketing/ai" element={<AIContent />} />
          <Route path="/admin/marketing/whatsapp" element={<WhatsAppMarketing />} />
          <Route path="/admin/marketing/birthdays" element={<Birthdays />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </CartProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App