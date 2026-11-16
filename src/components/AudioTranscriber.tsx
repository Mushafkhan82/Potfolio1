import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Sparkles, Check, Copy, RefreshCw, Volume2 } from 'lucide-react';

interface AudioTranscriberProps {
  onTranscriptReady?: (transcript: string) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({ onTranscriptReady }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const startRecording = async () => {
    setErrorMsg('');
    setTranscript('');
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await sendForTranscription(base64Data);
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Microphone permission required for audio recording. Please enable it in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const sendForTranscription = async (base64Audio: string) => {
    setTranscribing(true);
    try {
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTranscript(data.text || '');
      if (onTranscriptReady && data.text) {
        onTranscriptReady(data.text);
      }
    } catch (err: any) {
      console.error('Transcription failed:', err);
      setErrorMsg(err.message || 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  const copyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-3xl border border-[color:var(--border-subtle)] bg-[#0d100d] p-6 text-white shadow-xl space-y-6">
      {/* Title & Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c6f432]/20 border border-[#c6f432]/40 flex items-center justify-center text-[#c6f432]">
            <Mic size={18} />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-white">Voice Dictation & Audio Studio</h3>
            <p className="font-mono text-xs text-white/50">Powered by gemini-3.5-transcribe</p>
          </div>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#c6f432]">
          16kHz Studio Audio
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs">
          {errorMsg}
        </div>
      )}

      {/* Recording Console */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          {isRecording && (
            <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
          )}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white scale-105'
                : 'bg-[#c6f432] hover:bg-[#b2e022] text-[#050505] hover:scale-105'
            }`}
          >
            {isRecording ? <Square size={28} /> : <Mic size={28} />}
          </button>
        </div>

        <div>
          <div className="font-mono text-xl font-bold tracking-widest text-white">
            {isRecording ? formatTime(recordingDuration) : '00:00'}
          </div>
          <p className="font-mono text-xs text-white/60 mt-1">
            {isRecording
              ? 'Recording live voice brief... Click to finish'
              : 'Click microphone to dictate requirements or feedback'}
          </p>
        </div>

        {audioUrl && (
          <div className="w-full max-w-md pt-2">
            <audio src={audioUrl} controls className="w-full rounded-lg" />
          </div>
        )}
      </div>

      {/* Transcription Output */}
      {transcribing && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-mono text-xs text-white/70">
          <RefreshCw size={14} className="animate-spin text-[#c6f432]" />
          <span>Transcribing voice recording with gemini-3.5-transcribe...</span>
        </div>
      )}

      {transcript && (
        <div className="p-5 rounded-2xl bg-[#141814] border border-[#c6f432]/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#c6f432] flex items-center gap-1.5 uppercase">
              <Sparkles size={13} /> Generated Transcription
            </span>
            <button
              type="button"
              onClick={copyTranscript}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-[#c6f432]" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm text-white/90 leading-relaxed font-sans whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
};
