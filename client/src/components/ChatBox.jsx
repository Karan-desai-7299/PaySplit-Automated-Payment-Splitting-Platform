import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield, Check, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { api, getToken, API_BASE } from '../api';

export default function ChatBox({ currentUser, targetVendorId, targetVendorName, isMobile = false }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const esRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const effectiveVendorId = isAdmin ? targetVendorId : currentUser?.vendorId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history
  const loadMessages = async () => {
    if (!effectiveVendorId) return;
    try {
      const data = await api.getMessages(effectiveVendorId);
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [effectiveVendorId]);

  // Connect to SSE stream for real-time live messages
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const streamBase = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`;
    const url = `${streamBase}/chat/stream?token=${token}`;
    let es = null;
    try {
      es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_CHAT_MESSAGE' && data.message) {
            const msg = data.message;
            if (!isAdmin && msg.vendorId === currentUser?.vendorId) {
              setMessages((prev) => [...prev, msg]);
              setTimeout(scrollToBottom, 100);
            } else if (isAdmin && msg.vendorId === targetVendorId) {
              setMessages((prev) => [...prev, msg]);
              setTimeout(scrollToBottom, 100);
            }
          }
        } catch (err) {
          console.error('SSE chat parse error', err);
        }
      };

      es.onerror = () => {
        // SSE error handler
      };
    } catch (e) {
      console.warn('Chat SSE setup error', e);
    }

    return () => {
      if (es) es.close();
      esRef.current = null;
    };
  }, [isAdmin, targetVendorId, currentUser?.vendorId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendMessage(textToSend, effectiveVendorId);
      // Append optimistically if not already added by SSE
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Chat Header */}
      <div className="px-4 py-3.5 bg-blue-600 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            {isAdmin ? <User className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">
              {isAdmin ? (targetVendorName || `Vendor ${targetVendorId}`) : 'Support & Admin Desk'}
            </h3>
            <p className="text-[11px] text-blue-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time communication active
            </p>
          </div>
        </div>
        <button
          onClick={loadMessages}
          title="Refresh messages"
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px] max-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {isAdmin
                ? 'Send a direct message or instructions to this vendor.'
                : 'Need help with UPI ID, limits, or payments? Message the administrator directly!'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === currentUser?.role;
            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-semibold text-slate-400 mb-0.5 ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                    {isMe && <Check className="w-3 h-3 text-blue-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isAdmin ? 'Reply to vendor...' : 'Type your message to admin...'}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition shadow-sm shadow-blue-600/20 cursor-pointer shrink-0"
        >
          {sending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
