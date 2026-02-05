import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Globe, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { detectCountryCode } from '../lib/geo';
import { setLanguageByCountry } from '../i18n';

export const Navbar = ({ user }: { user: any }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) setRole(data.role);
      });
    } else {
      setRole(null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      // 1. Clear Supabase session
      await supabase.auth.signOut();
      // 2. Clear all local storage just in case
      localStorage.clear();
      // 3. Force a full page refresh to the login page (most reliable way to logout)
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/login';
    }
  };

  const changeLanguage = async (lng: string) => {
    if (lng === 'auto') {
      try {
        localStorage.removeItem('language_override');
      } catch {
        // ignore storage errors
      }

      try {
        const stored = localStorage.getItem('country_code');
        if (stored) {
          setLanguageByCountry(stored, { force: true });
          return;
        }
      } catch {
        // ignore storage errors
      }

      const code = await detectCountryCode();
      if (code) setLanguageByCountry(code, { force: true });
      return;
    }

    try {
      localStorage.setItem('language_override', '1');
    } catch {
      // ignore storage errors
    }
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex flex-col cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-black text-yellow-400 tracking-tighter italic leading-none">SUPERTEZ</h1>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('slogan')}</span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <Globe size={14} className="text-yellow-500" />
            <select 
              className="bg-transparent text-[10px] font-bold border-none focus:ring-0 cursor-pointer p-0"
              value={(() => {
                try {
                  if (localStorage.getItem('language_override') !== '1') return 'auto';
                } catch {
                  // ignore storage errors
                }
                return i18n.language.split('-')[0];
              })()}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="auto">AUTO</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="es">ES</option>
              <option value="pt">PT</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
              <option value="sv">SV</option>
              <option value="ko">KO</option>
              <option value="ja">JA</option>
              <option value="ar">AR</option>
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-500">
                  {role === 'owner' || role === 'admin' ? <ShieldCheck size={10} /> : <User size={10} />}
                  {role ? t(`roles.${role}`, { defaultValue: role }) : '...'}
                </div>
                <span className="hidden md:block text-[9px] font-bold text-slate-500">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all shadow-sm active:scale-90"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
              {t('login.sign_in')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
