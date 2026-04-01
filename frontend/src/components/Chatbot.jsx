import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, X, Loader2, Bot, User, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Core Truth House assistant. I can help you with questions about our platform, pricing, features, and more. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState(['View pricing', 'How to get started', 'What is Brand Memory?']);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = messageText.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await axios.post(`${API}/api/chatbot`, {
        message: userMessage,
        session_id: sessionId
      });

      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again or contact support@coretruthhouse.com." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ 
          background: 'linear-gradient(135deg, #e04e35, #af0024)',
          boxShadow: '0 8px 32px rgba(224,78,53,0.4)'
        }}
        data-testid="chatbot-trigger"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl overflow-hidden transition-all duration-300 ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ 
          background: '#1a0020',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          maxHeight: 'calc(100vh - 120px)'
        }}
        data-testid="chatbot-window"
      >
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ 
            background: 'linear-gradient(135deg, #e04e35, #af0024)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">CTH Assistant</div>
              <div className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div 
          className="p-4 overflow-y-auto"
          style={{ height: '350px' }}
        >
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-[#e04e35]/20' 
                      : 'bg-[#763b5b]/30'
                  }`}
                >
                  {msg.role === 'user' 
                    ? <User className="w-3.5 h-3.5 text-[#e04e35]" />
                    : <Sparkles className="w-3.5 h-3.5 text-[#c7a09d]" />
                  }
                </div>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#e04e35] text-white rounded-tr-sm'
                      : 'bg-[#0d0010] text-[#c7a09d] rounded-tl-sm border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#763b5b]/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#c7a09d]" />
                </div>
                <div className="bg-[#0d0010] border border-white/5 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#e04e35] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#e04e35] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#e04e35] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs bg-[#0d0010] border border-white/10 rounded-full text-[#c7a09d] hover:text-white hover:border-[#e04e35]/50 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              id="chatbot-message-input"
              name="chatbot-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#0d0010] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#e04e35]/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              style={{ 
                background: input.trim() && !loading ? 'linear-gradient(135deg, #e04e35, #af0024)' : 'rgba(255,255,255,0.05)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
              }}
            >
              {loading 
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">
            Powered by Brand Memory AI
          </p>
        </div>
      </div>
    </>
  );
}
