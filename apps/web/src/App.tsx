import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import type { UserRole } from './types';

function ProtectedShell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><span className="logo__mark">R</span><p>Loading RouteFlow…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><Outlet /></Layout>;
}

function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route element={<ProtectedShell />}>
      <Route index element={<DashboardPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route element={<RoleRoute roles={['CUSTOMER']} />}><Route path="orders/new" element={<NewOrderPage />} /></Route>
      <Route element={<RoleRoute roles={['ADMIN']} />}><Route path="users" element={<UsersPage />} /><Route path="reports" element={<ReportsPage />} /></Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
