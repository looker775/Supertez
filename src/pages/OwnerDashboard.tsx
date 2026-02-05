import { useState, useEffect } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';
import { 
  Crown, 
  Users, 
  Car, 
  DollarSign, 
  Settings, 
  CreditCard,
  Shield,
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
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [freeDaysInput, setFreeDaysInput] = useState('');
  const [message, setMessage] = useState('');

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
      if (settingsData) setSettings(settingsData);

      // Load stats
      await loadStats();

      // Load drivers
      await loadDrivers();
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
