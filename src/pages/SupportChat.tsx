import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, getUserProfile } from '../lib/supabase';
import { Loader2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SupportThread {
  id: string;
  user_id: string;
  user_role: 'client' | 'driver';
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface SupportMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'client' | 'driver' | 'admin' | 'owner';
  message: string;
  created_at: string;
}

export default function SupportChat() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const roleLabel = useMemo(() => {
    if (!profile?.role) return t('support.you');
    return profile.role === 'client' ? t('roles.client') : t('roles.driver');
  }, [profile?.role, t]);

  const loadMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as SupportMessage[]);
  }, []);

  const loadOrCreateThread = useCallback(async (userId: string, userRole: 'client' | 'driver') => {
    const { data: existing } = await supabase
      .from('support_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setThread(existing as SupportThread);
      await loadMessages(existing.id);
      return existing as SupportThread;
    }

    const { data: created, error: createError } = await supabase
      .from('support_threads')
      .insert({
        user_id: userId,
        user_role: userRole,
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (createError || !created) {
      throw createError || new Error('Failed to create support thread');
    }

    setThread(created as SupportThread);
    setMessages([]);
    return created as SupportThread;
  }, [loadMessages]);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const userProfile = await getUserProfile();
        if (!userProfile || (userProfile.role !== 'client' && userProfile.role !== 'driver')) {
          setError(t('support.errors.no_access'));
          return;
        }
        if (cancelled) return;
        setProfile(userProfile);

        const createdThread = await loadOrCreateThread(userProfile.id, userProfile.role);
        subscription = supabase
          .channel(`support-${createdThread.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `thread_id=eq.${createdThread.id}`,
          }, () => {
            loadMessages(createdThread.id);
          })
          .subscribe();
      } catch (err: any) {
        setError(err.message || t('support.errors.load_failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (subscription) subscription.unsubscribe();
    };
  }, [loadMessages, loadOrCreateThread, t]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!thread || !profile || !input.trim()) return;
    setSending(true);
    setError('');
    try {
      const message = input.trim();
      const { error: insertError } = await supabase.from('support_messages').insert({
        thread_id: thread.id,
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
        .eq('id', thread.id);

      setInput('');
      await loadMessages(thread.id);
    } catch (err: any) {
      setError(err.message || t('support.errors.send_failed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('support.title')}</h1>
          <p className="text-sm text-gray-500">{t('support.subtitle')}</p>
        </div>
        <Link
          to={profile?.role === 'driver' ? '/driver' : '/client'}
          className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {t('support.back')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b px-4 py-3 flex items-center gap-2 bg-gray-50">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('support.thread_title')}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          {thread && (
            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${thread.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
              {thread.status === 'open' ? t('support.open') : t('support.closed')}
            </span>
          )}
        </div>

        <div className="h-[50vh] overflow-y-auto space-y-3 p-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">{t('support.no_messages')}</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === profile?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'
                }`}>
                  <div className="text-[11px] opacity-70 mb-1">
                    {isMe ? t('support.you') : t('support.admin')}
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="border-t p-4 bg-white flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('support.placeholder')}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {sending ? t('common.sending') : t('support.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
