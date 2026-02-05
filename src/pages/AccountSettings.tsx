import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AccountSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError(t('account.errors.login_required'));
        setLoading(false);
        return;
      }

      const user = userData.user;
      setUserId(user.id);
      setCurrentEmail(user.email || '');
      setNewEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setAvatarUrl(profile.avatar_url || '');
        setRole(profile.role || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setError('');
    setMessage('');

    if ((role === 'driver' || role === 'client') && !phone.trim()) {
      setError(t('account.errors.phone_required'));
      setSavingProfile(false);
      return;
    }

    try {
      const updates = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) throw updateError;

      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      });

      setMessage(t('account.messages.profile_updated'));
    } catch (err: any) {
      setError(err.message || t('account.errors.profile_update_failed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmailUpdate = async () => {
    setSavingEmail(true);
    setError('');
    setMessage('');

    if (!newEmail.trim()) {
      setError(t('account.errors.email_empty'));
      setSavingEmail(false);
      return;
    }

    try {
      const { error: emailError } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (emailError) throw emailError;

      setMessage(t('account.messages.email_update_requested'));
      setCurrentEmail(newEmail.trim());
    } catch (err: any) {
      setError(err.message || t('account.errors.email_update_failed'));
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setSavingPassword(true);
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError(t('account.errors.password_length'));
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('account.errors.password_mismatch'));
      setSavingPassword(false);
      return;
    }

    try {
      const { error: passError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (passError) throw passError;

      setMessage(t('account.messages.password_updated'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || t('account.errors.password_update_failed'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !userId) return;
    setUploading(true);
    setError('');
    setMessage('');

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `public/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) throw new Error(t('account.errors.avatar_url_failed'));

      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setMessage(t('account.messages.photo_updated'));
    } catch (err: any) {
      setError(
        err.message ||
          t('account.errors.photo_upload_failed')
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('account.title')}</h1>
        <p className="text-sm text-gray-500">{t('account.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('account.profile.title')}</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <label className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              {uploading ? t('account.profile.uploading') : t('account.profile.upload_photo')}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.profile.full_name')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.profile.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('account.profile.phone_placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.profile.photo_url')}</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('account.profile.photo_url_placeholder')}
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {savingProfile ? t('common.saving') : t('account.profile.save')}
          </button>
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('account.email.title')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.email.current')}</label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.email.new')}</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('account.email.placeholder')}
            />
          </div>

          <p className="text-xs text-gray-500">
            {t('account.email.note')}
          </p>

          <button
            onClick={handleEmailUpdate}
            disabled={savingEmail}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {savingEmail ? t('common.updating') : t('account.email.update')}
          </button>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">{t('account.password.title')}</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.password.new')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('account.password.placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.password.confirm')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('account.password.placeholder')}
              />
            </div>
          </div>

          <button
            onClick={handlePasswordUpdate}
            disabled={savingPassword}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {savingPassword ? t('common.updating') : t('account.password.update')}
          </button>
        </div>
      </div>
    </div>
  );
}
