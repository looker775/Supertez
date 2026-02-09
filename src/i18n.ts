import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


const COUNTRY_LANGUAGE_MAP: Record<string, string | string[]> = {
  KZ: 'ru',
  RU: 'ru',
  BY: 'ru',
  US: 'en',
  GB: 'en',
  UK: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  ZA: 'en',
  AE: ['ar', 'en'],
  KR: 'ko',
  JP: 'ja',
  SA: 'ar',
  DZ: 'ar',
  MA: ['ar', 'fr', 'en'],
  JO: 'ar',
  ES: 'es',
  PT: 'pt',
  BR: 'pt',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',
  LU: 'de',
  SE: 'sv',
  FR: 'fr',
  AR: 'es',
  BO: 'es',
  CL: 'es',
  CO: 'es',
  EC: 'es',
  PY: 'es',
  PE: 'es',
  UY: 'es',
  VE: 'es',
  GF: 'fr',
  GY: 'en',
  SR: 'en',
  FK: 'en',
};

const EUROPE_COUNTRY_CODES = [
  'AL','AD','AT','BE','BA','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IS','IT','LT','LU','LV','MC','MD','ME','MK','MT','NL','NO','PL','PT','RO','RS','SE','SI','SK','SM','TR','UA','VA','XK','GE','AM','AZ','LI'
];

EUROPE_COUNTRY_CODES.forEach((code) => {
  if (!COUNTRY_LANGUAGE_MAP[code]) {
    COUNTRY_LANGUAGE_MAP[code] = 'en';
  }
});

const LANGUAGE_OVERRIDE_KEY = 'language_override';

function resolveCountryLanguage(code: string) {
  const entry = COUNTRY_LANGUAGE_MAP[code];
  if (!entry) return undefined;
  if (Array.isArray(entry)) {
    const browserLang = (navigator.language || '').split('-')[0];
    if (browserLang && entry.includes(browserLang)) {
      return browserLang;
    }
    const current = (i18n.resolvedLanguage || i18n.language || '').split('-')[0];
    if (current && entry.includes(current)) {
      return current;
    }
    return entry[0];
  }
  return entry;
}

export function setLanguageByCountry(countryCode?: string, options?: { force?: boolean }) {
  if (!countryCode) return;
  const code = countryCode.toUpperCase();
  const lang = resolveCountryLanguage(code);
  if (!lang) return;
  try {
    localStorage.setItem('country_code', code);
  } catch {
    // ignore storage errors
  }
  try {
    if (!options?.force && localStorage.getItem(LANGUAGE_OVERRIDE_KEY) === '1') {
      return;
    }
  } catch {
    // ignore storage errors
  }
  const current = (i18n.resolvedLanguage || i18n.language || '').split('-')[0];
  if (current !== lang) {
    i18n.changeLanguage(lang);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    supportedLngs: ['en', 'ru', 'es', 'pt', 'fr', 'de', 'sv', 'ko', 'ja', 'ar'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          slogan: 'Faster than bus, cheaper than taxi',
          welcome: 'Welcome to Supertez',


          book_ride: 'Book a Ride',
          pickup: 'Pickup Location',
          dropoff: 'Dropoff Location',
          passengers: 'Passengers',
          price: 'Price',
          book_now: 'Order Now',
          driver_dashboard: 'Driver Dashboard',
          admin_settings: 'Admin Settings',
          role: 'Role',
          email: 'Email',
          password: 'Password',
          full_name: 'Full Name',
          logout: 'Logout',
          pending_rides: 'Pending Rides',
          accept: 'Accept',
          pricing_mode: 'Pricing Mode',
          fixed_price: 'Fixed Price',
          per_km: 'Per KM',
          update_settings: 'Update Settings',
          distance: 'Distance',
          forgot_password: 'Forgot Password?',
          send_reset_link: 'Send Reset Link',
          reset_link_sent: 'Check your email for the reset link.',

          new_password: 'New Password',
          back_to_login: 'Back to Login',
          detecting_location: 'Detecting Location...',
          subscription_required: 'Subscription Required',
          subscription_desc: 'To accept rides, you must have an active subscription.',
          subscribe_now: 'Subscribe Now',
          subscription_price: 'Subscription Price',
          driver_settings: 'Driver Settings',
          require_subscription: 'Require Driver Subscription',
          manage_drivers: 'Manage Drivers',
          grant_access: 'Grant Free Access',
          days: 'Days',
          expires_at: 'Expires At',
          pay_with_paypal: 'Pay with PayPal',
          admin_portal: 'Admin Portal',
          admin_login: 'Admin Login',
          admin_registration: 'Admin Registration',
          management: 'Management',
          already_admin: 'Already an Admin?',
          need_admin: 'Need Admin Access?',
          have_account: 'Have an account?',
          no_account: 'No account?',
          passenger: 'Passenger',

          common: {
            saving: 'Saving...',
            updating: 'Updating...',
            sending: 'Sending...',
            processing: 'Processing...',
            find: 'Find',
            change: 'Change',
            hide: 'Hide',
            cancel: 'Cancel',
            refresh: 'Refresh',
            support: 'Support',
            error_prefix: 'Error: {{message}}',
            unknown: 'Unknown',
            not_available: 'N/A'
          },
          nav: {
            dashboard: 'Dashboard',
            admin: 'Admin',
            settings: 'Settings',
            subscription: 'Subscription',
            affiliate: 'Bloggers',
            affiliate_dashboard: 'Blogger CRM'
          },
          landing: {
            loading: 'Loading...',
            badge: 'City ride network',
            hero_title: 'Supertez moves your city with trusted drivers.',
            hero_subtitle: 'Request a ride in seconds or earn more as a verified driver. Real-time tracking, transparent pricing, and support built in.',
            cta_primary: 'Get started',
            cta_secondary: 'Sign in',
            hero_point_one: 'Transparent pricing',
            hero_point_two: 'Verified drivers',
            hero_point_three: 'Instant support',
            panel_title: 'Live dispatch',
            panel_subtitle: 'Always in control',
            panel_badge: 'Realtime',
            panel_item_one: 'Smart pickup locking',
            panel_item_one_sub: 'GPS + IP fallback keeps requests local.',
            panel_item_two: 'Driver verification',
            panel_item_two_sub: 'Subscriptions and approvals keep quality high.',
            panel_item_three: 'ETA & tracking',
            panel_item_three_sub: 'Clients see driver movement in real time.',
            panel_item_four: 'Support built in',
            panel_item_four_sub: 'Client + driver chat with admin anytime.',
            feature_one_title: 'Client experience',
            feature_one_body: 'Find rides fast, share live location, and pay transparently.',
            feature_two_title: 'Driver growth',
            feature_two_body: 'Subscriptions, free trials, and earnings visibility in one place.',
            feature_three_title: 'Admin control',
            feature_three_body: 'Pricing, approvals, CRM, and support inboxes managed centrally.',
            affiliate_title: 'Blogger program',
            affiliate_subtitle: 'Get a unique driver signup link and track your referrals in a CRM dashboard.',
            affiliate_cta: 'Open blogger page',
            affiliate_login: 'Blogger login',
            cta_title: 'Ready to launch your next ride?',
            cta_subtitle: 'Join Supertez and keep riders and drivers in sync.'
          },
          support: {
            title: 'Support',
            subtitle: 'Chat with admin if you need help.',
            back: 'Back',
            inbox: 'Support Inbox',
            search_placeholder: 'Search by name or email...',
            status_all: 'All',
            status_open: 'Open',
            status_closed: 'Closed',
            open: 'Open',
            closed: 'Closed',
            close: 'Close',
            reopen: 'Reopen',
            select_thread: 'Select a conversation',
            no_threads: 'No support requests yet.',
            no_messages: 'No messages yet.',
            placeholder: 'Type your message...',
            send: 'Send',
            thread_title: 'Support chat',
            admin: 'Admin',
            user: 'User',
            you: 'You',
            unknown_user: 'Unknown user',
            errors: {
              load_failed: 'Failed to load support chat.',
              send_failed: 'Failed to send message.',
              no_access: 'Support chat is available for drivers and clients only.'
            }
          },
          roles: {
            owner: 'Owner',
            admin: 'Admin',
            driver: 'Driver',
            affiliate: 'Blogger',
            client: 'Client'
          },
          payment: {
            cash: 'Cash',
            card: 'Card'
          },
          status: {
            pending: 'Pending',
            driver_assigned: 'Driver Assigned',
            driver_arrived: 'Driver Arrived',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled'
          },
          subscription: {
            title: 'Subscription',
            subtitle: 'Manage your driver subscription',
            current: {
              title: 'Current Status',
              active: 'Your subscription is active',
              inactive: 'No active subscription',
              status_label: 'Status',
              days_remaining: 'Days Remaining',
              days_count: '{{count}} days',
              expires_on: 'Expires On',
              free_title: 'Free Access Granted',
              free_desc: 'You have been granted {{days}} days of free access by the admin.',
              auto_title: 'Auto-Renewal Active',
              auto_desc: 'Your subscription will automatically renew on {{date}}.',
              none_title: 'No Active Subscription',
              none_desc: 'Subscribe now to start receiving ride requests from clients.'
            },
            subscribe: {
              title: 'Subscribe Now',
              subtitle: 'Choose a plan to start receiving ride requests',
              plan_title: 'Driver Subscription',
              plan_subtitle: 'Full access to ride requests',
              per_month: 'per month',
              feature_unlimited: 'Unlimited ride requests for {{days}} days',
              feature_realtime: 'Real-time notifications for new rides',
              feature_custom_offers: 'Send custom price offers to clients',
              feature_auto_renew: 'Auto-renewal option available',
              loading_paypal: 'Loading PayPal...',
              note: 'Note: Your subscription will automatically renew every {{days}} days. You can cancel at any time from your PayPal account.'
            },
            free_trial: {
              title: 'Need More Time to Decide?',
              subtitle: 'Request {{days}} days of free access to try the platform',
              button: 'Request Free Trial'
            },
            faq: {
              title: 'Frequently Asked Questions',
              q1: 'How does the subscription work?',
              a1: 'Pay ${{price}} monthly via PayPal to receive unlimited ride requests for {{days}} days.',
              q2: 'Can I cancel anytime?',
              a2: 'Yes! You can cancel your subscription at any time through your PayPal account. You\'ll continue to have access until your current period ends.',
              q3: 'What happens if my subscription expires?',
              a3: 'You won\'t receive new ride requests until you renew your subscription. Your account remains active.'
            },
            messages: {
              activated: 'Subscription activated successfully!',
              free_trial_requested: 'Free trial request sent to admin. You will be notified once approved.'
            },
            errors: {
              load_profile: 'Failed to load profile',
              activate: 'Error activating subscription: {{message}}',
              payment_failed: 'Payment failed. Please try again.'
            },
            status: {
              active: 'Active',
              free: 'Free Access',
              expired: 'Expired',
              cancelled: 'Cancelled',
              inactive: 'Inactive',
              none: 'No Subscription'
            },
            currency: {
              loading: 'Detecting your currency...',
              note: 'Showing base currency because exchange rates are unavailable.',
              unsupported: 'PayPal does not support your local currency. Charging in {{currency}}.',
              local_equivalent: '≈ {{amount}} in your local currency'
            }
          },
          login: {
            reset_title: 'Reset Password',
            reset_subtitle: 'Enter your email to receive a reset link',
            email_label: 'Email Address',
            email_placeholder: 'your@email.com',
            send_reset_link: 'Send Reset Link',
            back_to_login: 'Back to Login',
            title: 'Welcome to Supertez',
            subtitle: 'Sign in to your account',
            password_label: 'Password',
            password_placeholder: '••••••••',
            hide_password: 'Hide password',
            show_password: 'Show password',
            remember_me: 'Remember me',
            forgot_password: 'Forgot password?',
            signing_in: 'Signing in...',
            sign_in: 'Sign In',
            no_account: 'Don\'t have an account?',
            sign_up: 'Sign up',
            demo: 'Demo credentials: Use {{email}} for owner access',
            reset_success: 'Password reset email sent! Check your inbox.',
            errors: {
              no_user: 'No user data returned',
              sign_in_failed: 'Failed to sign in. Please check your credentials.',
              reset_failed: 'Failed to send reset email'
            }
          },
          register: {
            title: 'Create Account',
            subtitle: 'Join Supertez today',
            role_label: 'I want to',
            role_client: 'Get a Ride',
            role_driver: 'Drive & Earn',
            full_name: 'Full Name',
            full_name_placeholder: 'John Doe',
            email: 'Email',
            email_placeholder: 'you@example.com',
            phone_label: 'Phone Number (required for clients & drivers)',
            phone_placeholder: '+7 700 123 4567',
            city: 'City',
            city_placeholder: 'Almaty',
            password: 'Password',
            confirm_password: 'Confirm Password',
            submit: 'Create Account',
            have_account: 'Already have an account?',
            sign_in: 'Sign in',
            success_alert: 'Registration successful! Please check your email to verify your account, then login.',
            errors: {
              phone_required: 'Phone number is required for clients and drivers',
              password_mismatch: 'Passwords do not match',
              password_length: 'Password must be at least 6 characters',
              register_failed: 'Failed to register'
            }
          },
          update_password: {
            title: 'Set New Password',
            subtitle: 'Enter your new password below',
            new_password: 'New Password',
            confirm_password: 'Confirm Password',
            password_placeholder: '••••••••',
            hide_password: 'Hide password',
            show_password: 'Show password',
            hide_confirm_password: 'Hide confirm password',
            show_confirm_password: 'Show confirm password',
            min_length: 'At least 6 characters',
            update_button: 'Update Password',
            success_title: 'Password Updated!',
            success_subtitle: 'Your password has been successfully updated.',
            redirecting: 'Redirecting to login...',
            errors: {
              invalid_link: 'Invalid or expired reset link. Please request a new one.',
              password_length: 'Password must be at least 6 characters long',
              password_mismatch: 'Passwords do not match',
              update_failed: 'Failed to update password'
            }
          },
          auth: {
            phone_label: 'Phone (required for clients & drivers)',
            messages: {
              account_created: 'Account created! Logging you in...'
            },
            errors: {
              phone_required: 'Phone number is required for clients and drivers.',
              login_after_register_failed: 'Account created but login failed. Please login manually.'
            },
            placeholders: {
              full_name: 'John Doe',
              phone: '+7 700 123 4567',
              email: 'email@example.com'
            }
          },
          account: {
            title: 'Account Settings',
            subtitle: 'Manage your profile, email, and password.',
            profile: {
              title: 'Profile',
              uploading: 'Uploading...',
              upload_photo: 'Upload photo',
              full_name: 'Full name',
              phone: 'Phone',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'Photo URL (optional)',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: 'Save Profile'
            },
            email: {
              title: 'Email',
              current: 'Current email',
              new: 'New email',
              placeholder: 'new@email.com',
              note: 'If email confirmation is enabled in Supabase, you will receive a confirmation email.',
              update: 'Update Email'
            },
            password: {
              title: 'Password',
              new: 'New password',
              confirm: 'Confirm password',
              placeholder: '••••••••',
              update: 'Update Password'
            },
            messages: {
              profile_updated: 'Profile updated.',
              email_update_requested: 'Email update requested. If confirmation is enabled, check your inbox.',
              password_updated: 'Password updated.',
              photo_updated: 'Photo updated.'
            },
            errors: {
              login_required: 'Please login again to manage your account.',
              phone_required: 'Phone number is required for clients and drivers.',
              profile_update_failed: 'Failed to update profile.',
              email_empty: 'Email cannot be empty.',
              email_update_failed: 'Failed to update email.',
              password_length: 'Password must be at least 6 characters.',
              password_mismatch: 'Passwords do not match.',
              password_update_failed: 'Failed to update password.',
              avatar_url_failed: 'Could not get public URL for avatar.',
              photo_upload_failed: 'Failed to upload photo. Ensure the avatars bucket exists and has public read policies.'
            }
          },
          admin: {
            title: 'Admin Dashboard',
            subtitle: 'Manage rides and drivers',
            tabs: {
              rides: 'All Rides',
              drivers: 'Drivers',
              crm: 'CRM',
              affiliates: 'Affiliates',
              verifications: 'Verifications'
            },
            affiliates: {
              title: 'Affiliate CRM',
              subtitle: 'Track bloggers and driver registrations.',
              total_affiliates: 'Total affiliates',
              total_drivers: 'Drivers referred',
              search_placeholder: 'Search affiliates...',
              table: {
                affiliate: 'Affiliate',
                code: 'Code',
                drivers: 'Drivers',
                last_signup: 'Last signup',
                contact: 'Contact'
              },
              empty: 'No affiliates yet.'
            },
            search_placeholder: 'Search rides...',
            status_all: 'All Statuses',
            table: {
              id: 'ID',
              route: 'Route',
              client: 'Client',

              price: 'Price',
              status: 'Status',
              date: 'Date'
            },
            not_assigned: 'Not assigned',
            driver_management: 'Driver Management',
            drivers_table: {

              contact: 'Contact',
              city: 'City',
              joined: 'Joined',
              status: 'Status'
            },
            crm: {
              title: 'CRM Overview',
              search_placeholder: 'Search driver or client',
              total_trips: 'Total trips served',
              unique_drivers: 'Active drivers',
              unique_clients: 'Clients served',
              empty: 'No completed rides yet.',
              table: {
                driver: 'Driver',
                client: 'Client',
                trips: 'Trips',
                last_ride: 'Last ride',
                status: 'Status',
                price: 'Last price'
              }
            },
            verifications: {
              title: 'Driver verification',
              search_placeholder: 'Search driver, plate, license',
              status_all: 'All',
              status_pending: 'Pending',
              status_approved: 'Approved',
              status_rejected: 'Rejected',
              note_placeholder: 'Optional note for approval/rejection',
              empty: 'No verification requests.',
              table: {
                driver: 'Driver',
                docs: 'Documents',
                vehicle: 'Vehicle',
                status: 'Status',
                actions: 'Actions'
              },
              approve: 'Approve',
              reject: 'Reject',
              view_id_front: 'ID Front',
              view_id_back: 'ID Back',
              view_license: 'License',
              plate: 'Plate',
              license_number: 'License',
              license_class: 'Class'
            }
          },
          owner: {
            title: 'Owner Dashboard',
            welcome: 'Welcome back, {{name}}',
            tabs: {
              overview: 'Overview',
              drivers: 'Drivers',
              settings: 'Settings',
              finance: 'Finance'
            },
            stats: {
              total_rides: 'Total Rides',
              total_revenue: 'Total Revenue',
              active_drivers: 'Active Drivers',
              total_clients: 'Total Clients'
            },
            driver_management: {
              title: 'Driver Management',
              subtitle: 'Manage driver subscriptions and access'
            },
            drivers_table: {

              location: 'Location',
              status: 'Status',
              expires: 'Expires',
              actions: 'Actions'
            },
            actions: {
              grant_free: 'Grant Free',
              revoke: 'Revoke'
            },
            settings: {
              title: 'App Settings',
              pricing: {
                title: 'Pricing Settings',
                mode: 'Pricing Mode',
                fixed: 'Fixed Price',
                per_km: 'Per Kilometer',
                currency: 'Currency',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Fixed Price Amount',
                per_km_amount: 'Price per KM'
              },
              subscription: {
                title: 'Driver Subscription',
                require: 'Require subscription for drivers',
                price: 'Subscription Price',
                period_days: 'Period (Days)',
                default_free_days: 'Default Free Days'
              },
              paypal: {
                title: 'PayPal Configuration',
                client_id: 'PayPal Client ID',
                placeholder: 'Enter your PayPal Client ID'
              },
              save: 'Save Settings'
            },
            finance: {
              title: 'Financial Overview',
              coming_soon: 'Detailed financial reports coming soon...',
              total_revenue: 'Total Revenue: ${{amount}}'
            },
            grant_modal: {
              title: 'Grant Free Access',
              description: 'Grant free access to {{name}}',
              days_label: 'Number of Days',
              days_placeholder: 'e.g., 30',
              grant_button: 'Grant Access'
            },
            messages: {
              settings_saved: 'Settings saved successfully!',
              free_access_granted: 'Granted {{days}} days free access to {{name}}'
            },
            confirm_revoke: 'Are you sure you want to revoke this driver\'s access?'
          },
          chat: {
            title: 'Ride Chat',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Return to Dashboard',
            no_messages: 'No messages yet.',
            placeholder: 'Type a message...',
            send: 'Send',
            errors: {
              ride_not_found: 'Ride not found.',
              login_required: 'Please login again.',
              no_access: 'You do not have access to this chat.',
              send_failed: 'Failed to send message.'
            }
          },
          client: {
            account_settings: 'Account Settings',
            gps: {
              https_required: 'GPS requires HTTPS. Open {{url}}',
              not_supported: 'Geolocation is not supported in this browser.',
              blocked: 'Location is blocked. Click the lock icon in your browser, allow Location, then press Enable GPS.',
              requesting: 'Requesting location access...',
              detected_city: 'Detected city: {{city}}',
              detected: 'Location detected.',
              denied: 'Location permission denied. Enable Location for this site and then press Enable GPS.',
              enable_button: 'Enable GPS',
              hint: 'If Chrome already blocked it, click the lock icon next to the URL, allow Location, then press Enable GPS again.'
            },
            city_lock: 'Address search is limited to {{city}}.',
            city_lock_default: 'your current area',
            map: {
              instructions: 'Tap the map to set Pickup (A) and Drop-off (B), or use the buttons below',
              tile_error: 'Map tiles failed to load. Check your MapTiler key or try again.',
              pickup: 'Pickup',
              dropoff: 'Drop-off',
              driver_location: 'Driver location'
            },
            active: {
              title: 'Your Active Ride',
              status_pending: 'Looking for drivers...',
              status_assigned: 'Driver assigned!',
              status_arrived: 'Driver has arrived!',
              status_in_progress: 'Trip in progress',
              status_label: 'Status: {{status}}',
              cancel: 'Cancel Ride',
              price: 'Price',
              payment: 'Payment',
              waiting_title: 'Waiting for drivers...',
              waiting_subtitle: 'A driver in your area will accept your request',
              driver_title: 'Driver',
              driver_assigned: 'Driver assigned',
              call: 'Call',
              show_phone: 'Show phone',
              open_chat: 'Open chat',
              unread: '{{count}} new',
              driver_distance: 'Driver distance: {{km}} km',
              eta: 'ETA: {{minutes}} min',
              speed: 'Speed: {{speed}} km/h',
              heading: 'Heading: {{heading}}°'
            },
            notifications: {
              title: 'Ride Update',
              driver_assigned: 'Driver accepted your ride!',
              driver_arrived: 'Your driver has arrived.',
              trip_started: 'Your trip has started.',
              request_created: 'Ride request created! Waiting for drivers...',
              ride_cancelled: 'Ride cancelled'
            },
            errors: {
              send_message_failed: 'Failed to send message',
              create_ride_failed: 'Failed to create ride',
              location_outside: 'Please choose a location {{area}}.',
              city_inside: 'inside {{city}}',
              city_nearby: 'near your city',
              no_results_city: 'No results in {{city}}. Try another address.',
              no_results: 'No results found.'
            },
            confirm_cancel: 'Are you sure you want to cancel this ride?',
            request: {
              title: 'Request a Ride'
            },
            select_on_map: 'Select on map',
            select_on_map_active: 'Click on map...',
            pickup: {
              title: 'Pickup Location',
              placeholder_city: 'Type pickup address in {{city}}',
              placeholder: 'Type pickup address or place',
              helper: 'Select a result above or click on the map to set pickup',
              none: 'No pickup location selected'
            },
            dropoff: {
              title: 'Drop-off Location',
              placeholder_city: 'Type drop-off address in {{city}}',
              placeholder: 'Type drop-off address or place',
              helper: 'Select a result above or click on the map to set drop-off',
              none: 'No drop-off location selected'
            },
            options: {
              passengers: 'Passengers',
              payment_method: 'Payment Method'
            },
            price: {
              estimated: 'Estimated Price',
              distance: 'Distance',
              creating: 'Creating request...',
              request: 'Request Ride'
            }
          },
          driver: {
            account_settings: 'Account Settings',
            gps: {
              https_required: 'GPS requires HTTPS. Open {{url}}',
              not_supported: 'Geolocation is not supported by your browser',
              blocked: 'Location is blocked. Click the lock icon in your browser, allow Location, then press Enable GPS.',
              requesting: 'Requesting location access...',
              detected_city: 'Detected city: {{city}}',
              detected: 'Location detected.',
              denied: 'Location permission denied. Enable Location for this site and then press Enable GPS.',
              denied_short: 'Location permission denied. Enable Location for this site.',
              enable_button: 'Enable GPS',
              hint: 'If Chrome already blocked it, click the lock icon next to the URL, allow Location, then press Enable GPS again.',
              enable_location: 'Enable Location'
            },
            errors: {
              load_profile: 'Failed to load profile',
              send_message_failed: 'Failed to send message',
              ride_already_taken: 'This ride was already accepted by another driver.',
              accept_failed: 'Failed to accept ride'
            },
            subscription_required: {
              title: 'Subscription Required',
              subtitle: 'You need an active subscription to receive ride requests.',
              feature: 'Unlimited ride requests for {{days}} days',
              subscribe: 'Subscribe Now'
            },
            verification: {
              title: 'Driver verification',
              subtitle: 'Submit your documents to activate your driver account.',
              back: 'Back',
              required_title: 'Verification required',
              required_desc: 'Complete verification to start receiving ride requests.',
              pending_desc: 'Your documents are under review.',
              rejected_desc: 'Please update your documents and resubmit.',
              start_application: 'Start verification',
              view_application: 'View application',
              status_approved: 'Approved',
              status_pending: 'Pending review',
              status_rejected: 'Rejected',
              status_approved_desc: 'Your account is approved and active.',
              status_pending_desc: 'We are reviewing your documents. You will be notified when approved.',
              status_rejected_desc: 'Your submission needs updates. Please resubmit.',
              form_title: 'Verification form',
              form_subtitle: 'Upload clear photos of your documents and vehicle info.',
              id_type: 'Document type',
              passport: 'Passport',
              id_card: 'ID card',
              id_number: 'Document number',
              plate_number: 'Plate number',
              license_number: 'Driver license number',
              license_class: 'License class',
              id_front: 'ID / Passport photo',
              id_back: 'ID back photo',
              license_photo: 'Driver license photo',
              upload: 'Upload file',
              submit: 'Submit for review',
              submitted: 'Verification submitted. We will review shortly.',
              go_dashboard: 'Go to dashboard',
              blocked_title: 'Account blocked',
              blocked_subtitle: 'Your account is blocked. Contact support.',
              errors: {
                missing_fields: 'Please fill all required fields and upload required photos.',
                id_back_required: 'Please upload the back side of the ID card.',
                upload_failed: 'Failed to upload documents. Try again.',
                submit_failed: 'Failed to submit verification.',
                load_failed: 'Failed to load verification status.'
              }
            },
            active: {
              title: 'Active Ride',
              status: 'Status',
              earnings: 'Earnings',
              start_ride: 'Start Ride',
              complete_ride: 'Complete Ride',
              client: 'Client',
              client_default: 'Client',
              call: 'Call',
              show_phone: 'Show phone',
              open_chat: 'Open chat',
              unread: '{{count}} new'
            },
            map: {
              pickup_location: 'Pickup Location',
              pickup: 'Pickup',
              dropoff: 'Drop-off',
              you_are_here: 'You are here',
              tile_error: 'Map tiles failed to load. Check your MapTiler key or try again.'
            },
            available: {
              title: 'Available Rides',
              none_title: 'No available rides',
              none_with_location: 'No ride requests in your area right now. We are also checking nearby pickups.',
              none_without_location: 'Enable location to see nearby rides',
              accept: 'Accept Ride',
              passengers: '{{count}} passengers'
            }
          }
        }
      },
      ru: {
        translation: {
          slogan: 'Быстрее автобуса, дешевле такси',
          welcome: 'Добро пожаловать в Supertez',


          book_ride: 'Заказать поездку',
          pickup: 'Место посадки',
          dropoff: 'Место высадки',
          passengers: 'Пассажиры',
          price: 'Цена',
          book_now: 'Заказать сейчас',
          driver_dashboard: 'Кабинет водителя',
          admin_settings: 'Настройки админа',
          role: 'Роль',
          email: 'Email',
          password: 'Пароль',
          full_name: 'ФИО',
          logout: 'Выйти',
          pending_rides: 'Доступные поездки',
          accept: 'Принять',
          pricing_mode: 'Режим цены',
          fixed_price: 'Фиксированная',
          per_km: 'За км',
          update_settings: 'Обновить настройки',
          distance: 'Расстояние',
          forgot_password: 'Забыли пароль?',
          send_reset_link: 'Восстановить пароль',
          reset_link_sent: 'Ссылка для сброса пароля отправлена на почту.',

          new_password: 'Новый пароль',
          back_to_login: 'Вернуться к входу',
          detecting_location: 'Определение местоположения...',
          subscription_required: 'Требуется подписка',
          subscription_desc: 'Для приема заказов необходима активная подписка.',
          subscribe_now: 'Подписаться',
          subscription_price: 'Цена подписки',
          driver_settings: 'Настройки водителей',
          require_subscription: 'Требовать подписку',
          manage_drivers: 'Управление водителями',
          grant_access: 'Дать бесплатный доступ',
          days: 'Дней',
          expires_at: 'Истекает',
          pay_with_paypal: 'Оплатить через PayPal',
          admin_portal: 'Админ Панель',
          admin_login: 'Вход для Админа',
          admin_registration: 'Регистрация Админа',
          management: 'Управление',
          already_admin: 'Уже есть аккаунт админа?',
          need_admin: 'Нужен доступ админа?',
          have_account: 'Уже есть аккаунт?',
          no_account: 'Нет аккаунта?',
          passenger: 'Пассажир',

          common: {
            saving: 'Сохранение...',
            updating: 'Обновление...',
            sending: 'Отправка...',
            processing: 'Обработка...',
            find: 'Найти',
            change: 'Изменить',
            hide: 'Скрыть',
            cancel: 'Отмена',
            refresh: 'Обновить',
            support: 'Поддержка',
            error_prefix: 'Ошибка: {{message}}',
            unknown: 'Неизвестно',
            not_available: 'Н/Д'
          },
          nav: {
            dashboard: 'Панель',
            admin: 'Админ',
            settings: 'Настройки',
            subscription: 'Подписка',
            affiliate: 'Блогеры',
            affiliate_dashboard: 'CRM блогера'
          },
          landing: {
            loading: 'Загрузка...',
            badge: 'Городская сеть поездок',
            hero_title: 'Supertez связывает город с проверенными водителями.',
            hero_subtitle: 'Закажите поездку за секунды или зарабатывайте больше как проверенный водитель. Трекинг в реальном времени, прозрачные цены и поддержка.',
            cta_primary: 'Начать',
            cta_secondary: 'Войти',
            hero_point_one: 'Прозрачные цены',
            hero_point_two: 'Проверенные водители',
            hero_point_three: 'Мгновенная поддержка',
            panel_title: 'Живая диспетчеризация',
            panel_subtitle: 'Полный контроль',
            panel_badge: 'Realtime',
            panel_item_one: 'Умная фиксация адреса',
            panel_item_one_sub: 'GPS + IP удерживают заявки в вашем городе.',
            panel_item_two: 'Проверка водителей',
            panel_item_two_sub: 'Подписки и одобрения сохраняют качество сервиса.',
            panel_item_three: 'ETA и трекинг',
            panel_item_three_sub: 'Клиенты видят движение водителя в реальном времени.',
            panel_item_four: 'Поддержка внутри',
            panel_item_four_sub: 'Чат с админом для клиента и водителя.',
            feature_one_title: 'Опыт клиента',
            feature_one_body: 'Быстрый поиск поездок, обмен локацией и прозрачная оплата.',
            feature_two_title: 'Рост водителей',
            feature_two_body: 'Подписки, пробный доступ и контроль доходов в одном месте.',
            feature_three_title: 'Контроль администратора',
            feature_three_body: 'Цены, одобрения, CRM и поддержка — из одной панели.',
            affiliate_title: 'Программа для блогеров',
            affiliate_subtitle: 'Получите уникальную ссылку регистрации водителей и CRM-отчёты по заявкам.',
            affiliate_cta: 'Открыть страницу блогера',
            affiliate_login: 'Вход для блогера',
            cta_title: 'Готовы к следующей поездке?',
            cta_subtitle: 'Подключайтесь к Supertez и держите клиентов и водителей в синхронизации.'
          },
          support: {
            title: 'Поддержка',
            subtitle: 'Напишите администратору, если нужна помощь.',
            back: 'Назад',
            inbox: 'Входящие поддержки',
            search_placeholder: 'Поиск по имени или email...',
            status_all: 'Все',
            status_open: 'Открыто',
            status_closed: 'Закрыто',
            open: 'Открыто',
            closed: 'Закрыто',
            close: 'Закрыть',
            reopen: 'Открыть снова',
            select_thread: 'Выберите диалог',
            no_threads: 'Запросов поддержки пока нет.',
            no_messages: 'Сообщений пока нет.',
            placeholder: 'Введите сообщение...',
            send: 'Отправить',
            thread_title: 'Чат поддержки',
            admin: 'Админ',
            user: 'Пользователь',
            you: 'Вы',
            unknown_user: 'Пользователь',
            errors: {
              load_failed: 'Не удалось загрузить чат поддержки.',
              send_failed: 'Не удалось отправить сообщение.',
              no_access: 'Чат поддержки доступен только водителям и клиентам.'
            }
          },
          affiliate: {
            badge: 'Партнёрская программа',
            hero_title: 'Продвигайте Supertez и получайте вознаграждение за каждого водителя.',
            hero_subtitle: 'Делитесь своей уникальной ссылкой регистрации водителей. Отслеживайте результаты в своей CRM.',
            cta_join: 'Стать блогером',
            cta_login: 'Вход для блогера',
            cta_dashboard: 'Перейти в CRM блогера',
            panel_title: 'Инструменты продвижения',
            panel_subtitle: 'Каждая регистрация водителя отслеживается по вашей ссылке.',
            panel_item_one: 'Уникальная ссылка',
            panel_item_one_sub: 'У каждого блогера своя ссылка на регистрацию водителя.',
            panel_item_two: 'CRM-панель',
            panel_item_two_sub: 'Смотрите, кто зарегистрировался и сколько водителей пришло.',
            step_one_title: 'Зарегистрируйтесь как блогер',
            step_one_body: 'Создайте аккаунт за несколько минут.',
            step_two_title: 'Поделитесь ссылкой',
            step_two_body: 'Отправьте ссылку регистрации водителя своей аудитории.',
            step_three_title: 'Отслеживайте результат',
            step_three_body: 'Новые регистрации появятся в вашей CRM.',
            dashboard_title: 'CRM блогера',
            dashboard_subtitle: 'Отслеживайте водителей, пришедших по вашей ссылке.',
            status_active: 'Активен',
            link_title: 'Ваша ссылка регистрации водителя',
            link_subtitle: 'Поделитесь ссылкой для учёта регистраций.',
            copy_button: 'Копировать',
            copied: 'Скопировано!',
            copy_failed: 'Не удалось скопировать',
            total_drivers: 'Всего водителей',
            total_hint: 'Счётчик обновляется после регистрации водителя.',
            driver_list: 'Водители по вашей ссылке',
            table: {
              name: 'Имя',
              contact: 'Контакт',
              city: 'Город',
              date: 'Дата регистрации'
            },
            empty: 'Пока нет регистраций.',
            showcase_one: 'Быстрее автобуса, дешевле такси',
            showcase_two: 'Маршруты и бронирование в реальном времени'
          },
          roles: {
            owner: 'Владелец',
            admin: 'Админ',

            client: 'Клиент'
          },
          payment: {
            cash: 'Наличные',
            card: 'Карта'
          },
          status: {
            pending: 'Ожидает',
            driver_assigned: 'Водитель назначен',
            driver_arrived: 'Водитель прибыл',
            in_progress: 'В пути',
            completed: 'Завершено',
            cancelled: 'Отменено'
          },
          subscription: {
            title: 'Подписка',
            subtitle: 'Управление подпиской водителя',
            current: {
              title: 'Текущий статус',
              active: 'Подписка активна',
              inactive: 'Нет активной подписки',
              status_label: 'Статус',
              days_remaining: 'Осталось дней',
              days_count: '{{count}} дн.',
              expires_on: 'Истекает',
              free_title: 'Бесплатный доступ предоставлен',
              free_desc: 'Вам предоставлено {{days}} дней бесплатного доступа администратором.',
              auto_title: 'Автопродление включено',
              auto_desc: 'Подписка автоматически продлится {{date}}.',
              none_title: 'Нет активной подписки',
              none_desc: 'Оформите подписку, чтобы получать заявки от клиентов.'
            },
            subscribe: {
              title: 'Оформить подписку',
              subtitle: 'Выберите план, чтобы получать заявки',
              plan_title: 'Подписка водителя',
              plan_subtitle: 'Полный доступ к заявкам',
              per_month: 'в месяц',
              feature_unlimited: 'Неограниченные заявки на {{days}} дней',
              feature_realtime: 'Уведомления о новых поездках в реальном времени',
              feature_custom_offers: 'Отправка индивидуальной цены клиентам',
              feature_auto_renew: 'Доступна автопродление',
              loading_paypal: 'Загрузка PayPal...',
              note: 'Примечание: подписка автоматически продлевается каждые {{days}} дней. Вы можете отменить в любой момент в PayPal.'
            },
            free_trial: {
              title: 'Нужно больше времени?',
              subtitle: 'Запросите {{days}} дней бесплатного доступа, чтобы попробовать сервис',
              button: 'Запросить бесплатный доступ'
            },
            faq: {
              title: 'Частые вопросы',
              q1: 'Как работает подписка?',
              a1: 'Оплачивайте ${{price}} ежемесячно через PayPal и получайте неограниченные заявки на {{days}} дней.',
              q2: 'Можно отменить в любое время?',
              a2: 'Да! Вы можете отменить подписку в PayPal. Доступ сохранится до конца периода.',
              q3: 'Что будет, если подписка истечёт?',
              a3: 'Вы не будете получать новые заявки до продления. Аккаунт остаётся активным.'
            },
            messages: {
              activated: 'Подписка успешно активирована!',
              free_trial_requested: 'Запрос на бесплатный доступ отправлен админу. Вы получите уведомление после одобрения.'
            },
            errors: {
              load_profile: 'Не удалось загрузить профиль',
              activate: 'Ошибка активации подписки: {{message}}',
              payment_failed: 'Платёж не прошёл. Попробуйте снова.'
            },
            status: {
              active: 'Активна',
              free: 'Бесплатный доступ',
              expired: 'Истекла',
              cancelled: 'Отменена',
              inactive: 'Неактивна',
              none: 'Нет подписки'
            },
            currency: {
              loading: 'Определяем валюту...',
              note: 'Показана базовая валюта, так как курсы недоступны.',
              unsupported: 'PayPal не поддерживает вашу валюту. Оплата в {{currency}}.',
              local_equivalent: '≈ {{amount}} в вашей валюте'
            }
          },
          login: {
            reset_title: 'Сброс пароля',
            reset_subtitle: 'Введите email, чтобы получить ссылку',
            email_label: 'Email',
            email_placeholder: 'you@email.com',
            send_reset_link: 'Отправить ссылку',
            back_to_login: 'Вернуться к входу',
            title: 'Добро пожаловать в Supertez',
            subtitle: 'Войдите в аккаунт',
            password_label: 'Пароль',
            password_placeholder: '••••••••',
            hide_password: 'Скрыть пароль',
            show_password: 'Показать пароль',
            remember_me: 'Запомнить меня',
            forgot_password: 'Забыли пароль?',
            signing_in: 'Вход...',
            sign_in: 'Войти',
            no_account: 'Нет аккаунта?',
            sign_up: 'Зарегистрироваться',
            demo: 'Демо-доступ: используйте {{email}} для доступа владельца',
            reset_success: 'Письмо для сброса пароля отправлено.',
            errors: {
              no_user: 'Данные пользователя не получены',
              sign_in_failed: 'Не удалось войти. Проверьте данные.',
              reset_failed: 'Не удалось отправить письмо для сброса'
            }
          },
          register: {
            title: 'Создать аккаунт',
            subtitle: 'Присоединяйтесь к Supertez',
            role_label: 'Я хочу',
            role_client: 'Заказать поездку',
            role_driver: 'Водить и зарабатывать',
            full_name: 'ФИО',
            full_name_placeholder: 'Иван Иванов',
            email: 'Email',
            email_placeholder: 'you@example.com',
            phone_label: 'Телефон (обязателен для клиентов и водителей)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Город',
            city_placeholder: 'Алматы',
            password: 'Пароль',
            confirm_password: 'Подтвердите пароль',
            submit: 'Создать аккаунт',
            have_account: 'Уже есть аккаунт?',
            sign_in: 'Войти',
            success_alert: 'Регистрация успешна! Проверьте почту и подтвердите email, затем войдите.',
            errors: {
              phone_required: 'Телефон обязателен для клиентов и водителей',
              password_mismatch: 'Пароли не совпадают',
              password_length: 'Пароль должен быть не менее 6 символов',
              register_failed: 'Не удалось зарегистрироваться'
            }
          },
          update_password: {
            title: 'Новый пароль',
            subtitle: 'Введите новый пароль',
            new_password: 'Новый пароль',
            confirm_password: 'Подтвердите пароль',
            password_placeholder: '••••••••',
            hide_password: 'Скрыть пароль',
            show_password: 'Показать пароль',
            hide_confirm_password: 'Скрыть подтверждение',
            show_confirm_password: 'Показать подтверждение',
            min_length: 'Минимум 6 символов',
            update_button: 'Обновить пароль',
            success_title: 'Пароль обновлён!',
            success_subtitle: 'Ваш пароль успешно обновлён.',
            redirecting: 'Переадресация на вход...',
            errors: {
              invalid_link: 'Ссылка недействительна или истекла. Запросите новую.',
              password_length: 'Пароль должен быть не менее 6 символов',
              password_mismatch: 'Пароли не совпадают',
              update_failed: 'Не удалось обновить пароль'
            }
          },
          auth: {
            phone_label: 'Телефон (обязателен для клиентов и водителей)',
            messages: {
              account_created: 'Аккаунт создан! Выполняется вход...'
            },
            errors: {
              phone_required: 'Телефон обязателен для клиентов и водителей.',
              login_after_register_failed: 'Аккаунт создан, но вход не выполнен. Войдите вручную.'
            },
            placeholders: {
              full_name: 'Иван Иванов',
              phone: '+7 700 123 4567',
              email: 'email@example.com'
            }
          },
          account: {
            title: 'Настройки аккаунта',
            subtitle: 'Управляйте профилем, email и паролем.',
            profile: {
              title: 'Профиль',
              uploading: 'Загрузка...',
              upload_photo: 'Загрузить фото',
              full_name: 'ФИО',
              phone: 'Телефон',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'Ссылка на фото (необязательно)',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: 'Сохранить профиль'
            },
            email: {
              title: 'Email',
              current: 'Текущий email',
              new: 'Новый email',
              placeholder: 'new@email.com',
              note: 'Если включено подтверждение email в Supabase, вы получите письмо.',
              update: 'Обновить email'
            },
            password: {
              title: 'Пароль',
              new: 'Новый пароль',
              confirm: 'Подтвердите пароль',
              placeholder: '••••••••',
              update: 'Обновить пароль'
            },
            messages: {
              profile_updated: 'Профиль обновлён.',
              email_update_requested: 'Запрос на смену email отправлен. Если включено подтверждение, проверьте почту.',
              password_updated: 'Пароль обновлён.',
              photo_updated: 'Фото обновлено.'
            },
            errors: {
              login_required: 'Пожалуйста, войдите снова для управления аккаунтом.',
              phone_required: 'Телефон обязателен для клиентов и водителей.',
              profile_update_failed: 'Не удалось обновить профиль.',
              email_empty: 'Email не может быть пустым.',
              email_update_failed: 'Не удалось обновить email.',
              password_length: 'Пароль должен быть не менее 6 символов.',
              password_mismatch: 'Пароли не совпадают.',
              password_update_failed: 'Не удалось обновить пароль.',
              avatar_url_failed: 'Не удалось получить публичный URL для аватара.',
              photo_upload_failed: 'Не удалось загрузить фото. Проверьте bucket avatars и публичные политики.'
            }
          },
          admin: {
            title: 'Панель администратора',
            subtitle: 'Управление поездками и водителями',
            tabs: {
              rides: 'Все поездки',
              drivers: 'Водители',
              crm: 'CRM',
              affiliates: 'Блогеры',
              verifications: 'Проверка'
            },
            affiliates: {
              title: 'CRM блогеров',
              subtitle: 'Отслеживайте блогеров и регистрации водителей.',
              total_affiliates: 'Всего блогеров',
              total_drivers: 'Водителей по ссылкам',
              search_placeholder: 'Поиск блогера...',
              table: {
                affiliate: 'Блогер',
                code: 'Код',
                drivers: 'Водители',
                last_signup: 'Последняя регистрация',
                contact: 'Контакт'
              },
              empty: 'Пока нет блогеров.'
            },
            search_placeholder: 'Поиск поездок...',
            status_all: 'Все статусы',
            table: {
              id: 'ID',
              route: 'Маршрут',
              client: 'Клиент',

              price: 'Цена',
              status: 'Статус',
              date: 'Дата'
            },
            not_assigned: 'Не назначен',
            driver_management: 'Управление водителями',
            drivers_table: {

              contact: 'Контакт',
              city: 'Город',
              joined: 'Дата регистрации',
              status: 'Статус'
            },
            crm: {
              title: 'CRM обзор',
              search_placeholder: 'Поиск водителя или клиента',
              total_trips: 'Всего выполненных поездок',
              unique_drivers: 'Активные водители',
              unique_clients: 'Обслуженные клиенты',
              empty: 'Пока нет завершённых поездок.',
              table: {
                driver: 'Водитель',
                client: 'Клиент',
                trips: 'Поездки',
                last_ride: 'Последняя поездка',
                status: 'Статус',
                price: 'Последняя цена'
              }
            },
            verifications: {
              title: 'Проверка водителей',
              search_placeholder: 'Поиск водителя, номера, прав',
              status_all: 'Все',
              status_pending: 'Ожидает',
              status_approved: 'Одобрено',
              status_rejected: 'Отклонено',
              note_placeholder: 'Комментарий к одобрению/отклонению',
              empty: 'Нет заявок на проверку.',
              table: {
                driver: 'Водитель',
                docs: 'Документы',
                vehicle: 'Авто',
                status: 'Статус',
                actions: 'Действия'
              },
              approve: 'Одобрить',
              reject: 'Отклонить',
              view_id_front: 'ID лиц.',
              view_id_back: 'ID оборот',
              view_license: 'Права',
              plate: 'Номер',
              license_number: 'Права',
              license_class: 'Категория'
            }
          },
          owner: {
            title: 'Панель владельца',
            welcome: 'С возвращением, {{name}}',
            tabs: {
              overview: 'Обзор',
              drivers: 'Водители',
              settings: 'Настройки',
              finance: 'Финансы'
            },
            stats: {
              total_rides: 'Всего поездок',
              total_revenue: 'Общая выручка',
              active_drivers: 'Активных водителей',
              total_clients: 'Всего клиентов'
            },
            driver_management: {
              title: 'Управление водителями',
              subtitle: 'Управление подписками и доступом'
            },
            drivers_table: {

              location: 'Локация',
              status: 'Статус',
              expires: 'Истекает',
              actions: 'Действия'
            },
            actions: {
              grant_free: 'Дать доступ',
              revoke: 'Отозвать'
            },
            settings: {
              title: 'Настройки приложения',
              pricing: {
                title: 'Настройки цены',
                mode: 'Режим цены',
                fixed: 'Фиксированная',
                per_km: 'За км',
                currency: 'Валюта',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Сумма фиксированной цены',
                per_km_amount: 'Цена за км'
              },
              subscription: {
                title: 'Подписка водителя',
                require: 'Требовать подписку от водителей',
                price: 'Цена подписки',
                period_days: 'Период (дни)',
                default_free_days: 'Бесплатные дни по умолчанию'
              },
              paypal: {
                title: 'Настройки PayPal',
                client_id: 'PayPal Client ID',
                placeholder: 'Введите PayPal Client ID'
              },
              save: 'Сохранить настройки'
            },
            finance: {
              title: 'Финансовый обзор',
              coming_soon: 'Детальные отчёты скоро появятся...',
              total_revenue: 'Общая выручка: ${{amount}}'
            },
            grant_modal: {
              title: 'Выдать бесплатный доступ',
              description: 'Выдать бесплатный доступ для {{name}}',
              days_label: 'Количество дней',
              days_placeholder: 'например, 30',
              grant_button: 'Выдать доступ'
            },
            messages: {
              settings_saved: 'Настройки сохранены!',
              free_access_granted: 'Выдано {{days}} дней бесплатного доступа для {{name}}'
            },
            confirm_revoke: 'Вы уверены, что хотите отозвать доступ водителя?'
          },
          chat: {
            title: 'Чат поездки',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Вернуться в панель',
            no_messages: 'Сообщений пока нет.',
            placeholder: 'Введите сообщение...',
            send: 'Отправить',
            errors: {
              ride_not_found: 'Поездка не найдена.',
              login_required: 'Пожалуйста, войдите снова.',
              no_access: 'У вас нет доступа к этому чату.',
              send_failed: 'Не удалось отправить сообщение.'
            }
          },
          client: {
            account_settings: 'Настройки аккаунта',
            gps: {
              https_required: 'GPS требует HTTPS. Откройте {{url}}',
              not_supported: 'Геолокация не поддерживается в этом браузере.',
              blocked: 'Геолокация заблокирована. Разрешите доступ и нажмите "Включить GPS".',
              requesting: 'Запрашиваем доступ к геолокации...',
              detected_city: 'Определён город: {{city}}',
              detected: 'Локация определена.',
              denied: 'Доступ к геолокации запрещён. Разрешите доступ и нажмите "Включить GPS".',
              enable_button: 'Включить GPS',
              hint: 'Если доступ уже заблокирован, нажмите на значок замка и разрешите геолокацию, затем снова нажмите "Включить GPS".'
            },
            city_lock: 'Поиск адресов ограничен: {{city}}.',
            city_lock_default: 'ваш текущий район',
            map: {
              instructions: 'Нажмите на карту, чтобы выбрать Подачу (A) и Пункт назначения (B), или используйте кнопки ниже',
              tile_error: 'Не удалось загрузить карту. Проверьте ключ MapTiler или попробуйте снова.',
              pickup: 'Подача',
              dropoff: 'Пункт назначения',
              driver_location: 'Местоположение водителя'
            },
            active: {
              title: 'Активная поездка',
              status_pending: 'Ищем водителей...',
              status_assigned: 'Водитель назначен!',
              status_arrived: 'Водитель прибыл!',
              status_in_progress: 'Поездка в пути',
              status_label: 'Статус: {{status}}',
              cancel: 'Отменить поездку',
              price: 'Цена',
              payment: 'Оплата',
              waiting_title: 'Ожидаем водителей...',
              waiting_subtitle: 'Водитель в вашем районе примет заявку',
              driver_title: 'Водитель',
              driver_assigned: 'Водитель назначен',
              call: 'Позвонить',
              show_phone: 'Показать телефон',
              open_chat: 'Открыть чат',
              unread: '{{count}} новых',
              driver_distance: 'Расстояние до водителя: {{km}} км',
              eta: 'Прибытие через {{minutes}} мин',
              speed: 'Скорость: {{speed}} км/ч',
              heading: 'Направление: {{heading}}°'
            },
            notifications: {
              title: 'Обновление поездки',
              driver_assigned: 'Водитель принял вашу заявку!',
              driver_arrived: 'Ваш водитель прибыл.',
              trip_started: 'Поездка началась.',
              request_created: 'Заявка создана! Ожидаем водителей...',
              ride_cancelled: 'Поездка отменена'
            },
            errors: {
              send_message_failed: 'Не удалось отправить сообщение',
              create_ride_failed: 'Не удалось создать поездку',
              location_outside: 'Выберите локацию {{area}}.',
              city_inside: 'в пределах {{city}}',
              city_nearby: 'рядом с вашим городом',
              no_results_city: 'Нет результатов в городе {{city}}. Попробуйте другой адрес.',
              no_results: 'Ничего не найдено.'
            },
            confirm_cancel: 'Вы уверены, что хотите отменить поездку?',
            request: {
              title: 'Заказать поездку'
            },
            select_on_map: 'Выбрать на карте',
            select_on_map_active: 'Нажмите на карту...',
            pickup: {
              title: 'Место подачи',
              placeholder_city: 'Введите адрес подачи в {{city}}',
              placeholder: 'Введите адрес подачи',
              helper: 'Выберите результат выше или нажмите на карту',
              none: 'Место подачи не выбрано'
            },
            dropoff: {
              title: 'Пункт назначения',
              placeholder_city: 'Введите адрес назначения в {{city}}',
              placeholder: 'Введите адрес назначения',
              helper: 'Выберите результат выше или нажмите на карту',
              none: 'Пункт назначения не выбран'
            },
            options: {
              passengers: 'Пассажиры',
              payment_method: 'Способ оплаты'
            },
            price: {
              estimated: 'Ориентировочная цена',
              distance: 'Расстояние',
              creating: 'Создаём заявку...',
              request: 'Заказать поездку'
            }
          },
          driver: {
            account_settings: 'Настройки аккаунта',
            gps: {
              https_required: 'GPS требует HTTPS. Откройте {{url}}',
              not_supported: 'Геолокация не поддерживается вашим браузером',
              blocked: 'Геолокация заблокирована. Разрешите доступ и нажмите "Включить GPS".',
              requesting: 'Запрашиваем доступ к геолокации...',
              detected_city: 'Определён город: {{city}}',
              detected: 'Локация определена.',
              denied: 'Доступ к геолокации запрещён. Разрешите доступ и нажмите "Включить GPS".',
              denied_short: 'Доступ к геолокации запрещён. Разрешите доступ.',
              enable_button: 'Включить GPS',
              hint: 'Если доступ уже заблокирован, нажмите на значок замка и разрешите геолокацию, затем снова нажмите "Включить GPS".',
              enable_location: 'Включить геолокацию'
            },
            errors: {
              load_profile: 'Не удалось загрузить профиль',
              send_message_failed: 'Не удалось отправить сообщение',
              ride_already_taken: 'Эту поездку уже принял другой водитель.',
              accept_failed: 'Не удалось принять поездку'
            },
            subscription_required: {
              title: 'Требуется подписка',
              subtitle: 'Для получения заявок нужна активная подписка.',
              feature: 'Неограниченные заявки на {{days}} дней',
              subscribe: 'Подписаться'
            },
            verification: {
              title: 'Проверка водителя',
              subtitle: 'Отправьте документы, чтобы активировать аккаунт водителя.',
              back: 'Назад',
              required_title: 'Нужна проверка',
              required_desc: 'Завершите проверку, чтобы получать заявки.',
              pending_desc: 'Ваши документы на проверке.',
              rejected_desc: 'Обновите документы и отправьте снова.',
              start_application: 'Начать проверку',
              view_application: 'Посмотреть заявку',
              status_approved: 'Одобрено',
              status_pending: 'На проверке',
              status_rejected: 'Отклонено',
              status_approved_desc: 'Ваш аккаунт подтверждён и активен.',
              status_pending_desc: 'Мы проверяем документы. Вы получите уведомление после одобрения.',
              status_rejected_desc: 'Нужно обновить данные и отправить заново.',
              form_title: 'Анкета проверки',
              form_subtitle: 'Загрузите чёткие фото документов и данные авто.',
              id_type: 'Тип документа',
              passport: 'Паспорт',
              id_card: 'Удостоверение личности',
              id_number: 'Номер документа',
              plate_number: 'Номер авто',
              license_number: 'Номер водительских прав',
              license_class: 'Категория',
              id_front: 'Фото документа',
              id_back: 'Фото оборота',
              license_photo: 'Фото прав',
              upload: 'Загрузить файл',
              submit: 'Отправить на проверку',
              submitted: 'Заявка отправлена. Мы скоро проверим.',
              go_dashboard: 'Перейти в панель',
              blocked_title: 'Аккаунт заблокирован',
              blocked_subtitle: 'Ваш аккаунт заблокирован. Обратитесь в поддержку.',
              errors: {
                missing_fields: 'Заполните обязательные поля и загрузите все фото.',
                id_back_required: 'Загрузите оборот удостоверения личности.',
                upload_failed: 'Не удалось загрузить документы.',
                submit_failed: 'Не удалось отправить заявку.',
                load_failed: 'Не удалось загрузить статус проверки.'
              }
            },
            active: {
              title: 'Активная поездка',
              status: 'Статус',
              earnings: 'Заработок',
              start_ride: 'Начать поездку',
              complete_ride: 'Завершить поездку',
              client: 'Клиент',
              client_default: 'Клиент',
              call: 'Позвонить',
              show_phone: 'Показать телефон',
              open_chat: 'Открыть чат',
              unread: '{{count}} новых'
            },
            map: {
              pickup_location: 'Место подачи',
              pickup: 'Подача',
              dropoff: 'Пункт назначения',
              you_are_here: 'Вы здесь',
              tile_error: 'Не удалось загрузить карту. Проверьте ключ MapTiler или попробуйте снова.'
            },
            available: {
              title: 'Доступные поездки',
              none_title: 'Нет доступных поездок',
              none_with_location: 'В вашем районе нет заявок. Проверяем ближайшие адреса.',
              none_without_location: 'Включите геолокацию, чтобы видеть поездки',
              accept: 'Принять поездку',
              passengers: '{{count}} пассажиров'
            }
          }
        }
      },
      ko: {
        translation: {
          slogan: '버스보다 빠르고 택시보다 저렴',
          welcome: 'Supertez에 오신 것을 환영합니다',


          book_ride: '차량 예약',
          pickup: '픽업 위치',
          dropoff: '하차 위치',
          passengers: '승객',
          price: '가격',
          book_now: '지금 예약',
          driver_dashboard: '드라이버 대시보드',
          admin_settings: '관리자 설정',
          role: '역할',
          email: '이메일',
          password: '비밀번호',
          full_name: '이름',
          logout: '로그아웃',
          pending_rides: '대기 중인 요청',
          accept: '수락',
          pricing_mode: '요금 방식',
          fixed_price: '고정 요금',
          per_km: '킬로미터당',
          update_settings: '설정 업데이트',
          distance: '거리',
          forgot_password: '비밀번호를 잊으셨나요?',
          send_reset_link: '재설정 링크 보내기',
          reset_link_sent: '재설정 링크가 이메일로 전송되었습니다.',

          new_password: '새 비밀번호',
          back_to_login: '로그인으로 돌아가기',
          detecting_location: '위치 확인 중...',
          subscription_required: '구독 필요',
          subscription_desc: '요청을 받으려면 활성 구독이 필요합니다.',
          subscribe_now: '지금 구독',
          subscription_price: '구독 가격',
          driver_settings: '기사 설정',
          require_subscription: '기사 구독 요구',
          manage_drivers: '기사 관리',
          grant_access: '무료 이용 권한 부여',
          days: '일',
          expires_at: '만료일',
          pay_with_paypal: 'PayPal로 결제',
          admin_portal: '관리자 포털',
          admin_login: '관리자 로그인',
          admin_registration: '관리자 등록',
          management: '관리',
          already_admin: '이미 관리자 계정이 있나요?',
          need_admin: '관리자 권한이 필요하신가요?',
          have_account: '이미 계정이 있나요?',
          no_account: '계정이 없나요?',
          passenger: '승객',

          common: {
            saving: '저장 중...',
            updating: '업데이트 중...',
            sending: '전송 중...',
            processing: '처리 중...',
            find: '찾기',
            change: '변경',
            hide: '숨기기',
            cancel: '취소',
            refresh: '새로고침',
            error_prefix: '오류: {{message}}',
            unknown: '알 수 없음',
            not_available: '해당 없음'
          },
          nav: {
            dashboard: '대시보드',
            admin: '관리자',
            settings: '설정',
            subscription: '구독'
          },
          affiliate: {
            badge: 'Партнёрская программа',
            hero_title: 'Продвигайте Supertez и получайте вознаграждение за каждого водителя.',
            hero_subtitle: 'Делитесь своей уникальной ссылкой регистрации водителей. Отслеживайте результаты в своей CRM.',
            cta_join: 'Стать блогером',
            cta_login: 'Вход для блогера',
            cta_dashboard: 'Перейти в CRM блогера',
            panel_title: 'Инструменты продвижения',
            panel_subtitle: 'Каждая регистрация водителя отслеживается по вашей ссылке.',
            panel_item_one: 'Уникальная ссылка',
            panel_item_one_sub: 'У каждого блогера своя ссылка на регистрацию водителя.',
            panel_item_two: 'CRM-панель',
            panel_item_two_sub: 'Смотрите, кто зарегистрировался и сколько водителей пришло.',
            step_one_title: 'Зарегистрируйтесь как блогер',
            step_one_body: 'Создайте аккаунт за несколько минут.',
            step_two_title: 'Поделитесь ссылкой',
            step_two_body: 'Отправьте ссылку регистрации водителя своей аудитории.',
            step_three_title: 'Отслеживайте результат',
            step_three_body: 'Новые регистрации появятся в вашей CRM.',
            dashboard_title: 'CRM блогера',
            dashboard_subtitle: 'Отслеживайте водителей, пришедших по вашей ссылке.',
            status_active: 'Активен',
            link_title: 'Ваша ссылка регистрации водителя',
            link_subtitle: 'Поделитесь ссылкой для учёта регистраций.',
            copy_button: 'Копировать',
            copied: 'Скопировано!',
            copy_failed: 'Не удалось скопировать',
            total_drivers: 'Всего водителей',
            total_hint: 'Счётчик обновляется после регистрации водителя.',
            driver_list: 'Водители по вашей ссылке',
            table: {
              name: 'Имя',
              contact: 'Контакт',
              city: 'Город',
              date: 'Дата регистрации'
            },
            empty: 'Пока нет регистраций.',
            showcase_one: 'Быстрее автобуса, дешевле такси',
            showcase_two: 'Маршруты и бронирование в реальном времени'
          },
          roles: {
            owner: '소유자',
            admin: '관리자',

            client: '고객'
          },
          payment: {
            cash: '현금',
            card: '카드'
          },
          status: {
            pending: '대기 중',
            driver_assigned: '기사 배정됨',
            driver_arrived: '기사 도착',
            in_progress: '진행 중',
            completed: '완료됨',
            cancelled: '취소됨'
          },
          subscription: {
            title: '구독',
            subtitle: '기사 구독 관리',
            current: {
              title: '현재 상태',
              active: '구독이 활성 상태입니다',
              inactive: '활성 구독 없음',
              status_label: '상태',
              days_remaining: '남은 일수',
              days_count: '{{count}}일',
              expires_on: '만료일',
              free_title: '무료 이용 권한 부여됨',
              free_desc: '관리자가 {{days}}일 무료 이용을 부여했습니다.',
              auto_title: '자동 갱신 활성',
              auto_desc: '{{date}}에 자동으로 갱신됩니다.',
              none_title: '활성 구독 없음',
              none_desc: '구독하여 고객 요청을 받으세요.'
            },
            subscribe: {
              title: '지금 구독',
              subtitle: '요청을 받기 위한 플랜을 선택하세요',
              plan_title: '기사 구독',
              plan_subtitle: '요청에 대한 전체 접근',
              per_month: '매월',
              feature_unlimited: '{{days}}일 동안 무제한 요청',
              feature_realtime: '새 요청 실시간 알림',
              feature_custom_offers: '고객에게 맞춤 가격 제안',
              feature_auto_renew: '자동 갱신 옵션',
              loading_paypal: 'PayPal 로딩 중...',
              note: '참고: 구독은 {{days}}일마다 자동 갱신됩니다. PayPal에서 언제든지 취소할 수 있습니다.'
            },
            free_trial: {
              title: '더 시간이 필요하신가요?',
              subtitle: '플랫폼을 시험하기 위해 {{days}}일 무료 이용을 요청하세요',
              button: '무료 이용 요청'
            },
            faq: {
              title: '자주 묻는 질문',
              q1: '구독은 어떻게 작동하나요?',
              a1: 'PayPal로 매월 ${{price}} 결제하면 {{days}}일 동안 무제한 요청을 받을 수 있습니다.',
              q2: '언제든지 취소할 수 있나요?',
              a2: '네! PayPal에서 언제든지 취소할 수 있으며 현재 기간이 끝날 때까지 이용 가능합니다.',
              q3: '구독이 만료되면 어떻게 되나요?',
              a3: '갱신 전까지 새로운 요청을 받을 수 없습니다. 계정은 유지됩니다.'
            },
            messages: {
              activated: '구독이 활성화되었습니다!',
              free_trial_requested: '무료 체험 요청이 관리자에게 전송되었습니다. 승인 후 알림을 받습니다.'
            },
            errors: {
              load_profile: '프로필을 불러오지 못했습니다',
              activate: '구독 활성화 오류: {{message}}',
              payment_failed: '결제에 실패했습니다. 다시 시도해주세요.'
            },
            status: {
              active: '활성',
              free: '무료 이용',
              expired: '만료됨',
              cancelled: '취소됨',
              inactive: '비활성',
              none: '구독 없음'
            }
          },
          login: {
            reset_title: '비밀번호 재설정',
            reset_subtitle: '재설정 링크를 받을 이메일을 입력하세요',
            email_label: '이메일',
            email_placeholder: 'your@email.com',
            send_reset_link: '재설정 링크 보내기',
            back_to_login: '로그인으로 돌아가기',
            title: 'Supertez에 오신 것을 환영합니다',
            subtitle: '계정에 로그인하세요',
            password_label: '비밀번호',
            password_placeholder: '••••••••',
            hide_password: '비밀번호 숨기기',
            show_password: '비밀번호 보기',
            remember_me: '로그인 상태 유지',
            forgot_password: '비밀번호를 잊으셨나요?',
            signing_in: '로그인 중...',
            sign_in: '로그인',
            no_account: '계정이 없나요?',
            sign_up: '가입하기',
            demo: '데모: {{email}}로 소유자 계정에 접속',
            reset_success: '비밀번호 재설정 이메일을 보냈습니다.',
            errors: {
              no_user: '사용자 데이터가 없습니다',
              sign_in_failed: '로그인 실패. 정보를 확인하세요.',
              reset_failed: '재설정 이메일을 보내지 못했습니다'
            }
          },
          register: {
            title: '계정 만들기',
            subtitle: 'Supertez에 참여하세요',
            role_label: '저는',
            role_client: '차량 이용',
            role_driver: '운전 및 수익',
            full_name: '이름',
            full_name_placeholder: '홍길동',
            email: '이메일',
            email_placeholder: 'you@example.com',
            phone_label: '전화번호 (고객 및 기사 필수)',
            phone_placeholder: '+7 700 123 4567',
            city: '도시',
            city_placeholder: '알마티',
            password: '비밀번호',
            confirm_password: '비밀번호 확인',
            submit: '계정 만들기',
            have_account: '이미 계정이 있나요?',
            sign_in: '로그인',
            success_alert: '등록 완료! 이메일을 확인하고 인증 후 로그인하세요.',
            errors: {
              phone_required: '전화번호는 고객과 기사에게 필수입니다',
              password_mismatch: '비밀번호가 일치하지 않습니다',
              password_length: '비밀번호는 6자 이상이어야 합니다',
              register_failed: '등록에 실패했습니다'
            }
          },
          update_password: {
            title: '새 비밀번호 설정',
            subtitle: '새 비밀번호를 입력하세요',
            new_password: '새 비밀번호',
            confirm_password: '비밀번호 확인',
            password_placeholder: '••••••••',
            hide_password: '비밀번호 숨기기',
            show_password: '비밀번호 보기',
            hide_confirm_password: '확인 비밀번호 숨기기',
            show_confirm_password: '확인 비밀번호 보기',
            min_length: '최소 6자',
            update_button: '비밀번호 업데이트',
            success_title: '비밀번호 업데이트 완료!',
            success_subtitle: '비밀번호가 성공적으로 변경되었습니다.',
            redirecting: '로그인으로 이동 중...',
            errors: {
              invalid_link: '잘못되었거나 만료된 링크입니다. 새 링크를 요청하세요.',
              password_length: '비밀번호는 6자 이상이어야 합니다',
              password_mismatch: '비밀번호가 일치하지 않습니다',
              update_failed: '비밀번호를 업데이트하지 못했습니다'
            }
          },
          auth: {
            phone_label: '전화번호 (고객 및 기사 필수)',
            messages: {
              account_created: '계정 생성 완료! 로그인 중...'
            },
            errors: {
              phone_required: '전화번호는 고객과 기사에게 필수입니다.',
              login_after_register_failed: '계정은 생성되었지만 로그인에 실패했습니다. 수동으로 로그인하세요.'
            },
            placeholders: {
              full_name: '홍길동',
              phone: '+7 700 123 4567',
              email: 'email@example.com'
            }
          },
          account: {
            title: '계정 설정',
            subtitle: '프로필, 이메일, 비밀번호를 관리합니다.',
            profile: {
              title: '프로필',
              uploading: '업로드 중...',
              upload_photo: '사진 업로드',
              full_name: '이름',
              phone: '전화번호',
              phone_placeholder: '+7 700 123 4567',
              photo_url: '사진 URL (선택)',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: '프로필 저장'
            },
            email: {
              title: '이메일',
              current: '현재 이메일',
              new: '새 이메일',
              placeholder: 'new@email.com',
              note: 'Supabase에서 이메일 확인이 활성화되어 있으면 확인 메일이 전송됩니다.',
              update: '이메일 업데이트'
            },
            password: {
              title: '비밀번호',
              new: '새 비밀번호',
              confirm: '비밀번호 확인',
              placeholder: '••••••••',
              update: '비밀번호 업데이트'
            },
            messages: {
              profile_updated: '프로필이 업데이트되었습니다.',
              email_update_requested: '이메일 변경 요청을 보냈습니다. 확인 메일을 확인하세요.',
              password_updated: '비밀번호가 업데이트되었습니다.',
              photo_updated: '사진이 업데이트되었습니다.'
            },
            errors: {
              login_required: '계정 관리를 위해 다시 로그인하세요.',
              phone_required: '전화번호는 고객과 기사에게 필수입니다.',
              profile_update_failed: '프로필 업데이트 실패',
              email_empty: '이메일은 비워둘 수 없습니다.',
              email_update_failed: '이메일 업데이트 실패',
              password_length: '비밀번호는 6자 이상이어야 합니다',
              password_mismatch: '비밀번호가 일치하지 않습니다',
              password_update_failed: '비밀번호 업데이트 실패',
              avatar_url_failed: '아바타 URL을 가져오지 못했습니다.',
              photo_upload_failed: '사진 업로드 실패. avatars 버킷과 공개 정책을 확인하세요.'
            }
          },
          admin: {
            title: '관리자 대시보드',
            subtitle: '운행과 기사를 관리합니다',
            tabs: {
              rides: '전체 운행',
              drivers: '기사'
            },
            search_placeholder: '운행 검색...',
            status_all: '모든 상태',
            table: {
              id: 'ID',
              route: '경로',
              client: '고객',

              price: '요금',
              status: '상태',
              date: '날짜'
            },
            not_assigned: '미배정',
            driver_management: '기사 관리',
            drivers_table: {

              contact: '연락처',
              city: '도시',
              joined: '가입일',
              status: '상태'
            }
          },
          owner: {
            title: '소유자 대시보드',
            welcome: '{{name}}님, 다시 오신 것을 환영합니다',
            tabs: {
              overview: '개요',
              drivers: '기사',
              settings: '설정',
              finance: '재무'
            },
            stats: {
              total_rides: '총 운행',
              total_revenue: '총 수익',
              active_drivers: '활성 기사',
              total_clients: '총 고객'
            },
            driver_management: {
              title: '기사 관리',
              subtitle: '기사 구독 및 접근 관리'
            },
            drivers_table: {

              location: '지역',
              status: '상태',
              expires: '만료',
              actions: '작업'
            },
            actions: {
              grant_free: '무료 권한',
              revoke: '회수'
            },
            settings: {
              title: '앱 설정',
              pricing: {
                title: '요금 설정',
                mode: '요금 방식',
                fixed: '고정 요금',
                per_km: '킬로미터당',
                currency: '통화',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: '고정 요금',
                per_km_amount: 'km당 요금'
              },
              subscription: {
                title: '기사 구독',
                require: '기사 구독 요구',
                price: '구독 가격',
                period_days: '기간(일)',
                default_free_days: '기본 무료 일수'
              },
              paypal: {
                title: 'PayPal 설정',
                client_id: 'PayPal Client ID',
                placeholder: 'PayPal Client ID 입력'
              },
              save: '설정 저장'
            },
            finance: {
              title: '재무 개요',
              coming_soon: '자세한 재무 보고서가 곧 제공됩니다...',
              total_revenue: '총 수익: ${{amount}}'
            },
            grant_modal: {
              title: '무료 이용 부여',
              description: '{{name}}에게 무료 이용 부여',
              days_label: '일수',
              days_placeholder: '예: 30',
              grant_button: '이용 부여'
            },
            messages: {
              settings_saved: '설정이 저장되었습니다!',
              free_access_granted: '{{name}}에게 {{days}}일 무료 이용을 부여했습니다'
            },
            confirm_revoke: '이 기사 접근 권한을 회수하시겠습니까?'
          },
          chat: {
            title: '운행 채팅',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: '대시보드로 돌아가기',
            no_messages: '메시지가 없습니다.',
            placeholder: '메시지를 입력하세요...',
            send: '보내기',
            errors: {
              ride_not_found: '운행을 찾을 수 없습니다.',
              login_required: '다시 로그인해주세요.',
              no_access: '이 채팅에 접근할 수 없습니다.',
              send_failed: '메시지 전송에 실패했습니다.'
            }
          },
          client: {
            account_settings: '계정 설정',
            gps: {
              https_required: 'GPS는 HTTPS가 필요합니다. {{url}}을 여세요',
              not_supported: '이 브라우저는 위치 정보를 지원하지 않습니다.',
              blocked: '위치 정보가 차단되었습니다. 브라우저에서 허용 후 GPS를 켜세요.',
              requesting: '위치 권한 요청 중...',
              detected_city: '감지된 도시: {{city}}',
              detected: '위치가 감지되었습니다.',
              denied: '위치 권한이 거부되었습니다. 허용 후 GPS를 켜세요.',
              enable_button: 'GPS 켜기',
              hint: '이미 차단된 경우 주소창의 자물쇠 아이콘에서 위치를 허용한 뒤 다시 눌러주세요.'
            },
            city_lock: '주소 검색은 {{city}}로 제한됩니다.',
            city_lock_default: '현재 지역',
            map: {
              instructions: '지도에서 픽업(A)과 하차(B)를 선택하거나 아래 버튼을 사용하세요',
              tile_error: '지도 타일을 불러오지 못했습니다. MapTiler 키를 확인하세요.',
              pickup: '픽업',
              dropoff: '하차',
              driver_location: '기사 위치'
            },
            active: {
              title: '진행 중인 운행',
              status_pending: '기사 찾는 중...',
              status_assigned: '기사 배정됨!',
              status_arrived: '기사가 도착했습니다!',
              status_in_progress: '운행 중',
              status_label: '상태: {{status}}',
              cancel: '운행 취소',
              price: '요금',
              payment: '결제',
              waiting_title: '기사 대기 중...',
              waiting_subtitle: '근처 기사가 요청을 수락합니다',
              driver_title: '기사',
              driver_assigned: '기사 배정됨',
              call: '전화',
              show_phone: '전화번호 보기',
              open_chat: '채팅 열기',
              unread: '{{count}} 새 메시지',
              driver_distance: '기사 거리: {{km}} km',
              eta: '도착 예정: {{minutes}}분',
              speed: '속도: {{speed}} km/h',
              heading: '방향: {{heading}}°'
            },
            notifications: {
              title: '라이드 업데이트',
              driver_assigned: '기사가 요청을 수락했습니다!',
              driver_arrived: '기사가 도착했습니다.',
              trip_started: '운행이 시작되었습니다.',
              request_created: '요청이 생성되었습니다! 기사 대기 중...',
              ride_cancelled: '운행이 취소되었습니다'
            },
            errors: {
              send_message_failed: '메시지 전송 실패',
              create_ride_failed: '운행 생성 실패',
              location_outside: '{{area}} 내 위치를 선택하세요.',
              city_inside: '{{city}} 안에서',
              city_nearby: '현재 도시 근처에서',
              no_results_city: '{{city}}에서 결과가 없습니다. 다른 주소를 입력하세요.',
              no_results: '검색 결과가 없습니다.'
            },
            confirm_cancel: '이 운행을 취소하시겠습니까?',
            request: {
              title: '운행 요청'
            },
            select_on_map: '지도에서 선택',
            select_on_map_active: '지도에서 클릭...',
            pickup: {
              title: '픽업 위치',
              placeholder_city: '{{city}}에서 픽업 주소 입력',
              placeholder: '픽업 주소 입력',
              helper: '위 결과를 선택하거나 지도에서 클릭하세요',
              none: '픽업 위치가 선택되지 않았습니다'
            },
            dropoff: {
              title: '하차 위치',
              placeholder_city: '{{city}}에서 하차 주소 입력',
              placeholder: '하차 주소 입력',
              helper: '위 결과를 선택하거나 지도에서 클릭하세요',
              none: '하차 위치가 선택되지 않았습니다'
            },
            options: {
              passengers: '승객',
              payment_method: '결제 방법'
            },
            price: {
              estimated: '예상 요금',
              distance: '거리',
              creating: '요청 생성 중...',
              request: '운행 요청'
            }
          },
          driver: {
            account_settings: '계정 설정',
            gps: {
              https_required: 'GPS는 HTTPS가 필요합니다. {{url}}을 여세요',
              not_supported: '브라우저에서 위치 정보를 지원하지 않습니다',
              blocked: '위치 정보가 차단되었습니다. 허용 후 GPS를 켜세요.',
              requesting: '위치 권한 요청 중...',
              detected_city: '감지된 도시: {{city}}',
              detected: '위치가 감지되었습니다.',
              denied: '위치 권한이 거부되었습니다. 허용 후 GPS를 켜세요.',
              denied_short: '위치 권한이 거부되었습니다. 허용해주세요.',
              enable_button: 'GPS 켜기',
              hint: '이미 차단된 경우 자물쇠 아이콘에서 위치를 허용한 뒤 다시 눌러주세요.',
              enable_location: '위치 켜기'
            },
            errors: {
              load_profile: '프로필을 불러오지 못했습니다',
              send_message_failed: '메시지 전송 실패',
              ride_already_taken: '다른 기사가 이미 수락했습니다.',
              accept_failed: '운행 수락 실패'
            },
            subscription_required: {
              title: '구독 필요',
              subtitle: '요청을 받으려면 활성 구독이 필요합니다.',
              feature: '{{days}}일 동안 무제한 요청',
              subscribe: '구독하기'
            },
            active: {
              title: '활성 운행',
              status: '상태',
              earnings: '수익',
              start_ride: '운행 시작',
              complete_ride: '운행 완료',
              client: '고객',
              client_default: '고객',
              call: '전화',
              show_phone: '전화번호 보기',
              open_chat: '채팅 열기',
              unread: '{{count}} 새 메시지'
            },
            map: {
              pickup_location: '픽업 위치',
              pickup: '픽업',
              dropoff: '하차',
              you_are_here: '현재 위치',
              tile_error: '지도 타일을 불러오지 못했습니다. MapTiler 키를 확인하세요.'
            },
            available: {
              title: '이용 가능한 운행',
              none_title: '이용 가능한 운행 없음',
              none_with_location: '주변에 요청이 없습니다. 근처 픽업을 확인 중입니다.',
              none_without_location: '위치를 켜면 근처 운행을 볼 수 있습니다',
              accept: '운행 수락',
              passengers: '{{count}}명'
            }
          }
        }
      },
      ja: {
        translation: {
          slogan: 'バスより速く、タクシーより安い',
          welcome: 'Supertezへようこそ',


          book_ride: '乗車を予約',
          pickup: '乗車地点',
          dropoff: '降車地点',
          passengers: '乗客',
          price: '料金',
          book_now: '今すぐ予約',
          driver_dashboard: 'ドライバーダッシュボード',
          admin_settings: '管理者設定',
          role: '役割',
          email: 'メール',
          password: 'パスワード',
          full_name: '氏名',
          logout: 'ログアウト',
          pending_rides: '受付待ちの依頼',
          accept: '承諾',
          pricing_mode: '料金方式',
          fixed_price: '固定料金',
          per_km: '1kmあたり',
          update_settings: '設定を更新',
          distance: '距離',
          forgot_password: 'パスワードをお忘れですか？',
          send_reset_link: '再設定リンクを送信',
          reset_link_sent: '再設定リンクをメールで送信しました。',

          new_password: '新しいパスワード',
          back_to_login: 'ログインに戻る',
          detecting_location: '位置情報を取得中...',
          subscription_required: 'サブスクリプションが必要',
          subscription_desc: '依頼を受けるには有効なサブスクリプションが必要です。',
          subscribe_now: '今すぐ購読',
          subscription_price: 'サブスクリプション料金',
          driver_settings: 'ドライバー設定',
          require_subscription: 'ドライバー購読を必須にする',
          manage_drivers: 'ドライバー管理',
          grant_access: '無料アクセスを付与',
          days: '日',
          expires_at: '期限',
          pay_with_paypal: 'PayPalで支払う',
          admin_portal: '管理者ポータル',
          admin_login: '管理者ログイン',
          admin_registration: '管理者登録',
          management: '管理',
          already_admin: 'すでに管理者アカウントがありますか？',
          need_admin: '管理者アクセスが必要ですか？',
          have_account: 'アカウントをお持ちですか？',
          no_account: 'アカウントがありませんか？',
          passenger: '乗客',

          common: {
            saving: '保存中...',
            updating: '更新中...',
            sending: '送信中...',
            processing: '処理中...',
            find: '検索',
            change: '変更',
            hide: '非表示',
            cancel: 'キャンセル',
            refresh: '更新',
            error_prefix: 'エラー: {{message}}',
            unknown: '不明',
            not_available: 'N/A'
          },
          nav: {
            dashboard: 'ダッシュボード',
            admin: '管理',
            settings: '設定',
            subscription: 'サブスクリプション'
          },
          affiliate: {
            badge: 'Партнёрская программа',
            hero_title: 'Продвигайте Supertez и получайте вознаграждение за каждого водителя.',
            hero_subtitle: 'Делитесь своей уникальной ссылкой регистрации водителей. Отслеживайте результаты в своей CRM.',
            cta_join: 'Стать блогером',
            cta_login: 'Вход для блогера',
            cta_dashboard: 'Перейти в CRM блогера',
            panel_title: 'Инструменты продвижения',
            panel_subtitle: 'Каждая регистрация водителя отслеживается по вашей ссылке.',
            panel_item_one: 'Уникальная ссылка',
            panel_item_one_sub: 'У каждого блогера своя ссылка на регистрацию водителя.',
            panel_item_two: 'CRM-панель',
            panel_item_two_sub: 'Смотрите, кто зарегистрировался и сколько водителей пришло.',
            step_one_title: 'Зарегистрируйтесь как блогер',
            step_one_body: 'Создайте аккаунт за несколько минут.',
            step_two_title: 'Поделитесь ссылкой',
            step_two_body: 'Отправьте ссылку регистрации водителя своей аудитории.',
            step_three_title: 'Отслеживайте результат',
            step_three_body: 'Новые регистрации появятся в вашей CRM.',
            dashboard_title: 'CRM блогера',
            dashboard_subtitle: 'Отслеживайте водителей, пришедших по вашей ссылке.',
            status_active: 'Активен',
            link_title: 'Ваша ссылка регистрации водителя',
            link_subtitle: 'Поделитесь ссылкой для учёта регистраций.',
            copy_button: 'Копировать',
            copied: 'Скопировано!',
            copy_failed: 'Не удалось скопировать',
            total_drivers: 'Всего водителей',
            total_hint: 'Счётчик обновляется после регистрации водителя.',
            driver_list: 'Водители по вашей ссылке',
            table: {
              name: 'Имя',
              contact: 'Контакт',
              city: 'Город',
              date: 'Дата регистрации'
            },
            empty: 'Пока нет регистраций.',
            showcase_one: 'Быстрее автобуса, дешевле такси',
            showcase_two: 'Маршруты и бронирование в реальном времени'
          },
          roles: {
            owner: 'オーナー',
            admin: '管理者',

            client: 'クライアント'
          },
          payment: {
            cash: '現金',
            card: 'カード'
          },
          status: {
            pending: '保留',
            driver_assigned: 'ドライバー割当',
            driver_arrived: 'ドライバー到着',
            in_progress: '進行中',
            completed: '完了',
            cancelled: 'キャンセル'
          },
          subscription: {
            title: 'サブスクリプション',
            subtitle: 'ドライバーのサブスク管理',
            current: {
              title: '現在の状態',
              active: 'サブスクリプションは有効です',
              inactive: '有効なサブスクリプションはありません',
              status_label: 'ステータス',
              days_remaining: '残り日数',
              days_count: '{{count}}日',
              expires_on: '有効期限',
              free_title: '無料アクセスが付与されました',
              free_desc: '管理者より{{days}}日分の無料アクセスが付与されています。',
              auto_title: '自動更新が有効です',
              auto_desc: '{{date}}に自動更新されます。',
              none_title: '有効なサブスクリプションはありません',
              none_desc: '今すぐ購読してリクエストを受け取りましょう。'
            },
            subscribe: {
              title: '今すぐ購読',
              subtitle: 'リクエストを受け取るプランを選択',
              plan_title: 'ドライバーサブスク',
              plan_subtitle: 'リクエストへのフルアクセス',
              per_month: '月額',
              feature_unlimited: '{{days}}日間の無制限リクエスト',
              feature_realtime: '新規リクエストのリアルタイム通知',
              feature_custom_offers: '顧客へのカスタム価格提案',
              feature_auto_renew: '自動更新オプションあり',
              loading_paypal: 'PayPalを読み込み中...',
              note: '注: サブスクリプションは{{days}}日ごとに自動更新されます。PayPalでいつでもキャンセルできます。'
            },
            free_trial: {
              title: 'もっと試したいですか？',
              subtitle: '{{days}}日間の無料アクセスを申請できます',
              button: '無料アクセスを申請'
            },
            faq: {
              title: 'よくある質問',
              q1: 'サブスクリプションはどのように機能しますか？',
              a1: 'PayPalで月額${{price}}を支払うと、{{days}}日間無制限にリクエストを受け取れます。',
              q2: 'いつでもキャンセルできますか？',
              a2: 'はい。PayPalからいつでもキャンセルできます。期間終了まで利用可能です。',
              q3: 'サブスクリプションが期限切れになると？',
              a3: '更新するまで新しいリクエストは届きません。アカウントは保持されます。'
            },
            messages: {
              activated: 'サブスクリプションが有効化されました！',
              free_trial_requested: '無料トライアルの申請を管理者に送信しました。承認後に通知します。'
            },
            errors: {
              load_profile: 'プロフィールを読み込めませんでした',
              activate: 'サブスク有効化エラー: {{message}}',
              payment_failed: '支払いに失敗しました。再度お試しください。'
            },
            status: {
              active: '有効',
              free: '無料アクセス',
              expired: '期限切れ',
              cancelled: 'キャンセル',
              inactive: '無効',
              none: 'サブスクなし'
            }
          },
          login: {
            reset_title: 'パスワード再設定',
            reset_subtitle: '再設定リンクを受け取るメールを入力',
            email_label: 'メール',
            email_placeholder: 'your@email.com',
            send_reset_link: '再設定リンクを送信',
            back_to_login: 'ログインに戻る',
            title: 'Supertezへようこそ',
            subtitle: 'アカウントにログイン',
            password_label: 'パスワード',
            password_placeholder: '••••••••',
            hide_password: 'パスワードを隠す',
            show_password: 'パスワードを表示',
            remember_me: 'ログインを保持',
            forgot_password: 'パスワードを忘れた場合',
            signing_in: 'ログイン中...',
            sign_in: 'ログイン',
            no_account: 'アカウントがありませんか？',
            sign_up: '登録する',
            demo: 'デモ: オーナー権限は {{email}} を使用',
            reset_success: '再設定メールを送信しました。',
            errors: {
              no_user: 'ユーザーデータがありません',
              sign_in_failed: 'ログインに失敗しました。情報を確認してください。',
              reset_failed: '再設定メールの送信に失敗しました'
            }
          },
          register: {
            title: 'アカウント作成',
            subtitle: 'Supertezに参加',
            role_label: '私は',
            role_client: '乗車したい',
            role_driver: '運転して稼ぎたい',
            full_name: '氏名',
            full_name_placeholder: '山田 太郎',
            email: 'メール',
            email_placeholder: 'you@example.com',
            phone_label: '電話番号（乗客・ドライバー必須）',
            phone_placeholder: '+7 700 123 4567',
            city: '都市',
            city_placeholder: 'アルマトイ',
            password: 'パスワード',
            confirm_password: 'パスワード確認',
            submit: 'アカウント作成',
            have_account: 'すでにアカウントがありますか？',
            sign_in: 'ログイン',
            success_alert: '登録完了！メールを確認し認証後にログインしてください。',
            errors: {
              phone_required: '電話番号は乗客とドライバーに必須です',
              password_mismatch: 'パスワードが一致しません',
              password_length: 'パスワードは6文字以上必要です',
              register_failed: '登録に失敗しました'
            }
          },
          update_password: {
            title: '新しいパスワード',
            subtitle: '新しいパスワードを入力してください',
            new_password: '新しいパスワード',
            confirm_password: 'パスワード確認',
            password_placeholder: '••••••••',
            hide_password: 'パスワードを隠す',
            show_password: 'パスワードを表示',
            hide_confirm_password: '確認用パスワードを隠す',
            show_confirm_password: '確認用パスワードを表示',
            min_length: '6文字以上',
            update_button: 'パスワード更新',
            success_title: 'パスワード更新完了',
            success_subtitle: 'パスワードが更新されました。',
            redirecting: 'ログインへ移動中...',
            errors: {
              invalid_link: 'リンクが無効または期限切れです。再度リクエストしてください。',
              password_length: 'パスワードは6文字以上必要です',
              password_mismatch: 'パスワードが一致しません',
              update_failed: 'パスワード更新に失敗しました'
            }
          },
          auth: {
            phone_label: '電話番号（乗客・ドライバー必須）',
            messages: {
              account_created: 'アカウント作成完了。ログイン中...'
            },
            errors: {
              phone_required: '電話番号は乗客とドライバーに必須です。',
              login_after_register_failed: 'アカウントは作成されましたがログインに失敗しました。手動でログインしてください。'
            },
            placeholders: {
              full_name: '山田 太郎',
              phone: '+7 700 123 4567',
              email: 'email@example.com'
            }
          },
          account: {
            title: 'アカウント設定',
            subtitle: 'プロフィール、メール、パスワードを管理します。',
            profile: {
              title: 'プロフィール',
              uploading: 'アップロード中...',
              upload_photo: '写真をアップロード',
              full_name: '氏名',
              phone: '電話番号',
              phone_placeholder: '+7 700 123 4567',
              photo_url: '写真URL（任意）',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: 'プロフィールを保存'
            },
            email: {
              title: 'メール',
              current: '現在のメール',
              new: '新しいメール',
              placeholder: 'new@email.com',
              note: 'Supabaseでメール確認が有効な場合、確認メールが届きます。',
              update: 'メール更新'
            },
            password: {
              title: 'パスワード',
              new: '新しいパスワード',
              confirm: 'パスワード確認',
              placeholder: '••••••••',
              update: 'パスワード更新'
            },
            messages: {
              profile_updated: 'プロフィールを更新しました。',
              email_update_requested: 'メール変更をリクエストしました。確認メールを確認してください。',
              password_updated: 'パスワードを更新しました。',
              photo_updated: '写真を更新しました。'
            },
            errors: {
              login_required: 'アカウント管理のため再ログインしてください。',
              phone_required: '電話番号は乗客とドライバーに必須です。',
              profile_update_failed: 'プロフィール更新に失敗しました。',
              email_empty: 'メールを空にできません。',
              email_update_failed: 'メール更新に失敗しました。',
              password_length: 'パスワードは6文字以上必要です。',
              password_mismatch: 'パスワードが一致しません。',
              password_update_failed: 'パスワード更新に失敗しました。',
              avatar_url_failed: 'アバターのURLを取得できません。',
              photo_upload_failed: '写真のアップロードに失敗しました。avatarsバケットと公開ポリシーを確認してください。'
            }
          },
          admin: {
            title: '管理者ダッシュボード',
            subtitle: '乗車とドライバーを管理',
            tabs: {
              rides: '全ての乗車',
              drivers: 'ドライバー'
            },
            search_placeholder: '乗車を検索...',
            status_all: '全てのステータス',
            table: {
              id: 'ID',
              route: 'ルート',
              client: 'クライアント',

              price: '料金',
              status: 'ステータス',
              date: '日付'
            },
            not_assigned: '未割当',
            driver_management: 'ドライバー管理',
            drivers_table: {

              contact: '連絡先',
              city: '都市',
              joined: '登録日',
              status: 'ステータス'
            }
          },
          owner: {
            title: 'オーナーダッシュボード',
            welcome: '{{name}}さん、おかえりなさい',
            tabs: {
              overview: '概要',
              drivers: 'ドライバー',
              settings: '設定',
              finance: '財務'
            },
            stats: {
              total_rides: '合計乗車数',
              total_revenue: '総売上',
              active_drivers: '稼働中ドライバー',
              total_clients: '総クライアント'
            },
            driver_management: {
              title: 'ドライバー管理',
              subtitle: 'ドライバーのサブスクとアクセスを管理'
            },
            drivers_table: {

              location: '場所',
              status: 'ステータス',
              expires: '期限',
              actions: '操作'
            },
            actions: {
              grant_free: '無料付与',
              revoke: '取り消し'
            },
            settings: {
              title: 'アプリ設定',
              pricing: {
                title: '料金設定',
                mode: '料金モード',
                fixed: '固定料金',
                per_km: 'kmあたり',
                currency: '通貨',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: '固定料金額',
                per_km_amount: 'km単価'
              },
              subscription: {
                title: 'ドライバーサブスク',
                require: 'ドライバーにサブスク必須',
                price: 'サブスク料金',
                period_days: '期間(日)',
                default_free_days: 'デフォルト無料日数'
              },
              paypal: {
                title: 'PayPal設定',
                client_id: 'PayPal Client ID',
                placeholder: 'PayPal Client IDを入力'
              },
              save: '設定を保存'
            },
            finance: {
              title: '財務概要',
              coming_soon: '詳細なレポートは近日公開...',
              total_revenue: '総売上: ${{amount}}'
            },
            grant_modal: {
              title: '無料アクセス付与',
              description: '{{name}}に無料アクセスを付与',
              days_label: '日数',
              days_placeholder: '例: 30',
              grant_button: '付与する'
            },
            messages: {
              settings_saved: '設定を保存しました！',
              free_access_granted: '{{name}}に{{days}}日分の無料アクセスを付与しました'
            },
            confirm_revoke: 'このドライバーのアクセスを取り消しますか？'
          },
          chat: {
            title: 'ライドチャット',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'ダッシュボードへ戻る',
            no_messages: 'まだメッセージはありません。',
            placeholder: 'メッセージを入力...',
            send: '送信',
            errors: {
              ride_not_found: '乗車が見つかりません。',
              login_required: '再ログインしてください。',
              no_access: 'このチャットにアクセスできません。',
              send_failed: 'メッセージの送信に失敗しました。'
            }
          },
          client: {
            account_settings: 'アカウント設定',
            gps: {
              https_required: 'GPSにはHTTPSが必要です。{{url}}を開いてください',
              not_supported: 'このブラウザは位置情報に対応していません。',
              blocked: '位置情報がブロックされています。許可してGPSを有効にしてください。',
              requesting: '位置情報を要求中...',
              detected_city: '検出された都市: {{city}}',
              detected: '位置を検出しました。',
              denied: '位置情報の許可が拒否されました。許可してGPSを有効にしてください。',
              enable_button: 'GPSを有効化',
              hint: 'すでにブロックされている場合、アドレスバーの鍵アイコンから許可してください。'
            },
            city_lock: '住所検索は{{city}}に制限されています。',
            city_lock_default: '現在のエリア',
            map: {
              instructions: '地図をタップして乗車(A)と降車(B)を選択するか、下のボタンを使用してください',
              tile_error: '地図タイルの読み込みに失敗しました。MapTilerキーを確認してください。',
              pickup: '乗車',
              dropoff: '降車',
              driver_location: 'ドライバー位置'
            },
            active: {
              title: '進行中の乗車',
              status_pending: 'ドライバーを探しています...',
              status_assigned: 'ドライバーが割り当てられました！',
              status_arrived: 'ドライバーが到着しました！',
              status_in_progress: '移動中',
              status_label: 'ステータス: {{status}}',
              cancel: '乗車をキャンセル',
              price: '料金',
              payment: '支払い',
              waiting_title: 'ドライバー待機中...',
              waiting_subtitle: '近くのドライバーがリクエストを受け付けます',
              driver_title: 'ドライバー',
              driver_assigned: 'ドライバー割当',
              call: '電話',
              show_phone: '電話番号を表示',
              open_chat: 'チャットを開く',
              unread: '{{count}}件の新着',
              driver_distance: 'ドライバー距離: {{km}} km',
              eta: '到着予定: {{minutes}}分',
              speed: '速度: {{speed}} km/h',
              heading: '方角: {{heading}}°'
            },
            notifications: {
              title: '乗車更新',
              driver_assigned: 'ドライバーがリクエストを承認しました！',
              driver_arrived: 'ドライバーが到着しました。',
              trip_started: '乗車が開始されました。',
              request_created: 'リクエストを作成しました。ドライバー待機中...',
              ride_cancelled: '乗車をキャンセルしました'
            },
            errors: {
              send_message_failed: 'メッセージ送信に失敗しました',
              create_ride_failed: '乗車作成に失敗しました',
              location_outside: '{{area}}内の場所を選択してください。',
              city_inside: '{{city}}内',
              city_nearby: '現在の都市付近',
              no_results_city: '{{city}}で結果がありません。別の住所を試してください。',
              no_results: '結果が見つかりません。'
            },
            confirm_cancel: 'この乗車をキャンセルしますか？',
            request: {
              title: '乗車を依頼'
            },
            select_on_map: '地図で選択',
            select_on_map_active: '地図をクリック...',
            pickup: {
              title: '乗車地点',
              placeholder_city: '{{city}}で乗車住所を入力',
              placeholder: '乗車住所を入力',
              helper: '上の結果を選ぶか地図をクリックしてください',
              none: '乗車地点が選択されていません'
            },
            dropoff: {
              title: '降車地点',
              placeholder_city: '{{city}}で降車住所を入力',
              placeholder: '降車住所を入力',
              helper: '上の結果を選ぶか地図をクリックしてください',
              none: '降車地点が選択されていません'
            },
            options: {
              passengers: '乗客',
              payment_method: '支払い方法'
            },
            price: {
              estimated: '見積り料金',
              distance: '距離',
              creating: 'リクエスト作成中...',
              request: '乗車を依頼'
            }
          },
          driver: {
            account_settings: 'アカウント設定',
            gps: {
              https_required: 'GPSにはHTTPSが必要です。{{url}}を開いてください',
              not_supported: 'このブラウザは位置情報に対応していません',
              blocked: '位置情報がブロックされています。許可してGPSを有効にしてください。',
              requesting: '位置情報を要求中...',
              detected_city: '検出された都市: {{city}}',
              detected: '位置を検出しました。',
              denied: '位置情報が拒否されました。許可してGPSを有効にしてください。',
              denied_short: '位置情報が拒否されました。許可してください。',
              enable_button: 'GPSを有効化',
              hint: 'ブロックされている場合は鍵アイコンから許可してください。',
              enable_location: '位置情報を有効化'
            },
            errors: {
              load_profile: 'プロフィールを読み込めませんでした',
              send_message_failed: 'メッセージ送信に失敗しました',
              ride_already_taken: '別のドライバーにより受諾済みです。',
              accept_failed: '乗車の受諾に失敗しました'
            },
            subscription_required: {
              title: 'サブスクが必要',
              subtitle: 'リクエストを受けるには有効なサブスクが必要です。',
              feature: '{{days}}日間の無制限リクエスト',
              subscribe: '購読する'
            },
            active: {
              title: 'アクティブな乗車',
              status: 'ステータス',
              earnings: '収益',
              start_ride: '乗車開始',
              complete_ride: '完了',
              client: 'クライアント',
              client_default: 'クライアント',
              call: '電話',
              show_phone: '電話番号を表示',
              open_chat: 'チャットを開く',
              unread: '{{count}}件の新着'
            },
            map: {
              pickup_location: '乗車地点',
              pickup: '乗車',
              dropoff: '降車',
              you_are_here: '現在地',
              tile_error: '地図タイルの読み込みに失敗しました。MapTilerキーを確認してください。'
            },
            available: {
              title: '利用可能な乗車',
              none_title: '利用可能な乗車はありません',
              none_with_location: '近くにリクエストがありません。周辺のピックアップも確認中です。',
              none_without_location: '位置情報を有効にすると近くの乗車が表示されます',
              accept: '受諾',
              passengers: '{{count}}人'
            }
          }
        }
      },
      ar: {
        translation: {
          slogan: 'أسرع من الحافلة، وأرخص من التاكسي',
          welcome: 'مرحبًا بك في Supertez',


          book_ride: 'حجز رحلة',
          pickup: 'موقع الالتقاط',
          dropoff: 'موقع الإنزال',
          passengers: 'الركاب',
          price: 'السعر',
          book_now: 'احجز الآن',
          driver_dashboard: 'لوحة السائق',
          admin_settings: 'إعدادات المدير',
          role: 'الدور',
          email: 'البريد الإلكتروني',
          password: 'كلمة المرور',
          full_name: 'الاسم الكامل',
          logout: 'تسجيل الخروج',
          pending_rides: 'طلبات معلّقة',
          accept: 'قبول',
          pricing_mode: 'طريقة التسعير',
          fixed_price: 'سعر ثابت',
          per_km: 'لكل كيلومتر',
          update_settings: 'تحديث الإعدادات',
          distance: 'المسافة',
          forgot_password: 'نسيت كلمة المرور؟',
          send_reset_link: 'إرسال رابط إعادة التعيين',
          reset_link_sent: 'تم إرسال رابط إعادة التعيين إلى بريدك.',

          new_password: 'كلمة مرور جديدة',
          back_to_login: 'العودة لتسجيل الدخول',
          detecting_location: 'جارٍ تحديد الموقع...',
          subscription_required: 'مطلوب اشتراك',
          subscription_desc: 'لاستلام الرحلات يجب أن يكون لديك اشتراك نشط.',
          subscribe_now: 'اشترك الآن',
          subscription_price: 'سعر الاشتراك',
          driver_settings: 'إعدادات السائقين',
          require_subscription: 'اشتراك السائق مطلوب',
          manage_drivers: 'إدارة السائقين',
          grant_access: 'منح وصول مجاني',
          days: 'أيام',
          expires_at: 'ينتهي في',
          pay_with_paypal: 'ادفع عبر PayPal',
          admin_portal: 'بوابة المدير',
          admin_login: 'تسجيل دخول المدير',
          admin_registration: 'تسجيل المدير',
          management: 'الإدارة',
          already_admin: 'هل لديك حساب مدير بالفعل؟',
          need_admin: 'هل تحتاج إلى وصول كمدير؟',
          have_account: 'هل لديك حساب؟',
          no_account: 'ليس لديك حساب؟',
          passenger: 'راكب',

          common: {
            saving: 'جارٍ الحفظ...',
            updating: 'جارٍ التحديث...',
            sending: 'جارٍ الإرسال...',
            processing: 'جارٍ المعالجة...',
            find: 'بحث',
            change: 'تغيير',
            hide: 'إخفاء',
            cancel: 'إلغاء',
            refresh: 'تحديث',
            error_prefix: 'خطأ: {{message}}',
            unknown: 'غير معروف',
            not_available: 'غير متوفر'
          },
          nav: {
            dashboard: 'لوحة التحكم',
            admin: 'المدير',
            settings: 'الإعدادات',
            subscription: 'الاشتراك'
          },
          affiliate: {
            badge: 'Партнёрская программа',
            hero_title: 'Продвигайте Supertez и получайте вознаграждение за каждого водителя.',
            hero_subtitle: 'Делитесь своей уникальной ссылкой регистрации водителей. Отслеживайте результаты в своей CRM.',
            cta_join: 'Стать блогером',
            cta_login: 'Вход для блогера',
            cta_dashboard: 'Перейти в CRM блогера',
            panel_title: 'Инструменты продвижения',
            panel_subtitle: 'Каждая регистрация водителя отслеживается по вашей ссылке.',
            panel_item_one: 'Уникальная ссылка',
            panel_item_one_sub: 'У каждого блогера своя ссылка на регистрацию водителя.',
            panel_item_two: 'CRM-панель',
            panel_item_two_sub: 'Смотрите, кто зарегистрировался и сколько водителей пришло.',
            step_one_title: 'Зарегистрируйтесь как блогер',
            step_one_body: 'Создайте аккаунт за несколько минут.',
            step_two_title: 'Поделитесь ссылкой',
            step_two_body: 'Отправьте ссылку регистрации водителя своей аудитории.',
            step_three_title: 'Отслеживайте результат',
            step_three_body: 'Новые регистрации появятся в вашей CRM.',
            dashboard_title: 'CRM блогера',
            dashboard_subtitle: 'Отслеживайте водителей, пришедших по вашей ссылке.',
            status_active: 'Активен',
            link_title: 'Ваша ссылка регистрации водителя',
            link_subtitle: 'Поделитесь ссылкой для учёта регистраций.',
            copy_button: 'Копировать',
            copied: 'Скопировано!',
            copy_failed: 'Не удалось скопировать',
            total_drivers: 'Всего водителей',
            total_hint: 'Счётчик обновляется после регистрации водителя.',
            driver_list: 'Водители по вашей ссылке',
            table: {
              name: 'Имя',
              contact: 'Контакт',
              city: 'Город',
              date: 'Дата регистрации'
            },
            empty: 'Пока нет регистраций.',
            showcase_one: 'Быстрее автобуса, дешевле такси',
            showcase_two: 'Маршруты и бронирование в реальном времени'
          },
          roles: {
            owner: 'المالك',
            admin: 'المدير',

            client: 'العميل'
          },
          payment: {
            cash: 'نقدًا',
            card: 'بطاقة'
          },
          status: {
            pending: 'قيد الانتظار',
            driver_assigned: 'تم تعيين سائق',
            driver_arrived: 'وصل السائق',
            in_progress: 'قيد التنفيذ',
            completed: 'مكتملة',
            cancelled: 'ملغاة'
          },
          subscription: {
            title: 'الاشتراك',
            subtitle: 'إدارة اشتراك السائق',
            current: {
              title: 'الحالة الحالية',
              active: 'اشتراكك نشط',
              inactive: 'لا يوجد اشتراك نشط',
              status_label: 'الحالة',
              days_remaining: 'الأيام المتبقية',
              days_count: '{{count}} يوم',
              expires_on: 'ينتهي في',
              free_title: 'تم منح وصول مجاني',
              free_desc: 'تم منحك {{days}} يومًا من الوصول المجاني من قبل الإدارة.',
              auto_title: 'التجديد التلقائي مفعل',
              auto_desc: 'سيتم تجديد اشتراكك تلقائيًا في {{date}}.',
              none_title: 'لا يوجد اشتراك نشط',
              none_desc: 'اشترك الآن لتلقي طلبات الركوب.'
            },
            subscribe: {
              title: 'اشترك الآن',
              subtitle: 'اختر خطة لتلقي طلبات الركوب',
              plan_title: 'اشتراك السائق',
              plan_subtitle: 'وصول كامل إلى الطلبات',
              per_month: 'شهريًا',
              feature_unlimited: 'طلبات غير محدودة لمدة {{days}} يومًا',
              feature_realtime: 'إشعارات فورية للطلبات الجديدة',
              feature_custom_offers: 'إرسال عروض أسعار مخصصة للعملاء',
              feature_auto_renew: 'خيار التجديد التلقائي متاح',
              loading_paypal: 'جارٍ تحميل PayPal...',
              note: 'ملاحظة: سيتم تجديد الاشتراك تلقائيًا كل {{days}} يومًا. يمكنك الإلغاء في أي وقت عبر حساب PayPal.'
            },
            free_trial: {
              title: 'هل تحتاج وقتًا أكثر؟',
              subtitle: 'اطلب {{days}} يومًا من الوصول المجاني لتجربة المنصة',
              button: 'طلب وصول مجاني'
            },
            faq: {
              title: 'الأسئلة الشائعة',
              q1: 'كيف يعمل الاشتراك؟',
              a1: 'ادفع ${{price}} شهريًا عبر PayPal لتحصل على طلبات غير محدودة لمدة {{days}} يومًا.',
              q2: 'هل يمكنني الإلغاء في أي وقت؟',
              a2: 'نعم! يمكنك الإلغاء في أي وقت عبر حساب PayPal، وسيظل وصولك حتى نهاية الفترة الحالية.',
              q3: 'ماذا يحدث إذا انتهى الاشتراك؟',
              a3: 'لن تتلقى طلبات جديدة حتى تقوم بالتجديد. حسابك يبقى نشطًا.'
            },
            messages: {
              activated: 'تم تفعيل الاشتراك بنجاح!',
              free_trial_requested: 'تم إرسال طلب الوصول المجاني للإدارة. سيتم إعلامك بعد الموافقة.'
            },
            errors: {
              load_profile: 'فشل تحميل الملف الشخصي',
              activate: 'خطأ في تفعيل الاشتراك: {{message}}',
              payment_failed: 'فشل الدفع. حاول مرة أخرى.'
            },
            status: {
              active: 'نشط',
              free: 'وصول مجاني',
              expired: 'منتهي',
              cancelled: 'ملغى',
              inactive: 'غير نشط',
              none: 'لا يوجد اشتراك'
            }
          },
          login: {
            reset_title: 'إعادة تعيين كلمة المرور',
            reset_subtitle: 'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين',
            email_label: 'البريد الإلكتروني',
            email_placeholder: 'your@email.com',
            send_reset_link: 'إرسال رابط إعادة التعيين',
            back_to_login: 'العودة لتسجيل الدخول',
            title: 'مرحبًا بك في Supertez',
            subtitle: 'سجّل الدخول إلى حسابك',
            password_label: 'كلمة المرور',
            password_placeholder: '••••••••',
            hide_password: 'إخفاء كلمة المرور',
            show_password: 'إظهار كلمة المرور',
            remember_me: 'تذكرني',
            forgot_password: 'نسيت كلمة المرور؟',
            signing_in: 'جارٍ تسجيل الدخول...',
            sign_in: 'تسجيل الدخول',
            no_account: 'ليس لديك حساب؟',
            sign_up: 'إنشاء حساب',
            demo: 'تجربة: استخدم {{email}} للوصول كمالك',
            reset_success: 'تم إرسال رسالة إعادة التعيين.',
            errors: {
              no_user: 'لا توجد بيانات للمستخدم',
              sign_in_failed: 'فشل تسجيل الدخول. تحقق من البيانات.',
              reset_failed: 'فشل إرسال بريد إعادة التعيين'
            }
          },
          register: {
            title: 'إنشاء حساب',
            subtitle: 'انضم إلى Supertez',
            role_label: 'أريد',
            role_client: 'طلب رحلة',
            role_driver: 'القيادة والربح',
            full_name: 'الاسم الكامل',
            full_name_placeholder: 'محمد أحمد',
            email: 'البريد الإلكتروني',
            email_placeholder: 'you@example.com',
            phone_label: 'رقم الهاتف (مطلوب للعملاء والسائقين)',
            phone_placeholder: '+7 700 123 4567',
            city: 'المدينة',
            city_placeholder: 'ألماتي',
            password: 'كلمة المرور',
            confirm_password: 'تأكيد كلمة المرور',
            submit: 'إنشاء حساب',
            have_account: 'لديك حساب بالفعل؟',
            sign_in: 'تسجيل الدخول',
            success_alert: 'تم التسجيل بنجاح! تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.',
            errors: {
              phone_required: 'رقم الهاتف مطلوب للعملاء والسائقين',
              password_mismatch: 'كلمتا المرور غير متطابقتين',
              password_length: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
              register_failed: 'فشل إنشاء الحساب'
            }
          },
          update_password: {
            title: 'تعيين كلمة مرور جديدة',
            subtitle: 'أدخل كلمة المرور الجديدة أدناه',
            new_password: 'كلمة مرور جديدة',
            confirm_password: 'تأكيد كلمة المرور',
            password_placeholder: '••••••••',
            hide_password: 'إخفاء كلمة المرور',
            show_password: 'إظهار كلمة المرور',
            hide_confirm_password: 'إخفاء تأكيد كلمة المرور',
            show_confirm_password: 'إظهار تأكيد كلمة المرور',
            min_length: 'على الأقل 6 أحرف',
            update_button: 'تحديث كلمة المرور',
            success_title: 'تم تحديث كلمة المرور!',
            success_subtitle: 'تم تحديث كلمة المرور بنجاح.',
            redirecting: 'جارٍ التحويل إلى تسجيل الدخول...',
            errors: {
              invalid_link: 'رابط غير صالح أو منتهي. اطلب رابطًا جديدًا.',
              password_length: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
              password_mismatch: 'كلمتا المرور غير متطابقتين',
              update_failed: 'فشل تحديث كلمة المرور'
            }
          },
          auth: {
            phone_label: 'رقم الهاتف (مطلوب للعملاء والسائقين)',
            messages: {
              account_created: 'تم إنشاء الحساب! جارٍ تسجيل الدخول...'
            },
            errors: {
              phone_required: 'رقم الهاتف مطلوب للعملاء والسائقين.',
              login_after_register_failed: 'تم إنشاء الحساب لكن فشل تسجيل الدخول. يرجى تسجيل الدخول يدويًا.'
            },
            placeholders: {
              full_name: 'محمد أحمد',
              phone: '+7 700 123 4567',
              email: 'email@example.com'
            }
          },
          account: {
            title: 'إعدادات الحساب',
            subtitle: 'إدارة الملف الشخصي والبريد وكلمة المرور.',
            profile: {
              title: 'الملف الشخصي',
              uploading: 'جارٍ الرفع...',
              upload_photo: 'تحميل صورة',
              full_name: 'الاسم الكامل',
              phone: 'الهاتف',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'رابط الصورة (اختياري)',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: 'حفظ الملف'
            },
            email: {
              title: 'البريد الإلكتروني',
              current: 'البريد الحالي',
              new: 'البريد الجديد',
              placeholder: 'new@email.com',
              note: 'إذا كان تأكيد البريد مفعّلًا في Supabase، ستتلقى رسالة تأكيد.',
              update: 'تحديث البريد'
            },
            password: {
              title: 'كلمة المرور',
              new: 'كلمة مرور جديدة',
              confirm: 'تأكيد كلمة المرور',
              placeholder: '••••••••',
              update: 'تحديث كلمة المرور'
            },
            messages: {
              profile_updated: 'تم تحديث الملف الشخصي.',
              email_update_requested: 'تم طلب تحديث البريد. تحقق من صندوق الوارد إذا كان التأكيد مفعّلًا.',
              password_updated: 'تم تحديث كلمة المرور.',
              photo_updated: 'تم تحديث الصورة.'
            },
            errors: {
              login_required: 'يرجى تسجيل الدخول مرة أخرى لإدارة الحساب.',
              phone_required: 'رقم الهاتف مطلوب للعملاء والسائقين.',
              profile_update_failed: 'فشل تحديث الملف الشخصي.',
              email_empty: 'لا يمكن أن يكون البريد فارغًا.',
              email_update_failed: 'فشل تحديث البريد.',
              password_length: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
              password_mismatch: 'كلمتا المرور غير متطابقتين.',
              password_update_failed: 'فشل تحديث كلمة المرور.',
              avatar_url_failed: 'تعذر الحصول على رابط الصورة.',
              photo_upload_failed: 'فشل رفع الصورة. تأكد من وجود حاوية avatars وسياسات القراءة العامة.'
            }
          },
          admin: {
            title: 'لوحة المدير',
            subtitle: 'إدارة الرحلات والسائقين',
            tabs: {
              rides: 'كل الرحلات',
              drivers: 'السائقون'
            },
            search_placeholder: 'ابحث عن الرحلات...',
            status_all: 'كل الحالات',
            table: {
              id: 'المعرّف',
              route: 'المسار',
              client: 'العميل',

              price: 'السعر',
              status: 'الحالة',
              date: 'التاريخ'
            },
            not_assigned: 'غير مخصص',
            driver_management: 'إدارة السائقين',
            drivers_table: {

              contact: 'التواصل',
              city: 'المدينة',
              joined: 'تاريخ الانضمام',
              status: 'الحالة'
            }
          },
          owner: {
            title: 'لوحة المالك',
            welcome: 'مرحبًا بعودتك، {{name}}',
            tabs: {
              overview: 'نظرة عامة',
              drivers: 'السائقون',
              settings: 'الإعدادات',
              finance: 'المالية'
            },
            stats: {
              total_rides: 'إجمالي الرحلات',
              total_revenue: 'إجمالي الإيرادات',
              active_drivers: 'السائقون النشطون',
              total_clients: 'إجمالي العملاء'
            },
            driver_management: {
              title: 'إدارة السائقين',
              subtitle: 'إدارة الاشتراكات والوصول'
            },
            drivers_table: {

              location: 'الموقع',
              status: 'الحالة',
              expires: 'ينتهي',
              actions: 'الإجراءات'
            },
            actions: {
              grant_free: 'منح مجاني',
              revoke: 'إلغاء'
            },
            settings: {
              title: 'إعدادات التطبيق',
              pricing: {
                title: 'إعدادات التسعير',
                mode: 'وضع التسعير',
                fixed: 'سعر ثابت',
                per_km: 'لكل كم',
                currency: 'العملة',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'قيمة السعر الثابت',
                per_km_amount: 'السعر لكل كم'
              },
              subscription: {
                title: 'اشتراك السائق',
                require: 'اشتراك السائق مطلوب',
                price: 'سعر الاشتراك',
                period_days: 'المدة (أيام)',
                default_free_days: 'الأيام المجانية الافتراضية'
              },
              paypal: {
                title: 'إعدادات PayPal',
                client_id: 'معرّف PayPal',
                placeholder: 'أدخل معرّف PayPal'
              },
              save: 'حفظ الإعدادات'
            },
            finance: {
              title: 'نظرة مالية',
              coming_soon: 'تقارير مالية مفصلة قريبًا...',
              total_revenue: 'إجمالي الإيرادات: ${{amount}}'
            },
            grant_modal: {
              title: 'منح وصول مجاني',
              description: 'منح وصول مجاني لـ {{name}}',
              days_label: 'عدد الأيام',
              days_placeholder: 'مثال: 30',
              grant_button: 'منح الوصول'
            },
            messages: {
              settings_saved: 'تم حفظ الإعدادات بنجاح!',
              free_access_granted: 'تم منح {{days}} يومًا من الوصول المجاني لـ {{name}}'
            },
            confirm_revoke: 'هل أنت متأكد من إلغاء وصول هذا السائق؟'
          },
          chat: {
            title: 'دردشة الرحلة',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'العودة للوحة التحكم',
            no_messages: 'لا توجد رسائل بعد.',
            placeholder: 'اكتب رسالة...',
            send: 'إرسال',
            errors: {
              ride_not_found: 'لم يتم العثور على الرحلة.',
              login_required: 'يرجى تسجيل الدخول مجددًا.',
              no_access: 'ليس لديك صلاحية لهذا الدردشة.',
              send_failed: 'فشل إرسال الرسالة.'
            }
          },
          client: {
            account_settings: 'إعدادات الحساب',
            gps: {
              https_required: 'يتطلب GPS بروتوكول HTTPS. افتح {{url}}',
              not_supported: 'المتصفح لا يدعم تحديد الموقع.',
              blocked: 'تم حظر الموقع. اسمح بالموقع ثم فعّل GPS.',
              requesting: 'جارٍ طلب إذن الموقع...',
              detected_city: 'المدينة المكتشفة: {{city}}',
              detected: 'تم تحديد الموقع.',
              denied: 'تم رفض إذن الموقع. اسمح بالموقع ثم فعّل GPS.',
              enable_button: 'تفعيل GPS',
              hint: 'إذا كان محظورًا، اضغط رمز القفل في المتصفح واسمح بالموقع ثم أعد المحاولة.'
            },
            city_lock: 'بحث العنوان محدود بـ {{city}}.',
            city_lock_default: 'منطقتك الحالية',
            map: {
              instructions: 'اضغط على الخريطة لاختيار نقطة الالتقاط (A) والإنزال (B) أو استخدم الأزرار أدناه',
              tile_error: 'تعذر تحميل الخريطة. تحقق من مفتاح MapTiler.',
              pickup: 'الالتقاط',
              dropoff: 'الإنزال',
              driver_location: 'موقع السائق'
            },
            active: {
              title: 'الرحلة النشطة',
              status_pending: 'جارٍ البحث عن سائق...',
              status_assigned: 'تم تعيين سائق!',
              status_arrived: 'وصل السائق!',
              status_in_progress: 'الرحلة قيد التنفيذ',
              status_label: 'الحالة: {{status}}',
              cancel: 'إلغاء الرحلة',
              price: 'السعر',
              payment: 'الدفع',
              waiting_title: 'بانتظار السائقين...',
              waiting_subtitle: 'سائق قريب سيقبل طلبك',
              driver_title: 'السائق',
              driver_assigned: 'تم تعيين السائق',
              call: 'اتصال',
              show_phone: 'إظهار الرقم',
              open_chat: 'فتح الدردشة',
              unread: '{{count}} جديد',
              driver_distance: 'مسافة السائق: {{km}} كم',
              eta: 'وقت الوصول: {{minutes}} دقيقة',
              speed: 'السرعة: {{speed}} كم/س',
              heading: 'الاتجاه: {{heading}}°'
            },
            notifications: {
              title: 'تحديث الرحلة',
              driver_assigned: 'السائق قبل طلبك!',
              driver_arrived: 'وصل السائق.',
              trip_started: 'بدأت الرحلة.',
              request_created: 'تم إنشاء الطلب! بانتظار السائقين...',
              ride_cancelled: 'تم إلغاء الرحلة'
            },
            errors: {
              send_message_failed: 'فشل إرسال الرسالة',
              create_ride_failed: 'فشل إنشاء الرحلة',
              location_outside: 'يرجى اختيار موقع ضمن {{area}}.',
              city_inside: 'داخل {{city}}',
              city_nearby: 'قريب من مدينتك',
              no_results_city: 'لا توجد نتائج في {{city}}. جرّب عنوانًا آخر.',
              no_results: 'لا توجد نتائج.'
            },
            confirm_cancel: 'هل تريد إلغاء هذه الرحلة؟',
            request: {
              title: 'طلب رحلة'
            },
            select_on_map: 'اختر على الخريطة',
            select_on_map_active: 'انقر على الخريطة...',
            pickup: {
              title: 'موقع الالتقاط',
              placeholder_city: 'اكتب عنوان الالتقاط في {{city}}',
              placeholder: 'اكتب عنوان الالتقاط',
              helper: 'اختر نتيجة أعلاه أو انقر على الخريطة',
              none: 'لم يتم اختيار موقع الالتقاط'
            },
            dropoff: {
              title: 'موقع الإنزال',
              placeholder_city: 'اكتب عنوان الإنزال في {{city}}',
              placeholder: 'اكتب عنوان الإنزال',
              helper: 'اختر نتيجة أعلاه أو انقر على الخريطة',
              none: 'لم يتم اختيار موقع الإنزال'
            },
            options: {
              passengers: 'الركاب',
              payment_method: 'طريقة الدفع'
            },
            price: {
              estimated: 'السعر التقديري',
              distance: 'المسافة',
              creating: 'جارٍ إنشاء الطلب...',
              request: 'طلب رحلة'
            }
          },
          driver: {
            account_settings: 'إعدادات الحساب',
            gps: {
              https_required: 'يتطلب GPS بروتوكول HTTPS. افتح {{url}}',
              not_supported: 'المتصفح لا يدعم تحديد الموقع',
              blocked: 'تم حظر الموقع. اسمح بالموقع ثم فعّل GPS.',
              requesting: 'جارٍ طلب إذن الموقع...',
              detected_city: 'المدينة المكتشفة: {{city}}',
              detected: 'تم تحديد الموقع.',
              denied: 'تم رفض إذن الموقع. اسمح بالموقع ثم فعّل GPS.',
              denied_short: 'تم رفض إذن الموقع. يرجى السماح.',
              enable_button: 'تفعيل GPS',
              hint: 'إذا كان محظورًا، اضغط رمز القفل واسمح بالموقع ثم أعد المحاولة.',
              enable_location: 'تفعيل الموقع'
            },
            errors: {
              load_profile: 'فشل تحميل الملف الشخصي',
              send_message_failed: 'فشل إرسال الرسالة',
              ride_already_taken: 'تم قبول هذه الرحلة من سائق آخر.',
              accept_failed: 'فشل قبول الرحلة'
            },
            subscription_required: {
              title: 'الاشتراك مطلوب',
              subtitle: 'تحتاج إلى اشتراك نشط لتلقي الطلبات.',
              feature: 'طلبات غير محدودة لمدة {{days}} يومًا',
              subscribe: 'اشترك'
            },
            active: {
              title: 'رحلة نشطة',
              status: 'الحالة',
              earnings: 'الأرباح',
              start_ride: 'ابدأ الرحلة',
              complete_ride: 'إكمال الرحلة',
              client: 'العميل',
              client_default: 'العميل',
              call: 'اتصال',
              show_phone: 'إظهار الرقم',
              open_chat: 'فتح الدردشة',
              unread: '{{count}} جديد'
            },
            map: {
              pickup_location: 'موقع الالتقاط',
              pickup: 'الالتقاط',
              dropoff: 'الإنزال',
              you_are_here: 'أنت هنا',
              tile_error: 'تعذر تحميل الخريطة. تحقق من مفتاح MapTiler.'
            },
            available: {
              title: 'الرحلات المتاحة',
              none_title: 'لا توجد رحلات متاحة',
              none_with_location: 'لا توجد طلبات قريبة الآن. نتحقق من أماكن قريبة.',
              none_without_location: 'فعّل الموقع لرؤية الرحلات القريبة',
              accept: 'قبول الرحلة',
              passengers: '{{count}} ركاب'
            }
          }
        }
      },
      es: {
        translation: {
          slogan: 'Más rápido que el bus, más barato que el taxi',
          welcome: 'Bienvenido a Supertez',


          book_ride: 'Reservar un viaje',
          pickup: 'Lugar de recogida',
          dropoff: 'Lugar de destino',
          passengers: 'Pasajeros',
          price: 'Precio',
          book_now: 'Pedir ahora',
          driver_dashboard: 'Panel del conductor',
          admin_settings: 'Configuración de administrador',
          role: 'Rol',
          email: 'Correo electrónico',
          password: 'Contraseña',
          full_name: 'Nombre completo',
          logout: 'Cerrar sesión',
          pending_rides: 'Viajes pendientes',
          accept: 'Aceptar',
          pricing_mode: 'Modo de precios',
          fixed_price: 'Precio fijo',
          per_km: 'Por km',
          update_settings: 'Guardar ajustes',
          distance: 'Distancia',
          forgot_password: '¿Olvidaste tu contraseña?',
          send_reset_link: 'Enviar enlace de restablecimiento',
          reset_link_sent: 'Revisa tu correo para el enlace de restablecimiento.',

          new_password: 'Nueva contraseña',
          back_to_login: 'Volver a iniciar sesión',
          detecting_location: 'Detectando ubicación...',
          subscription_required: 'Se requiere suscripción',
          subscription_desc: 'Para aceptar viajes, debes tener una suscripción activa.',
          subscribe_now: 'Suscribirse ahora',
          subscription_price: 'Precio de suscripción',
          driver_settings: 'Ajustes del conductor',
          require_subscription: 'Requerir suscripción del conductor',
          manage_drivers: 'Administrar conductores',
          grant_access: 'Conceder acceso gratuito',
          days: 'Días',
          expires_at: 'Vence el',
          pay_with_paypal: 'Pagar con PayPal',
          admin_portal: 'Portal de administrador',
          admin_login: 'Acceso de administrador',
          admin_registration: 'Registro de administrador',
          management: 'Gestión',
          already_admin: '¿Ya eres administrador?',
          need_admin: '¿Necesitas acceso de administrador?',
          have_account: '¿Ya tienes una cuenta?',
          no_account: '¿No tienes cuenta?',
          passenger: 'Pasajero',

          common: {
            saving: 'Guardando...',
            updating: 'Actualizando...',
            sending: 'Enviando...',
            processing: 'Procesando...',
            find: 'Buscar',
            change: 'Cambiar',
            hide: 'Ocultar',
            cancel: 'Cancelar',
            refresh: 'Actualizar',
            error_prefix: 'Error: {{message}}',
            unknown: 'Desconocido',
            not_available: 'N/D'
          },
          nav: {
            dashboard: 'Panel',
            admin: 'Admin',
            settings: 'Ajustes',
            subscription: 'Suscripción'
          },
          roles: {
            owner: 'Propietario',
            admin: 'Administrador',

            client: 'Cliente'
          },
          payment: {
            cash: 'Efectivo',
            card: 'Tarjeta'
          },
          status: {
            pending: 'Pendiente',
            driver_assigned: 'Conductor asignado',
            driver_arrived: 'Conductor llegó',
            in_progress: 'En curso',
            completed: 'Completado',
            cancelled: 'Cancelado'
          },
          subscription: {
            title: 'Suscripción',
            subtitle: 'Gestiona tu suscripción de conductor',
            current: {
              title: 'Estado actual',
              active: 'Tu suscripción está activa',
              inactive: 'Sin suscripción activa',
              status_label: 'Estado',
              days_remaining: 'Días restantes',
              days_count: '{{count}} días',
              expires_on: 'Vence el',
              free_title: 'Acceso gratuito otorgado',
              free_desc: 'Se te han otorgado {{days}} días de acceso gratuito por el administrador.',
              auto_title: 'Renovación automática activa',
              auto_desc: 'Tu suscripción se renovará automáticamente el {{date}}.',
              none_title: 'Sin suscripción activa',
              none_desc: 'Suscríbete ahora para empezar a recibir solicitudes de viajes de clientes.'
            },
            subscribe: {
              title: 'Suscríbete ahora',
              subtitle: 'Elige un plan para comenzar a recibir solicitudes de viajes',
              plan_title: 'Suscripción de conductor',
              plan_subtitle: 'Acceso completo a solicitudes de viaje',
              per_month: 'por mes',
              feature_unlimited: 'Solicitudes de viaje ilimitadas por {{days}} días',
              feature_realtime: 'Notificaciones en tiempo real de nuevas solicitudes',
              feature_custom_offers: 'Enviar ofertas de precio personalizadas a los clientes',
              feature_auto_renew: 'Opción de renovación automática disponible',
              loading_paypal: 'Cargando PayPal...',
              note: 'Nota: Tu suscripción se renovará automáticamente cada {{days}} días. Puedes cancelarla en cualquier momento desde tu cuenta de PayPal.'
            },
            free_trial: {
              title: '¿Necesitas más tiempo para decidir?',
              subtitle: 'Solicita {{days}} días de acceso gratuito para probar la plataforma',
              button: 'Solicitar prueba gratuita'
            },
            faq: {
              title: 'Preguntas frecuentes',
              q1: '¿Cómo funciona la suscripción?',
              a1: 'Paga ${{price}} mensualmente vía PayPal para recibir solicitudes ilimitadas durante {{days}} días.',
              q2: '¿Puedo cancelar en cualquier momento?',
              a2: '¡Sí! Puedes cancelar tu suscripción en cualquier momento desde tu cuenta de PayPal. Seguirás teniendo acceso hasta que termine tu período actual.',
              q3: '¿Qué ocurre si mi suscripción vence?',
              a3: 'No recibirás nuevas solicitudes hasta que renueves la suscripción. Tu cuenta seguirá activa.'
            },
            messages: {
              activated: '¡Suscripción activada con éxito!',
              free_trial_requested: 'Solicitud de prueba gratuita enviada al administrador. Se te notificará cuando sea aprobada.'
            },
            errors: {
              load_profile: 'No se pudo cargar el perfil',
              activate: 'Error al activar la suscripción: {{message}}',
              payment_failed: 'El pago falló. Inténtalo de nuevo.'
            },
            status: {
              active: 'Activa',
              free: 'Acceso gratuito',
              expired: 'Vencida',
              cancelled: 'Cancelada',
              inactive: 'Inactiva',
              none: 'Sin suscripción'
            }
          },
          login: {
            reset_title: 'Restablecer contraseña',
            reset_subtitle: 'Ingresa tu correo para recibir un enlace de restablecimiento',
            email_label: 'Correo electrónico',
            email_placeholder: 'tu@correo.com',
            send_reset_link: 'Enviar enlace de restablecimiento',
            back_to_login: 'Volver a iniciar sesión',
            title: 'Bienvenido a Supertez',
            subtitle: 'Inicia sesión en tu cuenta',
            password_label: 'Contraseña',
            password_placeholder: '••••••••',
            hide_password: 'Ocultar contraseña',
            show_password: 'Mostrar contraseña',
            remember_me: 'Recordarme',
            forgot_password: '¿Olvidaste la contraseña?',
            signing_in: 'Iniciando sesión...',
            sign_in: 'Iniciar sesión',
            no_account: '¿No tienes una cuenta?',
            sign_up: 'Regístrate',
            demo: 'Credenciales demo: Usa {{email}} para acceso de propietario',
            reset_success: 'Correo de restablecimiento enviado. Revisa tu bandeja de entrada.',
            errors: {
              no_user: 'No se devolvieron datos de usuario',
              sign_in_failed: 'No se pudo iniciar sesión. Verifica tus credenciales.',
              reset_failed: 'No se pudo enviar el correo de restablecimiento'
            }
          },
          register: {
            title: 'Crear cuenta',
            subtitle: 'Únete a Supertez hoy',
            role_label: 'Quiero',
            role_client: 'Pedir un viaje',
            role_driver: 'Conducir y ganar',
            full_name: 'Nombre completo',
            full_name_placeholder: 'Juan Pérez',
            email: 'Correo electrónico',
            email_placeholder: 'tu@ejemplo.com',
            phone_label: 'Número de teléfono (requerido para clientes y conductores)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Ciudad',
            city_placeholder: 'Almaty',
            password: 'Contraseña',
            confirm_password: 'Confirmar contraseña',
            submit: 'Crear cuenta',
            have_account: '¿Ya tienes una cuenta?',
            sign_in: 'Iniciar sesión',
            success_alert: '¡Registro exitoso! Revisa tu correo para verificar tu cuenta y luego inicia sesión.',
            errors: {
              phone_required: 'El número de teléfono es obligatorio para clientes y conductores',
              password_mismatch: 'Las contraseñas no coinciden',
              password_length: 'La contraseña debe tener al menos 6 caracteres',
              register_failed: 'No se pudo registrar'
            }
          },
          update_password: {
            title: 'Establecer nueva contraseña',
            subtitle: 'Ingresa tu nueva contraseña a continuación',
            new_password: 'Nueva contraseña',
            confirm_password: 'Confirmar contraseña',
            password_placeholder: '••••••••',
            hide_password: 'Ocultar contraseña',
            show_password: 'Mostrar contraseña',
            hide_confirm_password: 'Ocultar confirmación',
            show_confirm_password: 'Mostrar confirmación',
            min_length: 'Al menos 6 caracteres',
            update_button: 'Actualizar contraseña',
            success_title: '¡Contraseña actualizada!',
            success_subtitle: 'Tu contraseña se actualizó correctamente.',
            redirecting: 'Redirigiendo al inicio de sesión...',
            errors: {
              invalid_link: 'Enlace de restablecimiento inválido o expirado. Solicita uno nuevo.',
              password_length: 'La contraseña debe tener al menos 6 caracteres',
              password_mismatch: 'Las contraseñas no coinciden',
              update_failed: 'No se pudo actualizar la contraseña'
            }
          },
          auth: {
            phone_label: 'Teléfono (requerido para clientes y conductores)',
            messages: {
              account_created: '¡Cuenta creada! Iniciando sesión...'
            },
            errors: {
              phone_required: 'El número de teléfono es obligatorio para clientes y conductores.',
              login_after_register_failed: 'Cuenta creada pero el inicio de sesión falló. Inicia sesión manualmente.'
            },
            placeholders: {
              full_name: 'Juan Pérez',
              phone: '+7 700 123 4567',
              email: 'email@ejemplo.com'
            }
          },
          account: {
            title: 'Configuración de la cuenta',
            subtitle: 'Administra tu perfil, correo y contraseña.',
            profile: {
              title: 'Perfil',
              uploading: 'Subiendo...',
              upload_photo: 'Subir foto',
              full_name: 'Nombre completo',
              phone: 'Teléfono',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'URL de foto (opcional)',
              photo_url_placeholder: 'https://example.com/foto.jpg',
              save: 'Guardar perfil'
            },
            email: {
              title: 'Correo electrónico',
              current: 'Correo actual',
              new: 'Nuevo correo',
              placeholder: 'nuevo@correo.com',
              note: 'Si la confirmación de correo está habilitada en Supabase, recibirás un correo de confirmación.',
              update: 'Actualizar correo'
            },
            password: {
              title: 'Contraseña',
              new: 'Nueva contraseña',
              confirm: 'Confirmar contraseña',
              placeholder: '••••••••',
              update: 'Actualizar contraseña'
            },
            messages: {
              profile_updated: 'Perfil actualizado.',
              email_update_requested: 'Actualización de correo solicitada. Revisa tu bandeja si hay confirmación.',
              password_updated: 'Contraseña actualizada.',
              photo_updated: 'Foto actualizada.'
            },
            errors: {
              login_required: 'Vuelve a iniciar sesión para administrar tu cuenta.',
              phone_required: 'El número de teléfono es obligatorio para clientes y conductores.',
              profile_update_failed: 'No se pudo actualizar el perfil.',
              email_empty: 'El correo no puede estar vacío.',
              email_update_failed: 'No se pudo actualizar el correo.',
              password_length: 'La contraseña debe tener al menos 6 caracteres.',
              password_mismatch: 'Las contraseñas no coinciden.',
              password_update_failed: 'No se pudo actualizar la contraseña.',
              avatar_url_failed: 'No se pudo obtener la URL pública del avatar.',
              photo_upload_failed: 'No se pudo subir la foto. Asegúrate de que el bucket avatars existe y tiene políticas públicas.'
            }
          },
          admin: {
            title: 'Panel de administrador',
            subtitle: 'Gestiona viajes y conductores',
            tabs: {
              rides: 'Todos los viajes',
              drivers: 'Conductores'
            },
            search_placeholder: 'Buscar viajes...',
            status_all: 'Todos los estados',
            table: {
              id: 'ID',
              route: 'Ruta',
              client: 'Cliente',

              price: 'Precio',
              status: 'Estado',
              date: 'Fecha'
            },
            not_assigned: 'Sin asignar',
            driver_management: 'Gestión de conductores',
            drivers_table: {

              contact: 'Contacto',
              city: 'Ciudad',
              joined: 'Fecha de registro',
              status: 'Estado'
            }
          },
          owner: {
            title: 'Panel del propietario',
            welcome: 'Bienvenido de nuevo, {{name}}',
            tabs: {
              overview: 'Resumen',
              drivers: 'Conductores',
              settings: 'Ajustes',
              finance: 'Finanzas'
            },
            stats: {
              total_rides: 'Total de viajes',
              total_revenue: 'Ingresos totales',
              active_drivers: 'Conductores activos',
              total_clients: 'Total de clientes'
            },
            driver_management: {
              title: 'Gestión de conductores',
              subtitle: 'Gestiona suscripciones y acceso'
            },
            drivers_table: {

              location: 'Ubicación',
              status: 'Estado',
              expires: 'Vence',
              actions: 'Acciones'
            },
            actions: {
              grant_free: 'Conceder gratis',
              revoke: 'Revocar'
            },
            settings: {
              title: 'Ajustes de la app',
              pricing: {
                title: 'Ajustes de precios',
                mode: 'Modo de precios',
                fixed: 'Precio fijo',
                per_km: 'Por kilómetro',
                currency: 'Moneda',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Monto de precio fijo',
                per_km_amount: 'Precio por km'
              },
              subscription: {
                title: 'Suscripción de conductores',
                require: 'Requerir suscripción para conductores',
                price: 'Precio de suscripción',
                period_days: 'Período (días)',
                default_free_days: 'Días gratis predeterminados'
              },
              paypal: {
                title: 'Configuración de PayPal',
                client_id: 'ID de cliente de PayPal',
                placeholder: 'Ingresa tu ID de cliente de PayPal'
              },
              save: 'Guardar ajustes'
            },
            finance: {
              title: 'Resumen financiero',
              coming_soon: 'Informes financieros detallados próximamente...',
              total_revenue: 'Ingresos totales: ${{amount}}'
            },
            grant_modal: {
              title: 'Conceder acceso gratuito',
              description: 'Conceder acceso gratuito a {{name}}',
              days_label: 'Número de días',
              days_placeholder: 'p. ej., 30',
              grant_button: 'Conceder acceso'
            },
            messages: {
              settings_saved: '¡Ajustes guardados correctamente!',
              free_access_granted: 'Se otorgaron {{days}} días gratis a {{name}}'
            },
            confirm_revoke: '¿Seguro que quieres revocar el acceso de este conductor?'
          },
          chat: {
            title: 'Chat del viaje',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Volver al panel',
            no_messages: 'Aún no hay mensajes.',
            placeholder: 'Escribe un mensaje...',
            send: 'Enviar',
            errors: {
              ride_not_found: 'Viaje no encontrado.',
              login_required: 'Vuelve a iniciar sesión.',
              no_access: 'No tienes acceso a este chat.',
              send_failed: 'No se pudo enviar el mensaje.'
            }
          },
          client: {
            account_settings: 'Configuración de la cuenta',
            gps: {
              https_required: 'El GPS requiere HTTPS. Abre {{url}}',
              not_supported: 'La geolocalización no es compatible con este navegador.',
              blocked: 'La ubicación está bloqueada. Haz clic en el candado del navegador, permite Ubicación y luego pulsa Activar GPS.',
              requesting: 'Solicitando acceso a la ubicación...',
              detected_city: 'Ciudad detectada: {{city}}',
              detected: 'Ubicación detectada.',
              denied: 'Permiso de ubicación denegado. Permite Ubicación y luego pulsa Activar GPS.',
              enable_button: 'Activar GPS',
              hint: 'Si Chrome ya lo bloqueó, haz clic en el candado junto a la URL, permite Ubicación y vuelve a pulsar Activar GPS.'
            },
            city_lock: 'La búsqueda de direcciones está limitada a {{city}}.',
            city_lock_default: 'tu zona actual',
            map: {
              instructions: 'Haz clic en el mapa para seleccionar punto de recogida (A) y destino (B) o usa los botones de abajo',
              tile_error: 'No se pudo cargar el mapa. Verifica la clave de MapTiler.',
              pickup: 'Recogida',
              dropoff: 'Destino',
              driver_location: 'Ubicación del conductor'
            },
            active: {
              title: 'Viaje activo',
              status_pending: 'Buscando conductor...',
              status_assigned: '¡Conductor asignado!',
              status_arrived: '¡El conductor llegó!',
              status_in_progress: 'Viaje en curso',
              status_label: 'Estado: {{status}}',
              cancel: 'Cancelar viaje',
              price: 'Precio',
              payment: 'Pago',
              waiting_title: 'Esperando conductores...',
              waiting_subtitle: 'Un conductor cercano aceptará tu solicitud',
              driver_title: 'Conductor',
              driver_assigned: 'Conductor asignado',
              call: 'Llamar',
              show_phone: 'Mostrar número',
              open_chat: 'Abrir chat',
              unread: '{{count}} nuevos',
              driver_distance: 'Distancia del conductor: {{km}} km',
              eta: 'Tiempo de llegada: {{minutes}} min',
              speed: 'Velocidad: {{speed}} km/h',
              heading: 'Rumbo: {{heading}}°'
            },
            notifications: {
              title: 'Actualización del viaje',
              driver_assigned: '¡El conductor aceptó tu solicitud!',
              driver_arrived: 'El conductor llegó.',
              trip_started: 'El viaje comenzó.',
              request_created: '¡Solicitud creada! Esperando conductores...',
              ride_cancelled: 'Viaje cancelado'
            },
            errors: {
              send_message_failed: 'No se pudo enviar el mensaje',
              create_ride_failed: 'No se pudo crear el viaje',
              location_outside: 'Selecciona un punto dentro de {{area}}.',
              city_inside: 'Dentro de {{city}}',
              city_nearby: 'Cerca de tu ciudad',
              no_results_city: 'No hay resultados en {{city}}. Prueba otra dirección.',
              no_results: 'No hay resultados.'
            },
            confirm_cancel: '¿Quieres cancelar este viaje?',
            request: {
              title: 'Solicitar un viaje'
            },
            select_on_map: 'Seleccionar en el mapa',
            select_on_map_active: 'Haz clic en el mapa...',
            pickup: {
              title: 'Lugar de recogida',
              placeholder_city: 'Escribe la dirección de recogida en {{city}}',
              placeholder: 'Escribe la dirección de recogida',
              helper: 'Selecciona un resultado arriba o haz clic en el mapa',
              none: 'No se ha seleccionado lugar de recogida'
            },
            dropoff: {
              title: 'Lugar de destino',
              placeholder_city: 'Escribe la dirección de destino en {{city}}',
              placeholder: 'Escribe la dirección de destino',
              helper: 'Selecciona un resultado arriba o haz clic en el mapa',
              none: 'No se ha seleccionado lugar de destino'
            },
            options: {
              passengers: 'Pasajeros',
              payment_method: 'Método de pago'
            },
            price: {
              estimated: 'Precio estimado',
              distance: 'Distancia',
              creating: 'Creando solicitud...',
              request: 'Solicitar viaje'
            }
          },
          driver: {
            account_settings: 'Configuración de la cuenta',
            gps: {
              https_required: 'El GPS requiere HTTPS. Abre {{url}}',
              not_supported: 'La geolocalización no es compatible con este navegador',
              blocked: 'La ubicación está bloqueada. Permite Ubicación y luego activa GPS.',
              requesting: 'Solicitando permiso de ubicación...',
              detected_city: 'Ciudad detectada: {{city}}',
              detected: 'Ubicación detectada.',
              denied: 'Permiso de ubicación denegado. Permite Ubicación y luego activa GPS.',
              denied_short: 'Permiso de ubicación denegado. Por favor, permite.',
              enable_button: 'Activar GPS',
              hint: 'Si está bloqueado, pulsa el candado y permite Ubicación, luego intenta de nuevo.',
              enable_location: 'Activar ubicación'
            },
            errors: {
              load_profile: 'No se pudo cargar el perfil',
              send_message_failed: 'No se pudo enviar el mensaje',
              ride_already_taken: 'Otro conductor ya aceptó este viaje.',
              accept_failed: 'No se pudo aceptar el viaje'
            },
            subscription_required: {
              title: 'Se requiere suscripción',
              subtitle: 'Necesitas una suscripción activa para recibir solicitudes.',
              feature: 'Solicitudes ilimitadas durante {{days}} días',
              subscribe: 'Suscribirse'
            },
            active: {
              title: 'Viaje activo',
              status: 'Estado',
              earnings: 'Ganancias',
              start_ride: 'Iniciar viaje',
              complete_ride: 'Completar viaje',
              client: 'Cliente',
              client_default: 'Cliente',
              call: 'Llamar',
              show_phone: 'Mostrar número',
              open_chat: 'Abrir chat',
              unread: '{{count}} nuevos'
            },
            map: {
              pickup_location: 'Lugar de recogida',
              pickup: 'Recogida',
              dropoff: 'Destino',
              you_are_here: 'Estás aquí',
              tile_error: 'No se pudo cargar el mapa. Verifica la clave de MapTiler.'
            },
            available: {
              title: 'Viajes disponibles',
              none_title: 'No hay viajes disponibles',
              none_with_location: 'No hay solicitudes cercanas ahora. Estamos revisando lugares cercanos.',
              none_without_location: 'Activa la ubicación para ver viajes cercanos',
              accept: 'Aceptar viaje',
              passengers: '{{count}} pasajeros'
            }
          }
        }
      },
      pt: {
        translation: {
          slogan: 'Mais rápido que o ônibus, mais barato que o táxi',
          welcome: 'Bem-vindo ao Supertez',


          book_ride: 'Pedir uma viagem',
          pickup: 'Local de embarque',
          dropoff: 'Local de destino',
          passengers: 'Passageiros',
          price: 'Preço',
          book_now: 'Pedir agora',
          driver_dashboard: 'Painel do motorista',
          admin_settings: 'Configurações do administrador',
          role: 'Função',
          email: 'E-mail',
          password: 'Senha',
          full_name: 'Nome completo',
          logout: 'Sair',
          pending_rides: 'Viagens pendentes',
          accept: 'Aceitar',
          pricing_mode: 'Modo de preço',
          fixed_price: 'Preço fixo',
          per_km: 'Por km',
          update_settings: 'Salvar configurações',
          distance: 'Distância',
          forgot_password: 'Esqueceu a senha?',
          send_reset_link: 'Enviar link de redefinição',
          reset_link_sent: 'Confira seu e-mail para o link de redefinição.',

          new_password: 'Nova senha',
          back_to_login: 'Voltar para entrar',
          detecting_location: 'Detectando localização...',
          subscription_required: 'Assinatura necessária',
          subscription_desc: 'Para aceitar viagens, você precisa de uma assinatura ativa.',
          subscribe_now: 'Assinar agora',
          subscription_price: 'Preço da assinatura',
          driver_settings: 'Configurações do motorista',
          require_subscription: 'Exigir assinatura do motorista',
          manage_drivers: 'Gerenciar motoristas',
          grant_access: 'Conceder acesso grátis',
          days: 'Dias',
          expires_at: 'Expira em',
          pay_with_paypal: 'Pagar com PayPal',
          admin_portal: 'Portal do administrador',
          admin_login: 'Login de administrador',
          admin_registration: 'Cadastro de administrador',
          management: 'Gestão',
          already_admin: 'Já é administrador?',
          need_admin: 'Precisa de acesso de administrador?',
          have_account: 'Já tem conta?',
          no_account: 'Não tem conta?',
          passenger: 'Passageiro',

          common: {
            saving: 'Salvando...',
            updating: 'Atualizando...',
            sending: 'Enviando...',
            processing: 'Processando...',
            find: 'Buscar',
            change: 'Alterar',
            hide: 'Ocultar',
            cancel: 'Cancelar',
            refresh: 'Atualizar',
            error_prefix: 'Erro: {{message}}',
            unknown: 'Desconhecido',
            not_available: 'N/D'
          },
          nav: {
            dashboard: 'Painel',
            admin: 'Admin',
            settings: 'Configurações',
            subscription: 'Assinatura'
          },
          roles: {
            owner: 'Proprietário',
            admin: 'Administrador',

            client: 'Cliente'
          },
          payment: {
            cash: 'Dinheiro',
            card: 'Cartão'
          },
          status: {
            pending: 'Pendente',
            driver_assigned: 'Motorista atribuído',
            driver_arrived: 'Motorista chegou',
            in_progress: 'Em andamento',
            completed: 'Concluído',
            cancelled: 'Cancelado'
          },
          subscription: {
            title: 'Assinatura',
            subtitle: 'Gerencie sua assinatura de motorista',
            current: {
              title: 'Status atual',
              active: 'Sua assinatura está ativa',
              inactive: 'Sem assinatura ativa',
              status_label: 'Status',
              days_remaining: 'Dias restantes',
              days_count: '{{count}} dias',
              expires_on: 'Expira em',
              free_title: 'Acesso grátis concedido',
              free_desc: 'Você recebeu {{days}} dias de acesso grátis pelo administrador.',
              auto_title: 'Renovação automática ativa',
              auto_desc: 'Sua assinatura será renovada automaticamente em {{date}}.',
              none_title: 'Sem assinatura ativa',
              none_desc: 'Assine agora para começar a receber solicitações de viagem dos clientes.'
            },
            subscribe: {
              title: 'Assine agora',
              subtitle: 'Escolha um plano para começar a receber solicitações de viagem',
              plan_title: 'Assinatura de motorista',
              plan_subtitle: 'Acesso completo às solicitações de viagem',
              per_month: 'por mês',
              feature_unlimited: 'Solicitações ilimitadas por {{days}} dias',
              feature_realtime: 'Notificações em tempo real de novas viagens',
              feature_custom_offers: 'Enviar ofertas de preço personalizadas aos clientes',
              feature_auto_renew: 'Opção de renovação automática disponível',
              loading_paypal: 'Carregando PayPal...',
              note: 'Nota: Sua assinatura será renovada automaticamente a cada {{days}} dias. Você pode cancelar a qualquer momento pela sua conta PayPal.'
            },
            free_trial: {
              title: 'Precisa de mais tempo para decidir?',
              subtitle: 'Solicite {{days}} dias de acesso grátis para testar a plataforma',
              button: 'Solicitar teste grátis'
            },
            faq: {
              title: 'Perguntas frequentes',
              q1: 'Como funciona a assinatura?',
              a1: 'Pague ${{price}} mensalmente via PayPal para receber solicitações ilimitadas por {{days}} dias.',
              q2: 'Posso cancelar a qualquer momento?',
              a2: 'Sim! Você pode cancelar sua assinatura a qualquer momento na sua conta PayPal. Você continuará com acesso até o fim do período atual.',
              q3: 'O que acontece se minha assinatura expirar?',
              a3: 'Você não receberá novas solicitações até renovar a assinatura. Sua conta permanece ativa.'
            },
            messages: {
              activated: 'Assinatura ativada com sucesso!',
              free_trial_requested: 'Solicitação de teste grátis enviada ao administrador. Você será notificado quando for aprovada.'
            },
            errors: {
              load_profile: 'Falha ao carregar perfil',
              activate: 'Erro ao ativar assinatura: {{message}}',
              payment_failed: 'Falha no pagamento. Tente novamente.'
            },
            status: {
              active: 'Ativa',
              free: 'Acesso grátis',
              expired: 'Expirada',
              cancelled: 'Cancelada',
              inactive: 'Inativa',
              none: 'Sem assinatura'
            }
          },
          login: {
            reset_title: 'Redefinir senha',
            reset_subtitle: 'Informe seu e-mail para receber o link de redefinição',
            email_label: 'E-mail',
            email_placeholder: 'seu@email.com',
            send_reset_link: 'Enviar link de redefinição',
            back_to_login: 'Voltar para entrar',
            title: 'Bem-vindo ao Supertez',
            subtitle: 'Entre na sua conta',
            password_label: 'Senha',
            password_placeholder: '••••••••',
            hide_password: 'Ocultar senha',
            show_password: 'Mostrar senha',
            remember_me: 'Lembrar de mim',
            forgot_password: 'Esqueceu a senha?',
            signing_in: 'Entrando...',
            sign_in: 'Entrar',
            no_account: 'Não tem uma conta?',
            sign_up: 'Cadastre-se',
            demo: 'Credenciais demo: Use {{email}} para acesso de proprietário',
            reset_success: 'E-mail de redefinição enviado! Verifique sua caixa de entrada.',
            errors: {
              no_user: 'Nenhum dado de usuário retornado',
              sign_in_failed: 'Falha ao entrar. Verifique suas credenciais.',
              reset_failed: 'Falha ao enviar e-mail de redefinição'
            }
          },
          register: {
            title: 'Criar conta',
            subtitle: 'Junte-se ao Supertez hoje',
            role_label: 'Eu quero',
            role_client: 'Pedir uma viagem',
            role_driver: 'Dirigir e ganhar',
            full_name: 'Nome completo',
            full_name_placeholder: 'João Silva',
            email: 'E-mail',
            email_placeholder: 'voce@exemplo.com',
            phone_label: 'Número de telefone (obrigatório para clientes e motoristas)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Cidade',
            city_placeholder: 'Almaty',
            password: 'Senha',
            confirm_password: 'Confirmar senha',
            submit: 'Criar conta',
            have_account: 'Já tem uma conta?',
            sign_in: 'Entrar',
            success_alert: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois entre.',
            errors: {
              phone_required: 'O número de telefone é obrigatório para clientes e motoristas',
              password_mismatch: 'As senhas não coincidem',
              password_length: 'A senha deve ter pelo menos 6 caracteres',
              register_failed: 'Falha ao registrar'
            }
          },
          update_password: {
            title: 'Definir nova senha',
            subtitle: 'Informe sua nova senha abaixo',
            new_password: 'Nova senha',
            confirm_password: 'Confirmar senha',
            password_placeholder: '••••••••',
            hide_password: 'Ocultar senha',
            show_password: 'Mostrar senha',
            hide_confirm_password: 'Ocultar confirmação',
            show_confirm_password: 'Mostrar confirmação',
            min_length: 'Pelo menos 6 caracteres',
            update_button: 'Atualizar senha',
            success_title: 'Senha atualizada!',
            success_subtitle: 'Sua senha foi atualizada com sucesso.',
            redirecting: 'Redirecionando para o login...',
            errors: {
              invalid_link: 'Link inválido ou expirado. Solicite um novo.',
              password_length: 'A senha deve ter pelo menos 6 caracteres',
              password_mismatch: 'As senhas não coincidem',
              update_failed: 'Falha ao atualizar a senha'
            }
          },
          auth: {
            phone_label: 'Telefone (obrigatório para clientes e motoristas)',
            messages: {
              account_created: 'Conta criada! Entrando...'
            },
            errors: {
              phone_required: 'O número de telefone é obrigatório para clientes e motoristas.',
              login_after_register_failed: 'Conta criada, mas o login falhou. Faça login manualmente.'
            },
            placeholders: {
              full_name: 'João Silva',
              phone: '+7 700 123 4567',
              email: 'email@exemplo.com'
            }
          },
          account: {
            title: 'Configurações da conta',
            subtitle: 'Gerencie seu perfil, e-mail e senha.',
            profile: {
              title: 'Perfil',
              uploading: 'Enviando...',
              upload_photo: 'Enviar foto',
              full_name: 'Nome completo',
              phone: 'Telefone',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'URL da foto (opcional)',
              photo_url_placeholder: 'https://example.com/foto.jpg',
              save: 'Salvar perfil'
            },
            email: {
              title: 'E-mail',
              current: 'E-mail atual',
              new: 'Novo e-mail',
              placeholder: 'novo@email.com',
              note: 'Se a confirmação de e-mail estiver habilitada no Supabase, você receberá um e-mail de confirmação.',
              update: 'Atualizar e-mail'
            },
            password: {
              title: 'Senha',
              new: 'Nova senha',
              confirm: 'Confirmar senha',
              placeholder: '••••••••',
              update: 'Atualizar senha'
            },
            messages: {
              profile_updated: 'Perfil atualizado.',
              email_update_requested: 'Atualização de e-mail solicitada. Verifique sua caixa de entrada se houver confirmação.',
              password_updated: 'Senha atualizada.',
              photo_updated: 'Foto atualizada.'
            },
            errors: {
              login_required: 'Faça login novamente para gerenciar sua conta.',
              phone_required: 'O número de telefone é obrigatório para clientes e motoristas.',
              profile_update_failed: 'Falha ao atualizar o perfil.',
              email_empty: 'O e-mail não pode estar vazio.',
              email_update_failed: 'Falha ao atualizar o e-mail.',
              password_length: 'A senha deve ter pelo menos 6 caracteres.',
              password_mismatch: 'As senhas não coincidem.',
              password_update_failed: 'Falha ao atualizar a senha.',
              avatar_url_failed: 'Não foi possível obter a URL pública do avatar.',
              photo_upload_failed: 'Falha ao enviar foto. Verifique se o bucket avatars existe e possui políticas públicas.'
            }
          },
          admin: {
            title: 'Painel do administrador',
            subtitle: 'Gerencie viagens e motoristas',
            tabs: {
              rides: 'Todas as viagens',
              drivers: 'Motoristas'
            },
            search_placeholder: 'Buscar viagens...',
            status_all: 'Todos os status',
            table: {
              id: 'ID',
              route: 'Rota',
              client: 'Cliente',

              price: 'Preço',
              status: 'Status',
              date: 'Data'
            },
            not_assigned: 'Não atribuído',
            driver_management: 'Gestão de motoristas',
            drivers_table: {

              contact: 'Contato',
              city: 'Cidade',
              joined: 'Data de cadastro',
              status: 'Status'
            }
          },
          owner: {
            title: 'Painel do proprietário',
            welcome: 'Bem-vindo de volta, {{name}}',
            tabs: {
              overview: 'Visão geral',
              drivers: 'Motoristas',
              settings: 'Configurações',
              finance: 'Finanças'
            },
            stats: {
              total_rides: 'Total de viagens',
              total_revenue: 'Receita total',
              active_drivers: 'Motoristas ativos',
              total_clients: 'Total de clientes'
            },
            driver_management: {
              title: 'Gestão de motoristas',
              subtitle: 'Gerencie assinaturas e acesso'
            },
            drivers_table: {

              location: 'Localização',
              status: 'Status',
              expires: 'Expira em',
              actions: 'Ações'
            },
            actions: {
              grant_free: 'Conceder grátis',
              revoke: 'Revogar'
            },
            settings: {
              title: 'Configurações do app',
              pricing: {
                title: 'Configurações de preço',
                mode: 'Modo de preço',
                fixed: 'Preço fixo',
                per_km: 'Por quilômetro',
                currency: 'Moeda',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Valor do preço fixo',
                per_km_amount: 'Preço por km'
              },
              subscription: {
                title: 'Assinatura de motoristas',
                require: 'Exigir assinatura para motoristas',
                price: 'Preço da assinatura',
                period_days: 'Período (dias)',
                default_free_days: 'Dias grátis padrão'
              },
              paypal: {
                title: 'Configuração do PayPal',
                client_id: 'ID do cliente PayPal',
                placeholder: 'Informe seu ID de cliente PayPal'
              },
              save: 'Salvar configurações'
            },
            finance: {
              title: 'Visão financeira',
              coming_soon: 'Relatórios financeiros detalhados em breve...',
              total_revenue: 'Receita total: ${{amount}}'
            },
            grant_modal: {
              title: 'Conceder acesso grátis',
              description: 'Conceder acesso grátis para {{name}}',
              days_label: 'Número de dias',
              days_placeholder: 'ex.: 30',
              grant_button: 'Conceder acesso'
            },
            messages: {
              settings_saved: 'Configurações salvas com sucesso!',
              free_access_granted: 'Concedidos {{days}} dias grátis para {{name}}'
            },
            confirm_revoke: 'Tem certeza de que deseja revogar o acesso deste motorista?'
          },
          chat: {
            title: 'Chat da viagem',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Voltar ao painel',
            no_messages: 'Nenhuma mensagem ainda.',
            placeholder: 'Digite uma mensagem...',
            send: 'Enviar',
            errors: {
              ride_not_found: 'Viagem não encontrada.',
              login_required: 'Faça login novamente.',
              no_access: 'Você não tem acesso a este chat.',
              send_failed: 'Falha ao enviar mensagem.'
            }
          },
          client: {
            account_settings: 'Configurações da conta',
            gps: {
              https_required: 'O GPS requer HTTPS. Abra {{url}}',
              not_supported: 'Geolocalização não é suportada neste navegador.',
              blocked: 'Localização bloqueada. Clique no cadeado do navegador, permita Localização e depois clique em Ativar GPS.',
              requesting: 'Solicitando acesso à localização...',
              detected_city: 'Cidade detectada: {{city}}',
              detected: 'Localização detectada.',
              denied: 'Permissão de localização negada. Permita Localização e depois clique em Ativar GPS.',
              enable_button: 'Ativar GPS',
              hint: 'Se o Chrome já bloqueou, clique no cadeado ao lado da URL, permita Localização e tente novamente.'
            },
            city_lock: 'A busca de endereços é limitada a {{city}}.',
            city_lock_default: 'sua área atual',
            map: {
              instructions: 'Clique no mapa para selecionar embarque (A) e destino (B) ou use os botões abaixo',
              tile_error: 'Não foi possível carregar o mapa. Verifique a chave do MapTiler.',
              pickup: 'Embarque',
              dropoff: 'Destino',
              driver_location: 'Localização do motorista'
            },
            active: {
              title: 'Viagem ativa',
              status_pending: 'Procurando motorista...',
              status_assigned: 'Motorista atribuído!',
              status_arrived: 'O motorista chegou!',
              status_in_progress: 'Viagem em andamento',
              status_label: 'Status: {{status}}',
              cancel: 'Cancelar viagem',
              price: 'Preço',
              payment: 'Pagamento',
              waiting_title: 'Aguardando motoristas...',
              waiting_subtitle: 'Um motorista próximo aceitará sua solicitação',
              driver_title: 'Motorista',
              driver_assigned: 'Motorista atribuído',
              call: 'Ligar',
              show_phone: 'Mostrar número',
              open_chat: 'Abrir chat',
              unread: '{{count}} novas',
              driver_distance: 'Distância do motorista: {{km}} km',
              eta: 'Tempo de chegada: {{minutes}} min',
              speed: 'Velocidade: {{speed}} km/h',
              heading: 'Direção: {{heading}}°'
            },
            notifications: {
              title: 'Atualização da viagem',
              driver_assigned: 'O motorista aceitou sua solicitação!',
              driver_arrived: 'O motorista chegou.',
              trip_started: 'A viagem começou.',
              request_created: 'Solicitação criada! Aguardando motoristas...',
              ride_cancelled: 'Viagem cancelada'
            },
            errors: {
              send_message_failed: 'Falha ao enviar mensagem',
              create_ride_failed: 'Falha ao criar viagem',
              location_outside: 'Selecione um ponto dentro de {{area}}.',
              city_inside: 'Dentro de {{city}}',
              city_nearby: 'Perto da sua cidade',
              no_results_city: 'Nenhum resultado em {{city}}. Tente outro endereço.',
              no_results: 'Nenhum resultado.'
            },
            confirm_cancel: 'Deseja cancelar esta viagem?',
            request: {
              title: 'Solicitar viagem'
            },
            select_on_map: 'Selecionar no mapa',
            select_on_map_active: 'Clique no mapa...',
            pickup: {
              title: 'Local de embarque',
              placeholder_city: 'Digite o endereço de embarque em {{city}}',
              placeholder: 'Digite o endereço de embarque',
              helper: 'Selecione um resultado acima ou clique no mapa',
              none: 'Nenhum local de embarque selecionado'
            },
            dropoff: {
              title: 'Local de destino',
              placeholder_city: 'Digite o endereço de destino em {{city}}',
              placeholder: 'Digite o endereço de destino',
              helper: 'Selecione um resultado acima ou clique no mapa',
              none: 'Nenhum local de destino selecionado'
            },
            options: {
              passengers: 'Passageiros',
              payment_method: 'Método de pagamento'
            },
            price: {
              estimated: 'Preço estimado',
              distance: 'Distância',
              creating: 'Criando solicitação...',
              request: 'Solicitar viagem'
            }
          },
          driver: {
            account_settings: 'Configurações da conta',
            gps: {
              https_required: 'O GPS requer HTTPS. Abra {{url}}',
              not_supported: 'Geolocalização não é suportada neste navegador',
              blocked: 'Localização bloqueada. Permita Localização e depois ative o GPS.',
              requesting: 'Solicitando permissão de localização...',
              detected_city: 'Cidade detectada: {{city}}',
              detected: 'Localização detectada.',
              denied: 'Permissão de localização negada. Permita Localização e depois ative o GPS.',
              denied_short: 'Permissão de localização negada. Por favor, permita.',
              enable_button: 'Ativar GPS',
              hint: 'Se estiver bloqueado, clique no cadeado e permita a localização, depois tente novamente.',
              enable_location: 'Ativar localização'
            },
            errors: {
              load_profile: 'Falha ao carregar perfil',
              send_message_failed: 'Falha ao enviar mensagem',
              ride_already_taken: 'Outro motorista já aceitou esta viagem.',
              accept_failed: 'Falha ao aceitar a viagem'
            },
            subscription_required: {
              title: 'Assinatura necessária',
              subtitle: 'Você precisa de uma assinatura ativa para receber solicitações.',
              feature: 'Solicitações ilimitadas por {{days}} dias',
              subscribe: 'Assinar'
            },
            active: {
              title: 'Viagem ativa',
              status: 'Status',
              earnings: 'Ganhos',
              start_ride: 'Iniciar viagem',
              complete_ride: 'Concluir viagem',
              client: 'Cliente',
              client_default: 'Cliente',
              call: 'Ligar',
              show_phone: 'Mostrar número',
              open_chat: 'Abrir chat',
              unread: '{{count}} novas'
            },
            map: {
              pickup_location: 'Local de embarque',
              pickup: 'Embarque',
              dropoff: 'Destino',
              you_are_here: 'Você está aqui',
              tile_error: 'Não foi possível carregar o mapa. Verifique a chave do MapTiler.'
            },
            available: {
              title: 'Viagens disponíveis',
              none_title: 'Nenhuma viagem disponível',
              none_with_location: 'Nenhuma solicitação por perto agora. Verificando locais próximos.',
              none_without_location: 'Ative a localização para ver viagens próximas',
              accept: 'Aceitar viagem',
              passengers: '{{count}} passageiros'
            }
          }
        }
      },
      de: {
        translation: {
          slogan: 'Schneller als der Bus, günstiger als das Taxi',
          welcome: 'Willkommen bei Supertez',


          book_ride: 'Fahrt buchen',
          pickup: 'Abholort',
          dropoff: 'Zielort',
          passengers: 'Passagiere',
          price: 'Preis',
          book_now: 'Jetzt bestellen',
          driver_dashboard: 'Fahrer-Dashboard',
          admin_settings: 'Admin-Einstellungen',
          role: 'Rolle',
          email: 'E-Mail',
          password: 'Passwort',
          full_name: 'Vollständiger Name',
          logout: 'Abmelden',
          pending_rides: 'Ausstehende Fahrten',
          accept: 'Annehmen',
          pricing_mode: 'Preismodus',
          fixed_price: 'Festpreis',
          per_km: 'Pro km',
          update_settings: 'Einstellungen speichern',
          distance: 'Entfernung',
          forgot_password: 'Passwort vergessen?',
          send_reset_link: 'Link zum Zurücksetzen senden',
          reset_link_sent: 'Prüfe deine E-Mails für den Zurücksetzungslink.',

          new_password: 'Neues Passwort',
          back_to_login: 'Zurück zum Login',
          detecting_location: 'Standort wird ermittelt...',
          subscription_required: 'Abo erforderlich',
          subscription_desc: 'Um Fahrten anzunehmen, benötigst du ein aktives Abo.',
          subscribe_now: 'Jetzt abonnieren',
          subscription_price: 'Abo-Preis',
          driver_settings: 'Fahrer-Einstellungen',
          require_subscription: 'Fahrer-Abo erforderlich',
          manage_drivers: 'Fahrer verwalten',
          grant_access: 'Kostenlosen Zugang gewähren',
          days: 'Tage',
          expires_at: 'Läuft ab am',
          pay_with_paypal: 'Mit PayPal bezahlen',
          admin_portal: 'Admin-Portal',
          admin_login: 'Admin-Login',
          admin_registration: 'Admin-Registrierung',
          management: 'Verwaltung',
          already_admin: 'Bereits Admin?',
          need_admin: 'Admin-Zugang benötigt?',
          have_account: 'Hast du ein Konto?',
          no_account: 'Noch kein Konto?',
          passenger: 'Fahrgast',

          common: {
            saving: 'Speichern...',
            updating: 'Aktualisieren...',
            sending: 'Senden...',
            processing: 'Verarbeiten...',
            find: 'Suchen',
            change: 'Ändern',
            hide: 'Ausblenden',
            cancel: 'Abbrechen',
            refresh: 'Aktualisieren',
            error_prefix: 'Fehler: {{message}}',
            unknown: 'Unbekannt',
            not_available: 'k. A.'
          },
          nav: {
            dashboard: 'Dashboard',
            admin: 'Admin',
            settings: 'Einstellungen',
            subscription: 'Abo'
          },
          roles: {
            owner: 'Eigentümer',
            admin: 'Admin',

            client: 'Kunde'
          },
          payment: {
            cash: 'Bargeld',
            card: 'Karte'
          },
          status: {
            pending: 'Ausstehend',
            driver_assigned: 'Fahrer zugewiesen',
            driver_arrived: 'Fahrer angekommen',
            in_progress: 'In Bearbeitung',
            completed: 'Abgeschlossen',
            cancelled: 'Storniert'
          },
          subscription: {
            title: 'Abo',
            subtitle: 'Verwalte dein Fahrer-Abo',
            current: {
              title: 'Aktueller Status',
              active: 'Dein Abo ist aktiv',
              inactive: 'Kein aktives Abo',
              status_label: 'Status',
              days_remaining: 'Verbleibende Tage',
              days_count: '{{count}} Tage',
              expires_on: 'Läuft ab am',
              free_title: 'Kostenloser Zugang gewährt',
              free_desc: 'Dir wurden {{days}} Tage kostenloser Zugang vom Admin gewährt.',
              auto_title: 'Automatische Verlängerung aktiv',
              auto_desc: 'Dein Abo wird am {{date}} automatisch verlängert.',
              none_title: 'Kein aktives Abo',
              none_desc: 'Abonniere jetzt, um Fahranfragen von Kunden zu erhalten.'
            },
            subscribe: {
              title: 'Jetzt abonnieren',
              subtitle: 'Wähle einen Plan, um Fahranfragen zu erhalten',
              plan_title: 'Fahrer-Abo',
              plan_subtitle: 'Voller Zugriff auf Fahranfragen',
              per_month: 'pro Monat',
              feature_unlimited: 'Unbegrenzte Fahranfragen für {{days}} Tage',
              feature_realtime: 'Echtzeit-Benachrichtigungen für neue Fahrten',
              feature_custom_offers: 'Individuelle Preisangebote an Kunden senden',
              feature_auto_renew: 'Option zur automatischen Verlängerung verfügbar',
              loading_paypal: 'PayPal wird geladen...',
              note: 'Hinweis: Dein Abo verlängert sich alle {{days}} Tage automatisch. Du kannst jederzeit in deinem PayPal-Konto kündigen.'
            },
            free_trial: {
              title: 'Brauchst du mehr Zeit?',
              subtitle: 'Fordere {{days}} Tage kostenlosen Zugang an, um die Plattform zu testen',
              button: 'Kostenlose Testphase anfordern'
            },
            faq: {
              title: 'Häufige Fragen',
              q1: 'Wie funktioniert das Abo?',
              a1: 'Zahle ${{price}} monatlich per PayPal, um {{days}} Tage unbegrenzte Anfragen zu erhalten.',
              q2: 'Kann ich jederzeit kündigen?',
              a2: 'Ja! Du kannst dein Abo jederzeit über dein PayPal-Konto kündigen. Du behältst den Zugang bis zum Ende des aktuellen Zeitraums.',
              q3: 'Was passiert, wenn mein Abo abläuft?',
              a3: 'Du erhältst keine neuen Anfragen, bis du das Abo erneuerst. Dein Konto bleibt aktiv.'
            },
            messages: {
              activated: 'Abo erfolgreich aktiviert!',
              free_trial_requested: 'Anfrage für kostenlose Testphase an den Admin gesendet. Du wirst benachrichtigt, sobald sie genehmigt ist.'
            },
            errors: {
              load_profile: 'Profil konnte nicht geladen werden',
              activate: 'Fehler beim Aktivieren des Abos: {{message}}',
              payment_failed: 'Zahlung fehlgeschlagen. Bitte erneut versuchen.'
            },
            status: {
              active: 'Aktiv',
              free: 'Kostenloser Zugang',
              expired: 'Abgelaufen',
              cancelled: 'Gekündigt',
              inactive: 'Inaktiv',
              none: 'Kein Abo'
            }
          },
          login: {
            reset_title: 'Passwort zurücksetzen',
            reset_subtitle: 'Gib deine E-Mail ein, um einen Reset-Link zu erhalten',
            email_label: 'E-Mail-Adresse',
            email_placeholder: 'dein@email.com',
            send_reset_link: 'Reset-Link senden',
            back_to_login: 'Zurück zum Login',
            title: 'Willkommen bei Supertez',
            subtitle: 'Melde dich in deinem Konto an',
            password_label: 'Passwort',
            password_placeholder: '••••••••',
            hide_password: 'Passwort verbergen',
            show_password: 'Passwort anzeigen',
            remember_me: 'Angemeldet bleiben',
            forgot_password: 'Passwort vergessen?',
            signing_in: 'Anmelden...',
            sign_in: 'Anmelden',
            no_account: 'Noch kein Konto?',
            sign_up: 'Registrieren',
            demo: 'Demo-Zugang: Verwende {{email}} für Eigentümerzugang',
            reset_success: 'Reset-E-Mail gesendet! Prüfe deinen Posteingang.',
            errors: {
              no_user: 'Keine Benutzerdaten zurückgegeben',
              sign_in_failed: 'Anmeldung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.',
              reset_failed: 'Reset-E-Mail konnte nicht gesendet werden'
            }
          },
          register: {
            title: 'Konto erstellen',
            subtitle: 'Trete Supertez heute bei',
            role_label: 'Ich möchte',
            role_client: 'Eine Fahrt buchen',
            role_driver: 'Fahren & verdienen',
            full_name: 'Vollständiger Name',
            full_name_placeholder: 'Max Mustermann',
            email: 'E-Mail',
            email_placeholder: 'du@beispiel.com',
            phone_label: 'Telefonnummer (für Kunden und Fahrer erforderlich)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Stadt',
            city_placeholder: 'Almaty',
            password: 'Passwort',
            confirm_password: 'Passwort bestätigen',
            submit: 'Konto erstellen',
            have_account: 'Hast du bereits ein Konto?',
            sign_in: 'Anmelden',
            success_alert: 'Registrierung erfolgreich! Bitte E-Mail bestätigen und dann anmelden.',
            errors: {
              phone_required: 'Telefonnummer ist für Kunden und Fahrer erforderlich',
              password_mismatch: 'Passwörter stimmen nicht überein',
              password_length: 'Passwort muss mindestens 6 Zeichen haben',
              register_failed: 'Registrierung fehlgeschlagen'
            }
          },
          update_password: {
            title: 'Neues Passwort festlegen',
            subtitle: 'Gib unten dein neues Passwort ein',
            new_password: 'Neues Passwort',
            confirm_password: 'Passwort bestätigen',
            password_placeholder: '••••••••',
            hide_password: 'Passwort verbergen',
            show_password: 'Passwort anzeigen',
            hide_confirm_password: 'Bestätigung verbergen',
            show_confirm_password: 'Bestätigung anzeigen',
            min_length: 'Mindestens 6 Zeichen',
            update_button: 'Passwort aktualisieren',
            success_title: 'Passwort aktualisiert!',
            success_subtitle: 'Dein Passwort wurde erfolgreich aktualisiert.',
            redirecting: 'Weiterleitung zum Login...',
            errors: {
              invalid_link: 'Ungültiger oder abgelaufener Reset-Link. Bitte neuen Link anfordern.',
              password_length: 'Passwort muss mindestens 6 Zeichen haben',
              password_mismatch: 'Passwörter stimmen nicht überein',
              update_failed: 'Passwortaktualisierung fehlgeschlagen'
            }
          },
          auth: {
            phone_label: 'Telefon (für Kunden und Fahrer erforderlich)',
            messages: {
              account_created: 'Konto erstellt! Anmeldung läuft...'
            },
            errors: {
              phone_required: 'Telefonnummer ist für Kunden und Fahrer erforderlich.',
              login_after_register_failed: 'Konto erstellt, aber Anmeldung fehlgeschlagen. Bitte manuell anmelden.'
            },
            placeholders: {
              full_name: 'Max Mustermann',
              phone: '+7 700 123 4567',
              email: 'email@beispiel.com'
            }
          },
          account: {
            title: 'Kontoeinstellungen',
            subtitle: 'Verwalte dein Profil, E-Mail und Passwort.',
            profile: {
              title: 'Profil',
              uploading: 'Wird hochgeladen...',
              upload_photo: 'Foto hochladen',
              full_name: 'Vollständiger Name',
              phone: 'Telefon',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'Foto-URL (optional)',
              photo_url_placeholder: 'https://example.com/foto.jpg',
              save: 'Profil speichern'
            },
            email: {
              title: 'E-Mail',
              current: 'Aktuelle E-Mail',
              new: 'Neue E-Mail',
              placeholder: 'neu@email.com',
              note: 'Wenn die E-Mail-Bestätigung in Supabase aktiviert ist, erhältst du eine Bestätigungs-E-Mail.',
              update: 'E-Mail aktualisieren'
            },
            password: {
              title: 'Passwort',
              new: 'Neues Passwort',
              confirm: 'Passwort bestätigen',
              placeholder: '••••••••',
              update: 'Passwort aktualisieren'
            },
            messages: {
              profile_updated: 'Profil aktualisiert.',
              email_update_requested: 'E-Mail-Update angefordert. Prüfe deinen Posteingang, falls Bestätigung aktiviert ist.',
              password_updated: 'Passwort aktualisiert.',
              photo_updated: 'Foto aktualisiert.'
            },
            errors: {
              login_required: 'Bitte erneut anmelden, um dein Konto zu verwalten.',
              phone_required: 'Telefonnummer ist für Kunden und Fahrer erforderlich.',
              profile_update_failed: 'Profil konnte nicht aktualisiert werden.',
              email_empty: 'E-Mail darf nicht leer sein.',
              email_update_failed: 'E-Mail konnte nicht aktualisiert werden.',
              password_length: 'Passwort muss mindestens 6 Zeichen haben.',
              password_mismatch: 'Passwörter stimmen nicht überein.',
              password_update_failed: 'Passwort konnte nicht aktualisiert werden.',
              avatar_url_failed: 'Öffentliche URL des Avatars konnte nicht ermittelt werden.',
              photo_upload_failed: 'Foto-Upload fehlgeschlagen. Stelle sicher, dass der avatars-Bucket existiert und öffentlich lesbar ist.'
            }
          },
          admin: {
            title: 'Admin-Dashboard',
            subtitle: 'Fahrten und Fahrer verwalten',
            tabs: {
              rides: 'Alle Fahrten',
              drivers: 'Fahrer'
            },
            search_placeholder: 'Fahrten suchen...',
            status_all: 'Alle Status',
            table: {
              id: 'ID',
              route: 'Route',
              client: 'Kunde',

              price: 'Preis',
              status: 'Status',
              date: 'Datum'
            },
            not_assigned: 'Nicht zugewiesen',
            driver_management: 'Fahrer-Verwaltung',
            drivers_table: {

              contact: 'Kontakt',
              city: 'Stadt',
              joined: 'Beigetreten',
              status: 'Status'
            }
          },
          owner: {
            title: 'Eigentümer-Dashboard',
            welcome: 'Willkommen zurück, {{name}}',
            tabs: {
              overview: 'Übersicht',
              drivers: 'Fahrer',
              settings: 'Einstellungen',
              finance: 'Finanzen'
            },
            stats: {
              total_rides: 'Gesamtfahrten',
              total_revenue: 'Gesamter Umsatz',
              active_drivers: 'Aktive Fahrer',
              total_clients: 'Gesamtzahl Kunden'
            },
            driver_management: {
              title: 'Fahrer-Verwaltung',
              subtitle: 'Abos und Zugriff verwalten'
            },
            drivers_table: {

              location: 'Standort',
              status: 'Status',
              expires: 'Läuft ab',
              actions: 'Aktionen'
            },
            actions: {
              grant_free: 'Kostenlos gewähren',
              revoke: 'Entziehen'
            },
            settings: {
              title: 'App-Einstellungen',
              pricing: {
                title: 'Preis-Einstellungen',
                mode: 'Preismodus',
                fixed: 'Festpreis',
                per_km: 'Pro Kilometer',
                currency: 'Währung',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Festpreis-Betrag',
                per_km_amount: 'Preis pro km'
              },
              subscription: {
                title: 'Fahrer-Abo',
                require: 'Abo für Fahrer erforderlich',
                price: 'Abo-Preis',
                period_days: 'Zeitraum (Tage)',
                default_free_days: 'Standardfreie Tage'
              },
              paypal: {
                title: 'PayPal-Konfiguration',
                client_id: 'PayPal Client ID',
                placeholder: 'PayPal Client ID eingeben'
              },
              save: 'Einstellungen speichern'
            },
            finance: {
              title: 'Finanzübersicht',
              coming_soon: 'Detaillierte Finanzberichte folgen bald...',
              total_revenue: 'Gesamter Umsatz: ${{amount}}'
            },
            grant_modal: {
              title: 'Kostenlosen Zugang gewähren',
              description: 'Kostenlosen Zugang für {{name}} gewähren',
              days_label: 'Anzahl der Tage',
              days_placeholder: 'z. B. 30',
              grant_button: 'Zugang gewähren'
            },
            messages: {
              settings_saved: 'Einstellungen erfolgreich gespeichert!',
              free_access_granted: '{{days}} Tage kostenloser Zugang für {{name}} gewährt'
            },
            confirm_revoke: 'Möchtest du den Zugriff dieses Fahrers wirklich entziehen?'
          },
          chat: {
            title: 'Fahrt-Chat',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Zurück zum Dashboard',
            no_messages: 'Noch keine Nachrichten.',
            placeholder: 'Nachricht eingeben...',
            send: 'Senden',
            errors: {
              ride_not_found: 'Fahrt nicht gefunden.',
              login_required: 'Bitte erneut anmelden.',
              no_access: 'Du hast keinen Zugriff auf diesen Chat.',
              send_failed: 'Nachricht konnte nicht gesendet werden.'
            }
          },
          client: {
            account_settings: 'Kontoeinstellungen',
            gps: {
              https_required: 'GPS erfordert HTTPS. Öffne {{url}}',
              not_supported: 'Geolokalisierung wird in diesem Browser nicht unterstützt.',
              blocked: 'Standort blockiert. Klicke auf das Schloss-Symbol, erlaube Standort und drücke dann GPS aktivieren.',
              requesting: 'Standortzugriff wird angefordert...',
              detected_city: 'Erkannte Stadt: {{city}}',
              detected: 'Standort erkannt.',
              denied: 'Standortberechtigung verweigert. Erlaube Standort und drücke dann GPS aktivieren.',
              enable_button: 'GPS aktivieren',
              hint: 'Wenn Chrome bereits blockiert hat: Schloss-Symbol anklicken, Standort erlauben und erneut GPS aktivieren.'
            },
            city_lock: 'Adresssuche ist auf {{city}} beschränkt.',
            city_lock_default: 'dein aktueller Bereich',
            map: {
              instructions: 'Klicke auf die Karte, um Abholpunkt (A) und Ziel (B) auszuwählen oder nutze die Buttons unten',
              tile_error: 'Karte konnte nicht geladen werden. Prüfe deinen MapTiler-Schlüssel.',
              pickup: 'Abholung',
              dropoff: 'Ziel',
              driver_location: 'Fahrerstandort'
            },
            active: {
              title: 'Aktive Fahrt',
              status_pending: 'Fahrer wird gesucht...',
              status_assigned: 'Fahrer zugewiesen!',
              status_arrived: 'Fahrer ist angekommen!',
              status_in_progress: 'Fahrt läuft',
              status_label: 'Status: {{status}}',
              cancel: 'Fahrt stornieren',
              price: 'Preis',
              payment: 'Zahlung',
              waiting_title: 'Warte auf Fahrer...',
              waiting_subtitle: 'Ein Fahrer in der Nähe wird deine Anfrage annehmen',
              driver_title: 'Fahrer',
              driver_assigned: 'Fahrer zugewiesen',
              call: 'Anrufen',
              show_phone: 'Nummer anzeigen',
              open_chat: 'Chat öffnen',
              unread: '{{count}} neu',
              driver_distance: 'Fahrerentfernung: {{km}} km',
              eta: 'Ankunftszeit: {{minutes}} Min',
              speed: 'Geschwindigkeit: {{speed}} km/h',
              heading: 'Richtung: {{heading}}°'
            },
            notifications: {
              title: 'Fahrt-Update',
              driver_assigned: 'Der Fahrer hat deine Anfrage angenommen!',
              driver_arrived: 'Der Fahrer ist angekommen.',
              trip_started: 'Die Fahrt hat begonnen.',
              request_created: 'Anfrage erstellt! Warte auf Fahrer...',
              ride_cancelled: 'Fahrt storniert'
            },
            errors: {
              send_message_failed: 'Nachricht konnte nicht gesendet werden',
              create_ride_failed: 'Fahrt konnte nicht erstellt werden',
              location_outside: 'Bitte wähle einen Punkt innerhalb von {{area}}.',
              city_inside: 'Innerhalb von {{city}}',
              city_nearby: 'In der Nähe deiner Stadt',
              no_results_city: 'Keine Ergebnisse in {{city}}. Versuche eine andere Adresse.',
              no_results: 'Keine Ergebnisse.'
            },
            confirm_cancel: 'Möchtest du diese Fahrt stornieren?',
            request: {
              title: 'Fahrt anfordern'
            },
            select_on_map: 'Auf Karte auswählen',
            select_on_map_active: 'Klicke auf die Karte...',
            pickup: {
              title: 'Abholort',
              placeholder_city: 'Abholadresse in {{city}} eingeben',
              placeholder: 'Abholadresse eingeben',
              helper: 'Wähle ein Ergebnis oben oder klicke auf die Karte',
              none: 'Kein Abholort ausgewählt'
            },
            dropoff: {
              title: 'Zielort',
              placeholder_city: 'Zieladresse in {{city}} eingeben',
              placeholder: 'Zieladresse eingeben',
              helper: 'Wähle ein Ergebnis oben oder klicke auf die Karte',
              none: 'Kein Zielort ausgewählt'
            },
            options: {
              passengers: 'Passagiere',
              payment_method: 'Zahlungsmethode'
            },
            price: {
              estimated: 'Geschätzter Preis',
              distance: 'Entfernung',
              creating: 'Anfrage wird erstellt...',
              request: 'Fahrt anfordern'
            }
          },
          driver: {
            account_settings: 'Kontoeinstellungen',
            gps: {
              https_required: 'GPS erfordert HTTPS. Öffne {{url}}',
              not_supported: 'Geolokalisierung wird in diesem Browser nicht unterstützt',
              blocked: 'Standort blockiert. Erlaube Standort und aktiviere GPS.',
              requesting: 'Standortberechtigung wird angefordert...',
              detected_city: 'Erkannte Stadt: {{city}}',
              detected: 'Standort erkannt.',
              denied: 'Standortberechtigung verweigert. Erlaube Standort und aktiviere GPS.',
              denied_short: 'Standortberechtigung verweigert. Bitte erlauben.',
              enable_button: 'GPS aktivieren',
              hint: 'Wenn blockiert, Schloss-Symbol anklicken, Standort erlauben und erneut versuchen.',
              enable_location: 'Standort aktivieren'
            },
            errors: {
              load_profile: 'Profil konnte nicht geladen werden',
              send_message_failed: 'Nachricht konnte nicht gesendet werden',
              ride_already_taken: 'Diese Fahrt wurde bereits von einem anderen Fahrer angenommen.',
              accept_failed: 'Fahrt konnte nicht angenommen werden'
            },
            subscription_required: {
              title: 'Abo erforderlich',
              subtitle: 'Du brauchst ein aktives Abo, um Anfragen zu erhalten.',
              feature: 'Unbegrenzte Anfragen für {{days}} Tage',
              subscribe: 'Abonnieren'
            },
            active: {
              title: 'Aktive Fahrt',
              status: 'Status',
              earnings: 'Einnahmen',
              start_ride: 'Fahrt starten',
              complete_ride: 'Fahrt abschließen',
              client: 'Kunde',
              client_default: 'Kunde',
              call: 'Anrufen',
              show_phone: 'Nummer anzeigen',
              open_chat: 'Chat öffnen',
              unread: '{{count}} neu'
            },
            map: {
              pickup_location: 'Abholort',
              pickup: 'Abholung',
              dropoff: 'Ziel',
              you_are_here: 'Du bist hier',
              tile_error: 'Karte konnte nicht geladen werden. Prüfe deinen MapTiler-Schlüssel.'
            },
            available: {
              title: 'Verfügbare Fahrten',
              none_title: 'Keine Fahrten verfügbar',
              none_with_location: 'Zurzeit keine Anfragen in der Nähe. Wir prüfen weitere Bereiche.',
              none_without_location: 'Aktiviere den Standort, um Fahrten in der Nähe zu sehen',
              accept: 'Fahrt annehmen',
              passengers: '{{count}} Passagiere'
            }
          }
        }
      },
      fr: {
        translation: {
          slogan: 'Plus rapide que le bus, moins cher que le taxi',
          welcome: 'Bienvenue sur Supertez',

          book_ride: 'Réserver un trajet',
          pickup: 'Lieu de départ',
          dropoff: 'Lieu d\'arrivée',
          passengers: 'Passagers',
          price: 'Prix',
          book_now: 'Commander maintenant',
          driver_dashboard: 'Tableau de bord conducteur',
          admin_settings: 'Paramètres administrateur',
          role: 'Rôle',
          email: 'E-mail',
          password: 'Mot de passe',
          full_name: 'Nom complet',
          logout: 'Se déconnecter',
          pending_rides: 'Trajets en attente',
          accept: 'Accepter',
          pricing_mode: 'Mode de tarification',
          fixed_price: 'Prix fixe',
          per_km: 'Par km',
          update_settings: 'Enregistrer les paramètres',
          distance: 'Distance',
          forgot_password: 'Mot de passe oublié ?',
          send_reset_link: 'Envoyer le lien de réinitialisation',
          reset_link_sent: 'Vérifiez votre e-mail pour le lien de réinitialisation.',

          new_password: 'Nouveau mot de passe',
          back_to_login: 'Retour à la connexion',
          detecting_location: 'Détection de la localisation...',
          subscription_required: 'Abonnement requis',
          subscription_desc: 'Pour accepter des trajets, vous devez avoir un abonnement actif.',
          subscribe_now: 'S\'abonner maintenant',
          subscription_price: 'Prix de l\'abonnement',
          driver_settings: 'Paramètres conducteur',
          require_subscription: 'Exiger l\'abonnement conducteur',
          manage_drivers: 'Gérer les conducteurs',
          grant_access: 'Accorder un accès gratuit',
          days: 'Jours',
          expires_at: 'Expire le',
          pay_with_paypal: 'Payer avec PayPal',
          admin_portal: 'Portail admin',
          admin_login: 'Connexion admin',
          admin_registration: 'Inscription admin',
          management: 'Gestion',
          already_admin: 'Déjà admin ?',
          need_admin: 'Besoin d\'un accès admin ?',
          have_account: 'Vous avez déjà un compte ?',
          no_account: 'Pas de compte ?',
          passenger: 'Passager',

          common: {
            saving: 'Enregistrement...',
            updating: 'Mise à jour...',
            sending: 'Envoi...',
            processing: 'Traitement...',
            find: 'Rechercher',
            change: 'Modifier',
            hide: 'Masquer',
            cancel: 'Annuler',
            refresh: 'Actualiser',
            error_prefix: 'Erreur : {{message}}',
            unknown: 'Inconnu',
            not_available: 'N/D'
          },
          nav: {
            dashboard: 'Tableau de bord',
            admin: 'Admin',
            settings: 'Paramètres',
            subscription: 'Abonnement'
          },
          roles: {
            owner: 'Propriétaire',
            admin: 'Admin',

            client: 'Client'
          },
          payment: {
            cash: 'Espèces',
            card: 'Carte'
          },
          status: {
            pending: 'En attente',
            driver_assigned: 'Conducteur attribué',
            driver_arrived: 'Conducteur arrivé',
            in_progress: 'En cours',
            completed: 'Terminé',
            cancelled: 'Annulé'
          },
          subscription: {
            title: 'Abonnement',
            subtitle: 'Gérez votre abonnement conducteur',
            current: {
              title: 'Statut actuel',
              active: 'Votre abonnement est actif',
              inactive: 'Aucun abonnement actif',
              status_label: 'Statut',
              days_remaining: 'Jours restants',
              days_count: '{{count}} jours',
              expires_on: 'Expire le',
              free_title: 'Accès gratuit accordé',
              free_desc: 'Vous avez reçu {{days}} jours d\'accès gratuit de l\'admin.',
              auto_title: 'Renouvellement automatique actif',
              auto_desc: 'Votre abonnement sera renouvelé automatiquement le {{date}}.',
              none_title: 'Aucun abonnement actif',
              none_desc: 'Abonnez-vous maintenant pour recevoir des demandes de trajets.'
            },
            subscribe: {
              title: 'S\'abonner maintenant',
              subtitle: 'Choisissez un plan pour commencer à recevoir des demandes',
              plan_title: 'Abonnement conducteur',
              plan_subtitle: 'Accès complet aux demandes de trajet',
              per_month: 'par mois',
              feature_unlimited: 'Demandes illimitées pendant {{days}} jours',
              feature_realtime: 'Notifications en temps réel des nouvelles demandes',
              feature_custom_offers: 'Envoyer des offres de prix personnalisées aux clients',
              feature_auto_renew: 'Option de renouvellement automatique disponible',
              loading_paypal: 'Chargement de PayPal...',
              note: 'Note : votre abonnement se renouvellera automatiquement tous les {{days}} jours. Vous pouvez annuler à tout moment via PayPal.'
            },
            free_trial: {
              title: 'Besoin de plus de temps ?',
              subtitle: 'Demandez {{days}} jours d\'accès gratuit pour tester la plateforme',
              button: 'Demander un essai gratuit'
            },
            faq: {
              title: 'Questions fréquentes',
              q1: 'Comment fonctionne l\'abonnement ?',
              a1: 'Payez ${{price}} par mois via PayPal pour recevoir des demandes illimitées pendant {{days}} jours.',
              q2: 'Puis-je annuler à tout moment ?',
              a2: 'Oui ! Vous pouvez annuler votre abonnement à tout moment depuis votre compte PayPal. Vous gardez l\'accès jusqu\'à la fin de la période en cours.',
              q3: 'Que se passe-t-il si mon abonnement expire ?',
              a3: 'Vous ne recevrez plus de nouvelles demandes jusqu\'à renouvellement. Votre compte reste actif.'
            },
            messages: {
              activated: 'Abonnement activé avec succès !',
              free_trial_requested: 'Demande d\'essai gratuit envoyée à l\'admin. Vous serez averti une fois approuvée.'
            },
            errors: {
              load_profile: 'Échec du chargement du profil',
              activate: 'Erreur lors de l\'activation de l\'abonnement : {{message}}',
              payment_failed: 'Le paiement a échoué. Veuillez réessayer.'
            },
            status: {
              active: 'Actif',
              free: 'Accès gratuit',
              expired: 'Expiré',
              cancelled: 'Annulé',
              inactive: 'Inactif',
              none: 'Aucun abonnement'
            }
          },
          login: {
            reset_title: 'Réinitialiser le mot de passe',
            reset_subtitle: 'Entrez votre e-mail pour recevoir un lien de réinitialisation',
            email_label: 'Adresse e-mail',
            email_placeholder: 'votre@email.com',
            send_reset_link: 'Envoyer le lien',
            back_to_login: 'Retour à la connexion',
            title: 'Bienvenue sur Supertez',
            subtitle: 'Connectez-vous à votre compte',
            password_label: 'Mot de passe',
            password_placeholder: '••••••••',
            hide_password: 'Masquer le mot de passe',
            show_password: 'Afficher le mot de passe',
            remember_me: 'Se souvenir de moi',
            forgot_password: 'Mot de passe oublié ?',
            signing_in: 'Connexion...',
            sign_in: 'Se connecter',
            no_account: 'Vous n\'avez pas de compte ?',
            sign_up: 'S\'inscrire',
            demo: 'Identifiants démo : utilisez {{email}} pour l\'accès propriétaire',
            reset_success: 'E-mail de réinitialisation envoyé ! Vérifiez votre boîte de réception.',
            errors: {
              no_user: 'Aucune donnée utilisateur renvoyée',
              sign_in_failed: 'Connexion échouée. Vérifiez vos identifiants.',
              reset_failed: 'Échec de l\'envoi de l\'e-mail de réinitialisation'
            }
          },
          register: {
            title: 'Créer un compte',
            subtitle: 'Rejoignez Supertez aujourd\'hui',
            role_label: 'Je veux',
            role_client: 'Réserver un trajet',
            role_driver: 'Conduire & gagner',
            full_name: 'Nom complet',
            full_name_placeholder: 'Jean Dupont',
            email: 'E-mail',
            email_placeholder: 'vous@exemple.com',
            phone_label: 'Numéro de téléphone (obligatoire pour clients et conducteurs)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Ville',
            city_placeholder: 'Almaty',
            password: 'Mot de passe',
            confirm_password: 'Confirmer le mot de passe',
            submit: 'Créer un compte',
            have_account: 'Vous avez déjà un compte ?',
            sign_in: 'Se connecter',
            success_alert: 'Inscription réussie ! Vérifiez votre e-mail pour confirmer, puis connectez-vous.',
            errors: {
              phone_required: 'Le numéro de téléphone est obligatoire pour clients et conducteurs',
              password_mismatch: 'Les mots de passe ne correspondent pas',
              password_length: 'Le mot de passe doit contenir au moins 6 caractères',
              register_failed: 'Échec de l\'inscription'
            }
          },
          update_password: {
            title: 'Définir un nouveau mot de passe',
            subtitle: 'Entrez votre nouveau mot de passe ci-dessous',
            new_password: 'Nouveau mot de passe',
            confirm_password: 'Confirmer le mot de passe',
            password_placeholder: '••••••••',
            hide_password: 'Masquer le mot de passe',
            show_password: 'Afficher le mot de passe',
            hide_confirm_password: 'Masquer la confirmation',
            show_confirm_password: 'Afficher la confirmation',
            min_length: 'Au moins 6 caractères',
            update_button: 'Mettre à jour le mot de passe',
            success_title: 'Mot de passe mis à jour !',
            success_subtitle: 'Votre mot de passe a été mis à jour.',
            redirecting: 'Redirection vers la connexion...',
            errors: {
              invalid_link: 'Lien invalide ou expiré. Veuillez en demander un nouveau.',
              password_length: 'Le mot de passe doit contenir au moins 6 caractères',
              password_mismatch: 'Les mots de passe ne correspondent pas',
              update_failed: 'Échec de la mise à jour du mot de passe'
            }
          },
          auth: {
            phone_label: 'Téléphone (obligatoire pour clients et conducteurs)',
            messages: {
              account_created: 'Compte créé ! Connexion en cours...'
            },
            errors: {
              phone_required: 'Le numéro de téléphone est obligatoire pour clients et conducteurs.',
              login_after_register_failed: 'Compte créé mais connexion échouée. Veuillez vous connecter manuellement.'
            },
            placeholders: {
              full_name: 'Jean Dupont',
              phone: '+7 700 123 4567',
              email: 'email@exemple.com'
            }
          },
          account: {
            title: 'Paramètres du compte',
            subtitle: 'Gérez votre profil, e-mail et mot de passe.',
            profile: {
              title: 'Profil',
              uploading: 'Téléchargement...',
              upload_photo: 'Téléverser une photo',
              full_name: 'Nom complet',
              phone: 'Téléphone',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'URL de la photo (optionnel)',
              photo_url_placeholder: 'https://example.com/photo.jpg',
              save: 'Enregistrer le profil'
            },
            email: {
              title: 'E-mail',
              current: 'E-mail actuel',
              new: 'Nouvel e-mail',
              placeholder: 'nouveau@email.com',
              note: 'Si la confirmation e-mail est activée dans Supabase, vous recevrez un e-mail de confirmation.',
              update: 'Mettre à jour l\'e-mail'
            },
            password: {
              title: 'Mot de passe',
              new: 'Nouveau mot de passe',
              confirm: 'Confirmer le mot de passe',
              placeholder: '••••••••',
              update: 'Mettre à jour le mot de passe'
            },
            messages: {
              profile_updated: 'Profil mis à jour.',
              email_update_requested: 'Mise à jour de l\'e-mail demandée. Vérifiez votre boîte si confirmation activée.',
              password_updated: 'Mot de passe mis à jour.',
              photo_updated: 'Photo mise à jour.'
            },
            errors: {
              login_required: 'Veuillez vous reconnecter pour gérer votre compte.',
              phone_required: 'Le numéro de téléphone est obligatoire pour clients et conducteurs.',
              profile_update_failed: 'Échec de la mise à jour du profil.',
              email_empty: 'L\'e-mail ne peut pas être vide.',
              email_update_failed: 'Échec de la mise à jour de l\'e-mail.',
              password_length: 'Le mot de passe doit contenir au moins 6 caractères.',
              password_mismatch: 'Les mots de passe ne correspondent pas.',
              password_update_failed: 'Échec de la mise à jour du mot de passe.',
              avatar_url_failed: 'Impossible d\'obtenir l\'URL publique de l\'avatar.',
              photo_upload_failed: 'Échec du téléchargement de la photo. Vérifiez que le bucket avatars existe et est public.'
            }
          },
          admin: {
            title: 'Tableau de bord admin',
            subtitle: 'Gérez les trajets et conducteurs',
            tabs: {
              rides: 'Tous les trajets',
              drivers: 'Conducteurs'
            },
            search_placeholder: 'Rechercher des trajets...',
            status_all: 'Tous les statuts',
            table: {
              id: 'ID',
              route: 'Trajet',
              client: 'Client',

              price: 'Prix',
              status: 'Statut',
              date: 'Date'
            },
            not_assigned: 'Non attribué',
            driver_management: 'Gestion des conducteurs',
            drivers_table: {

              contact: 'Contact',
              city: 'Ville',
              joined: 'Inscrit le',
              status: 'Statut'
            }
          },
          owner: {
            title: 'Tableau de bord propriétaire',
            welcome: 'Bon retour, {{name}}',
            tabs: {
              overview: 'Aperçu',
              drivers: 'Conducteurs',
              settings: 'Paramètres',
              finance: 'Finances'
            },
            stats: {
              total_rides: 'Total des trajets',
              total_revenue: 'Revenu total',
              active_drivers: 'Conducteurs actifs',
              total_clients: 'Total des clients'
            },
            driver_management: {
              title: 'Gestion des conducteurs',
              subtitle: 'Gérez les abonnements et l\'accès'
            },
            drivers_table: {

              location: 'Localisation',
              status: 'Statut',
              expires: 'Expire le',
              actions: 'Actions'
            },
            actions: {
              grant_free: 'Accorder gratuit',
              revoke: 'Révoquer'
            },
            settings: {
              title: 'Paramètres de l\'app',
              pricing: {
                title: 'Paramètres de prix',
                mode: 'Mode de tarification',
                fixed: 'Prix fixe',
                per_km: 'Par kilomètre',
                currency: 'Devise',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Montant du prix fixe',
                per_km_amount: 'Prix par km'
              },
              subscription: {
                title: 'Abonnement conducteur',
                require: 'Exiger l\'abonnement pour les conducteurs',
                price: 'Prix de l\'abonnement',
                period_days: 'Période (jours)',
                default_free_days: 'Jours gratuits par défaut'
              },
              paypal: {
                title: 'Configuration PayPal',
                client_id: 'ID client PayPal',
                placeholder: 'Entrez votre ID client PayPal'
              },
              save: 'Enregistrer les paramètres'
            },
            finance: {
              title: 'Aperçu financier',
              coming_soon: 'Rapports financiers détaillés bientôt...',
              total_revenue: 'Revenu total : ${{amount}}'
            },
            grant_modal: {
              title: 'Accorder un accès gratuit',
              description: 'Accorder un accès gratuit à {{name}}',
              days_label: 'Nombre de jours',
              days_placeholder: 'ex. 30',
              grant_button: 'Accorder l\'accès'
            },
            messages: {
              settings_saved: 'Paramètres enregistrés avec succès !',
              free_access_granted: '{{days}} jours gratuits accordés à {{name}}'
            },
            confirm_revoke: 'Voulez-vous vraiment révoquer l\'accès de ce conducteur ?'
          },
          chat: {
            title: 'Chat de trajet',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Retour au tableau de bord',
            no_messages: 'Aucun message pour le moment.',
            placeholder: 'Écrivez un message...',
            send: 'Envoyer',
            errors: {
              ride_not_found: 'Trajet introuvable.',
              login_required: 'Veuillez vous reconnecter.',
              no_access: 'Vous n\'avez pas accès à ce chat.',
              send_failed: 'Échec de l\'envoi du message.'
            }
          },
          client: {
            account_settings: 'Paramètres du compte',
            gps: {
              https_required: 'Le GPS nécessite HTTPS. Ouvrez {{url}}',
              not_supported: 'La géolocalisation n\'est pas prise en charge par ce navigateur.',
              blocked: 'La localisation est bloquée. Cliquez sur le cadenas, autorisez la localisation puis activez le GPS.',
              requesting: 'Demande d\'accès à la localisation...',
              detected_city: 'Ville détectée : {{city}}',
              detected: 'Localisation détectée.',
              denied: 'Autorisation de localisation refusée. Autorisez la localisation puis activez le GPS.',
              enable_button: 'Activer le GPS',
              hint: 'Si Chrome a bloqué, cliquez sur le cadenas, autorisez la localisation puis réessayez.'
            },
            city_lock: 'La recherche d\'adresse est limitée à {{city}}.',
            city_lock_default: 'votre zone actuelle',
            map: {
              instructions: 'Cliquez sur la carte pour sélectionner le point de départ (A) et d\'arrivée (B) ou utilisez les boutons ci-dessous',
              tile_error: 'Impossible de charger la carte. Vérifiez la clé MapTiler.',
              pickup: 'Départ',
              dropoff: 'Arrivée',
              driver_location: 'Localisation du conducteur'
            },
            active: {
              title: 'Trajet actif',
              status_pending: 'Recherche d\'un conducteur...',
              status_assigned: 'Conducteur attribué !',
              status_arrived: 'Le conducteur est arrivé !',
              status_in_progress: 'Trajet en cours',
              status_label: 'Statut : {{status}}',
              cancel: 'Annuler le trajet',
              price: 'Prix',
              payment: 'Paiement',
              waiting_title: 'En attente de conducteurs...',
              waiting_subtitle: 'Un conducteur proche acceptera votre demande',
              driver_title: 'Conducteur',
              driver_assigned: 'Conducteur attribué',
              call: 'Appeler',
              show_phone: 'Afficher le numéro',
              open_chat: 'Ouvrir le chat',
              unread: '{{count}} nouveaux',
              driver_distance: 'Distance du conducteur : {{km}} km',
              eta: 'Temps d\'arrivée : {{minutes}} min',
              speed: 'Vitesse : {{speed}} km/h',
              heading: 'Direction : {{heading}}°'
            },
            notifications: {
              title: 'Mise à jour du trajet',
              driver_assigned: 'Le conducteur a accepté votre demande !',
              driver_arrived: 'Le conducteur est arrivé.',
              trip_started: 'Le trajet a commencé.',
              request_created: 'Demande créée ! En attente de conducteurs...',
              ride_cancelled: 'Trajet annulé'
            },
            errors: {
              send_message_failed: 'Échec de l\'envoi du message',
              create_ride_failed: 'Échec de la création du trajet',
              location_outside: 'Veuillez choisir un point dans {{area}}.',
              city_inside: 'Dans {{city}}',
              city_nearby: 'Près de votre ville',
              no_results_city: 'Aucun résultat à {{city}}. Essayez une autre adresse.',
              no_results: 'Aucun résultat.'
            },
            confirm_cancel: 'Voulez-vous annuler ce trajet ?',
            request: {
              title: 'Demander un trajet'
            },
            select_on_map: 'Sélectionner sur la carte',
            select_on_map_active: 'Cliquez sur la carte...',
            pickup: {
              title: 'Lieu de départ',
              placeholder_city: 'Entrez l\'adresse de départ à {{city}}',
              placeholder: 'Entrez l\'adresse de départ',
              helper: 'Sélectionnez un résultat ci-dessus ou cliquez sur la carte',
              none: 'Aucun lieu de départ sélectionné'
            },
            dropoff: {
              title: 'Lieu d\'arrivée',
              placeholder_city: 'Entrez l\'adresse d\'arrivée à {{city}}',
              placeholder: 'Entrez l\'adresse d\'arrivée',
              helper: 'Sélectionnez un résultat ci-dessus ou cliquez sur la carte',
              none: 'Aucun lieu d\'arrivée sélectionné'
            },
            options: {
              passengers: 'Passagers',
              payment_method: 'Méthode de paiement'
            },
            price: {
              estimated: 'Prix estimé',
              distance: 'Distance',
              creating: 'Création de la demande...',
              request: 'Demander un trajet'
            }
          },
          driver: {
            account_settings: 'Paramètres du compte',
            gps: {
              https_required: 'Le GPS nécessite HTTPS. Ouvrez {{url}}',
              not_supported: 'La géolocalisation n\'est pas prise en charge par ce navigateur',
              blocked: 'Localisation bloquée. Autorisez la localisation puis activez le GPS.',
              requesting: 'Demande d\'autorisation de localisation...',
              detected_city: 'Ville détectée : {{city}}',
              detected: 'Localisation détectée.',
              denied: 'Autorisation de localisation refusée. Autorisez la localisation puis activez le GPS.',
              denied_short: 'Autorisation de localisation refusée. Veuillez autoriser.',
              enable_button: 'Activer le GPS',
              hint: 'Si bloqué, cliquez sur le cadenas, autorisez la localisation puis réessayez.',
              enable_location: 'Activer la localisation'
            },
            errors: {
              load_profile: 'Échec du chargement du profil',
              send_message_failed: 'Échec de l\'envoi du message',
              ride_already_taken: 'Ce trajet a déjà été pris par un autre conducteur.',
              accept_failed: 'Échec de l\'acceptation du trajet'
            },
            subscription_required: {
              title: 'Abonnement requis',
              subtitle: 'Vous devez avoir un abonnement actif pour recevoir des demandes.',
              feature: 'Demandes illimitées pendant {{days}} jours',
              subscribe: 'S\'abonner'
            },
            active: {
              title: 'Trajet actif',
              status: 'Statut',
              earnings: 'Gains',
              start_ride: 'Démarrer le trajet',
              complete_ride: 'Terminer le trajet',
              client: 'Client',
              client_default: 'Client',
              call: 'Appeler',
              show_phone: 'Afficher le numéro',
              open_chat: 'Ouvrir le chat',
              unread: '{{count}} nouveaux'
            },
            map: {
              pickup_location: 'Lieu de départ',
              pickup: 'Départ',
              dropoff: 'Arrivée',
              you_are_here: 'Vous êtes ici',
              tile_error: 'Impossible de charger la carte. Vérifiez la clé MapTiler.'
            },
            available: {
              title: 'Trajets disponibles',
              none_title: 'Aucun trajet disponible',
              none_with_location: 'Aucune demande proche pour le moment. Nous vérifions les environs.',
              none_without_location: 'Activez la localisation pour voir les trajets proches',
              accept: 'Accepter le trajet',
              passengers: '{{count}} passagers'
            }
          }
        }
      },
      sv: {
        translation: {
          slogan: 'Snabbare än bussen, billigare än taxi',
          welcome: 'Välkommen till Supertez',


          book_ride: 'Boka en resa',
          pickup: 'Upphämtningsplats',
          dropoff: 'Avlämningsplats',
          passengers: 'Passagerare',
          price: 'Pris',
          book_now: 'Beställ nu',
          driver_dashboard: 'Förarpanel',
          admin_settings: 'Admininställningar',
          role: 'Roll',
          email: 'E-post',
          password: 'Lösenord',
          full_name: 'Fullständigt namn',
          logout: 'Logga ut',
          pending_rides: 'Väntande resor',
          accept: 'Acceptera',
          pricing_mode: 'Prisläge',
          fixed_price: 'Fast pris',
          per_km: 'Per km',
          update_settings: 'Spara inställningar',
          distance: 'Avstånd',
          forgot_password: 'Glömt lösenord?',
          send_reset_link: 'Skicka återställningslänk',
          reset_link_sent: 'Kontrollera din e-post för återställningslänken.',

          new_password: 'Nytt lösenord',
          back_to_login: 'Tillbaka till inloggning',
          detecting_location: 'Letar efter plats...',
          subscription_required: 'Prenumeration krävs',
          subscription_desc: 'För att acceptera resor behöver du en aktiv prenumeration.',
          subscribe_now: 'Prenumerera nu',
          subscription_price: 'Prenumerationspris',
          driver_settings: 'Förarinställningar',
          require_subscription: 'Kräv förarprenumeration',
          manage_drivers: 'Hantera förare',
          grant_access: 'Ge gratis åtkomst',
          days: 'Dagar',
          expires_at: 'Går ut',
          pay_with_paypal: 'Betala med PayPal',
          admin_portal: 'Adminportal',
          admin_login: 'Admininloggning',
          admin_registration: 'Adminregistrering',
          management: 'Hantering',
          already_admin: 'Redan admin?',
          need_admin: 'Behöver du adminåtkomst?',
          have_account: 'Har du redan ett konto?',
          no_account: 'Inget konto?',
          passenger: 'Passagerare',

          common: {
            saving: 'Sparar...',
            updating: 'Uppdaterar...',
            sending: 'Skickar...',
            processing: 'Bearbetar...',
            find: 'Sök',
            change: 'Ändra',
            hide: 'Dölj',
            cancel: 'Avbryt',
            refresh: 'Uppdatera',
            error_prefix: 'Fel: {{message}}',
            unknown: 'Okänd',
            not_available: 'N/A'
          },
          nav: {
            dashboard: 'Översikt',
            admin: 'Admin',
            settings: 'Inställningar',
            subscription: 'Prenumeration'
          },
          roles: {
            owner: 'Ägare',
            admin: 'Admin',

            client: 'Kund'
          },
          payment: {
            cash: 'Kontant',
            card: 'Kort'
          },
          status: {
            pending: 'Väntar',
            driver_assigned: 'Förare tilldelad',
            driver_arrived: 'Förare framme',
            in_progress: 'Pågår',
            completed: 'Slutförd',
            cancelled: 'Avbruten'
          },
          subscription: {
            title: 'Prenumeration',
            subtitle: 'Hantera din förarprenumeration',
            current: {
              title: 'Nuvarande status',
              active: 'Din prenumeration är aktiv',
              inactive: 'Ingen aktiv prenumeration',
              status_label: 'Status',
              days_remaining: 'Återstående dagar',
              days_count: '{{count}} dagar',
              expires_on: 'Går ut',
              free_title: 'Gratis åtkomst beviljad',
              free_desc: 'Du har fått {{days}} dagar gratis åtkomst av admin.',
              auto_title: 'Automatisk förnyelse aktiv',
              auto_desc: 'Din prenumeration förnyas automatiskt den {{date}}.',
              none_title: 'Ingen aktiv prenumeration',
              none_desc: 'Prenumerera nu för att börja få reseförfrågningar.'
            },
            subscribe: {
              title: 'Prenumerera nu',
              subtitle: 'Välj en plan för att börja ta emot reseförfrågningar',
              plan_title: 'Förarprenumeration',
              plan_subtitle: 'Full åtkomst till reseförfrågningar',
              per_month: 'per månad',
              feature_unlimited: 'Obegränsade förfrågningar i {{days}} dagar',
              feature_realtime: 'Realtidsnotiser för nya resor',
              feature_custom_offers: 'Skicka anpassade prisförslag till kunder',
              feature_auto_renew: 'Alternativ för automatisk förnyelse',
              loading_paypal: 'Laddar PayPal...',
              note: 'Obs: Din prenumeration förnyas automatiskt var {{days}} dag. Du kan avbryta när som helst i ditt PayPal-konto.'
            },
            free_trial: {
              title: 'Behöver du mer tid?',
              subtitle: 'Be om {{days}} dagar gratis åtkomst för att testa plattformen',
              button: 'Begär gratis test'
            },
            faq: {
              title: 'Vanliga frågor',
              q1: 'Hur fungerar prenumerationen?',
              a1: 'Betala ${{price}} per månad via PayPal för obegränsade förfrågningar i {{days}} dagar.',
              q2: 'Kan jag avbryta när som helst?',
              a2: 'Ja! Du kan avbryta när som helst via PayPal. Du behåller åtkomst till perioden är slut.',
              q3: 'Vad händer om min prenumeration går ut?',
              a3: 'Du får inga nya förfrågningar förrän du förnyar. Kontot förblir aktivt.'
            },
            messages: {
              activated: 'Prenumerationen aktiverades!',
              free_trial_requested: 'Förfrågan om gratis test skickad till admin. Du får en notis när den godkänns.'
            },
            errors: {
              load_profile: 'Kunde inte ladda profil',
              activate: 'Fel vid aktivering av prenumeration: {{message}}',
              payment_failed: 'Betalning misslyckades. Försök igen.'
            },
            status: {
              active: 'Aktiv',
              free: 'Gratis åtkomst',
              expired: 'Utgången',
              cancelled: 'Avbruten',
              inactive: 'Inaktiv',
              none: 'Ingen prenumeration'
            }
          },
          login: {
            reset_title: 'Återställ lösenord',
            reset_subtitle: 'Ange din e-post för att få en återställningslänk',
            email_label: 'E-postadress',
            email_placeholder: 'din@email.com',
            send_reset_link: 'Skicka återställningslänk',
            back_to_login: 'Tillbaka till inloggning',
            title: 'Välkommen till Supertez',
            subtitle: 'Logga in på ditt konto',
            password_label: 'Lösenord',
            password_placeholder: '••••••••',
            hide_password: 'Dölj lösenord',
            show_password: 'Visa lösenord',
            remember_me: 'Kom ihåg mig',
            forgot_password: 'Glömt lösenord?',
            signing_in: 'Loggar in...',
            sign_in: 'Logga in',
            no_account: 'Har du inget konto?',
            sign_up: 'Registrera dig',
            demo: 'Demo-inloggning: använd {{email}} för ägaråtkomst',
            reset_success: 'Återställningsmail skickat! Kontrollera inkorgen.',
            errors: {
              no_user: 'Ingen användardata returnerades',
              sign_in_failed: 'Inloggning misslyckades. Kontrollera dina uppgifter.',
              reset_failed: 'Kunde inte skicka återställningsmail'
            }
          },
          register: {
            title: 'Skapa konto',
            subtitle: 'Gå med i Supertez idag',
            role_label: 'Jag vill',
            role_client: 'Boka en resa',
            role_driver: 'Köra & tjäna',
            full_name: 'Fullständigt namn',
            full_name_placeholder: 'Anna Andersson',
            email: 'E-post',
            email_placeholder: 'du@exempel.com',
            phone_label: 'Telefonnummer (krävs för kunder och förare)',
            phone_placeholder: '+7 700 123 4567',
            city: 'Stad',
            city_placeholder: 'Almaty',
            password: 'Lösenord',
            confirm_password: 'Bekräfta lösenord',
            submit: 'Skapa konto',
            have_account: 'Har du redan ett konto?',
            sign_in: 'Logga in',
            success_alert: 'Registreringen lyckades! Kontrollera din e-post för att verifiera kontot och logga in.',
            errors: {
              phone_required: 'Telefonnummer krävs för kunder och förare',
              password_mismatch: 'Lösenorden matchar inte',
              password_length: 'Lösenordet måste vara minst 6 tecken',
              register_failed: 'Registreringen misslyckades'
            }
          },
          update_password: {
            title: 'Ange nytt lösenord',
            subtitle: 'Ange ditt nya lösenord nedan',
            new_password: 'Nytt lösenord',
            confirm_password: 'Bekräfta lösenord',
            password_placeholder: '••••••••',
            hide_password: 'Dölj lösenord',
            show_password: 'Visa lösenord',
            hide_confirm_password: 'Dölj bekräftelse',
            show_confirm_password: 'Visa bekräftelse',
            min_length: 'Minst 6 tecken',
            update_button: 'Uppdatera lösenord',
            success_title: 'Lösenord uppdaterat!',
            success_subtitle: 'Ditt lösenord har uppdaterats.',
            redirecting: 'Omdirigerar till inloggning...',
            errors: {
              invalid_link: 'Ogiltig eller utgången länk. Begär en ny.',
              password_length: 'Lösenordet måste vara minst 6 tecken',
              password_mismatch: 'Lösenorden matchar inte',
              update_failed: 'Det gick inte att uppdatera lösenordet'
            }
          },
          auth: {
            phone_label: 'Telefon (krävs för kunder och förare)',
            messages: {
              account_created: 'Konto skapat! Loggar in...'
            },
            errors: {
              phone_required: 'Telefonnummer krävs för kunder och förare.',
              login_after_register_failed: 'Konto skapat men inloggning misslyckades. Logga in manuellt.'
            },
            placeholders: {
              full_name: 'Anna Andersson',
              phone: '+7 700 123 4567',
              email: 'email@exempel.com'
            }
          },
          account: {
            title: 'Kontoinställningar',
            subtitle: 'Hantera din profil, e-post och lösenord.',
            profile: {
              title: 'Profil',
              uploading: 'Laddar upp...',
              upload_photo: 'Ladda upp foto',
              full_name: 'Fullständigt namn',
              phone: 'Telefon',
              phone_placeholder: '+7 700 123 4567',
              photo_url: 'Foto-URL (valfritt)',
              photo_url_placeholder: 'https://example.com/foto.jpg',
              save: 'Spara profil'
            },
            email: {
              title: 'E-post',
              current: 'Nuvarande e-post',
              new: 'Ny e-post',
              placeholder: 'ny@email.com',
              note: 'Om e-postbekräftelse är aktiverad i Supabase får du ett bekräftelsemail.',
              update: 'Uppdatera e-post'
            },
            password: {
              title: 'Lösenord',
              new: 'Nytt lösenord',
              confirm: 'Bekräfta lösenord',
              placeholder: '••••••••',
              update: 'Uppdatera lösenord'
            },
            messages: {
              profile_updated: 'Profil uppdaterad.',
              email_update_requested: 'E-postuppdatering begärd. Kontrollera inkorgen om bekräftelse är aktiverad.',
              password_updated: 'Lösenord uppdaterat.',
              photo_updated: 'Foto uppdaterat.'
            },
            errors: {
              login_required: 'Logga in igen för att hantera kontot.',
              phone_required: 'Telefonnummer krävs för kunder och förare.',
              profile_update_failed: 'Det gick inte att uppdatera profilen.',
              email_empty: 'E-post får inte vara tom.',
              email_update_failed: 'Det gick inte att uppdatera e-post.',
              password_length: 'Lösenordet måste vara minst 6 tecken.',
              password_mismatch: 'Lösenorden matchar inte.',
              password_update_failed: 'Det gick inte att uppdatera lösenordet.',
              avatar_url_failed: 'Kunde inte hämta offentlig URL för avatar.',
              photo_upload_failed: 'Det gick inte att ladda upp foto. Kontrollera att avatars-bucket finns och är publikt läsbar.'
            }
          },
          admin: {
            title: 'Adminpanel',
            subtitle: 'Hantera resor och förare',
            tabs: {
              rides: 'Alla resor',
              drivers: 'Förare'
            },
            search_placeholder: 'Sök resor...',
            status_all: 'Alla statusar',
            table: {
              id: 'ID',
              route: 'Rutt',
              client: 'Kund',

              price: 'Pris',
              status: 'Status',
              date: 'Datum'
            },
            not_assigned: 'Inte tilldelad',
            driver_management: 'Förarhantering',
            drivers_table: {

              contact: 'Kontakt',
              city: 'Stad',
              joined: 'Ansluten',
              status: 'Status'
            }
          },
          owner: {
            title: 'Ägarpanel',
            welcome: 'Välkommen tillbaka, {{name}}',
            tabs: {
              overview: 'Översikt',
              drivers: 'Förare',
              settings: 'Inställningar',
              finance: 'Ekonomi'
            },
            stats: {
              total_rides: 'Totalt antal resor',
              total_revenue: 'Total intäkt',
              active_drivers: 'Aktiva förare',
              total_clients: 'Totalt antal kunder'
            },
            driver_management: {
              title: 'Förarhantering',
              subtitle: 'Hantera prenumerationer och åtkomst'
            },
            drivers_table: {

              location: 'Plats',
              status: 'Status',
              expires: 'Går ut',
              actions: 'Åtgärder'
            },
            actions: {
              grant_free: 'Ge gratis',
              revoke: 'Återkalla'
            },
            settings: {
              title: 'Appinställningar',
              pricing: {
                title: 'Prisinställningar',
                mode: 'Prisläge',
                fixed: 'Fast pris',
                per_km: 'Per kilometer',
                currency: 'Valuta',
                currency_usd: 'USD ($)',
                currency_eur: 'EUR (€)',
                currency_kzt: 'KZT (₸)',
                fixed_amount: 'Fast pris-belopp',
                per_km_amount: 'Pris per km'
              },
              subscription: {
                title: 'Förarprenumeration',
                require: 'Kräv prenumeration för förare',
                price: 'Prenumerationspris',
                period_days: 'Period (dagar)',
                default_free_days: 'Standard fria dagar'
              },
              paypal: {
                title: 'PayPal-konfiguration',
                client_id: 'PayPal Client ID',
                placeholder: 'Ange din PayPal Client ID'
              },
              save: 'Spara inställningar'
            },
            finance: {
              title: 'Ekonomisk översikt',
              coming_soon: 'Detaljerade ekonomirapporter kommer snart...',
              total_revenue: 'Total intäkt: ${{amount}}'
            },
            grant_modal: {
              title: 'Ge gratis åtkomst',
              description: 'Ge gratis åtkomst till {{name}}',
              days_label: 'Antal dagar',
              days_placeholder: 't.ex. 30',
              grant_button: 'Ge åtkomst'
            },
            messages: {
              settings_saved: 'Inställningarna sparades!',
              free_access_granted: 'Gav {{days}} dagar gratis åtkomst till {{name}}'
            },
            confirm_revoke: 'Är du säker på att du vill återkalla denna förares åtkomst?'
          },
          chat: {
            title: 'Rese-chat',
            ride_summary: '{{pickup}} -> {{dropoff}} ({{status}})',
            return_dashboard: 'Tillbaka till panelen',
            no_messages: 'Inga meddelanden ännu.',
            placeholder: 'Skriv ett meddelande...',
            send: 'Skicka',
            errors: {
              ride_not_found: 'Resa hittades inte.',
              login_required: 'Logga in igen.',
              no_access: 'Du har inte åtkomst till denna chatt.',
              send_failed: 'Det gick inte att skicka meddelandet.'
            }
          },
          client: {
            account_settings: 'Kontoinställningar',
            gps: {
              https_required: 'GPS kräver HTTPS. Öppna {{url}}',
              not_supported: 'Geolokalisering stöds inte i den här webbläsaren.',
              blocked: 'Plats blockerad. Klicka på låset, tillåt plats och tryck sedan Aktivera GPS.',
              requesting: 'Begär platsåtkomst...',
              detected_city: 'Upptäckt stad: {{city}}',
              detected: 'Plats upptäckt.',
              denied: 'Platsbehörighet nekad. Tillåt plats och tryck sedan Aktivera GPS.',
              enable_button: 'Aktivera GPS',
              hint: 'Om Chrome redan blockerat, klicka på låset bredvid URL:en, tillåt plats och försök igen.'
            },
            city_lock: 'Adressökning är begränsad till {{city}}.',
            city_lock_default: 'ditt aktuella område',
            map: {
              instructions: 'Klicka på kartan för att välja upphämtning (A) och avlämning (B) eller använd knapparna nedan',
              tile_error: 'Kartan kunde inte laddas. Kontrollera MapTiler-nyckeln.',
              pickup: 'Upphämtning',
              dropoff: 'Avlämning',
              driver_location: 'Förarens plats'
            },
            active: {
              title: 'Aktiv resa',
              status_pending: 'Söker förare...',
              status_assigned: 'Förare tilldelad!',
              status_arrived: 'Förare har anlänt!',
              status_in_progress: 'Resan pågår',
              status_label: 'Status: {{status}}',
              cancel: 'Avbryt resa',
              price: 'Pris',
              payment: 'Betalning',
              waiting_title: 'Väntar på förare...',
              waiting_subtitle: 'En närliggande förare kommer att acceptera din förfrågan',
              driver_title: 'Förare',
              driver_assigned: 'Förare tilldelad',
              call: 'Ring',
              show_phone: 'Visa nummer',
              open_chat: 'Öppna chatt',
              unread: '{{count}} nya',
              driver_distance: 'Förarens avstånd: {{km}} km',
              eta: 'Ankomsttid: {{minutes}} min',
              speed: 'Hastighet: {{speed}} km/h',
              heading: 'Riktning: {{heading}}°'
            },
            notifications: {
              title: 'Uppdatering av resa',
              driver_assigned: 'Föraren accepterade din begäran!',
              driver_arrived: 'Föraren har anlänt.',
              trip_started: 'Resan har startat.',
              request_created: 'Begäran skapad! Väntar på förare...',
              ride_cancelled: 'Resan avbröts'
            },
            errors: {
              send_message_failed: 'Det gick inte att skicka meddelandet',
              create_ride_failed: 'Det gick inte att skapa resan',
              location_outside: 'Välj en plats inom {{area}}.',
              city_inside: 'Inom {{city}}',
              city_nearby: 'Nära din stad',
              no_results_city: 'Inga resultat i {{city}}. Prova en annan adress.',
              no_results: 'Inga resultat.'
            },
            confirm_cancel: 'Vill du avbryta denna resa?',
            request: {
              title: 'Begär resa'
            },
            select_on_map: 'Välj på karta',
            select_on_map_active: 'Klicka på kartan...',
            pickup: {
              title: 'Upphämtningsplats',
              placeholder_city: 'Ange upphämtningsadress i {{city}}',
              placeholder: 'Ange upphämtningsadress',
              helper: 'Välj ett resultat ovan eller klicka på kartan',
              none: 'Ingen upphämtning vald'
            },
            dropoff: {
              title: 'Avlämningsplats',
              placeholder_city: 'Ange avlämningsadress i {{city}}',
              placeholder: 'Ange avlämningsadress',
              helper: 'Välj ett resultat ovan eller klicka på kartan',
              none: 'Ingen avlämning vald'
            },
            options: {
              passengers: 'Passagerare',
              payment_method: 'Betalningsmetod'
            },
            price: {
              estimated: 'Uppskattat pris',
              distance: 'Avstånd',
              creating: 'Skapar begäran...',
              request: 'Begär resa'
            }
          },
          driver: {
            account_settings: 'Kontoinställningar',
            gps: {
              https_required: 'GPS kräver HTTPS. Öppna {{url}}',
              not_supported: 'Geolokalisering stöds inte i den här webbläsaren',
              blocked: 'Plats blockerad. Tillåt plats och aktivera GPS.',
              requesting: 'Begär platsbehörighet...',
              detected_city: 'Upptäckt stad: {{city}}',
              detected: 'Plats upptäckt.',
              denied: 'Platsbehörighet nekad. Tillåt plats och aktivera GPS.',
              denied_short: 'Platsbehörighet nekad. Vänligen tillåt.',
              enable_button: 'Aktivera GPS',
              hint: 'Om blockerad, klicka på låset, tillåt plats och försök igen.',
              enable_location: 'Aktivera plats'
            },
            errors: {
              load_profile: 'Kunde inte ladda profil',
              send_message_failed: 'Det gick inte att skicka meddelandet',
              ride_already_taken: 'Den här resan har redan tagits av en annan förare.',
              accept_failed: 'Det gick inte att acceptera resan'
            },
            subscription_required: {
              title: 'Prenumeration krävs',
              subtitle: 'Du behöver en aktiv prenumeration för att få förfrågningar.',
              feature: 'Obegränsade förfrågningar i {{days}} dagar',
              subscribe: 'Prenumerera'
            },
            active: {
              title: 'Aktiv resa',
              status: 'Status',
              earnings: 'Intäkter',
              start_ride: 'Starta resa',
              complete_ride: 'Slutför resa',
              client: 'Kund',
              client_default: 'Kund',
              call: 'Ring',
              show_phone: 'Visa nummer',
              open_chat: 'Öppna chatt',
              unread: '{{count}} nya'
            },
            map: {
              pickup_location: 'Upphämtningsplats',
              pickup: 'Upphämtning',
              dropoff: 'Avlämning',
              you_are_here: 'Du är här',
              tile_error: 'Kartan kunde inte laddas. Kontrollera MapTiler-nyckeln.'
            },
            available: {
              title: 'Tillgängliga resor',
              none_title: 'Inga resor tillgängliga',
              none_with_location: 'Inga förfrågningar i närheten just nu. Vi kontrollerar närliggande områden.',
              none_without_location: 'Aktivera plats för att se resor i närheten',
              accept: 'Acceptera resa',
              passengers: '{{count}} passagerare'
            }
          }
        }
      }
    }
  });

export default i18n;


i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

try {
  const storedCountry = localStorage.getItem('country_code');
  if (storedCountry) {
    setLanguageByCountry(storedCountry);
  }
} catch {
  // ignore storage errors
}
