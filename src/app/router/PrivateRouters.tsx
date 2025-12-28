import { useState, useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from '../../shared/utils/api';

export const PrivateRouters = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    loading: boolean;
    checked: boolean;
  }>({
    isAuthenticated: false,
    loading: true,
    checked: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setAuthState({ isAuthenticated: false, loading: false, checked: true });
        return;
      }

      try {
        try {
          await apiFetch('/api/auth/fetchme', {
            auth: true
          });
        } catch (error: any) {
          if (error.message.includes('401') || error.message.includes('Token')) {
            toast.error('Token expirado', {
              position: 'top-left'
            });
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            setAuthState({ isAuthenticated: false, loading: false, checked: true });
            return;
          }
          throw error;
        }
        
        setAuthState({ isAuthenticated: true, loading: false, checked: true });
      } catch (error) {
        console.error('Auth check error:', error);
                localStorage.removeItem("auth_token");
                localStorage.removeItem("user_data");
        setAuthState({ isAuthenticated: false, loading: false, checked: true });
      }
    };

    checkAuth();
  }, [location.pathname]); 

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};