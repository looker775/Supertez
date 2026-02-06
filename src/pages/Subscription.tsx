import { useState, useEffect } from 'react';
import { DISPATCH_ACTION, SCRIPT_LOADING_STATE, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { supabase, getUserProfile } from '../lib/supabase';
import { detectCountryCode } from '../lib/geo';
import { formatCurrency, getExchangeRate, normalizeCurrency, resolveCurrencyForCountry, roundAmount } from '../lib/currency';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle,
  Gift,
  Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Subscription {
  id: string;
  driver_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'free';
  is_free_access: boolean;
  free_days_granted: number;
  expires_at: string;
  paypal_subscription_id: string;
  auto_renew: boolean;
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const [{
    isPending,
    isRejected,
  }, paypalDispatch] = usePayPalScriptReducer();
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const paypalConfigured = Boolean(
    paypalClientId &&
    paypalClientId !== 'test' &&
    !paypalClientId.toLowerCase().includes('your_')
  );
  const paypalEnvRaw = import.meta.env.VITE_PAYPAL_ENV;
  const paypalEnv = typeof paypalEnvRaw === 'string'
    ? paypalEnvRaw.trim().toLowerCase()
    : undefined;
  const paypalEnvironment: 'sandbox' | 'production' | undefined =
    paypalEnv === 'sandbox' || paypalEnv === 'production'
      ? paypalEnv
      : undefined;
  const paypalSdkBase =
    import.meta.env.VITE_PAYPAL_SDK_BASE ||
    (paypalEnv === 'sandbox'
      ? 'https://www.sandbox.paypal.com/sdk/js'
      : 'https://www.paypal.com/sdk/js');
  const paypalBaseOptions = {
    clientId: paypalClientId || 'test',
    intent: 'subscription',
    vault: true,
    components: 'buttons,funding-eligibility',
    enableFunding: 'card',
    ...(paypalEnvironment ? { environment: paypalEnvironment } : {}),
    ...(paypalSdkBase ? { sdkBaseUrl: paypalSdkBase } : {}),
  };
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paypalDebug, setPaypalDebug] = useState('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
  const [displayPrice, setDisplayPrice] = useState<number>(2);
  const [currencyNote, setCurrencyNote] = useState<string>('');
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const emailReceiptsEnabled = import.meta.env.VITE_ENABLE_EMAIL_RECEIPTS === 'true';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let active = true;
    const loadCountry = async () => {
      const code = await detectCountryCode();
      if (!active) return;
      setCountryCode(code);
    };
    loadCountry();
    return () => {
      active = false;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      if (!userProfile) {
        setError(t('subscription.errors.load_profile'));
        return;
      }
      setProfile(userProfile);

      // Load subscription
      const { data: subData } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .eq('driver_id', userProfile.id)
        .single();

      if (subData) {
        setSubscription(subData);
      }

      // Load settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!settings) return;

    const baseCurrencyRaw = settings.subscription_currency || settings.currency || 'USD';
    const baseCurrency = typeof baseCurrencyRaw === 'string' ? baseCurrencyRaw.toUpperCase() : 'USD';
    const basePriceValue = Number(settings.driver_subscription_price ?? 2);
    const basePrice = Number.isFinite(basePriceValue) ? basePriceValue : 2;

    setDisplayCurrency(normalizeCurrency(baseCurrency));
    setDisplayPrice(roundAmount(basePrice, normalizeCurrency(baseCurrency)));
    setCurrencyNote('');

    if (!countryCode) return;

    const loadCurrency = async () => {
      setCurrencyLoading(true);
      try {
        const resolved = await resolveCurrencyForCountry(countryCode, baseCurrency);
        const resolvedCurrency = resolved.currency;
        const rate = await getExchangeRate(baseCurrency, resolvedCurrency);
        if (!rate) {
          setCurrencyNote(t('subscription.currency.note', {
            defaultValue: 'Showing base currency because exchange rates are unavailable.',
          }));
          setDisplayCurrency(normalizeCurrency(baseCurrency));
          setDisplayPrice(roundAmount(basePrice, normalizeCurrency(baseCurrency)));
          return;
        }

        const converted = roundAmount(basePrice * rate, resolvedCurrency);
        setDisplayCurrency(resolvedCurrency);
        setDisplayPrice(converted);

        if (resolved.isFallback) {
          setCurrencyNote(t('subscription.currency.unsupported', {
            defaultValue: 'PayPal does not support your local currency. Showing USD instead.',
          }));
        }
      } catch {
        setCurrencyNote(t('subscription.currency.note', {
          defaultValue: 'Showing base currency because exchange rates are unavailable.',
        }));
        setDisplayCurrency(normalizeCurrency(baseCurrency));
        setDisplayPrice(roundAmount(basePrice, normalizeCurrency(baseCurrency)));
      } finally {
        setCurrencyLoading(false);
      }
    };

    loadCurrency();
  }, [settings, countryCode, t]);

  useEffect(() => {
    if (!paypalConfigured || !displayCurrency) return;
    paypalDispatch({
      type: DISPATCH_ACTION.RESET_OPTIONS,
      value: {
        ...paypalBaseOptions,
        currency: displayCurrency,
      },
    });
    paypalDispatch({ type: DISPATCH_ACTION.LOADING_STATUS, value: SCRIPT_LOADING_STATE.PENDING });
  }, [paypalConfigured, displayCurrency, paypalDispatch, paypalClientId, paypalSdkBase, paypalEnvironment]);

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    if (subscription.is_free_access) return true;
    if (subscription.status === 'active' && new Date(subscription.expires_at) > new Date()) {
      return true;
    }
    return false;
  };

  const getDaysRemaining = () => {
    if (!subscription || !subscription.expires_at) return 0;
    const now = new Date();
    const expiry = new Date(subscription.expires_at);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const callPayPalFunction = async (path: string, payload: any) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error || data?.message || 'PayPal request failed';
      throw new Error(message);
    }
    return data;
  };

  const sendSubscriptionEmail = async (expiresAt: Date) => {
    if (!emailReceiptsEnabled) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const payload = {
        type: 'subscription_activated',
        price: settings?.driver_subscription_price || 2,
        currency: settings?.subscription_currency || settings?.currency || 'USD',
        days: settings?.subscription_period_days || 30,
        expiresAt: expiresAt.toISOString(),
      };

      const response = await fetch('/.netlify/functions/send-subscription-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.error || 'Email failed';
        if (message !== 'Email not configured') {
          setPaypalDebug(`email: ${message}`);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'unknown error';
      if (message !== 'Email not configured') {
        setPaypalDebug(`email: ${message}`);
      }
    }
  };

  const createSubscription = async () => {
    if (!profile) throw new Error(t('subscription.errors.load_profile'));

    const payload = {
      customId: profile.id,
      planId: settings?.paypal_plan_id || null,
      countryCode: countryCode || null,
      returnUrl: `${window.location.origin}/subscription?paypal=success`,
      cancelUrl: `${window.location.origin}/subscription?paypal=cancel`,
    };

    try {
      setPaypalDebug('');
      const data = await callPayPalFunction(
        '/.netlify/functions/paypal-create-subscription',
        payload
      );
      return data.id;
    } catch (err: any) {
      const message = err?.message || t('subscription.errors.payment_failed');
      setError(message);
      setPaypalDebug(`createSubscription failed: ${message}`);
      throw err;
    }
  };

  const onApprove = async (data: any) => {
    try {
      setPaypalDebug('');
      const verify = await callPayPalFunction(
        '/.netlify/functions/paypal-verify-subscription',
        { subscriptionId: data.subscriptionID }
      );

      if (!verify?.status || verify.status !== 'ACTIVE') {
        throw new Error(`Subscription status: ${verify?.status || 'unknown'}`);
      }

      const nextBilling = verify?.billing_info?.next_billing_time;
      const expiresAt = nextBilling ? new Date(nextBilling) : new Date();
      if (!nextBilling) {
        expiresAt.setDate(expiresAt.getDate() + (settings?.subscription_period_days || 30));
      }

      // Update subscription in database
      await supabase
        .from('driver_subscriptions')
        .upsert({
          driver_id: profile.id,
          status: 'active',
          paypal_subscription_id: data.subscriptionID,
          is_free_access: false,
          expires_at: expiresAt.toISOString(),
          last_payment_date: new Date().toISOString(),
          last_payment_amount: settings?.driver_subscription_price || 2,
          auto_renew: true,
        });

      setSuccess(t('subscription.messages.activated'));
      sendSubscriptionEmail(expiresAt);
      loadData();
    } catch (err: any) {
      const message = err?.message || t('subscription.errors.payment_failed');
      setError(t('subscription.errors.activate', { message }));
      setPaypalDebug(`onApprove failed: ${message}`);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal Error:', err);
    const message = err?.message || err?.toString?.() || t('subscription.errors.payment_failed');
    setError(message);
    setPaypalDebug(`onError: ${message}`);
  };
  const onCancel = () => {
    setPaypalDebug('Payment cancelled by user.');
  };

  const requestFreeTrial = async () => {
    // This would send a request to admin/owner
    alert(t('subscription.messages.free_trial_requested'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('subscription.title')}</h1>
          <p className="text-sm text-gray-500">{t('subscription.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('subscription.current.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isSubscriptionActive() ? t('subscription.current.active') : t('subscription.current.inactive')}
              </p>
            </div>
            <div className={`p-4 rounded-full ${
              isSubscriptionActive() ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isSubscriptionActive() ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {subscription && isSubscriptionActive() ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{t('subscription.current.status_label')}</span>
                  </div>
                  <p className="text-lg font-semibold capitalize">
                    {subscription.is_free_access
                      ? t('subscription.status.free')
                      : t(`subscription.status.${subscription.status}`, { defaultValue: subscription.status })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{t('subscription.current.days_remaining')}</span>
                  </div>
                  <p className="text-lg font-semibold">{t('subscription.current.days_count', { count: getDaysRemaining() })}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{t('subscription.current.expires_on')}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {subscription.is_free_access && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start space-x-3">
                  <Gift className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-900">{t('subscription.current.free_title')}</p>
                    <p className="text-sm text-purple-700 mt-1">
                      {t('subscription.current.free_desc', { days: subscription.free_days_granted })}
                    </p>
                  </div>
                </div>
              )}

              {subscription.auto_renew && !subscription.is_free_access && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">{t('subscription.current.auto_title')}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {t('subscription.current.auto_desc', { date: new Date(subscription.expires_at).toLocaleDateString() })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('subscription.current.none_title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('subscription.current.none_desc')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans */}
      {!isSubscriptionActive() && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">{t('subscription.subscribe.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('subscription.subscribe.subtitle')}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Pricing Card */}
            <div className="border-2 border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t('subscription.subscribe.plan_title')}</h3>
                  <p className="text-sm text-gray-600">{t('subscription.subscribe.plan_subtitle')}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(displayPrice, displayCurrency)}
                  </p>
                  <p className="text-sm text-gray-500">{t('subscription.subscribe.per_month')}</p>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {t('subscription.subscribe.feature_unlimited', { days: settings?.subscription_period_days || 30 })}
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {t('subscription.subscribe.feature_realtime')}
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {t('subscription.subscribe.feature_custom_offers')}
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {t('subscription.subscribe.feature_auto_renew')}
                </li>
              </ul>

              {/* PayPal Button */}
              <div className="mt-6">
                {!paypalConfigured && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                    {t('subscription.errors.paypal_not_configured', {
                      defaultValue: 'PayPal is not configured. Set VITE_PAYPAL_CLIENT_ID in Netlify and redeploy.',
                    })}
                  </div>
                )}

                <div className="mt-3 text-[11px] text-gray-500 break-all space-y-1">
                  <div>PayPal SDK: {paypalSdkBase}</div>
                  <div>VITE_PAYPAL_ENV: {paypalEnv || 'not set'}</div>
                  <div>VITE_PAYPAL_CLIENT_ID length: {paypalClientId ? paypalClientId.length : 0}</div>
                  <div>Detected country: {countryCode || 'unknown'}</div>
                  <div>Charge currency: {displayCurrency}</div>
                </div>

                {currencyLoading && (
                  <div className="mt-3 text-xs text-gray-600">
                    {t('subscription.currency.loading', { defaultValue: 'Detecting your currency...' })}
                  </div>
                )}

                {currencyNote && (
                  <div className="mt-3 text-xs text-orange-600">
                    {currencyNote}
                  </div>
                )}

                {paypalConfigured && isPending && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">{t('subscription.subscribe.loading_paypal')}</span>
                  </div>
                )}

                {paypalConfigured && isRejected && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {t('subscription.errors.paypal_failed', {
                      defaultValue: 'PayPal failed to load. Check your Client ID, redeploy, or disable ad blockers.',
                    })}
                  </div>
                )}

                {paypalConfigured && !isPending && !isRejected && (
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'subscribe' }}
                    createSubscription={createSubscription}
                    onApprove={onApprove}
                    onError={onError}
                    onCancel={onCancel}
                  />
                )}
              </div>
            </div>

            {/* Request Free Trial */}
            {settings?.enable_free_driver_access && (
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex items-start space-x-3 mb-4">
                  <Gift className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('subscription.free_trial.title')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('subscription.free_trial.subtitle', { days: settings.default_free_days })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={requestFreeTrial}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  {t('subscription.free_trial.button')}
                </button>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                {t('subscription.subscribe.note', { days: settings?.subscription_period_days || 30 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {paypalDebug && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          {paypalDebug}
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4">{t('subscription.faq.title')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('subscription.faq.q1')}</h3>
            <p className="text-sm text-gray-600">
              {t('subscription.faq.a1', { price: settings?.driver_subscription_price || 2, days: settings?.subscription_period_days || 30 })}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('subscription.faq.q2')}</h3>
            <p className="text-sm text-gray-600">
              {t('subscription.faq.a2')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('subscription.faq.q3')}</h3>
            <p className="text-sm text-gray-600">
              {t('subscription.faq.a3')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
