import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAdmin, selectUserData, selectLoadingUserData } from '../../store/slices/disclaimer/disclaimerSlice';
import type { RootState } from '../../store/store';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const isAdmin = useSelector((state: RootState) => selectIsAdmin(state));
  const userData = useSelector((state: RootState) => selectUserData(state));
  const loadingUserData = useSelector((state: RootState) => selectLoadingUserData(state));

  // Si está cargando o no hay datos del usuario, mostrar loading
  if (loadingUserData || !userData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando datos del usuario...</div>
      </div>
    );
  }

  // Solo verificar permisos cuando los datos estén completamente cargados
  if (!isAdmin) {
    return <Navigate to="/newsandalerts" replace />;
  }

  return <>{children}</>;
};
