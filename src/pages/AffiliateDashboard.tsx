import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Copy, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, getUserProfile } from '../lib/supabase';

interface AffiliateCode {
  id: string;
  affiliate_id: string;
  code: string;
  created_at: string;
}

interface DriverRow {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  city?: string;
  created_at: string;
}

function generateCode() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `STZ-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  }
  return `STZ-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export default function AffiliateDashboard() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [affiliateCode, setAffiliateCode] = useState<AffiliateCode | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState('');

  const referralLink = useMemo(() => {
    if (!affiliateCode?.code) return '';
    return `${window.location.origin}/register?role=driver&ref=${affiliateCode.code}`;
  }, [affiliateCode?.code]);

  const loadDrivers = useCallback(async (code: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, city, created_at')
      .eq('role', 'driver')
      .eq('affiliate_code', code)
      .order('created_at', { ascending: false });
    setDrivers((data as DriverRow[]) || []);
  }, []);

  const ensureAffiliateCode = useCallback(async (affiliateId: string) => {
    const { data: existing } = await supabase
      .from('affiliate_codes')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .maybeSingle();

    if (existing?.code) {
      setAffiliateCode(existing as AffiliateCode);
      await loadDrivers(existing.code);
      return;
    }

    let created: AffiliateCode | null = null;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      const code = generateCode();
      const { data, error } = await supabase
        .from('affiliate_codes')
        .insert({ affiliate_id: affiliateId, code })
        .select('*')
        .single();
      if (!error && data) {
        created = data as AffiliateCode;
      }
    }

    if (created) {
      setAffiliateCode(created);
      await loadDrivers(created.code);
    }
  }, [loadDrivers]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      const userProfile = await getUserProfile();
      if (!active) return;
      setProfile(userProfile);
      if (userProfile?.id) {
        await ensureAffiliateCode(userProfile.id);
      }
      if (active) setLoading(false);
    };
    init();
    return () => {
      active = false;
    };
  }, [ensureAffiliateCode]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyState(t('affiliate.copied', { defaultValue: 'Copied!' }));
      setTimeout(() => setCopyState(''), 2000);
    } catch {
      setCopyState(t('affiliate.copy_failed', { defaultValue: 'Copy failed' }));
      setTimeout(() => setCopyState(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {t('common.processing', { defaultValue: 'Processing...' })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('affiliate.dashboard_title', { defaultValue: 'Affiliate CRM' })}
          </h1>
          <p className="text-sm text-slate-500">
            {t('affiliate.dashboard_subtitle', { defaultValue: 'Track drivers who signed up through your link.' })}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
          {t('affiliate.status_active', { defaultValue: 'Active' })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="app-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Link2 className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t('affiliate.link_title', { defaultValue: 'Your driver signup link' })}
              </p>
              <p className="text-xs text-slate-500">
                {t('affiliate.link_subtitle', { defaultValue: 'Share this link to track driver registrations.' })}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={referralLink}
              readOnly
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Copy className="h-4 w-4" />
              {t('affiliate.copy_button', { defaultValue: 'Copy' })}
            </button>
          </div>
          {copyState && <p className="text-xs text-emerald-600">{copyState}</p>}
        </div>

        <div className="app-card p-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-5 w-5" />
            <p className="text-sm">{t('affiliate.total_drivers', { defaultValue: 'Total drivers referred' })}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{drivers.length}</p>
          <p className="text-xs text-slate-500 mt-2">
            {t('affiliate.total_hint', { defaultValue: 'Counts update automatically after driver signup.' })}
          </p>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            {t('affiliate.driver_list', { defaultValue: 'Referred drivers' })}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">{t('affiliate.table.name', { defaultValue: 'Name' })}</th>
                <th className="px-6 py-3 text-left">{t('affiliate.table.contact', { defaultValue: 'Contact' })}</th>
                <th className="px-6 py-3 text-left">{t('affiliate.table.city', { defaultValue: 'City' })}</th>
                <th className="px-6 py-3 text-left">{t('affiliate.table.date', { defaultValue: 'Signed up' })}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                    {t('affiliate.empty', { defaultValue: 'No driver signups yet.' })}
                  </td>
                </tr>
              )}
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">{driver.full_name}</td>
                  <td className="px-6 py-3 text-slate-600">{driver.phone || driver.email || t('common.not_available')}</td>
                  <td className="px-6 py-3 text-slate-600">{driver.city || t('common.unknown')}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {driver.created_at ? new Date(driver.created_at).toLocaleDateString() : t('common.not_available')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
