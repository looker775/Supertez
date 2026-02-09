import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Link2, Megaphone, Users } from 'lucide-react';
import { getUserProfile } from '../lib/supabase';

export default function Affiliate() {
  const { t } = useTranslation();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const profile = await getUserProfile();
      if (!active) return;
      setRole(profile?.role || null);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-14">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
            {t('affiliate.badge', { defaultValue: 'Affiliate Program' })}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
            {t('affiliate.hero_title', { defaultValue: 'Promote Supertez and earn with every driver you refer.' })}
          </h1>
          <p className="text-lg text-slate-600">
            {t('affiliate.hero_subtitle', {
              defaultValue:
                'Share your unique driver signup link. Track registrations and performance in your own dashboard.',
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register?role=affiliate"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition"
            >
              {t('affiliate.cta_join', { defaultValue: 'Register as Blogger' })}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
            >
              {t('affiliate.cta_login', { defaultValue: 'Blogger Login' })}
            </Link>
          </div>
          {role === 'affiliate' && (
            <div className="text-sm text-emerald-700">
              <Link to="/blogger/dashboard" className="underline">
                {t('affiliate.cta_dashboard', { defaultValue: 'Go to your affiliate dashboard' })}
              </Link>
            </div>
          )}
        </div>

        <div className="app-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t('affiliate.panel_title', { defaultValue: 'Promotion tools' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('affiliate.panel_subtitle', { defaultValue: 'Track every driver signup with a unique link.' })}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <Link2 className="h-6 w-6 text-indigo-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('affiliate.panel_item_one', { defaultValue: 'Unique referral link' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('affiliate.panel_item_one_sub', { defaultValue: 'Each blogger gets their own driver signup URL.' })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <Users className="h-6 w-6 text-sky-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('affiliate.panel_item_two', { defaultValue: 'CRM dashboard' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('affiliate.panel_item_two_sub', { defaultValue: 'See who registered and how many drivers joined.' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: t('affiliate.step_one_title', { defaultValue: 'Register as a blogger' }),
            body: t('affiliate.step_one_body', { defaultValue: 'Create your affiliate account in minutes.' }),
          },
          {
            title: t('affiliate.step_two_title', { defaultValue: 'Share your link' }),
            body: t('affiliate.step_two_body', { defaultValue: 'Send your driver signup link to your audience.' }),
          },
          {
            title: t('affiliate.step_three_title', { defaultValue: 'Track results' }),
            body: t('affiliate.step_three_body', { defaultValue: 'Watch driver registrations appear in your CRM.' }),
          },
        ].map((item) => (
          <div key={item.title} className="app-card p-6">
            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
