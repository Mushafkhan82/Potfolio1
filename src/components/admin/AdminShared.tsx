import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  List,
  Link2,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Check,
  Loader2,
  Film,
  Eraser,
} from 'lucide-react';
import {
  listMediaAssets,
  uploadFileToStorage,
} from '../../lib/storeService';
import type { MediaAsset } from '../../types/store';

// ======================= CSV HELPERS =======================

export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | undefined)[][]) {
  const escape = (val: unknown) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = splitRow(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj;
  });
}

// ======================= RICH TEXT EDITOR =======================

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write formatted description...',
  minHeight = 160,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (!sourceMode && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, sourceMode]);

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const applyLink = () => {
    const clean = linkUrl.trim();
    if (clean) {
      exec('createLink', clean);
    }
    setLinkUrl('');
    setShowLinkInput(false);
  };

  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-black/5 dark:bg-white/[0.03] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[color:var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Bold"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Italic"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', 'h2')}
            title="Heading"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput((v) => !v)}
            title="Insert Link"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <Link2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            title="Clear formatting"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <Eraser size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSourceMode((s) => !s)}
          className="px-2 py-1 rounded text-[11px] font-mono border border-[color:var(--border-subtle)] hover:border-[#C6F432] cursor-pointer"
        >
          {sourceMode ? 'Visual' : 'HTML'}
        </button>
      </div>

      {showLinkInput && !sourceMode && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[color:var(--border-subtle)] bg-black/[0.04] dark:bg-white/[0.04]">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              } else if (e.key === 'Escape') {
                setShowLinkInput(false);
              }
            }}
            placeholder="https://example.com"
            className="flex-1 min-w-[180px] px-2.5 py-1 rounded-lg text-xs font-mono bg-black/5 dark:bg-white/[0.06] border border-[color:var(--border-subtle)] focus:outline-none focus:border-[#C6F432]"
          />
          <button
            type="button"
            onClick={applyLink}
            className="px-2.5 py-1 rounded-lg bg-[#C6F432] text-[#050505] text-xs font-mono font-bold cursor-pointer"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2.5 py-1 rounded-lg border border-[color:var(--border-subtle)] text-xs font-mono cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight }}
          className="w-full p-3 text-xs font-mono bg-transparent focus:outline-none"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className="p-3.5 text-sm leading-relaxed focus:outline-none prose prose-sm dark:prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-[color:var(--text-muted)]"
        />
      )}
    </div>
  );
};

// ======================= MEDIA PICKER MODAL =======================

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  acceptVideo?: boolean;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  acceptVideo = false,
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPct, setUploadingPct] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await listMediaAssets();
      setAssets(list);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    try {
      for (const file of Array.from(files)) {
        setUploadingPct(0);
        const uploaded = await uploadFileToStorage(file, 'store-media', (pct) =>
          setUploadingPct(pct)
        );
        setAssets((prev) => [uploaded, ...prev]);
        onSelect(uploaded);
        onClose();
        break;
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Upload failed. Ensure Firebase Storage is enabled and storage.rules allows your admin email.'
      );
    } finally {
      setUploadingPct(null);
    }
  };

  const filtered = assets.filter((a) => {
    if (!acceptVideo && a.mimeType.startsWith('video/')) return false;
    if (search.trim()) {
      return a.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Media Library Picker"
    >
      <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-[color:var(--bg-canvas)] border border-[color:var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[color:var(--border-subtle)] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">Media Library</h3>
            <p className="text-xs font-mono text-[color:var(--text-muted)]">
              Upload directly to Firebase Storage or pick an existing file
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[color:var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search uploaded files..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-black/5 dark:bg-white/[0.05] border border-[color:var(--border-subtle)]"
            />
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C6F432] text-[#050505] text-xs font-mono font-bold cursor-pointer">
            {uploadingPct !== null ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            <span>
              {uploadingPct !== null
                ? `Uploading ${uploadingPct}%`
                : 'Upload to Storage'}
            </span>
            <input
              type="file"
              accept={acceptVideo ? 'image/*,video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
          </label>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-[color:var(--text-muted)]">
              Loading Firebase Storage media...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-[color:var(--border-subtle)] rounded-2xl">
              <ImageIcon size={28} className="mx-auto text-[color:var(--text-muted)]" />
              <p className="text-sm font-medium">No uploaded files yet</p>
              <p className="text-xs text-[color:var(--text-muted)]">
                Upload an image or video above to store it in Firebase Storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((asset) => {
                const isVideo = asset.mimeType.startsWith('video/');
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden border border-[color:var(--border-subtle)] hover:border-[#C6F432] text-left cursor-pointer bg-black/5 dark:bg-white/[0.03]"
                  >
                    <div className="aspect-square bg-black/20 overflow-hidden">
                      {isVideo ? (
                        <div className="w-full h-full flex items-center justify-center text-[color:var(--accent-text)]">
                          <Film size={24} />
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="p-2 text-[11px] font-mono truncate">
                      {asset.name}
                    </div>
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C6F432] text-[#050505] items-center justify-center hidden group-hover:flex">
                      <Check size={12} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
