import React, { useState } from 'react';
import { Film, Video, Image as ImageIcon, Sparkles, RefreshCw, Download, Play, AlertCircle } from 'lucide-react';

export const MotionVideoLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '10s'>('10s');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [videoData, setVideoData] = useState<{ base64?: string; mimeType?: string; uri?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const PRESET_PROMPTS = [
    'A hyper-realistic 3D metallic studio logo rotating with subtle neon edge reflections and smoke.',
    'Kinetic typography motion graphics displaying "MUSHAF KHAN DIGITAL STUDIO" with glitch transitions.',
    'Cinematic camera gliding across an obsidian luxury watch mechanism with macro depth of field.',
    'Minimalist mobile app interface floating in zero gravity with smooth card expansion animations.',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imagePreview) return;
    setGenerating(true);
    setErrorMsg('');
    setVideoData(null);

    try {
      const res = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || (imagePreview ? 'Animate this visual with cinematic camera movement and glowing studio light.' : ''),
          imageBase64: activeTab === 'image' ? imagePreview : undefined,
          aspectRatio,
          duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video generation failed.');
      }

      if (data.videoBase64) {
        setVideoData({
          base64: data.videoBase64,
          mimeType: data.mimeType || 'video/mp4',
        });
      } else if (data.uri) {
        setVideoData({ uri: data.uri });
      } else {
        setErrorMsg('Video processing completed. Generation status received.');
      }
    } catch (err: any) {
      console.error('Video error:', err);
      setErrorMsg(err.message || 'Video generation could not complete.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--border-subtle)] bg-[#0d100d] p-6 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c6f432]/20 border border-[#c6f432]/40 flex items-center justify-center text-[#c6f432]">
            <Film size={20} />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-white">Motion Video & CGI Studio</h3>
            <p className="font-mono text-xs text-white/50">Omni Flash Video Engine (gemini-omni-1.2-flash)</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'text' ? 'bg-[#c6f432] text-black font-bold' : 'text-white/70 hover:text-white'
            }`}
          >
            <Video size={13} /> Text-to-Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'image' ? 'bg-[#c6f432] text-black font-bold' : 'text-white/70 hover:text-white'
            }`}
          >
            <ImageIcon size={13} /> Animate Image
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Main Grid: Input / Presets / Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'image' && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-white/70 font-semibold">
                Upload Frame or Photo to Animate
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs font-mono file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#c6f432] file:text-black hover:file:opacity-90 cursor-pointer"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-[#c6f432]/40"
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-white/70 font-semibold mb-2">
              {activeTab === 'image' ? 'Motion Prompt (Describe the action & camera)' : 'Video Scene Prompt'}
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 3D holographic camera gimbal rotating smoothly on a dark reflective surface with volumetric smoke..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#c6f432] transition-colors resize-none"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block font-mono text-[11px] text-white/50 uppercase mb-2">Preset Studio Scenes:</span>
            <div className="space-y-1.5">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 text-xs text-white/80 transition-colors line-clamp-2 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Bar: Aspect Ratio & Duration */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div>
              <span className="block font-mono text-[11px] text-white/50 uppercase mb-1.5">Aspect Ratio:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-[#c6f432] text-black font-bold shadow-xs'
                      : 'bg-white/5 text-white/70 border border-white/10'
                  }`}
                >
                  16:9 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-[#c6f432] text-black font-bold shadow-xs'
                      : 'bg-white/5 text-white/70 border border-white/10'
                  }`}
                >
                  9:16 Portrait (Reels/TikTok)
                </button>
              </div>
            </div>

            <div>
              <span className="block font-mono text-[11px] text-white/50 uppercase mb-1.5">Duration:</span>
              <div className="flex items-center gap-2">
                {(['5s', '10s'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`min-h-[44px] min-w-[48px] px-3.5 py-2 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                      duration === d
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/5 text-white/70 border border-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || (!prompt.trim() && !imagePreview)}
            className="w-full min-h-[48px] py-3.5 rounded-2xl bg-[#c6f432] text-[#050505] font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Generating Video with Omni Flash...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Studio Video</span>
              </>
            )}
          </button>
        </div>

        {/* Video Preview Column */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 rounded-2xl bg-black/40 border border-white/10 min-h-[340px]">
          {videoData?.base64 ? (
            <div className="space-y-3 w-full">
              <video
                src={`data:${videoData.mimeType};base64,${videoData.base64}`}
                controls
                autoPlay
                loop
                playsInline
                className={`w-full rounded-2xl border border-white/20 shadow-2xl ${
                  aspectRatio === '9:16' ? 'max-h-[460px] mx-auto' : 'aspect-video'
                }`}
              />
              <a
                href={`data:${videoData.mimeType};base64,${videoData.base64}`}
                download={`mushaf-khan-studio-motion-${Date.now()}.mp4`}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={13} /> Download Generated MP4
              </a>
            </div>
          ) : (
            <div className="text-center space-y-3 p-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#c6f432]">
                <Film size={26} />
              </div>
              <h4 className="font-display text-lg text-white">Video Rendering Viewport</h4>
              <p className="font-mono text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                Configure your prompt or upload an image and click Generate. Aspect ratio supports 16:9 widescreen or 9:16 portrait.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
