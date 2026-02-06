import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Login from './pages/Login';
import Register from './pages/Register';
import UpdatePassword from './pages/UpdatePassword';
import ClientDashboard from './pages/ClientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Subscription from './pages/Subscription';
import AccountSettings from './pages/AccountSettings';
import RideChat from './pages/RideChat';
import SupportChat from './pages/SupportChat';
import Landing from './pages/Landing';
import DriverVerification from './pages/DriverVerification';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { detectCountryCode } from './lib/geo';
import { setLanguageByCountry } from './i18n';

const paypalEnvironmentRaw = import.meta.env.VITE_PAYPAL_ENV;
const paypalEnvironmentNormalized = typeof paypalEnvironmentRaw === 'string'
  ? paypalEnvironmentRaw.trim().toLowerCase()
  : undefined;
const paypalEnvironment: 'sandbox' | 'production' | undefined =
  paypalEnvironmentNormalized === 'sandbox' || paypalEnvironmentNormalized === 'production'
    ? paypalEnvironmentNormalized
    : undefined;
const paypalSdkBase = import.meta.env.VITE_PAYPAL_SDK_BASE;
const resolvedSdkBase = paypalSdkBase || (paypalEnvironment === 'sandbox'
  ? 'https://www.sandbox.paypal.com/sdk/js'
  : undefined);

const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
  currency: import.meta.env.VITE_PAYPAL_CURRENCY || 'USD',
  intent: 'subscription',
  vault: true,
  components: 'buttons,funding-eligibility',
  enableFunding: 'card',
  ...(paypalEnvironment ? { environment: paypalEnvironment } : {}),
  ...(resolvedSdkBase ? { sdkBaseUrl: resolvedSdkBase } : {}),
};

function App() {
  useEffect(() => {
    let isActive = true;

    const detectCountry = async () => {
      try {
        const stored = localStorage.getItem('country_code');
        if (stored) return;
      } catch {
        // ignore storage errors
      }

      const code = await detectCountryCode();
      if (!isActive || !code) return;
      setLanguageByCountry(code);
    };

    detectCountry();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Protected routes with layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            
            {/* Client routes */}
            <Route 
              path="/client" 
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/client/chat/:rideId"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <RideChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/settings"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allowedRoles={['client', 'driver']}>
                  <SupportChat />
                </ProtectedRoute>
              }
            />

            {/* Driver routes */}
            <Route 
              path="/driver" 
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/driver/chat/:rideId"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <RideChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/settings"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/verification"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverVerification />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <Subscription />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Owner routes */}
            <Route 
              path="/owner" 
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;
