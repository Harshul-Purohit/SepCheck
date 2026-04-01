import { useState } from 'react';
import { Bot, Send, User, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import api from '../services/api';

function AIFollowupChat({ reportId, reportRisk }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello! I'm your SepCheck AI assistant. I've analyzed your ${reportRisk} risk report. Do you have any questions about the findings or next steps?`, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, sender: 'user' }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.post('/ai/chat-followup', {
        report_id: reportId,
        message: userMsg,
        history: history
      });

      setMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.response, sender: 'ai' }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-[2rem] transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg shadow-brand-200 group-hover:scale-110 transition duration-300">
            <Bot className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-brand-900 flex items-center gap-2">
              Deep-Dive AI Assistant <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            </h4>
            <p className="text-xs text-brand-600 font-medium tracking-tight">Ask specific questions regarding this assessment findings.</p>
          </div>
        </div>
        {isOpen ? <ChevronDown className="text-brand-400" /> : <ChevronUp className="text-brand-400" />}
      </button>

      {isOpen && (
        <div className="mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[450px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                    ${m.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-600 text-white'}
                  `}>
                    {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                    ${m.sender === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}
                  `}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4" />
                 </div>
                 <div className="p-4 rounded-3xl bg-white border border-slate-100 flex items-center gap-2 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
             <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="Ask about your risk, symptoms, or next steps..."
                  className="flex-1 bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-4 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 disabled:bg-slate-300 disabled:shadow-none transition-all shadow-lg shadow-brand-100 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AIFollowupChat;
