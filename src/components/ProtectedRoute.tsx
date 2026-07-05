import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
