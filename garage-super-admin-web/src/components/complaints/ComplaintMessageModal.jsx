import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';

// Decode JWT payload without a library
const parseJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
};

export default function ComplaintMessageModal({ complaint, onClose, onResolved }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
        setMessages(prev => [...prev, normalized]);
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Admin socket connection error:', err.message);
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
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    const token = localStorage.getItem('token');
    const payload = parseJwtPayload(token);
    const adminId = payload?.id ?? payload?.userId ?? 0;

    setIsSending(true);
    setNewMessage('');  // clear input immediately for UX

    try {
      // 1. Persist via REST API
      await api.post(`/complaints/${complaint.ComplaintID}/messages`, { message: messageText });

      const socketMsg = {
        complaintId: Number(complaint.ComplaintID),
        SenderID: adminId,
        Message: messageText,
        SenderRole: 'SuperAdmin',
        CreatedAt: new Date().toISOString(),
      };

      // 2. Optimistic local update (sender sees it immediately)
      setMessages(prev => [...prev, socketMsg]);

      // 3. Broadcast to customer in real time
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_complaint_message', {
          ...socketMsg,
          senderName: payload?.fullName ?? 'Support Team',
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(messageText); // restore text if failed
    } finally {
      setIsSending(false);
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
            <p className="text-xs text-gray-500">{t('customer')}: {complaint.CustomerName} | {t('garage')}: {complaint.GarageName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Issue Description Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-sm">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 block mb-1 uppercase">{t('Customer Grievance')}</span>
          <p className="text-slate-700 font-medium leading-relaxed">{complaint.Description}</p>
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4">
          {loading ? (
            <div className="text-center py-4"><span className="animate-pulse text-gray-400">{t('loading')}...</span></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('noMessagesYet')}</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.SenderRole === 'SuperAdmin';
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.Message}</p>
                    <span className={`text-[9px] font-semibold block mt-1.5 text-right ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                      {new Date(msg.CreatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Panel */}
        <div className="p-4 border-t border-gray-100 bg-white">
          {complaint.Status === 'Resolved' ? (
            <div className="text-center p-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              {t('thisResolved')}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('typeReplyPlaceholder')}
                disabled={isSending}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-[#1890ff] text-white p-2 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {isSending ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <Send size={16} />
                )}
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

      {/* Resolve Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('resolveComplaintTitle')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('resolveConfirmText')}</p>
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
