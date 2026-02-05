import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [role, setRole] = useState('client');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isAdminPath = location.pathname.toLowerCase().startsWith('/kali');

  useEffect(() => {
    if (isAdminPath) {
      setRole('admin');
    }
  }, [isAdminPath]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/update-password',
        });
        if (error) throw error;
        setMessage(t('reset_link_sent'));
      } else if (isRegistering) {
        if (!isAdminPath && (role === 'client' || role === 'driver') && !phone.trim()) {
          setError(t('auth.errors.phone_required'));
          setLoading(false);
          return;
        }
        const finalRole = isAdminPath ? 'admin' : role;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              role: finalRole, 
              full_name: fullName,
              phone: phone.trim() || null,
            } 
          },
        });
        if (error) throw error;
        
        if (data.session) {
          // AUTO-LOGIN SUCCESS
          navigate('/');
        } else {
          setMessage(t('auth.messages.account_created'));
          // Delay briefly then try to sign in automatically
          setTimeout(async () => {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (!signInError) navigate('/');
            else setError(t('auth.errors.login_after_register_failed'));
          }, 1500);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isAdminPath) return isRegistering ? t('admin_registration') : t('admin_login');
    if (isForgotPassword) return t('login.reset_title');
    return isRegistering ? t('register.title') : t('login.sign_in');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-100 p-4 font-sans">   
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-yellow-500">  
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {getTitle()}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('management')}</p> 
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border-2 border-red-100">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm font-bold border-2 border-green-100">{message}</div>}

        <form onSubmit={handleAuth} className="space-y-5">
          {isRegistering && !isForgotPassword && (
            <>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('full_name')}</label>
                <input type="text" required placeholder={t('auth.placeholders.full_name')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:bg-white outline-none transition-all" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              {!isAdminPath && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('role')}</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-500 outline-none transition-all bg-white font-bold text-slate-700" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="client">{t('roles.client')}</option>
                    <option value="driver">{t('roles.driver')}</option>
                  </select>
                </div>
              )}

              {!isAdminPath && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('auth.phone_label')}</label>
                  <input
                    type="tel"
                    required={role === 'client' || role === 'driver'}
                    placeholder={t('auth.placeholders.phone')}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:bg-white outline-none transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('email')}</label>
            <input type="email" required placeholder={t('auth.placeholders.email')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:bg-white outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('password')}</label>
              <input type="password" required placeholder="••••••••" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:bg-white outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-yellow-400 font-black py-5 rounded-2xl hover:bg-slate-800 hover:scale-[1.02] transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm mt-4">
            {loading ? t('common.processing') : isForgotPassword ? t('login.send_reset_link') : isRegistering ? t('register.submit') : t('login.sign_in')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-slate-50 text-center space-y-4">
          {!isForgotPassword && (
            <button type="button" onClick={() => { setIsForgotPassword(true); setIsRegistering(false); }} className="text-[10px] font-black text-slate-400 hover:text-yellow-600 transition uppercase tracking-[0.3em]">
              {t('forgot_password')}
            </button>
          )}

          <div className="flex flex-col gap-3">
            {isForgotPassword ? (
              <button onClick={() => setIsForgotPassword(false)} className="text-xs font-black text-yellow-600 uppercase tracking-widest hover:underline">{t('back_to_login')}</button>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  {isRegistering ? (isAdminPath ? t('already_admin') : t('have_account')) : (isAdminPath ? t('need_admin') : t('no_account'))}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm font-black text-slate-900 underline decoration-yellow-500 decoration-4 underline-offset-4 hover:text-yellow-600 transition-colors"
                >
                  {isRegistering ? t('login.sign_in') : t('register.title')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
