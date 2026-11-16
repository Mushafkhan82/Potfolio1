import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  Brain,
  Palette,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model: string;
  isError?: boolean;
  retryPrompt?: string;
}

interface ModelOption {
  id: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen' | 'gemini-4-argon' | 'gemini-4-carbon';
  name: string;
  badge: string;
  roleTitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accentColor: string;
}

const MODELS: ModelOption[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    badge: 'Standard',
    roleTitle: 'Studio Advisor',
    description: 'General tasks, service guides, project estimates & client discovery',
    icon: Sparkles,
    accentColor: '#6BAA00',
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    badge: 'Deep Reasoning',
    roleTitle: 'Systems Architect',
    description: 'Deep reasoning, system blueprints, tech stack trade-offs & audits',
    icon: Brain,
    accentColor: '#2563EB',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Complex Creative',
    roleTitle: 'Creative Director',
    description: 'Complex interactive design, motion systems & UX strategy',
    icon: Palette,
    accentColor: '#C026D3',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'Fast',
    roleTitle: 'Instant FAQ',
    description: 'Tasks that should happen fast: quick answers, rate cards & links',
    icon: Zap,
    accentColor: '#D97706',
  },
];

const STARTER_PROMPTS = [
  {
    label: 'Estimate 14-Day Sprint',
    prompt: 'Can you provide a scope breakdown and ballpark estimate for a 14-day web application sprint with React and Tailwind?',
    model: 'gemini-4-hydrogen' as const,
  },
  {
    label: 'Architecture Deep Dive',
    prompt: 'What are the architectural trade-offs between Cloud SQL Postgres and Firestore for a high-traffic SaaS dashboard?',
    model: 'gemini-4-carbon' as const,
  },
  {
    label: 'Creative Motion & 3D Plan',
    prompt: 'How would Mushaf structure a brand identity that combines 3D Blender visuals with subtle UI motion graphics?',
    model: 'gemini-4-argon' as const,
  },
  {
    label: 'Quick Pricing & Delivery',
    prompt: 'What are the starting rates for UI/UX design and video editing services?',
    model: 'gemini-3.1-flash-lite' as const,
  },
];

export function GeminiChatbot() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('mushaf_chat_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const [overlayBlocked, setOverlayBlocked] = useState(false);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption['id']>('gemini-4-hydrogen');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize with welcoming system introduction
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('mushaf_studio_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: ChatMessage) =>
            m.model === 'gemini-3.8-flash' ? { ...m, model: 'gemini-4-hydrogen' } : m
          );
        }
      }
    } catch {}
    return [
      {
        id: 'intro-msg',
        role: 'assistant',
        content: `**Welcome to Mushaf Khan Digital Studio AI Advisor.**

I'm configured with live intelligence on our 8 disciplines:
- Web & App Engineering (React 19, TypeScript, Tailwind)
- UI/UX & Digital Product Design
- Video Editing & High-Impact Motion Graphics
- 3D & Procedural Craft
- SEO, Social Growth & AI Automation

Choose a specialized model above depending on your task (e.g. **Gemini 4 Hydrogen** for project scoping, **Gemini 3.1 Flash-Lite** for instant answers, or **Gemini 4 Carbon** for architecture). How can I assist your project today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-4-hydrogen',
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('mushaf_studio_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const state = { navOpen: false, cartOpen: false };
    const onOverlay = (e: Event) => {
      const detail = (e as CustomEvent<{ navOpen?: boolean; cartOpen?: boolean }>).detail || {};
      if (typeof detail.navOpen === 'boolean') state.navOpen = detail.navOpen;
      if (typeof detail.cartOpen === 'boolean') state.cartOpen = detail.cartOpen;
      setOverlayBlocked(state.navOpen || state.cartOpen);
    };
    window.addEventListener('mk-overlay-state', onOverlay);
    return () => window.removeEventListener('mk-overlay-state', onOverlay);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mk-overlay-state', { detail: { chatOpen: isOpen && !isMinimized } })
    );
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || isMinimized || typeof window === 'undefined') {
      setMobileViewportHeight(null);
      return;
    }
    const updateViewport = () => {
      if (window.innerWidth < 640 && window.visualViewport) {
        setMobileViewportHeight(Math.round(window.visualViewport.height));
      } else {
        setMobileViewportHeight(null);
      }
    };
    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.addEventListener('resize', updateViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModelPicker(false);
        setConfirmReset(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const currentModelInfo = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Offline Notice:** You appear to be offline. Reconnect to send "${text}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        isError: true,
        retryPrompt: text,
      };
      setMessages((prev) => [...prev, offlineMsg]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 28_000);

    try {
      // Prepare multi-turn conversation payload
      const payloadMessages = newMessages
        .filter((m) => m.id !== 'intro-msg' && !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: payloadMessages,
        }),
        signal: controller.signal,
      });

      const rawText = await res.text();
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        const isHtml =
          !contentType.includes('application/json') &&
          rawText.trimStart().startsWith('<');
        throw new Error(
          data?.error ||
            (isHtml
              ? `Chat service returned an HTML error page (HTTP ${res.status}). Please refresh or retry in a moment.`
              : `Server responded with status ${res.status}`)
        );
      }

      if (!data || typeof data.text !== 'string') {
        throw new Error(
          'Received an unexpected non-JSON response from the chat server. Please refresh the page and try again.'
        );
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isTimeout = err?.name === 'AbortError';
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Notice:** ${
          isTimeout
            ? 'The chat request timed out. Please try again.'
            : err.message || 'Unable to connect to Gemini API. Please verify the server connection or API key in Settings > Secrets.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        isError: true,
        retryPrompt: text,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleConfirmReset = () => {
    const resetIntro: ChatMessage = {
      id: `intro-${Date.now()}`,
      role: 'assistant',
      content: `Conversation reset. Select a model to start fresh.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    };
    setMessages([resetIntro]);
    setConfirmReset(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render markdown bold, bullet points, headers, and code
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-display font-medium text-base text-[color:var(--text-primary)] mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-display font-medium text-lg text-[color:var(--text-primary)] mt-4 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="font-display font-medium text-xl text-[color:var(--text-primary)] mt-4 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6BAA00] shrink-0 mt-2" />
            <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
          </div>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    });
  };

  // Safe inline markdown formatter for bold, code, and links
  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#111111] font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-[#111111]">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded font-mono text-xs bg-[#FAF8F4] border border-[#E7E3DA] text-[#4C7A00]">$1</code>');
  };

  const hideLauncher =
    overlayBlocked || pathname.startsWith('/checkout') || pathname.startsWith('/admin');

  const toggleDismiss = (next: boolean) => {
    setIsDismissed(next);
    try {
      localStorage.setItem('mushaf_chat_dismissed', next ? '1' : '0');
    } catch {}
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && !hideLauncher && !isDismissed && (
        <div className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 z-[65] animate-in fade-in zoom-in duration-300 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleDismiss(true)}
            aria-label="Dismiss AI assistant button"
            title="Hide AI button"
            className="md:hidden w-7 h-7 rounded-full glass-pill text-[#5B5B56] flex items-center justify-center cursor-pointer"
          >
            <X size={12} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsOpen(true);
            }}
            aria-label="Open Studio AI Chatbot"
            className="group relative w-14 h-14 p-0 md:w-auto md:h-auto md:px-4 md:py-2.5 flex items-center justify-center md:justify-start gap-2.5 rounded-full glass-strong text-[#111111] hover:border-[#6BAA00] hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="relative w-9 h-9 md:w-8 md:h-8 rounded-full bg-[#B6F500] text-[#111111] flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={16} className="group-hover:rotate-12 transition-transform duration-300" />
            </div>

            <div className="relative text-left hidden md:block pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-semibold">
                  Studio AI
                </span>
              </div>
              <span className="font-sans text-xs font-semibold text-[#111111] block">
                Ask Gemini Assistant
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Subtle restore button if user dismissed on mobile */}
      {!isOpen && !hideLauncher && isDismissed && (
        <button
          type="button"
          onClick={() => {
            toggleDismiss(false);
            setIsOpen(true);
          }}
          aria-label="Restore Studio AI Assistant"
          className="md:hidden fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-4 z-[65] min-h-[44px] px-3 rounded-full glass-strong text-[#111111] font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} className="text-[#6BAA00]" />
          <span>AI</span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mushaf Studio AI Assistant"
          className={`fixed z-[80] transition-all duration-300 shadow-[0_24px_60px_-15px_rgba(17,17,17,0.22)] ${
            isMinimized
              ? 'bottom-[calc(84px+env(safe-area-inset-bottom))] sm:bottom-6 right-4 sm:right-6 w-72 sm:w-80 h-16 rounded-2xl overflow-hidden'
              : 'inset-0 w-full rounded-none sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[460px] sm:h-[650px] sm:rounded-3xl'
          } flex flex-col glass-strong text-[#111111] font-sans`}
          style={{
            height: !isMinimized && mobileViewportHeight ? `${mobileViewportHeight}px` : undefined,
            paddingTop: !isMinimized ? 'env(safe-area-inset-top)' : undefined,
            paddingBottom: !isMinimized ? 'env(safe-area-inset-bottom)' : undefined,
          }}
        >
          {/* Header */}
          <div className="relative px-4 py-3 border-b border-[#E7E3DA] bg-white/40 dark:bg-black/25 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0"
                style={{ backgroundColor: `${currentModelInfo.accentColor}1A`, color: currentModelInfo.accentColor }}
              >
                <currentModelInfo.icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-[#111111] truncate">
                    Mushaf Studio AI
                  </h3>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-widest shrink-0"
                    style={{
                      backgroundColor: `${currentModelInfo.accentColor}18`,
                      color: currentModelInfo.accentColor,
                    }}
                  >
                    {currentModelInfo.badge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="min-h-[36px] flex items-center gap-1 text-[11px] font-mono text-[#5B5B56] hover:text-[#111111] transition-colors text-left cursor-pointer"
                >
                  <span>{currentModelInfo.name}</span>
                  <ChevronDown size={12} className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-0.5 text-[#5B5B56] shrink-0">
              <button
                type="button"
                onClick={() => setConfirmReset((v) => !v)}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="w-11 h-11 rounded-xl hover:bg-[#E7E3DA]/50 hover:text-[#111111] transition-colors cursor-pointer flex items-center justify-center"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="hidden sm:flex w-11 h-11 rounded-xl hover:bg-[#E7E3DA]/50 hover:text-[#111111] transition-colors cursor-pointer items-center justify-center"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
                className="w-11 h-11 rounded-xl hover:bg-[#E7E3DA]/50 hover:text-[#111111] transition-colors cursor-pointer flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {confirmReset && !isMinimized && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-red-700">Reset this conversation?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:opacity-90 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E3DA] text-[#5B5B56] hover:text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isOnline && !isMinimized && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11px] font-mono text-amber-800">
              <WifiOff size={13} className="shrink-0" />
              <span>You are offline. Reconnect to send new messages.</span>
            </div>
          )}

          {/* Model Selector Dropdown Menu */}
          {showModelPicker && !isMinimized && (
            <div className="p-3 bg-[#FAF8F4] border-b border-[#E7E3DA] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 z-10">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#5B5B56] px-1 mb-1">
                <span>SELECT TASK-SPECIALIZED MODEL</span>
                <span>4 ENGINES</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#6BAA00] bg-[#B6F500]/15 text-[#111111] shadow-xs'
                          : 'border-[#E7E3DA] bg-white text-[#5B5B56] hover:border-[#6BAA00]/50 hover:text-[#111111]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} style={{ color: m.accentColor }} />
                          <span className="font-mono text-xs font-bold text-[#111111]">{m.name}</span>
                        </div>
                        {isSelected && <span className="text-[10px] text-[#6BAA00]">●</span>}
                      </div>
                      <span className="text-[10px] text-[#5B5B56] leading-tight block">
                        {m.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Body Content when Not Minimized */}
          {!isMinimized && (
            <>
              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-transparent">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const modelInfo = MODELS.find((m) => m.id === msg.model) || currentModelInfo;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-in fade-in duration-200`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {!isUser && (
                          <span
                            className="font-mono text-[9px] uppercase tracking-wider font-semibold"
                            style={{ color: modelInfo.accentColor }}
                          >
                            {modelInfo.roleTitle} ({modelInfo.name})
                          </span>
                        )}
                        <span className="font-mono text-[9px] text-[#5B5B56]">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`relative max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${
                          isUser
                            ? 'bg-[#B6F500] text-[#111111] font-medium rounded-tr-xs shadow-xs'
                            : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111] rounded-tl-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="max-w-none text-[#111111]">
                            {renderFormattedContent(msg.content)}
                          </div>
                        )}

                        {/* Message Actions */}
                        {!isUser && (
                          <div className="mt-2.5 pt-2 border-t border-[#E7E3DA] flex items-center justify-between gap-2 text-[11px] font-mono text-[#5B5B56]">
                            <span className="flex items-center gap-1 text-[10px]">
                              <ShieldCheck size={11} className="text-[#6BAA00]" />
                              <span>{msg.isError ? 'Connection Issue' : 'Verified Studio Knowledge'}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              {msg.isError && msg.retryPrompt && (
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleSend(msg.retryPrompt)}
                                  className="px-2 py-0.5 rounded-md bg-[#B6F500] text-[#111111] font-bold flex items-center gap-1 hover:opacity-90 cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw size={11} />
                                  <span>Retry</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="hover:text-[#111111] flex items-center gap-1 transition-colors p-1 cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check size={12} className="text-[#6BAA00]" />
                                    <span className="text-[#6BAA00]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex flex-col items-start space-y-1.5 animate-in fade-in duration-200">
                    <span className="font-mono text-[9px] text-[#5B5B56] uppercase tracking-widest pl-1">
                      {currentModelInfo.name} thinking...
                    </span>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-xs bg-[#FAF8F4] border border-[#E7E3DA] text-[#111111]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#6BAA00] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-mono text-[#5B5B56] ml-1">Formulating response</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Prompt Chips */}
              {messages.length <= 2 && (
                <div className="px-4 py-2.5 border-t border-[#E7E3DA] bg-white/30 dark:bg-black/20">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#5B5B56] mb-2">
                    Quick Studio Questions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedModel(item.model);
                          handleSend(item.prompt);
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-full text-[11px] font-mono glass-pill hover:border-[#6BAA00] text-[#111111] transition-all text-left flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight size={11} className="text-[#6BAA00]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 border-t border-[#E7E3DA] bg-white/45 dark:bg-black/25 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative bg-[#FAF8F4] border border-[#E7E3DA] rounded-2xl focus-within:border-[#6BAA00] transition-colors overflow-hidden">
                    <textarea
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Ask ${currentModelInfo.roleTitle}...`}
                      rows={1}
                      disabled={isLoading}
                      className="w-full min-h-[44px] bg-transparent px-3.5 py-2.5 text-base sm:text-sm text-[#111111] placeholder:text-[#5B5B56]/70 focus:outline-none resize-none max-h-28"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isLoading}
                    className="w-11 h-11 rounded-2xl bg-[#B6F500] text-[#111111] flex items-center justify-center font-bold hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shrink-0 cursor-pointer shadow-sm"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send size={17} />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-[#5B5B56]">
                  <span>Engine: {currentModelInfo.name}</span>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-[#6BAA00] transition-colors flex items-center gap-1"
                  >
                    <span>Direct Brief Form</span>
                    <ArrowUpRight size={10} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
export default GeminiChatbot;
