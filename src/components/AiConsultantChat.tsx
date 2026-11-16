import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Globe, MapPin, RefreshCw, Cpu, ExternalLink, Bookmark } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
  timestamp?: string;
}

export const AiConsultantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Greetings. I'm the AI Creative Director & Strategy Consultant for **Mushaf Khan Digital Studio**.\n\nWhether you need to architect a high-performance web platform, plan a 3D Blender pipeline, storyboard a motion graphics campaign, or integrate custom AI automations—ask me anything about project scope, tech stack, or budget estimates.",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-4-hydrogen');
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  const [loading, setLoading] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const parseJsonSafely = async (res: Response) => {
        const raw = await res.text();
        let parsed: any = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = null;
          }
        }
        if (!res.ok) {
          throw new Error(
            parsed?.error || `Chat service returned HTTP ${res.status}`
          );
        }
        if (!parsed) {
          throw new Error('Chat service returned a non-JSON response.');
        }
        return parsed;
      };

      if (groundingMode === 'search') {
        const res = await fetch('/api/gemini/grounding/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userText }),
        });
        const data = await parseJsonSafely(res);
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.text || 'Information retrieved.',
            groundingChunks: data.groundingChunks,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (groundingMode === 'maps') {
        let lat: number | undefined;
        let lng: number | undefined;

        if (navigator.geolocation) {
          try {
            const pos: GeolocationPosition = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (geoErr) {
            console.warn('Geolocation unavailable for maps grounding:', geoErr);
          }
        }

        const res = await fetch('/api/gemini/grounding/maps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userText, lat, lng }),
        });
        const data = await parseJsonSafely(res);
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.text || 'Location insights retrieved.',
            groundingChunks: data.groundingChunks,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        // Standard Multi-Turn Chat
        const formattedPayload = newMessages.map((m) => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: formattedPayload,
            model: selectedModel,
          }),
        });
        const data = await parseJsonSafely(res);
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.text || 'Response generated.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ Error: ${err.message || 'Unable to generate response. Please check network or try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToFirestore = async () => {
    if (!auth.currentUser) {
      setSavedNotification(
        'Please sign in with Google in the Client Portal to save chat conversations.'
      );
      setTimeout(() => setSavedNotification(''), 4500);
      return;
    }

    try {
      const userConvoPath = `users/${auth.currentUser.uid}/conversations`;
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'conversations'), {
        userId: auth.currentUser.uid,
        title: messages[1]?.text?.slice(0, 50) || 'Studio Consultation',
        modelUsed: selectedModel,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.text?.slice(0, 200) || '',
        updatedAt: serverTimestamp(),
      });
      setSavedNotification('Conversation saved to your Firestore profile!');
      setTimeout(() => setSavedNotification(''), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/conversations`);
    }
  };

  return (
    <div className="flex flex-col h-[640px] rounded-3xl border border-[#E7E3DA] bg-white text-[#111111] overflow-hidden shadow-[0_12px_40px_-15px_rgba(17,17,17,0.1)]">
      {/* Top Header Bar */}
      <div className="p-4 bg-[#FAF8F4] border-b border-[#E7E3DA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B6F500]/25 border border-[#6BAA00]/35 flex items-center justify-center text-[#6BAA00]">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-medium text-lg text-[#111111]">AI Studio Director</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#B6F500]/25 text-[#4C7A00] text-[10px] font-mono font-bold uppercase">
                Interactive
              </span>
            </div>
            <p className="font-mono text-xs text-[#5B5B56]">Multi-Turn Consultation • Grounded Intelligence</p>
          </div>
        </div>

        {/* Model Selection & Grounding Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Switcher */}
          <div className="flex items-center gap-1 bg-white border border-[#E7E3DA] rounded-xl p-1 text-xs font-mono">
            <Cpu size={12} className="text-[#6BAA00] ml-1.5" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-[#111111] text-xs focus:outline-none cursor-pointer pr-2"
            >
              <option value="gemini-4-hydrogen" className="bg-white text-[#111111]">
                gemini-4-hydrogen (General)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-white text-[#111111]">
                gemini-3.1-flash-lite (Ultra-Fast)
              </option>
              <option value="gemini-4-carbon" className="bg-white text-[#111111]">
                gemini-4-carbon (Deep Reasoning)
              </option>
              <option value="gemini-4-argon" className="bg-white text-[#111111]">
                gemini-4-argon (Complex Interactive)
              </option>
            </select>
          </div>

          {/* Grounding Mode Pills */}
          <div className="flex items-center gap-1 bg-white border border-[#E7E3DA] rounded-xl p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setGroundingMode('none')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                groundingMode === 'none' ? 'bg-[#B6F500] text-[#111111] font-bold' : 'text-[#5B5B56] hover:text-[#111111]'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setGroundingMode('search')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                groundingMode === 'search' ? 'bg-[#B6F500] text-[#111111] font-bold' : 'text-[#5B5B56] hover:text-[#111111]'
              }`}
              title="Ground with live Google Search"
            >
              <Globe size={11} />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => setGroundingMode('maps')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                groundingMode === 'maps' ? 'bg-[#B6F500] text-[#111111] font-bold' : 'text-[#5B5B56] hover:text-[#111111]'
              }`}
              title="Ground with live Google Maps places"
            >
              <MapPin size={11} />
              <span>Maps</span>
            </button>
          </div>

          {/* Save to Firestore */}
          <button
            type="button"
            onClick={handleSaveToFirestore}
            className="p-2 rounded-xl bg-white hover:bg-[#FAF8F4] border border-[#E7E3DA] text-[#5B5B56] hover:text-[#111111] transition-colors cursor-pointer"
            title="Bookmark conversation to Firestore profile"
          >
            <Bookmark size={14} />
          </button>
        </div>
      </div>

      {/* Saved notification banner */}
      {savedNotification && (
        <div className="bg-[#B6F500]/25 border-b border-[#6BAA00]/30 text-[#111111] font-mono text-xs py-1.5 px-4 text-center">
          {savedNotification}
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans bg-white">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#B6F500]/25 border border-[#6BAA00]/35 flex items-center justify-center text-[#6BAA00] shrink-0 mt-1">
                  <Sparkles size={14} />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#B6F500] text-[#111111] font-medium shadow-xs'
                    : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Citations & Web Sources */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E7E3DA] space-y-1.5">
                    <p className="font-mono text-[11px] text-[#6BAA00] font-semibold flex items-center gap-1">
                      <Globe size={11} /> Grounded Sources & Citations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingChunks.map((chunk: any, i: number) => {
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || uri;
                        if (!uri) return null;
                        return (
                          <a
                            key={i}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E7E3DA] hover:border-[#6BAA00] text-[11px] font-mono text-[#111111] transition-colors"
                          >
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[180px]">{title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={`mt-2 font-mono text-[10px] ${isUser ? 'text-[#111111]/60 text-right' : 'text-[#5B5B56]'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-center text-[#111111] shrink-0 mt-1">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-[#5B5B56] font-mono text-xs">
            <div className="w-8 h-8 rounded-full bg-[#B6F500]/20 border border-[#6BAA00]/30 flex items-center justify-center text-[#6BAA00]">
              <RefreshCw size={14} className="animate-spin" />
            </div>
            <span>Thinking with {selectedModel}...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#FAF8F4] border-t border-[#E7E3DA] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            groundingMode === 'search'
              ? 'Ask with Google Search grounding (e.g. latest 2026 web design trends)...'
              : groundingMode === 'maps'
              ? 'Ask with Google Maps grounding (e.g. design studios or creative hubs near me)...'
              : 'Ask studio director about tech stacks, 3D pipelines, or quote estimates...'
          }
          className="flex-1 bg-white border border-[#E7E3DA] rounded-2xl px-4 py-3 text-sm text-[#111111] placeholder:text-[#5B5B56] focus:outline-none focus:border-[#6BAA00] transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-2xl bg-[#B6F500] text-[#111111] font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
