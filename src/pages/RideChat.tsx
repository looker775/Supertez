import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Ride {
  id: string;
  client_id: string;
  driver_id?: string | null;
  pickup_address: string;
  drop_address: string;
  status: string;
}

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: 'client' | 'driver';
  message: string;
  created_at: string;
}

export default function RideChat() {
  const { t } = useTranslation();
  const { rideId } = useParams();
  const location = useLocation();
  const dashboardPath = useMemo(() => {
    return location.pathname.startsWith('/driver') ? '/driver' : '/client';
  }, [location.pathname]);
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      if (!rideId) {
        setError(t('chat.errors.ride_not_found'));
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError(t('chat.errors.login_required'));
        setLoading(false);
        return;
      }
      setCurrentUserId(userData.user.id);

      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('id, client_id, driver_id, pickup_address, drop_address, status')
        .eq('id', rideId)
        .maybeSingle();

      if (rideError || !rideData) {
        setError(t('chat.errors.ride_not_found'));
        setLoading(false);
        return;
      }

      if (rideData.client_id !== userData.user.id && rideData.driver_id !== userData.user.id) {
        setError(t('chat.errors.no_access'));
        setLoading(false);
        return;
      }

      setRide(rideData as Ride);

      const { data: msgData } = await supabase
        .from('ride_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });
      setMessages((msgData || []) as RideMessage[]);

      setLoading(false);

      subscription = supabase
        .channel(`ride-chat-${rideId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${rideId}`,
        }, async () => {
          const { data: newData } = await supabase
            .from('ride_messages')
            .select('*')
            .eq('ride_id', rideId)
            .order('created_at', { ascending: true });
          setMessages((newData || []) as RideMessage[]);
        })
        .subscribe();
    };

    load();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [rideId]);

  useEffect(() => {
    if (!rideId) return;

    const interval = setInterval(async () => {
      const { data: msgData } = await supabase
        .from('ride_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData as RideMessage[]);
    }, 5000);

    return () => clearInterval(interval);
  }, [rideId]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!ride || !currentUserId || !input.trim()) return;
    setSending(true);
    setError('');

    try {
      const senderRole = currentUserId === ride.client_id ? 'client' : 'driver';
      const { data: inserted, error: insertError } = await supabase
        .from('ride_messages')
        .insert({
          ride_id: ride.id,
          sender_id: currentUserId,
          sender_role: senderRole,
          message: input.trim(),
        })
        .select('*')
        .single();
      if (insertError) throw insertError;
      setInput('');
      if (inserted) {
        setMessages((prev) => [...prev, inserted as RideMessage]);
      }
    } catch (err: any) {
      setError(err.message || t('chat.errors.send_failed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('chat.title')}</h1>
            {ride && (
            <p className="text-sm text-gray-500">
                {t('chat.ride_summary', {
                  pickup: ride.pickup_address,
                  dropoff: ride.drop_address,
                  status: t(`status.${ride.status}`, { defaultValue: ride.status })
                })}
            </p>
            )}
          </div>
          <Link
            to={dashboardPath}
            className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {t('chat.return_dashboard')}
          </Link>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="h-[60vh] sm:h-[55vh] overflow-y-auto space-y-2 bg-gray-50 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">{t('chat.no_messages')}</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      isMine ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('chat.placeholder')}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {t('chat.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
