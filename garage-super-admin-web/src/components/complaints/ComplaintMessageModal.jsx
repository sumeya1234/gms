import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { api } from '../../lib/api';

export default function ComplaintMessageModal({ complaint, onClose, onResolved }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef(null);

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
  }, [complaint.ComplaintID]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/complaints/${complaint.ComplaintID}/messages`, { message: newMessage });
      setNewMessage('');
      fetchMessages(); // refresh thread
    } catch (err) {
      alert('Failed to send message');
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
            <h2 className="text-lg font-bold text-gray-900">Complaint #{complaint.ComplaintID}</h2>
            <p className="text-xs text-gray-500">Customer: {complaint.CustomerName} | Garage: {complaint.GarageName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {}
        <div className="p-4 bg-orange-50 border-b border-orange-100 text-sm">
          <span className="font-semibold text-orange-800 block mb-1">Issue Description:</span>
          <p className="text-orange-900">{complaint.Description}</p>
        </div>

        {}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4">
          {loading ? (
            <div className="text-center py-4"><span className="animate-pulse text-gray-400">Loading messages...</span></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.SenderRole === 'SuperAdmin';
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-[#1890ff] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.Message}</p>
                    <span className={`text-[10px] block mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.CreatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {msg.SenderRole}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {}
        <div className="p-4 border-t border-gray-100 bg-white">
          {complaint.Status === 'Resolved' ? (
            <div className="text-center p-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              This complaint has been resolved.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a reply as Super Admin..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#1890ff] text-white p-2 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
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
              Mark Complaint as Resolved
            </button>
          )}
        </div>
      </div>

      {}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Resolve Complaint</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to officially mark this escalated complaint as resolved?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleResolveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
