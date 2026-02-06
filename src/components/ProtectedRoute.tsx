import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserProfile, signOut } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userProfile = await getUserProfile();
    setProfile(userProfile);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    // Redirect to their appropriate dashboard
    const roleRedirects: Record<string, string> = {
      owner: '/owner',
      admin: '/admin',
      driver: '/driver',
      client: '/client',
    };
    return <Navigate to={roleRedirects[profile.role] || '/login'} replace />;
  }

  if (profile.role === 'admin') {
    const approved = profile.admin_approved !== false;
    const blocked = profile.admin_blocked === true;
    if (!approved || blocked) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-900">
              {blocked ? 'Admin account blocked' : 'Admin approval required'}
            </h1>
            <p className="text-gray-600 text-sm">
              {blocked
                ? 'Your admin account has been blocked by the owner. Please contact support.'
                : 'Your admin account is pending approval by the owner.'}
            </p>
            <button
              onClick={signOut}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
