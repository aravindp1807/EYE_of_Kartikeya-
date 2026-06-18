'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, ChevronDown, Loader2, MessageSquare, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface KartikeyaChatProps {
  feedData?: Record<string, unknown>;
  spaceWeather?: unknown;
  onClose: () => void;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--kp-gold)' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 text-[10px] font-bold border"
          style={{ background: 'rgba(200,140,20,0.15)', borderColor: 'rgba(200,140,20,0.4)', color: 'var(--kp-gold)' }}
        >
          ⚡
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed font-mono ${
          isUser
            ? 'rounded-tr-sm'
            : 'rounded-tl-sm'
        } ${msg.error ? 'border border-red-500/40' : ''}`}
        style={
          isUser
            ? { background: 'rgba(200,140,20,0.18)', color: '#EDE0CC', border: '1px solid rgba(200,140,20,0.3)' }
            : { background: 'rgba(10,0,18,0.8)', color: '#EDE0CC', border: '1px solid rgba(255,255,255,0.07)' }
        }
      >
        {/* Render markdown-lite: bold, line breaks */}
        {msg.content.split('\n').map((line, i) => {
          // Bold **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={i}>
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j} style={{ color: 'var(--kp-gold)' }}>{part.slice(2, -2)}</strong>
                  : <span key={j}>{part}</span>
              )}
              {i < msg.content.split('\n').length - 1 && <br />}
            </span>
          );
        })}
        <div className="mt-1 text-[8px] opacity-40 font-mono">
          {msg.timestamp.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>
    </motion.div>
  );
}

const SUGGESTED_QUERIES = [
  'What is the current threat level globally?',
  'Any active GPS jamming zones?',
  'Summarize critical cyber threats',
  'Show major seismic activity today',
  'What is the space weather status?',
  'Any dark vessels detected?',
];

export default function KartikeyaChat({ feedData = {}, spaceWeather, onClose }: KartikeyaChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '**KARTIKEYA INTELLIGENCE ORACLE ONLINE**\n\nI am the six-eyed sentinel of EYE OF KARTIKEYA. I see all six directions of the intelligence battlespace simultaneously — aviation, maritime, seismic, cyber, space, and conflict.\n\nAsk me anything about current global intelligence. I have live feed context.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildFeedContext = useCallback(() => {
    const ctx: Record<string, unknown> = {};
    if (feedData.flights) ctx.flights = feedData.flights;
    if (feedData.ships) ctx.ships = feedData.ships;
    if (feedData.earthquakes) ctx.earthquakes = feedData.earthquakes;
    if (feedData.fires) ctx.fires = feedData.fires;
    if (feedData.cyberAlerts) ctx.cyberAlerts = feedData.cyberAlerts;
    if (feedData.threats) ctx.threats = feedData.threats;
    if (spaceWeather) ctx.spaceWeather = spaceWeather;
    if (feedData.markets) ctx.markets = feedData.markets;
    return ctx;
  }, [feedData, spaceWeather]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          feedContext: buildFeedContext(),
        }),
      });

      interface ChatResponse {
        reply?: string;
        error?: string;
      }

      const data: ChatResponse = await res.json() as ChatResponse;

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply ?? data.error ?? 'Intelligence oracle returned empty response.',
        timestamp: new Date(),
        error: !res.ok,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection to intelligence oracle lost. The server might be restarting or the network disconnected.',
        timestamp: new Date(),
        error: true,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, messages, buildFeedContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const panelClass = maximized
    ? 'fixed inset-4 z-[9999]'
    : 'fixed bottom-24 right-4 w-[380px] max-h-[560px] z-[1000]';

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 right-4 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(200,140,20,0.9), rgba(180,20,20,0.8))',
          borderColor: 'rgba(200,140,20,0.6)',
          boxShadow: '0 0 20px rgba(200,140,20,0.4)',
        }}
        title="Open KARTIKEYA Oracle"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`${panelClass} flex flex-col rounded-2xl overflow-hidden shadow-2xl`}
      style={{
        background: 'rgba(5,0,12,0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(200,140,20,0.25)',
        boxShadow: '0 0 40px rgba(200,140,20,0.1), 0 0 80px rgba(180,20,20,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(200,140,20,0.12), rgba(180,20,20,0.08))',
          borderBottom: '1px solid rgba(200,140,20,0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 shrink-0">
            {/* Vel icon */}
            <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-[0_0_6px_rgba(200,140,20,0.8)]" fill="none">
              <polygon points="50,2 56,22 50,17 44,22" fill="#C88C14" opacity="0.95"/>
              <polygon points="50,14 68,30 50,25 32,30" fill="#CC1A1A" opacity="0.85"/>
              <rect x="48" y="22" width="4" height="65" rx="2" fill="#C88C14" opacity="0.9"/>
              <polygon points="50,87 53,97 50,105 47,97" fill="#9B6A10" opacity="0.8"/>
              <circle cx="50" cy="45" r="4" fill="#CC1A1A" opacity="0.9"/>
              <circle cx="50" cy="45" r="2" fill="#F5E8C8" opacity="0.95"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] font-mono" style={{ color: '#C88C14' }}>
              KARTIKEYA ORACLE
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[8px] font-mono opacity-60" style={{ color: '#EDE0CC' }}>LIVE FEEDS CONNECTED</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 text-white/60" />
          </button>
          <button
            onClick={() => setMaximized(m => !m)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {maximized
              ? <Minimize2 className="w-3.5 h-3.5 text-white/60" />
              : <Maximize2 className="w-3.5 h-3.5 text-white/60" />}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 styled-scrollbar min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-3"
          >
            <div
              className="rounded-2xl rounded-tl-sm px-3 py-2"
              style={{ background: 'rgba(10,0,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries (only show when no conversation yet) */}
      {messages.length <= 1 && !loading && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.slice(0, 3).map(q => (
            <button
              key={q}
              onClick={() => void sendMessage(q)}
              className="text-[9px] font-mono px-2 py-1 rounded-full border transition-colors hover:border-[rgba(200,140,20,0.6)] hover:text-[#C88C14]"
              style={{
                borderColor: 'rgba(200,140,20,0.2)',
                color: 'rgba(237,224,204,0.6)',
                background: 'rgba(200,140,20,0.05)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-3 py-2 shrink-0"
        style={{ borderTop: '1px solid rgba(200,140,20,0.15)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(200,140,20,0.06)', border: '1px solid rgba(200,140,20,0.18)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Oracle anything about global intelligence..."
            rows={1}
            className="flex-1 bg-transparent text-[11px] font-mono resize-none outline-none placeholder-white/30 leading-relaxed"
            style={{ color: '#EDE0CC', maxHeight: '80px' }}
            disabled={loading}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #C88C14, #CC1A1A)'
                : 'rgba(200,140,20,0.2)',
              boxShadow: input.trim() && !loading ? '0 0 12px rgba(200,140,20,0.4)' : 'none',
            }}
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <div className="mt-1 text-center">
          <span className="text-[7px] font-mono opacity-30" style={{ color: '#EDE0CC' }}>
            Powered by OpenRouter · Nemotron 550B · Live Feed Context
          </span>
        </div>
      </div>
    </motion.div>
  );
}
