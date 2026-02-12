import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFcmRegistration } from './hooks/useFcmRegistration';
import { SideMenu } from './components/SideMenu';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PhoneLogin } from './pages/PhoneLogin';
import { Lists } from './pages/Lists';
import { ListDetail } from './pages/ListDetail';
import { ShareList } from './pages/ShareList';
import { ProductBank } from './pages/ProductBank';
import { Categories } from './pages/Categories';
import { Profile } from './pages/Profile';

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login/phone" element={<PhoneLogin />} />
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
          path="/lists/:listId/share"
          element={
            <PrivateRoute>
              <ShareList />
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
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <Categories />
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
        <Route path="/" element={<Navigate to="/lists" replace />} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
