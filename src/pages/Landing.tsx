import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Car, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { getUserProfile } from '../lib/supabase';

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const profile = await getUserProfile();
        if (!active) return;
        if (profile?.role) {
          const roleRoute = profile.role === 'driver'
            ? '/driver'
            : profile.role === 'client'
              ? '/client'
              : profile.role === 'admin'
                ? '/admin'
                : '/owner';
          navigate(roleRoute, { replace: true });
          return;
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {t('landing.loading', { defaultValue: 'Loading...' })}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
            {t('landing.badge', { defaultValue: 'City ride network' })}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
            {t('landing.hero_title', { defaultValue: 'Supertez moves your city with trusted drivers.' })}
          </h1>
          <p className="text-lg text-slate-600 max-w-xl">
            {t('landing.hero_subtitle', {
              defaultValue:
                'Request a ride in seconds or earn more as a verified driver. Real-time tracking, transparent pricing, and support built in.',
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition"
            >
              {t('landing.cta_primary', { defaultValue: 'Get started' })}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
            >
              {t('landing.cta_secondary', { defaultValue: 'Sign in' })}
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>&bull; {t('landing.hero_point_one', { defaultValue: 'Transparent pricing' })}</span>
            <span>&bull; {t('landing.hero_point_two', { defaultValue: 'Verified drivers' })}</span>
            <span>&bull; {t('landing.hero_point_three', { defaultValue: 'Instant support' })}</span>
          </div>
        </div>

        <div className="app-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {t('landing.panel_title', { defaultValue: 'Live dispatch' })}
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {t('landing.panel_subtitle', { defaultValue: 'Always in control' })}
              </h3>
            </div>
            <span className="app-pill">{t('landing.panel_badge', { defaultValue: 'Realtime' })}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <MapPin className="h-6 w-6 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('landing.panel_item_one', { defaultValue: 'Smart pickup locking' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('landing.panel_item_one_sub', { defaultValue: 'GPS + IP fallback keeps requests local.' })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <ShieldCheck className="h-6 w-6 text-orange-500" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('landing.panel_item_two', { defaultValue: 'Driver verification' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('landing.panel_item_two_sub', { defaultValue: 'Subscriptions and approvals keep quality high.' })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <Clock className="h-6 w-6 text-sky-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('landing.panel_item_three', { defaultValue: 'ETA & tracking' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('landing.panel_item_three_sub', { defaultValue: 'Clients see driver movement in real time.' })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <Users className="h-6 w-6 text-indigo-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {t('landing.panel_item_four', { defaultValue: 'Support built in' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('landing.panel_item_four_sub', { defaultValue: 'Client + driver chat with admin anytime.' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="app-card overflow-hidden">
          <div className="relative">
            <img
              src="/landing/supertez-hero-1.png"
              alt="Supertez futuristic shuttle"
              className="h-64 w-full object-cover sm:h-80"
              loading="lazy"
            />
            <div className="absolute inset-x-6 bottom-6 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 backdrop-blur">
              {t('landing.showcase_one', { defaultValue: 'Faster than bus, cheaper than taxi' })}
            </div>
          </div>
        </div>
        <div className="app-card overflow-hidden">
          <div className="relative">
            <img
              src="/landing/supertez-hero-2.png"
              alt="Supertez city shuttle with mobile app"
              className="h-64 w-full object-cover sm:h-80"
              loading="lazy"
            />
            <div className="absolute inset-x-6 bottom-6 rounded-full bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white">
              {t('landing.showcase_two', { defaultValue: 'Real-time routes and booking' })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            icon: Car,
            title: t('landing.feature_one_title', { defaultValue: 'Client experience' }),
            body: t('landing.feature_one_body', { defaultValue: 'Find rides fast, share live location, and pay transparently.' }),
          },
          {
            icon: Users,
            title: t('landing.feature_two_title', { defaultValue: 'Driver growth' }),
            body: t('landing.feature_two_body', { defaultValue: 'Subscriptions, free trials, and earnings visibility in one place.' }),
          },
          {
            icon: ShieldCheck,
            title: t('landing.feature_three_title', { defaultValue: 'Admin control' }),
            body: t('landing.feature_three_body', { defaultValue: 'Pricing, approvals, CRM, and support inboxes managed centrally.' }),
          },
        ].map((item) => (
          <div key={item.title} className="app-card p-6">
            <item.icon className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="app-card p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {t('landing.cta_title', { defaultValue: 'Ready to launch your next ride?' })}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {t('landing.cta_subtitle', { defaultValue: 'Join Supertez and keep riders and drivers in sync.' })}
          </p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition"
        >
          {t('landing.cta_primary', { defaultValue: 'Get started' })}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
