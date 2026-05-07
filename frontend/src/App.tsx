import { useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useFcmRegistration } from './hooks/useFcmRegistration';
import { useAuthFailureRedirect } from './hooks/useAuthFailureRedirect';
import { useUserEvents } from './hooks/useUserEvents';
import { SideMenu } from './components/SideMenu';
import { OfflineBanner } from './components/OfflineBanner';
import type { UserEvent } from './types';

const Welcome = lazy(() => import('./pages/Welcome').then((m) => ({ default: m.Welcome })));
const PhoneLogin = lazy(() => import('./pages/PhoneLogin').then((m) => ({ default: m.PhoneLogin })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Lists = lazy(() => import('./pages/Lists').then((m) => ({ default: m.Lists })));
const ListDetail = lazy(() => import('./pages/ListDetail').then((m) => ({ default: m.ListDetail })));
const ListItemEdit = lazy(() => import('./pages/ListItemEdit').then((m) => ({ default: m.ListItemEdit })));
const ListEdit = lazy(() => import('./pages/ListEdit').then((m) => ({ default: m.ListEdit })));
const ListCreate = lazy(() => import('./pages/ListCreate').then((m) => ({ default: m.ListCreate })));
const ProductEdit = lazy(() => import('./pages/ProductEdit').then((m) => ({ default: m.ProductEdit })));
const CategoryEdit = lazy(() => import('./pages/CategoryEdit').then((m) => ({ default: m.CategoryEdit })));
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })));
const ShareWorkspace = lazy(() => import('./pages/ShareWorkspace').then((m) => ({ default: m.ShareWorkspace })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount').then((m) => ({ default: m.DeleteAccount })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirects to /welcome if the user hasn't seen the onboarding yet */
function WelcomeGate({ children }: { children: React.ReactNode }) {
  const seen = localStorage.getItem('listyyy_welcome_seen');
  if (!seen) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

/** Routes where we do not connect the user WebSocket (avoids hang on load before auth is ready). */
const PUBLIC_PATHS = ['/', '/welcome', '/login', '/login/email', '/login/phone', '/register'];

function AppShell() {
  useFcmRegistration();
  useAuthFailureRedirect();
  const location = useLocation();
  const pathname = location.pathname;
  const isPublicRoute = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.userId);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const clearActiveWorkspace = useWorkspaceStore((s) => s.clearActiveWorkspace);

  const onUserEvent = useCallback(
    (event: UserEvent) => {
      if (event.type === 'NEW_INVITATION') {
        queryClient.invalidateQueries({ queryKey: ['workspaceInvitations'] });
      }
      if (event.type === 'REMOVED_FROM_WORKSPACE' && event.workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        clearActiveWorkspace();
        if (activeWorkspaceId === event.workspaceId) {
          navigate('/lists', { replace: true });
        }
      }
    },
    [queryClient, navigate, activeWorkspaceId, clearActiveWorkspace]
  );

  // Only connect user WebSocket when authenticated and not on welcome/login (avoids freeze on initial load)
  useUserEvents(isPublicRoute ? null : userId ?? null, onUserEvent);

  return (
    <>
      <OfflineBanner />
      <SideMenu />
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>טוען…</div>}>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<WelcomeGate><PhoneLogin /></WelcomeGate>} />
        <Route path="/login/email" element={<WelcomeGate><Login /></WelcomeGate>} />
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
          path="/lists/new"
          element={
            <PrivateRoute>
              <ListCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId/items/:itemId/edit"
          element={
            <PrivateRoute>
              <ListItemEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId/edit"
          element={
            <PrivateRoute>
              <ListEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:productId/edit"
          element={
            <PrivateRoute>
              <ProductEdit />
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
          path="/categories/:categoryId/edit"
          element={
            <PrivateRoute>
              <CategoryEdit />
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
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/" element={<Navigate to="/lists" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
