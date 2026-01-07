import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { StudentData } from '../types';

interface ChatBotProps {
  user: StudentData;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: `Halo ${user.name}! Saya EduBot. Ada yang bisa saya bantu terkait nilai atau materi kuliah?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('https://riodino14-edupulse-backend.hf.space/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          message: userMessage,
          learning_style: user.learning_style || "Visual"
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Maaf, koneksi server terputus." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4 transition-all animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-red-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full"><Bot className="w-5 h-5" /></div>
                <div>
                    <h3 className="font-bold text-sm">EduBot AI</h3>
                    <p className="text-[10px] opacity-80">Online • Context Aware</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-red-700 p-1 rounded"><X className="w-5 h-5" /></button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-red-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-200 text-slate-500 text-xs px-3 py-2 rounded-full animate-pulse">
                        EduBot sedang mengetik...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu..."
              className="flex-1 text-sm border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:border-red-500"
            />
            <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'rotate-90 scale-0' : 'scale-100'} transition-all duration-300 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center`}
      >
        <MessageCircle className="w-8 h-8" />
      </button>
    </div>
  );
};

export default ChatBot;