import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFcmRegistration } from './hooks/useFcmRegistration';
import { SideMenu } from './components/SideMenu';
import { Login } from './pages/Login';

import { PhoneLogin } from './pages/PhoneLogin';
import { Lists } from './pages/Lists';
import { ListDetail } from './pages/ListDetail';
import { ProductBank } from './pages/ProductBank';
import { ShareWorkspace } from './pages/ShareWorkspace';
import { Profile } from './pages/Profile';
import { Privacy } from './pages/Privacy';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useFcmRegistration();
  return (
    <BrowserRouter>
      <SideMenu />
      <Routes>
        <Route path="/login" element={<PhoneLogin />} />
        <Route path="/login/email" element={<Login />} />
        <Route path="/login/phone" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          path="/lists"
          element={
            <PrivateRoute>
              <Lists />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId"
          element={
            <PrivateRoute>
              <ListDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId/bank"
          element={
            <PrivateRoute>
              <ProductBank />
            </PrivateRoute>
          }
        />
        <Route path="/categories" element={<Navigate to="/lists" replace />} />
        <Route
          path="/workspaces/:workspaceId/share"
          element={
            <PrivateRoute>
              <ShareWorkspace />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/" element={<Navigate to="/lists" replace />} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
