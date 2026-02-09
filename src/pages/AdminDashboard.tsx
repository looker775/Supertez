import { useState, useEffect, useMemo } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';
import { 
  Shield, 
  Users, 
  Car, 
  DollarSign, 
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  Search,
  Filter,
  CreditCard,
  Save,
  MessageCircle,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Ride {
  id: string;
  client_id: string;
  driver_id: string | null;
  pickup_address: string;
  drop_address: string;
  final_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  client?: { full_name: string; email: string; phone: string };
  driver?: { full_name: string; email: string; phone: string };
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
  subscription_status?: string;
}

interface SupportThread {
  id: string;
  user_id: string;
  user_role: 'client' | 'driver';
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user?: { full_name: string; email: string; phone: string; role: string };
}

interface SupportMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'client' | 'driver' | 'admin' | 'owner';
  message: string;
  created_at: string;
}

interface CrmPair {
  driverId: string;
  clientId: string;
  driverName: string;
  driverPhone?: string;
  clientName: string;
  clientPhone?: string;
  trips: number;
  lastRideAt: string;
  lastStatus: string;
  lastPrice?: number;
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

interface AffiliateRow {
  id: string;
  affiliate_id: string;
  code: string;
  created_at: string;
  affiliate?: { full_name: string; email: string; phone: string };
  driverCount: number;
  lastDriverAt?: string | null;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('rides');
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [freeDaysInput, setFreeDaysInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('all');
  const [supportLoading, setSupportLoading] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [verificationRequests, setVerificationRequests] = useState<DriverVerification[]>([]);
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('pending');
  const [verificationSearch, setVerificationSearch] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [affiliateSearch, setAffiliateSearch] = useState('');

  const filteredSupportThreads = supportThreads.filter((thread) => {
    if (supportStatusFilter !== 'all' && thread.status !== supportStatusFilter) {
      return false;
    }
    if (!supportSearch.trim()) return true;
    const needle = supportSearch.trim().toLowerCase();
    const name = thread.user?.full_name?.toLowerCase() || '';
    const email = thread.user?.email?.toLowerCase() || '';
    const phone = thread.user?.phone?.toLowerCase() || '';
    const role = thread.user_role?.toLowerCase() || '';
    return name.includes(needle) || email.includes(needle) || phone.includes(needle) || role.includes(needle);
  });

  const servedStatuses = useMemo(() => new Set(['driver_assigned', 'driver_arrived', 'in_progress', 'completed']), []);

  const crmPairs = useMemo(() => {
    const map = new Map<string, CrmPair>();
    rides.forEach((ride) => {
      if (!ride.driver_id || !ride.client_id) return;
      if (!servedStatuses.has(ride.status)) return;

      const key = `${ride.driver_id}-${ride.client_id}`;
      const driverName = ride.driver?.full_name || t('common.unknown');
      const clientName = ride.client?.full_name || t('common.unknown');
      const driverPhone = ride.driver?.phone;
      const clientPhone = ride.client?.phone;
      const rideTime = ride.created_at || '';

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          driverId: ride.driver_id,
          clientId: ride.client_id,
          driverName,
          driverPhone,
          clientName,
          clientPhone,
          trips: 1,
          lastRideAt: rideTime,
          lastStatus: ride.status,
          lastPrice: ride.final_price || 0,
        });
        return;
      }

      existing.trips += 1;
      const existingTime = existing.lastRideAt ? new Date(existing.lastRideAt).getTime() : 0;
      const nextTime = rideTime ? new Date(rideTime).getTime() : 0;
      if (nextTime >= existingTime) {
        existing.lastRideAt = rideTime;
        existing.lastStatus = ride.status;
        existing.lastPrice = ride.final_price || existing.lastPrice;
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.lastRideAt ? new Date(a.lastRideAt).getTime() : 0;
      const bTime = b.lastRideAt ? new Date(b.lastRideAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rides, servedStatuses, t]);

  const filteredCrmPairs = useMemo(() => {
    if (!crmSearch.trim()) return crmPairs;
    const needle = crmSearch.trim().toLowerCase();
    return crmPairs.filter((row) => {
      return (
        row.driverName.toLowerCase().includes(needle) ||
        row.clientName.toLowerCase().includes(needle) ||
        (row.driverPhone || '').toLowerCase().includes(needle) ||
        (row.clientPhone || '').toLowerCase().includes(needle)
      );
    });
  }, [crmPairs, crmSearch]);

  const crmStats = useMemo(() => {
    const driversSet = new Set<string>();
    const clientsSet = new Set<string>();
    let totalTrips = 0;
    crmPairs.forEach((row) => {
      driversSet.add(row.driverId);
      clientsSet.add(row.clientId);
      totalTrips += row.trips;
    });
    return {
      drivers: driversSet.size,
      clients: clientsSet.size,
      trips: totalTrips,
    };
  }, [crmPairs]);

  const filteredAffiliates = useMemo(() => {
    if (!affiliateSearch.trim()) return affiliates;
    const needle = affiliateSearch.trim().toLowerCase();
    return affiliates.filter((row) => {
      const name = row.affiliate?.full_name?.toLowerCase() || '';
      const email = row.affiliate?.email?.toLowerCase() || '';
      const phone = row.affiliate?.phone?.toLowerCase() || '';
      const code = row.code?.toLowerCase() || '';
      return name.includes(needle) || email.includes(needle) || phone.includes(needle) || code.includes(needle);
    });
  }, [affiliates, affiliateSearch]);

  const affiliateStats = useMemo(() => {
    const totalAffiliates = affiliates.length;
    const totalDrivers = affiliates.reduce((sum, row) => sum + (row.driverCount || 0), 0);
    return { totalAffiliates, totalDrivers };
  }, [affiliates]);

  const filteredVerifications = useMemo(() => {
    return verificationRequests.filter((item) => {
      if (verificationStatusFilter !== 'all' && item.status !== verificationStatusFilter) {
        return false;
      }
      if (!verificationSearch.trim()) return true;
      const needle = verificationSearch.trim().toLowerCase();
      const driverName = item.driver?.full_name?.toLowerCase() || '';
      const driverEmail = item.driver?.email?.toLowerCase() || '';
      const driverPhone = item.driver?.phone?.toLowerCase() || '';
      const plate = item.plate_number?.toLowerCase() || '';
      const license = item.license_number?.toLowerCase() || '';
      return driverName.includes(needle) || driverEmail.includes(needle) || driverPhone.includes(needle) || plate.includes(needle) || license.includes(needle);
    });
  }, [verificationRequests, verificationSearch, verificationStatusFilter]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedThread?.id) {
      setSupportMessages([]);
      return;
    }
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await loadSupportMessages(selectedThread.id);
      subscription = supabase
        .channel(`support-admin-${selectedThread.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${selectedThread.id}`,
        }, () => {
          loadSupportMessages(selectedThread.id);
          loadSupportThreads();
        })
        .subscribe();
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [selectedThread?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      const { data: settingsData } = await supabase.from('app_settings').select('*').single();
      if (settingsData) setSettings(settingsData);

      await Promise.all([loadRides(), loadDrivers(), loadSupportThreads(), loadVerifications(), loadAffiliates()]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRides = async () => {
    const { data } = await supabase
      .from('rides')
      .select(`
        *,
        client:profiles!client_id(full_name, email, phone),
        driver:profiles!driver_id(full_name, email, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) setRides(data);
  };

  const loadDrivers = async () => {
    const { data: driversData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (driversData) {
      const driversWithSubs = await Promise.all(
        driversData.map(async (driver) => {
          const { data: sub } = await supabase
            .from('driver_subscriptions')
            .select('status')
            .eq('driver_id', driver.id)
            .single();
          return { ...driver, subscription_status: sub?.status };
        })
      );
      setDrivers(driversWithSubs);
    }
  };

  const loadSupportThreads = async () => {
    const { data } = await supabase
      .from('support_threads')
      .select('*, user:profiles!user_id(full_name, email, phone, role)')
      .order('last_message_at', { ascending: false })
      .limit(200);
    if (data) setSupportThreads(data as SupportThread[]);
  };

  const loadSupportMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (data) setSupportMessages(data as SupportMessage[]);
  };

  const loadVerifications = async () => {
    const { data } = await supabase
      .from('driver_verifications')
      .select('*, driver:profiles!driver_id(full_name, email, phone, city)')
      .order('submitted_at', { ascending: false })
      .limit(200);
    if (data) setVerificationRequests(data as DriverVerification[]);
  };

  const loadAffiliates = async () => {
    const { data: codes, error } = await supabase
      .from('affiliate_codes')
      .select('*, affiliate:profiles!affiliate_id(full_name, email, phone)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('Failed to load affiliates:', error);
      setAffiliates([]);
      return;
    }

    const { data: driversData } = await supabase
      .from('profiles')
      .select('id, affiliate_code, created_at')
      .eq('role', 'driver')
      .not('affiliate_code', 'is', null);

    const stats = new Map<string, { count: number; lastAt?: string | null }>();
    (driversData || []).forEach((driver: any) => {
      const code = driver.affiliate_code;
      if (!code) return;
      const current = stats.get(code) || { count: 0, lastAt: null };
      current.count += 1;
      if (!current.lastAt || (driver.created_at && new Date(driver.created_at).getTime() > new Date(current.lastAt).getTime())) {
        current.lastAt = driver.created_at;
      }
      stats.set(code, current);
    });

    const rows = (codes || []).map((row: any) => {
      const stat = stats.get(row.code) || { count: 0, lastAt: null };
      return {
        ...row,
        driverCount: stat.count,
        lastDriverAt: stat.lastAt,
      } as AffiliateRow;
    });

    setAffiliates(rows);
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

  const updateSupportThreadStatus = async (threadId: string, status: 'open' | 'closed') => {
    await supabase
      .from('support_threads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);
    await loadSupportThreads();
    if (selectedThread?.id === threadId) {
      setSelectedThread((prev) => (prev ? { ...prev, status } : prev));
    }
  };

  const sendSupportMessage = async () => {
    if (!profile?.id || !selectedThread || !supportInput.trim()) return;
    setSupportLoading(true);
    try {
      const message = supportInput.trim();
      const { error: insertError } = await supabase
        .from('support_messages')
        .insert({
          thread_id: selectedThread.id,
          sender_id: profile.id,
          sender_role: profile.role,
          message,
        });
      if (insertError) throw insertError;

      await supabase
        .from('support_threads')
        .update({
          status: 'open',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedThread.id);

      setSupportInput('');
      await loadSupportMessages(selectedThread.id);
      await loadSupportThreads();
    } catch (err) {
      console.error('Failed to send support message:', err);
    } finally {
      setSupportLoading(false);
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.drop_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      driver_assigned: 'bg-blue-100 text-blue-800',
      driver_arrived: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const updateSettings = async () => {
    const canEditPricing = profile?.role === 'owner' || profile?.admin_can_edit_pricing;
    const canManageSubscriptions = profile?.role === 'owner' || profile?.admin_can_manage_subscriptions;

    if (!canEditPricing && !canManageSubscriptions) {
      setMessage(t('common.error_prefix', { message: 'You do not have permission to update settings.' }));
      return;
    }

    setSaving(true);
    try {
      const updatePayload: Record<string, any> = {};
      if (canEditPricing) {
        updatePayload.pricing_mode = settings.pricing_mode;
        updatePayload.fixed_price_amount = parseFloat(settings.fixed_price_amount);
        updatePayload.price_per_km = parseFloat(settings.price_per_km);
        updatePayload.currency = settings.currency;
      }
      if (canManageSubscriptions) {
        updatePayload.require_driver_subscription = settings.require_driver_subscription;
        updatePayload.driver_subscription_price = parseFloat(settings.driver_subscription_price);
        updatePayload.subscription_period_days = parseInt(settings.subscription_period_days);
        updatePayload.enable_free_driver_access = settings.enable_free_driver_access;
        updatePayload.default_free_days = parseInt(settings.default_free_days);
      }

      const { error } = await supabase
        .from('app_settings')
        .update(updatePayload)
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
          free_access_reason: 'Granted by admin',
          expires_at: expiresAt.toISOString(),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const canEditPricing = profile?.role === 'owner' || profile?.admin_can_edit_pricing;
  const canManageSubscriptions = profile?.role === 'owner' || profile?.admin_can_manage_subscriptions;
  const canGrantFreeAccess = profile?.role === 'owner' || profile?.admin_can_grant_free_access;
  const showSettingsTab = Boolean(canEditPricing || canManageSubscriptions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin.subtitle')}</p>
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
          { id: 'rides', label: t('admin.tabs.rides'), icon: Car },
          { id: 'drivers', label: t('admin.tabs.drivers'), icon: Users },
          { id: 'crm', label: t('admin.tabs.crm', { defaultValue: 'CRM' }), icon: BarChart3 },
          { id: 'affiliates', label: t('admin.tabs.affiliates', { defaultValue: 'Affiliates' }), icon: Users },
          { id: 'verifications', label: t('admin.tabs.verifications', { defaultValue: 'Verifications' }), icon: ShieldCheck },
          { id: 'support', label: t('support.inbox'), icon: MessageCircle },
          ...(showSettingsTab ? [{ id: 'settings', label: t('owner.tabs.settings'), icon: Settings }] : []),
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

      {/* Rides Tab */}
      {activeTab === 'rides' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admin.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">{t('admin.status_all')}</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="driver_assigned">{t('status.driver_assigned')}</option>
                <option value="in_progress">{t('status.in_progress')}</option>
                <option value="completed">{t('status.completed')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
          </div>

          {/* Rides Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.id')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.route')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.client')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.driver')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {ride.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center text-green-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-xs">{ride.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-red-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-xs">{ride.drop_address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium">{ride.client?.full_name || t('common.unknown')}</p>
                        <p className="text-gray-500">{ride.client?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ride.driver ? (
                        <div className="text-sm">
                          <p className="font-medium">{ride.driver.full_name}</p>
                          <p className="text-gray-500">{ride.driver.phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">{t('admin.not_assigned')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">${ride.final_price || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                        {t(`status.${ride.status}`, { defaultValue: ride.status.replace('_', ' ') })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(ride.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">{t('admin.driver_management')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.drivers_table.driver')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.drivers_table.contact')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.drivers_table.city')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.drivers_table.joined')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.drivers_table.status')}</th>
                  {canGrantFreeAccess && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('owner.drivers_table.actions')}</th>
                  )}
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {driver.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {driver.city || t('common.unknown')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(driver.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        driver.subscription_status === 'active' || driver.subscription_status === 'free'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.subscription_status ? t(`subscription.status.${driver.subscription_status}`, { defaultValue: driver.subscription_status }) : t('subscription.status.inactive')}
                      </span>
                    </td>
                    {canGrantFreeAccess && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedDriver(driver)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          {t('owner.actions.grant_free')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRM Tab */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-slate-500">{t('admin.crm.total_trips', { defaultValue: 'Total trips served' })}</p>
              <p className="text-2xl font-bold text-slate-900">{crmStats.trips}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-slate-500">{t('admin.crm.unique_drivers', { defaultValue: 'Active drivers' })}</p>
              <p className="text-2xl font-bold text-slate-900">{crmStats.drivers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-slate-500">{t('admin.crm.unique_clients', { defaultValue: 'Clients served' })}</p>
              <p className="text-2xl font-bold text-slate-900">{crmStats.clients}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder={t('admin.crm.search_placeholder', { defaultValue: 'Search driver or client' })}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.driver', { defaultValue: 'Driver' })}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.client', { defaultValue: 'Client' })}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.trips', { defaultValue: 'Trips' })}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.last_ride', { defaultValue: 'Last ride' })}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.status', { defaultValue: 'Status' })}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.crm.table.price', { defaultValue: 'Last price' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCrmPairs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-sm text-gray-500">
                        {t('admin.crm.empty', { defaultValue: 'No completed rides yet.' })}
                      </td>
                    </tr>
                  )}
                  {filteredCrmPairs.map((row) => (
                    <tr key={`${row.driverId}-${row.clientId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{row.driverName}</div>
                        <div className="text-xs text-gray-500">{row.driverPhone || t('common.not_available')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{row.clientName}</div>
                        <div className="text-xs text-gray-500">{row.clientPhone || t('common.not_available')}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.trips}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.lastRideAt ? new Date(row.lastRideAt).toLocaleString() : t('common.not_available')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.lastStatus)}`}>
                          {t(`status.${row.lastStatus}`, { defaultValue: row.lastStatus.replace('_', ' ') })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.lastPrice ? `${settings?.currency || 'USD'} ${row.lastPrice}` : t('common.not_available')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('admin.affiliates.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('admin.affiliates.subtitle')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-slate-500">{t('admin.affiliates.total_affiliates')}</p>
              <p className="text-2xl font-bold text-slate-900">{affiliateStats.totalAffiliates}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-slate-500">{t('admin.affiliates.total_drivers')}</p>
              <p className="text-2xl font-bold text-slate-900">{affiliateStats.totalDrivers}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={affiliateSearch}
                    onChange={(e) => setAffiliateSearch(e.target.value)}
                    placeholder={t('admin.affiliates.search_placeholder')}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.affiliates.table.affiliate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.affiliates.table.code')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.affiliates.table.drivers')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.affiliates.table.last_signup')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.affiliates.table.contact')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAffiliates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-sm text-gray-500">
                        {t('admin.affiliates.empty')}
                      </td>
                    </tr>
                  )}
                  {filteredAffiliates.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {row.affiliate?.full_name || t('common.unknown')}
                        </div>
                        <div className="text-xs text-gray-500">{row.affiliate?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{row.code}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.driverCount || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.lastDriverAt ? new Date(row.lastDriverAt).toLocaleDateString() : t('common.not_available')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.affiliate?.phone || row.affiliate?.email || t('common.not_available')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  placeholder={t('admin.verifications.search_placeholder', { defaultValue: 'Search driver, plate, license' })}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <select
                value={verificationStatusFilter}
                onChange={(e) => setVerificationStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="all">{t('admin.verifications.status_all', { defaultValue: 'All' })}</option>
                <option value="pending">{t('admin.verifications.status_pending', { defaultValue: 'Pending' })}</option>
                <option value="approved">{t('admin.verifications.status_approved', { defaultValue: 'Approved' })}</option>
                <option value="rejected">{t('admin.verifications.status_rejected', { defaultValue: 'Rejected' })}</option>
              </select>
            </div>
            <input
              type="text"
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder={t('admin.verifications.note_placeholder', { defaultValue: 'Optional note for approval/rejection' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                    <td colSpan={5} className="px-6 py-6 text-sm text-gray-500">
                      {t('admin.verifications.empty', { defaultValue: 'No verification requests.' })}
                    </td>
                  </tr>
                )}
                {filteredVerifications.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.driver?.full_name || t('common.unknown')}</div>
                      <div className="text-xs text-gray-500">{item.driver?.phone || item.driver?.email || t('common.not_available')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">{item.id_document_type}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => openVerificationDoc(item.id_document_front_path)}
                          className="text-xs px-3 py-1 border rounded-lg"
                        >
                          {t('admin.verifications.view_id_front', { defaultValue: 'ID Front' })}
                        </button>
                        {item.id_document_back_path && (
                          <button
                            onClick={() => openVerificationDoc(item.id_document_back_path)}
                            className="text-xs px-3 py-1 border rounded-lg"
                          >
                            {t('admin.verifications.view_id_back', { defaultValue: 'ID Back' })}
                          </button>
                        )}
                        <button
                          onClick={() => openVerificationDoc(item.license_photo_path)}
                          className="text-xs px-3 py-1 border rounded-lg"
                        >
                          {t('admin.verifications.view_license', { defaultValue: 'License' })}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{t('admin.verifications.plate', { defaultValue: 'Plate' })}: {item.plate_number}</div>
                      <div>{t('admin.verifications.license_number', { defaultValue: 'License' })}: {item.license_number}</div>
                      <div>{t('admin.verifications.license_class', { defaultValue: 'Class' })}: {item.license_class}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => updateVerificationStatus(item, 'approved')}
                          disabled={verificationLoading}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                        >
                          {t('admin.verifications.approve', { defaultValue: 'Approve' })}
                        </button>
                        <button
                          onClick={() => updateVerificationStatus(item, 'rejected')}
                          disabled={verificationLoading}
                          className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-700 disabled:opacity-50"
                        >
                          {t('admin.verifications.reject', { defaultValue: 'Reject' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="border-r p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  placeholder={t('support.search_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <select
                value={supportStatusFilter}
                onChange={(e) => setSupportStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">{t('support.status_all')}</option>
                <option value="open">{t('support.status_open')}</option>
                <option value="closed">{t('support.status_closed')}</option>
              </select>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredSupportThreads.length === 0 && (
                  <div className="text-sm text-gray-500">{t('support.no_threads')}</div>
                )}
                {filteredSupportThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left border rounded-lg p-3 transition ${
                      selectedThread?.id === thread.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {thread.user?.full_name || t('support.unknown_user')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        thread.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {thread.status === 'open' ? t('support.open') : t('support.closed')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {thread.user?.email || thread.user?.phone || thread.user_role}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 p-4 flex flex-col">
              {!selectedThread && (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                  {t('support.select_thread')}
                </div>
              )}

              {selectedThread && (
                <>
                  <div className="flex items-center justify-between gap-3 border-b pb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedThread.user?.full_name || t('support.unknown_user')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedThread.user?.email || selectedThread.user?.phone || selectedThread.user_role}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedThread.status === 'open' ? (
                        <button
                          onClick={() => updateSupportThreadStatus(selectedThread.id, 'closed')}
                          className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          {t('support.close')}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSupportThreadStatus(selectedThread.id, 'open')}
                          className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {t('support.reopen')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 py-4">
                    {supportMessages.length === 0 && (
                      <div className="text-sm text-gray-500">{t('support.no_messages')}</div>
                    )}
                    {supportMessages.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'owner';
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="text-[11px] opacity-70 mb-1">
                              {isAdmin ? t('support.you') : t('support.user')}
                            </div>
                            <div>{msg.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-3 flex items-center gap-2">
                    <input
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      placeholder={t('support.placeholder')}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={sendSupportMessage}
                      disabled={supportLoading || !supportInput.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {supportLoading ? t('common.sending') : t('support.send')}
                    </button>
                  </div>
                </>
              )}
            </div>
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

            {!canEditPricing && (
              <div className="text-sm text-orange-600">
                {t('owner.admins.permissions.pricing', { defaultValue: 'You do not have permission to edit pricing.' })}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.pricing.mode')}</label>
                <select
                  value={settings.pricing_mode}
                  onChange={(e) => setSettings({ ...settings, pricing_mode: e.target.value })}
                  disabled={!canEditPricing}
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
                  disabled={!canEditPricing}
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
                    disabled={!canEditPricing}
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
                    disabled={!canEditPricing}
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

            {!canManageSubscriptions && (
              <div className="text-sm text-orange-600">
                {t('owner.admins.permissions.subscriptions', { defaultValue: 'You do not have permission to edit subscriptions.' })}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="admin_require_subscription"
                  checked={settings.require_driver_subscription}
                  onChange={(e) => setSettings({ ...settings, require_driver_subscription: e.target.checked })}
                  disabled={!canManageSubscriptions}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="admin_require_subscription" className="ml-2 text-sm font-medium text-gray-700">
                  {t('owner.settings.subscription.require')}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.price')}</label>
                <input
                  type="number"
                  value={settings.driver_subscription_price}
                  onChange={(e) => setSettings({ ...settings, driver_subscription_price: e.target.value })}
                  disabled={!canManageSubscriptions}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.period_days')}</label>
                <input
                  type="number"
                  value={settings.subscription_period_days}
                  onChange={(e) => setSettings({ ...settings, subscription_period_days: e.target.value })}
                  disabled={!canManageSubscriptions}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner.settings.subscription.default_free_days')}</label>
                <input
                  type="number"
                  value={settings.default_free_days}
                  onChange={(e) => setSettings({ ...settings, default_free_days: e.target.value })}
                  disabled={!canManageSubscriptions}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
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

      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="h-8 w-8 text-purple-600" />
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
