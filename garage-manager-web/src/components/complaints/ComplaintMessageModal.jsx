import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { io } from 'socket.io-client';

export default function ComplaintMessageModal({ complaint, onClose, onResolved }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.ComplaintID}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Extract socket server root (strip /api suffix robustly)
    const baseURL = api.defaults.baseURL;
    const socketUrl = baseURL.endsWith('/api')
      ? baseURL.slice(0, -4)
      : baseURL.replace(/\/api(\/.*)?$/, '');
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_complaint_room', { complaintId: complaint.ComplaintID });
    });

    socket.on('receive_complaint_message', (data) => {
      const normalized = {
        complaintId: Number(data.complaintId ?? data.ComplaintID),
        SenderID: data.SenderID ?? data.senderId,
        Message: data.Message ?? data.message,
        SenderRole: data.SenderRole ?? data.senderRole ?? 'Customer',
        SenderName: data.SenderName ?? data.senderName,
        CreatedAt: data.CreatedAt ?? new Date().toISOString(),
      };
      // Use Number() on both sides to avoid string/number type mismatch
      if (normalized.complaintId === Number(complaint.ComplaintID)) {
        setMessages(prev => {
          const alreadyExists = prev.some(
            m => m.Message === normalized.Message && m.SenderID === normalized.SenderID
          );
          if (alreadyExists) return prev;
          return [...prev, normalized];
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Manager socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [complaint.ComplaintID]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();

    try {
      await api.post(`/complaints/${complaint.ComplaintID}/messages`, { message: messageText });
      
      const socketMsg = {
        complaintId: complaint.ComplaintID,
        SenderID: user.id,
        Message: messageText,
        SenderRole: 'Manager',
        CreatedAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, socketMsg]);
      setNewMessage('');

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_complaint_message', {
          ...socketMsg,
          senderName: user.FullName ?? 'Manager',
        });
      }
    } catch (err) {
      alert(t('failedToSendMessage'));
    }
  };

  const handleResolveConfirm = () => {
    setShowConfirm(false);
    onResolved(complaint.ComplaintID);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('Support Ticket')}</h2>
            <p className="text-xs text-gray-500">{t('customer')}: {complaint.CustomerName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        { }
        <div className="p-4 bg-orange-50 border-b border-orange-100 text-sm">
          <span className="font-semibold text-orange-800 block mb-1">{t('issueDescription')}:</span>
          <p className="text-orange-900">{complaint.Description}</p>
        </div>

        { }
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4">
          {loading ? (
            <div className="text-center py-4"><span className="animate-pulse text-gray-400">{t('loadingMessages')}</span></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('noMessagesYet')}</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.SenderID === user.id;
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-[var(--color-primary)] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.Message}</p>
                    <span className={`text-[10px] block mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        { }
        <div className="p-4 border-t border-gray-100 bg-white">
          {complaint.Status === 'Resolved' ? (
            <div className="text-center p-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              {t('complaintResolvedTag')}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('typeReplyPlaceholder')}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[var(--color-primary)] text-white p-2 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          )}

          {complaint.Status !== 'Resolved' && (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full mt-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              {t('markResolvedBtn')}
            </button>
          )}
        </div>
      </div>

      { }
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('resolveComplaintTitle')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('confirmResolveText')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleResolveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
