import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Listens for auth-failure events dispatched by the API client (outside React)
 * and performs an SPA-safe redirect to /login via React Router.
 */
export function useAuthFailureRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener('listyyy:auth-failure', handler);
    return () => window.removeEventListener('listyyy:auth-failure', handler);
  }, [navigate]);
}
