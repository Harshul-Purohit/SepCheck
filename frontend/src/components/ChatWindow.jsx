import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, X, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ChatWindow({ consultationId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [consultationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/chat/history/${consultationId}`);
      if (res.data.length !== messages.length) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Chat fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage;
    setNewMessage('');

    try {
      await api.post('/chat/send', {
        consultation_id: consultationId,
        message: msgText
      });
      fetchHistory();
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-brand-600 p-4 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Live Consultation</h3>
            <p className="text-[10px] text-brand-100 uppercase font-black tracking-widest">Case #{consultationId + 1000}</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">Connecting to secured line...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
               <User className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">Start the conversation with your specialist.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.user_id;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                  {isMe ? 'You' : 'Specialist'}
                </span>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-md transition-all
                  ${isMe 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}
                `}>
                  <p className="leading-relaxed font-medium">{m.message}</p>
                  <p className={`text-[9px] mt-2 font-bold opacity-70 flex items-center gap-1 ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="relative">
          <input 
            type="text"
            placeholder="Type your message..."
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition shadow-md shadow-brand-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;
