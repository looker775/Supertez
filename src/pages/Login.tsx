import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff, Mail, Lock, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) throw signInError;
      if (!authData.user) throw new Error(t('login.errors.no_user'));

      const user = authData.user;
      const fallbackRole =
        user.email === 'kaliwill3@gmail.com'
          ? 'owner'
          : (user.user_metadata?.role as string | undefined) || 'client';

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let resolvedRole = profile?.role ?? fallbackRole;

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      if (!profile) {
        const fullName = typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : null;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email,
              role: fallbackRole,
              full_name: fullName,
            },
            { onConflict: 'id' }
          );

        if (upsertError) {
          console.error('Profile upsert error:', upsertError);
        } else {
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (newProfileError) {
            console.error('Profile reload error:', newProfileError);
          }

          if (newProfile?.role) {
            resolvedRole = newProfile.role;
          }
        }
      }

      // Redirect based on role
      if (resolvedRole) {
        switch (resolvedRole) {
          case 'owner':
            navigate('/owner');
            break;
          case 'admin':
            navigate('/admin');
            break;
          case 'driver':
            navigate('/driver');
            break;
          case 'client':
            navigate('/client');
            break;
          case 'affiliate':
            navigate('/affiliate/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('login.errors.sign_in_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (resetError) throw resetError;

      setResetSuccess(t('login.reset_success'));
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess('');
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('login.errors.reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="app-auth-shell">
        <div className="app-auth-card">
          <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-100 to-orange-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-teal-700" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            <span className="app-gradient-text">{t('login.reset_title')}</span>
          </h2>
            <p className="text-gray-600 mt-2">{t('login.reset_subtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {resetSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {resetSuccess}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email_label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('login.email_placeholder')}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('common.sending')}</span>
                </>
              ) : (
                <span>{t('login.send_reset_link')}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-gray-600 hover:text-gray-900 font-medium"
            >
              {t('login.back_to_login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-auth-shell">
      <div className="app-auth-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-orange-400 rounded-full mb-4 shadow-lg">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            <span className="app-gradient-text">{t('login.title')}</span>
          </h2>
          <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.email_label')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('login.email_placeholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.password_label')}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('login.password_placeholder')}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 p-2 rounded-lg border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                {t('login.remember_me')}
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t('login.forgot_password')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('login.signing_in')}</span>
              </>
            ) : (
              <span>{t('login.sign_in')}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('login.no_account')}{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t('login.sign_up')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
