import { useState, useEffect } from 'react';
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
  Filter
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

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('rides');
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      await Promise.all([loadRides(), loadDrivers()]);
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
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'rides', label: t('admin.tabs.rides'), icon: Car },
          { id: 'drivers', label: t('admin.tabs.drivers'), icon: Users },
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
