import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Recommendation from '@/pages/Recommendation';
import RecommendationAnalytics from '@/pages/RecommendationAnalytics';
import Inventory from '@/pages/Inventory';
import InventoryPurchase from '@/pages/InventoryPurchase';
import Marketing from '@/pages/Marketing';
import MarketingAutomation from '@/pages/MarketingAutomation';
import Rules from '@/pages/Rules';
import SettingsPermissions from '@/pages/SettingsPermissions';
import SettingsLogs from '@/pages/SettingsLogs';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (token) {
      api.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  if (!isAuthenticated) {
    if (location.pathname === '/login') {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireAuth>
            <Login />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route
          path="/recommendation/analytics"
          element={<RecommendationAnalytics />}
        />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/purchase" element={<InventoryPurchase />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route
          path="/marketing/automation"
          element={<MarketingAutomation />}
        />
        <Route path="/rules" element={<Rules />} />
        <Route
          path="/settings/permissions"
          element={<SettingsPermissions />}
        />
        <Route path="/settings/logs" element={<SettingsLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppRoot() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      api.setToken(token);
    }
  }, [token]);

  return <AppRoutes />;
}

export default function App() {
  return (
    <Router>
      <AppRoot />
    </Router>
  );
}
