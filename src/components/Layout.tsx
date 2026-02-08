import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile, signOut } from '../lib/supabase';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await getUserProfile();
    setProfile(userProfile);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!profile) return [];

    switch (profile.role) {
      case 'owner':
        return [
          { path: '/owner', label: t('nav.dashboard') },
          { path: '/admin', label: t('nav.admin') },
        ];
      case 'admin':
        return [{ path: '/admin', label: t('nav.dashboard') }];
      case 'driver':
        return [
          { path: '/driver', label: t('nav.dashboard') },
          { path: '/driver/settings', label: t('nav.settings') },
          { path: '/subscription', label: t('nav.subscription') },
        ];
      case 'client':
        return [
          { path: '/client', label: t('nav.dashboard') },
          { path: '/client/settings', label: t('nav.settings') },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="app-shell">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/kk.png"
                  alt="Supertez"
                  className="h-8 w-auto object-contain"
                />
                <span className="sr-only">Supertez</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {profile && (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  {getNavLinks().map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`app-nav-link ${location.pathname === link.path ? 'is-active' : ''}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* User Menu */}
                <div className="hidden md:flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{profile.full_name}</span>
                    <span className="app-pill">
                      {t(`roles.${profile.role}`, { defaultValue: profile.role })}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">{t('logout')}</span>
                  </button>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-gray-700 hover:text-teal-600"
                  >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && profile && (
          <div className="md:hidden border-t bg-white/80 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {getNavLinks().map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-700 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                  <span className="inline-block mt-1 app-pill">
                    {t(`roles.${profile.role}`, { defaultValue: profile.role })}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="app-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-[fadeIn_0.6s_ease]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
