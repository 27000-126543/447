import { useEffect, useMemo } from 'react';
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
import Notifications from '@/pages/Notifications';
import DataCollection from '@/pages/DataCollection';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { canAccessMenu } from '@/lib/permissions';
import { ROLE_MENU_ACCESS } from '@shared/types';

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

function RequireMenuPermission({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return canAccessMenu(location.pathname);
  }, [user, location.pathname]);

  useEffect(() => {
    if (user && !hasAccess) {
      const allowedPaths = ROLE_MENU_ACCESS[user.role] || [];
      const firstAllowed = allowedPaths[0] || '/dashboard';
      navigate(firstAllowed, { replace: true });
    }
  }, [user, hasAccess, location.pathname, navigate]);

  if (!hasAccess) {
    return null;
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
        <Route path="/dashboard" element={<RequireMenuPermission><Dashboard /></RequireMenuPermission>} />
        <Route path="/orders" element={<RequireMenuPermission><Orders /></RequireMenuPermission>} />
        <Route path="/orders/:id" element={<RequireMenuPermission><OrderDetail /></RequireMenuPermission>} />
        <Route path="/recommendation" element={<RequireMenuPermission><Recommendation /></RequireMenuPermission>} />
        <Route
          path="/recommendation/analytics"
          element={<RequireMenuPermission><RecommendationAnalytics /></RequireMenuPermission>}
        />
        <Route path="/inventory" element={<RequireMenuPermission><Inventory /></RequireMenuPermission>} />
        <Route path="/inventory/purchase" element={<RequireMenuPermission><InventoryPurchase /></RequireMenuPermission>} />
        <Route path="/marketing" element={<RequireMenuPermission><Marketing /></RequireMenuPermission>} />
        <Route
          path="/marketing/automation"
          element={<RequireMenuPermission><MarketingAutomation /></RequireMenuPermission>}
        />
        <Route path="/rules" element={<RequireMenuPermission><Rules /></RequireMenuPermission>} />
        <Route path="/data-collection" element={<RequireMenuPermission><DataCollection /></RequireMenuPermission>} />
        <Route path="/notifications" element={<RequireMenuPermission><Notifications /></RequireMenuPermission>} />
        <Route
          path="/settings/permissions"
          element={<RequireMenuPermission><SettingsPermissions /></RequireMenuPermission>}
        />
        <Route path="/settings/logs" element={<RequireMenuPermission><SettingsLogs /></RequireMenuPermission>} />
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
