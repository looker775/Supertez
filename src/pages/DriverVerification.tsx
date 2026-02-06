import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { supabase, getUserProfile } from '../lib/supabase';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface DriverVerification {
  id: string;
  driver_id: string;
  status: VerificationStatus;
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
}

export default function DriverVerification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [verification, setVerification] = useState<DriverVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [idType, setIdType] = useState<'passport' | 'id_card'>('passport');
  const [idNumber, setIdNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseClass, setLicenseClass] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const userProfile = await getUserProfile();
        if (!active) return;
        if (!userProfile || userProfile.role !== 'driver') {
          navigate('/login', { replace: true });
          return;
        }
        setProfile(userProfile);

        const { data } = await supabase
          .from('driver_verifications')
          .select('*')
          .eq('driver_id', userProfile.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          setVerification(data as DriverVerification);
        }
      } catch (err: any) {
        setError(err.message || t('driver.verification.errors.load_failed'));
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [navigate, t]);

  const uploadFile = async (driverId: string, file: File, label: string) => {
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${driverId}/${Date.now()}_${label}.${extension}`;
    const { data, error } = await supabase.storage
      .from('driver-docs')
      .upload(path, file, { upsert: true });
    if (error || !data?.path) {
      throw new Error(error?.message || t('driver.verification.errors.upload_failed'));
    }
    return data.path;
  };

  const submitVerification = async () => {
    if (!profile) return;
    setError('');
    setSuccess('');

    if (!idFrontFile || !licenseFile || !plateNumber.trim() || !licenseNumber.trim() || !licenseClass.trim()) {
      setError(t('driver.verification.errors.missing_fields'));
      return;
    }
    if (idType === 'id_card' && !idBackFile) {
      setError(t('driver.verification.errors.id_back_required'));
      return;
    }

    setSaving(true);
    try {
      const frontPath = await uploadFile(profile.id, idFrontFile, 'id_front');
      const backPath = idBackFile ? await uploadFile(profile.id, idBackFile, 'id_back') : null;
      const licensePath = await uploadFile(profile.id, licenseFile, 'license');

      const payload = {
        driver_id: profile.id,
        status: 'pending',
        id_document_type: idType,
        id_document_number: idNumber.trim() || null,
        id_document_front_path: frontPath,
        id_document_back_path: backPath,
        license_number: licenseNumber.trim(),
        license_class: licenseClass.trim(),
        license_photo_path: licensePath,
        plate_number: plateNumber.trim(),
        admin_note: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
      };

      const { data, error: upsertError } = await supabase
        .from('driver_verifications')
        .upsert(payload, { onConflict: 'driver_id' })
        .select('*')
        .single();
      if (upsertError) throw upsertError;

      setVerification(data as DriverVerification);
      setSuccess(t('driver.verification.submitted'));
    } catch (err: any) {
      setError(err.message || t('driver.verification.errors.submit_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const status = verification?.status;
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('driver.verification.title')}</h1>
          <p className="text-sm text-gray-500">{t('driver.verification.subtitle')}</p>
        </div>
        <Link
          to="/driver"
          className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {t('driver.verification.back')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {(isPending || isRejected || isApproved) && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-orange-500" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {isApproved
                  ? t('driver.verification.status_approved')
                  : isRejected
                    ? t('driver.verification.status_rejected')
                    : t('driver.verification.status_pending')}
              </p>
              <p className="text-sm text-gray-500">
                {isApproved
                  ? t('driver.verification.status_approved_desc')
                  : isRejected
                    ? t('driver.verification.status_rejected_desc')
                    : t('driver.verification.status_pending_desc')}
              </p>
            </div>
          </div>
          {verification?.admin_note && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm">
              {verification.admin_note}
            </div>
          )}
          {isApproved && (
            <Link
              to="/driver"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-2 text-sm font-semibold"
            >
              {t('driver.verification.go_dashboard')}
            </Link>
          )}
        </div>
      )}

      {!isApproved && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('driver.verification.form_title')}</h2>
            <p className="text-sm text-gray-500">{t('driver.verification.form_subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.id_type')}</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as 'passport' | 'id_card')}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="passport">{t('driver.verification.passport')}</option>
                <option value="id_card">{t('driver.verification.id_card')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.id_number')}</label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.plate_number')}</label>
              <input
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.license_number')}</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.license_class')}</label>
              <input
                value={licenseClass}
                onChange={(e) => setLicenseClass(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.id_front')}</label>
              <label className="mt-1 flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm text-gray-600">
                <UploadCloud className="h-4 w-4" />
                {idFrontFile ? idFrontFile.name : t('driver.verification.upload')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {idType === 'id_card' && (
              <div>
                <label className="text-sm font-medium text-gray-700">{t('driver.verification.id_back')}</label>
                <label className="mt-1 flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm text-gray-600">
                  <UploadCloud className="h-4 w-4" />
                  {idBackFile ? idBackFile.name : t('driver.verification.upload')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">{t('driver.verification.license_photo')}</label>
              <label className="mt-1 flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm text-gray-600">
                <UploadCloud className="h-4 w-4" />
                {licenseFile ? licenseFile.name : t('driver.verification.upload')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <button
            onClick={submitVerification}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('driver.verification.submit')}
          </button>
        </div>
      )}
    </div>
  );
}
