import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Radio, Volume2, Sparkles, Activity } from 'lucide-react';

export const LiveVoiceStudio: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Ready to connect');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Helper: Float32Array to 16-bit PCM Base64
  const floatTo16BitPCMBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Playback 24kHz PCM chunk with gapless scheduling
  const playPCMChunk = (base64Data: string) => {
    if (!audioContextOutRef.current) {
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    const ctx = audioContextOutRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    audioQueueRef.current.push(source);
    source.onended = () => {
      audioQueueRef.current = audioQueueRef.current.filter((s) => s !== source);
    };
  };

  const stopAllPlayback = () => {
    audioQueueRef.current.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    audioQueueRef.current = [];
    if (audioContextOutRef.current) {
      nextStartTimeRef.current = audioContextOutRef.current.currentTime;
    }
  };

  const startSession = async () => {
    setStatusText('Requesting microphone & initializing Live API session...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 16kHz for input mic capture
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextInRef.current = inCtx;

      // 24kHz for model output playback
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('Live Audio Session Active • Speak naturally');

        // Mic audio processor
        const source = inCtx.createMediaStreamSource(stream);
        const processor = inCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate visual level
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          setAudioLevel(Math.min(100, Math.round((sum / inputData.length) * 400)));

          if (ws.readyState === WebSocket.OPEN) {
            const pcmBase64 = floatTo16BitPCMBase64(inputData);
            ws.send(JSON.stringify({ audio: pcmBase64 }));
          }
        };

        source.connect(processor);
        processor.connect(inCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playPCMChunk(msg.audio);
          }
          if (msg.interrupted) {
            stopAllPlayback();
          }
          if (msg.error) {
            setStatusText(`Notice: ${msg.error}`);
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onclose = () => {
        cleanupSession();
        setStatusText('Session disconnected');
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        cleanupSession();
        setStatusText('Live connection error or key not ready');
      };
    } catch (err: any) {
      console.error('Microphone or connection failure:', err);
      setStatusText(`Error: ${err.message || 'Microphone access denied'}`);
      cleanupSession();
    }
  };

  const cleanupSession = () => {
    setIsConnected(false);
    stopAllPlayback();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (audioContextInRef.current) {
      try {
        audioContextInRef.current.close();
      } catch (e) {}
      audioContextInRef.current = null;
    }

    if (audioContextOutRef.current) {
      try {
        audioContextOutRef.current.close();
      } catch (e) {}
      audioContextOutRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  return (
    <div className="rounded-3xl border border-[color:var(--border-subtle)] bg-[#0d100d] p-6 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c6f432]/20 border border-[#c6f432]/40 flex items-center justify-center text-[#c6f432]">
            <Radio size={20} className={isConnected ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-white">Live Voice Director Studio</h3>
            <p className="font-mono text-xs text-white/50">Real-Time Bidirectional Voice via gemini-3.8-live</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-[#c6f432] shadow-[0_0_12px_#c6f432]' : 'bg-white/20'
            }`}
          />
          <span className="font-mono text-xs text-white/70">{isConnected ? 'LIVE' : 'STANDBY'}</span>
        </div>
      </div>

      {/* Center Voice Console */}
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center space-y-6">
        {/* Animated Waveform Visualizer */}
        <div className="flex items-center gap-1.5 h-16">
          {[...Array(16)].map((_, i) => {
            const height = isConnected ? Math.max(8, (audioLevel * (1 + (i % 4) * 0.4)) % 56) : 8;
            return (
              <div
                key={i}
                style={{ height: `${height}px` }}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isConnected ? 'bg-[#c6f432]' : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>

        <div>
          <h4 className="font-display text-2xl text-white mb-1.5">
            {isConnected ? 'Voice Session In Progress' : 'Start Studio Voice Consultation'}
          </h4>
          <p className="font-mono text-xs text-white/60 max-w-md mx-auto">{statusText}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button
              type="button"
              onClick={startSession}
              className="px-6 py-3.5 rounded-full bg-[#c6f432] text-[#050505] font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 hover:opacity-90 shadow-xl transition-all cursor-pointer"
            >
              <PhoneCall size={16} />
              <span>Connect Voice Session</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                  isMuted ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/10 border-white/20 text-white'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                type="button"
                onClick={cleanupSession}
                className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <PhoneOff size={16} />
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
