import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();
  if (loading)   return <LoadingScreen message="Verificando sesión..." />;
  if (!user)     return <Navigate to="/login" replace />;
  if (!profile)  return <LoadingScreen message="Cargando perfil..." />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
