import { useState, useEffect, useMemo } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';
import { 
  Crown, 
  Users, 
  Car, 
  DollarSign, 
  Settings, 
  CreditCard,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Calendar,
  Edit3,
  Save,
  Gift
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalRides: number;
  totalRevenue: number;
  activeDrivers: number;
  totalClients: number;
  pendingSubscriptions: number;
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
  subscription_status?: string;
  subscription_expires?: string;
  is_free_access?: boolean;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  admin_approved?: boolean;
  admin_blocked?: boolean;
  admin_can_edit_pricing?: boolean;
  admin_can_manage_subscriptions?: boolean;
  admin_can_grant_free_access?: boolean;
}

interface DriverVerification {
  id: string;
  driver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  id_document_type: 'passport' | 'id_card';
  id_document_number?: string | null;
  id_document_front_path: string;
  id_document_back_path?: string | null;
  license_number: string;
  license_class: string;
  license_photo_path: string;
  plate_number: string;
  admin_note?: string | null;
  submitted_at?: string;
  reviewed_at?: string | null;
  driver?: { full_name: string; email: string; phone: string; city?: string };
}

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRides: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    totalClients: 0,
    pendingSubscriptions: 0
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<DriverVerification[]>([]);
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('pending');
  const [verificationSearch, setVerificationSearch] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [offerCountriesInput, setOfferCountriesInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [freeDaysInput, setFreeDaysInput] = useState('');
  const [message, setMessage] = useState('');

  const formatOfferCountries = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  const parseOfferCountries = (value: string) => {
    return value
      .split(/[,\n]/)
      .map((entry) => entry.trim().toUpperCase())
      .filter(Boolean);
  };

  const filteredVerifications = useMemo(() => {
    return verificationRequests.filter((item) => {
      if (verificationStatusFilter !== 'all' && item.status !== verificationStatusFilter) {
        return false;
      }
      if (!verificationSearch.trim()) return true;
      const needle = verificationSearch.trim().toLowerCase();
      return [
        item.driver?.full_name,
        item.driver?.email,
        item.driver?.phone,
        item.plate_number,
        item.license_number,
        item.license_class,
        item.id_document_number,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [verificationRequests, verificationSearch, verificationStatusFilter]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      // Load settings
      const { data: settingsData } = await supabase.from('app_settings').select('*').single();
      if (settingsData) {
        setSettings(settingsData);
        setOfferCountriesInput(formatOfferCountries(settingsData.driver_offer_countries));
      }

      // Load stats
      await loadStats();

      // Load drivers
      await loadDrivers();
      await loadAdmins();
      await loadVerifications();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Total rides
    const { count: totalRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true });

    // Total revenue (from paid rides)
    const { data: revenueData } = await supabase
      .from('rides')
      .select('final_price')
      .eq('payment_status', 'paid');
    const totalRevenue = revenueData?.reduce((sum, ride) => sum + (ride.final_price || 0), 0) || 0;

    // Active drivers
    const { count: activeDrivers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver');

    // Total clients
    const { count: totalClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client');

    // Pending subscriptions
    const { count: pendingSubscriptions } = await supabase
      .from('driver_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    setStats({
      totalRides: totalRides || 0,
      totalRevenue,
      activeDrivers: activeDrivers || 0,
      totalClients: totalClients || 0,
      pendingSubscriptions: pendingSubscriptions || 0
    });
  };

  const loadDrivers = async () => {
    const { data: driversData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (driversData) {
      // Get subscription info for each driver
      const driversWithSubs = await Promise.all(
        driversData.map(async (driver) => {
          const { data: sub } = await supabase
            .from('driver_subscriptions')
            .select('*')
            .eq('driver_id', driver.id)
            .single();
          
          return {
            ...driver,
            subscription_status: sub?.status,
            subscription_expires: sub?.expires_at,
            is_free_access: sub?.is_free_access
          };
        })
      );
      setDrivers(driversWithSubs);
    }
  };

  const loadAdmins = async () => {
    const { data: adminsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (adminsData) {
      setAdmins(adminsData as AdminUser[]);
    }
  };

  const loadVerifications = async () => {
    const { data } = await supabase
      .from('driver_verifications')
      .select('*, driver:profiles!driver_id(full_name, email, phone, city)')
      .order('submitted_at', { ascending: false })
      .limit(200);
    if (data) setVerificationRequests(data as DriverVerification[]);
  };

  const openVerificationDoc = async (path?: string | null) => {
    if (!path) return;
    const { data, error } = await supabase
      .storage
      .from('driver-docs')
      .createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const updateVerificationStatus = async (item: DriverVerification, status: 'approved' | 'rejected') => {
    if (!profile?.id) return;
    setVerificationLoading(true);
    try {
      const adminNote = verificationNote.trim() || null;
      await supabase
        .from('driver_verifications')
        .update({
          status,
          admin_note: adminNote,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await supabase
        .from('profiles')
        .update({
          admin_approved: status === 'approved',
          admin_blocked: false,
        })
        .eq('id', item.driver_id);

      setVerificationNote('');
      await loadVerifications();
    } catch (err) {
      console.error('Failed to update verification:', err);
    } finally {
      setVerificationLoading(false);
    }
  };

  const updateAdmin = async (adminId: string, updates: Partial<AdminUser>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', adminId)
        .eq('role', 'admin');

      if (error) throw error;
      setMessage(t('owner.messages.settings_saved'));
      loadAdmins();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(t('common.error_prefix', { message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          pricing_mode: settings.pricing_mode,
          fixed_price_amount: parseFloat(settings.fixed_price_amount),
          price_per_km: parseFloat(settings.price_per_km),
          currency: settings.currency,
          require_driver_subscription: settings.require_driver_subscription,
          driver_subscription_price: parseFloat(settings.driver_subscription_price),
          subscription_period_days: parseInt(settings.subscription_period_days),
          enable_free_driver_access: settings.enable_free_driver_access,
          default_free_days: parseInt(settings.default_free_days),
          paypal_client_id: settings.paypal_client_id,
          driver_offer_countries: parseOfferCountries(offerCountriesInput),
        })
        .eq('id', 1);

      if (error) throw error;
      setMessage(t('owner.messages.settings_saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(t('common.error_prefix', { message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  const grantFreeAccess = async () => {
    if (!selectedDriver || !freeDaysInput) return;

    setSaving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(freeDaysInput));

      await supabase
        .from('driver_subscriptions')
        .upsert({
          driver_id: selectedDriver.id,
          status: 'free',
          is_free_access: true,
          free_days_granted: parseInt(freeDaysInput),
          free_access_reason: 'Granted by owner',
          expires_at: expiresAt.toISOString()
        });

      setMessage(t('owner.messages.free_access_granted', { days: freeDaysInput, name: selectedDriver.full_name }));
      setSelectedDriver(null);
      setFreeDaysInput('');
      loadDrivers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(t('common.error_prefix', { message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  const revokeAccess = async (driverId: string) => {
    if (!confirm(t('owner.confirm_revoke'))) return;

    await supabase
      .from('driver_subscriptions')
      .update({ status: 'expired', is_free_access: false })
      .eq('driver_id', driverId);

    loadDrivers();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('owner.title')}</h1>
            <p className="text-sm text-gray-500">{t('owner.welcome', { name: profile?.full_name || '' })}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: t('owner.tabs.overview'), icon: TrendingUp },
          { id: 'drivers', label: t('owner.tabs.drivers'), icon: Users },
          { id: 'verifications', label: t('admin.tabs.verifications', { defaultValue: 'Verifications' }), icon: ShieldCheck },
          { id: 'admins', label: t('owner.tabs.admins', { defaultValue: 'Admins' }), icon: Shield },
          { id: 'settings', label: t('owner.tabs.settings'), icon: Settings },
          { id: 'finance', label: t('owner.tabs.finance'), icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('owner.stats.total_rides')}
            value={stats.totalRides}
            icon={Car}
            color="blue"
          />
          <StatCard
            title={t('owner.stats.total_revenue')}
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title={t('owner.stats.active_drivers')}
            value={stats.activeDrivers}
            icon={Users}
            color="purple"
          />
          <StatCard
            title={t('owner.stats.total_clients')}
            value={stats.totalClients}
            icon={CheckCircle}
            color="orange"
          />
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">{t('owner.driver_management.title')}</h2>
            <p className="text-sm text-gray-500">{t('owner.driver_management.subtitle')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.driver')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.location')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.expires')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {driver.full_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{driver.full_name}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{driver.city || t('common.unknown')}</div>
                      <div className="text-sm text-gray-500">{driver.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        driver.is_free_access
                          ? 'bg-purple-100 text-purple-800'
                          : driver.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.is_free_access
                          ? t('subscription.status.free')
                          : driver.subscription_status
                          ? t(`subscription.status.${driver.subscription_status}`, { defaultValue: driver.subscription_status })
                          : t('subscription.status.none')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {driver.subscription_expires
                        ? new Date(driver.subscription_expires).toLocaleDateString()
                        : t('common.not_available')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedDriver(driver)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          {t('owner.actions.grant_free')}
                        </button>
                        {(driver.is_free_access || driver.subscription_status === 'active') && (
                          <button
                            onClick={() => revokeAccess(driver.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            {t('owner.actions.revoke')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">{t('owner.admins.title', { defaultValue: 'Admin Accounts' })}</h2>
            <p className="text-sm text-gray-500">{t('owner.admins.subtitle', { defaultValue: 'Approve, block, and control admin permissions' })}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.admins.table.admin', { defaultValue: 'Admin' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.admins.table.status', { defaultValue: 'Status' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.admins.table.permissions', { defaultValue: 'Permissions' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.admins.table.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.map((admin) => {
                  const approved = admin.admin_approved === true;
                  const blocked = admin.admin_blocked === true;
                  return (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-semibold text-blue-600">
                              {admin.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{admin.full_name || admin.email}</div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {approved ? t('owner.admins.status.approved', { defaultValue: 'Approved' }) : t('owner.admins.status.pending', { defaultValue: 'Pending' })}
                          </span>
                          {blocked && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 ml-2">
                              {t('owner.admins.status.blocked', { defaultValue: 'Blocked' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 text-sm text-gray-700">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={admin.admin_can_edit_pricing === true}
                              onChange={(e) => updateAdmin(admin.id, { admin_can_edit_pricing: e.target.checked })}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span>{t('owner.admins.permissions.pricing', { defaultValue: 'Edit pricing (fixed / per km)' })}</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={admin.admin_can_manage_subscriptions === true}
                              onChange={(e) => updateAdmin(admin.id, { admin_can_manage_subscriptions: e.target.checked })}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span>{t('owner.admins.permissions.subscriptions', { defaultValue: 'Change subscription requirements & price' })}</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={admin.admin_can_grant_free_access === true}
                              onChange={(e) => updateAdmin(admin.id, { admin_can_grant_free_access: e.target.checked })}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span>{t('owner.admins.permissions.free_access', { defaultValue: 'Grant free access to drivers' })}</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {!approved && !blocked && (
                            <button
                              onClick={() => updateAdmin(admin.id, { admin_approved: true })}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              {t('owner.admins.actions.approve', { defaultValue: 'Approve' })}
                            </button>
                          )}
                          {blocked ? (
                            <button
                              onClick={() => updateAdmin(admin.id, { admin_blocked: false })}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              {t('owner.admins.actions.unblock', { defaultValue: 'Unblock' })}
                            </button>
                          ) : (
                            <button
                              onClick={() => updateAdmin(admin.id, { admin_blocked: true })}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              {t('owner.admins.actions.block', { defaultValue: 'Block' })}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{t('admin.verifications.title', { defaultValue: 'Driver Verifications' })}</h2>
              <p className="text-sm text-gray-500">{t('admin.verifications.subtitle', { defaultValue: 'Review and approve driver documents.' })}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <input
              value={verificationSearch}
              onChange={(e) => setVerificationSearch(e.target.value)}
              placeholder={t('admin.verifications.search_placeholder', { defaultValue: 'Search driver, plate, license' })}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
            <select
              value={verificationStatusFilter}
              onChange={(e) => setVerificationStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">{t('admin.verifications.status_all', { defaultValue: 'All' })}</option>
              <option value="pending">{t('admin.verifications.status_pending', { defaultValue: 'Pending' })}</option>
              <option value="approved">{t('admin.verifications.status_approved', { defaultValue: 'Approved' })}</option>
              <option value="rejected">{t('admin.verifications.status_rejected', { defaultValue: 'Rejected' })}</option>
            </select>
            <input
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder={t('admin.verifications.note_placeholder', { defaultValue: 'Optional note for approval/rejection' })}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.verifications.table.driver', { defaultValue: 'Driver' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.verifications.table.docs', { defaultValue: 'Documents' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.verifications.table.vehicle', { defaultValue: 'Vehicle' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.verifications.table.status', { defaultValue: 'Status' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.verifications.table.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVerifications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      {t('admin.verifications.empty', { defaultValue: 'No verification requests.' })}
                    </td>
                  </tr>
                )}
                {filteredVerifications.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.driver?.full_name || item.driver_id}</div>
                      <div className="text-sm text-gray-500">{item.driver?.email}</div>
                      <div className="text-sm text-gray-500">{item.driver?.phone}</div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <div className="text-sm text-gray-700">
                        {t('admin.verifications.id_type', { defaultValue: 'Document' })}: {item.id_document_type === 'passport' ? t('admin.verifications.passport', { defaultValue: 'Passport' }) : t('admin.verifications.id_card', { defaultValue: 'ID Card' })}
                      </div>
                      {item.id_document_number && (
                        <div className="text-sm text-gray-700">
                          {t('admin.verifications.id_number', { defaultValue: 'ID Number' })}: {item.id_document_number}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openVerificationDoc(item.id_document_front_path)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          {t('admin.verifications.view_id_front', { defaultValue: 'ID Front' })}
                        </button>
                        {item.id_document_back_path && (
                          <button
                            onClick={() => openVerificationDoc(item.id_document_back_path)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            {t('admin.verifications.view_id_back', { defaultValue: 'ID Back' })}
                          </button>
                        )}
                        <button
                          onClick={() => openVerificationDoc(item.license_photo_path)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          {t('admin.verifications.view_license', { defaultValue: 'License' })}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1 text-sm text-gray-700">
                      <div>{t('admin.verifications.plate', { defaultValue: 'Plate' })}: {item.plate_number}</div>
                      <div>{t('admin.verifications.license_number', { defaultValue: 'License' })}: {item.license_number}</div>
                      <div>{t('admin.verifications.license_class', { defaultValue: 'Class' })}: {item.license_class}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t(`admin.verifications.status_${item.status}`, { defaultValue: item.status })}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <button
                        onClick={() => updateVerificationStatus(item, 'approved')}
                        disabled={verificationLoading}
                        className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {t('admin.verifications.approve', { defaultValue: 'Approve' })}
                      </button>
                      <button
                        onClick={() => updateVerificationStatus(item, 'rejected')}
                        disabled={verificationLoading}
                        className="w-full bg-red-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                      >
                        {t('admin.verifications.reject', { defaultValue: 'Reject' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-lg font-bold">{t('owner.settings.title')}</h2>

          {/* Pricing Settings */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              {t('owner.settings.pricing.title')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.pricing.mode')}</label>
                <select
                  value={settings.pricing_mode}
                  onChange={(e) => setSettings({ ...settings, pricing_mode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="fixed">{t('owner.settings.pricing.fixed')}</option>
                  <option value="distance">{t('owner.settings.pricing.per_km')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.pricing.currency')}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="USD">{t('owner.settings.pricing.currency_usd')}</option>
                  <option value="EUR">{t('owner.settings.pricing.currency_eur')}</option>
                  <option value="KZT">{t('owner.settings.pricing.currency_kzt')}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('owner.settings.pricing.offer_countries', { defaultValue: 'Countries with driver price offers' })}
                </label>
                <input
                  value={offerCountriesInput}
                  onChange={(e) => setOfferCountriesInput(e.target.value)}
                  placeholder={t('owner.settings.pricing.offer_countries_hint', { defaultValue: 'Example: KZ, RU, US' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('owner.settings.pricing.offer_countries_help', { defaultValue: 'Drivers will propose prices for rides created in these countries (ISO codes, comma separated).' })}
                </p>
              </div>

              {settings.pricing_mode === 'fixed' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.pricing.fixed_amount')}</label>
                  <input
                    type="number"
                    value={settings.fixed_price_amount}
                    onChange={(e) => setSettings({ ...settings, fixed_price_amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.pricing.per_km_amount')}</label>
                  <input
                    type="number"
                    value={settings.price_per_km}
                    onChange={(e) => setSettings({ ...settings, price_per_km: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              {t('owner.settings.subscription.title')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require_subscription"
                  checked={settings.require_driver_subscription}
                  onChange={(e) => setSettings({ ...settings, require_driver_subscription: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="require_subscription" className="ml-2 text-sm font-medium text-gray-700">
                  {t('owner.settings.subscription.require')}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.price')}</label>
                <input
                  type="number"
                  value={settings.driver_subscription_price}
                  onChange={(e) => setSettings({ ...settings, driver_subscription_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.period_days')}</label>
                <input
                  type="number"
                  value={settings.subscription_period_days}
                  onChange={(e) => setSettings({ ...settings, subscription_period_days: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.default_free_days')}</label>
                <input
                  type="number"
                  value={settings.default_free_days}
                  onChange={(e) => setSettings({ ...settings, default_free_days: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* PayPal Settings */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              {t('owner.settings.paypal.title')}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.paypal.client_id')}</label>
              <input
                type="text"
                value={settings.paypal_client_id || ''}
                onChange={(e) => setSettings({ ...settings, paypal_client_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={t('owner.settings.paypal.placeholder')}
              />
            </div>
          </div>

          <button
            onClick={updateSettings}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{t('owner.settings.save')}</span>
          </button>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold mb-4">{t('owner.finance.title')}</h2>
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>{t('owner.finance.coming_soon')}</p>
            <p className="text-sm mt-2">{t('owner.finance.total_revenue', { amount: stats.totalRevenue.toFixed(2) })}</p>
          </div>
        </div>
      )}

      {/* Grant Free Access Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Gift className="h-8 w-8 text-purple-600" />
              <h3 className="text-xl font-bold">{t('owner.grant_modal.title')}</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              {t('owner.grant_modal.description', { name: selectedDriver.full_name })}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('owner.grant_modal.days_label')}
              </label>
              <input
                type="number"
                value={freeDaysInput}
                onChange={(e) => setFreeDaysInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
                placeholder={t('owner.grant_modal.days_placeholder')}
                min="1"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedDriver(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={grantFreeAccess}
                disabled={saving || !freeDaysInput}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  t('owner.grant_modal.grant_button')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
