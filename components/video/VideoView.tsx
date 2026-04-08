"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Download, Volume2, VolumeX, Maximize,
  Type, RotateCcw, FastForward, Rewind, Play, Pause,
  SkipBack, SkipForward, Film, Palette, Sliders, Music,
  Upload, Scissors, Copy, MoveVertical, Sun, Contrast,
  FlipHorizontal, FlipVertical, RotateCw, ZoomIn,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface TextOverlay {
  id: string; text: string; startTime: number; endTime: number;
  x: number; y: number; fontSize: number; color: string; bgColor: string;
  bold: boolean; italic: boolean; fontFamily: string;
}

interface Clip {
  id: string; title: string; url: string; localFile?: boolean;
  startTrim: number; endTrim: number | null;
  volume: number; playbackRate: number;
  brightness: number; contrast: number; saturation: number;
  hue: number; blur: number; sepia: number; grayscale: number;
  sharpness: number; vignette: number; temperature: number;
  flipH: boolean; flipV: boolean; rotate: number; opacity: number;
  textOverlays: TextOverlay[]; addedAt: string;
}

const makeClip = (o: Partial<Clip> & { url: string; title: string }): Clip => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  startTrim: 0, endTrim: null, volume: 1, playbackRate: 1,
  brightness: 100, contrast: 100, saturation: 100, hue: 0,
  blur: 0, sepia: 0, grayscale: 0, sharpness: 0, vignette: 0, temperature: 0,
  flipH: false, flipV: false, rotate: 0, opacity: 100,
  textOverlays: [], addedAt: new Date().toISOString(), ...o,
});

// ── Constants ──────────────────────────────────────────────────────
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];

const FILTER_PRESETS = [
  { name:"None",      brightness:100,contrast:100,saturation:100,hue:0,  sepia:0, grayscale:0  },
  { name:"Vivid",     brightness:110,contrast:120,saturation:150,hue:0,  sepia:0, grayscale:0  },
  { name:"Muted",     brightness:95, contrast:90, saturation:60, hue:0,  sepia:0, grayscale:0  },
  { name:"Vintage",   brightness:100,contrast:90, saturation:80, hue:0,  sepia:40,grayscale:0  },
  { name:"B&W",       brightness:100,contrast:110,saturation:0,  hue:0,  sepia:0, grayscale:100},
  { name:"Warm",      brightness:105,contrast:100,saturation:110,hue:10, sepia:20,grayscale:0  },
  { name:"Cool",      brightness:95, contrast:100,saturation:90, hue:200,sepia:0, grayscale:0  },
  { name:"Dramatic",  brightness:90, contrast:150,saturation:80, hue:0,  sepia:0, grayscale:0  },
  { name:"Fade",      brightness:110,contrast:80, saturation:70, hue:0,  sepia:10,grayscale:0  },
  { name:"Cinematic", brightness:95, contrast:130,saturation:85, hue:5,  sepia:15,grayscale:0  },
  { name:"Summer",    brightness:110,contrast:105,saturation:130,hue:15, sepia:10,grayscale:0  },
  { name:"Noir",      brightness:85, contrast:140,saturation:0,  hue:0,  sepia:30,grayscale:80 },
];

const FONTS = ["Arial","Georgia","Impact","Courier New","Trebuchet MS","Comic Sans MS","Verdana","Helvetica"];
const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/ogg,video/mov,video/avi,video/mkv,video/*";

// ── Main Component ─────────────────────────────────────────────────
export default function VideoView({ databaseId }: { databaseId: string }) {
  const [clips, setClips]               = useState<Clip[]>([makeClip({ title:"Sample Video", url:"https://www.w3schools.com/html/mov_bbb.mp4" })]);
  const [selectedClip, setSelectedClip] = useState<Clip>(clips[0]);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [activePanel, setActivePanel]   = useState<"clips"|"filter"|"adjust"|"text"|"audio"|"speed"|"transform"|"crop">("clips");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab]             = useState<"url"|"upload">("upload");
  const [newUrl, setNewUrl]             = useState("");
  const [newTitle, setNewTitle]         = useState("");
  const [urlError, setUrlError]         = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Text overlay state
  const [overlayText, setOverlayText]   = useState("");
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayBg, setOverlayBg]       = useState("transparent");
  const [overlayFontSize, setOverlayFontSize] = useState(24);
  const [overlayFont, setOverlayFont]   = useState("Arial");
  const [overlayBold, setOverlayBold]   = useState(false);
  const [overlayItalic, setOverlayItalic] = useState(false);
  const [overlayX, setOverlayX]         = useState(50);
  const [overlayY, setOverlayY]         = useState(80);
  const [editingOverlayId, setEditingOverlayId] = useState<string|null>(null);

  // Crop state
  const [cropMode, setCropMode]         = useState(false);
  const [cropAspect, setCropAspect]     = useState("free");

  // Save state
  const [loadedOnce, setLoadedOnce]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savedAt, setSavedAt]           = useState<string|null>(null);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDropRef = useRef<HTMLDivElement>(null);
  const lastLocalEditAtRef = useRef<number>(Date.now());
  const lastAppliedRemoteSnapshotRef = useRef<string>("");
  const sel = selectedClip;

  // ── Load from DB ──
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${databaseId}/video`);
        const json = await res.json();
        if (json.clips?.length) {
          // Filter out any local blob URLs (they won't survive refresh)
          const restored = json.clips.map((c: Clip) => ({
            ...c,
            url: c.localFile ? "" : c.url,
          }));
          lastAppliedRemoteSnapshotRef.current = JSON.stringify(restored);
          setClips(restored);
          setSelectedClip(restored[0]);
        }
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoadedOnce(true); }
    };
    load();
  }, [databaseId]);

  // ── Auto-save ──
  useEffect(() => {
    if (!loadedOnce) return;
    const t = setTimeout(async () => {
      setSaving(true);
      try {
        // Don't save blob URLs (they're session-only)
        const saveable = clips.map(c => ({
          ...c,
          url: c.localFile ? "" : c.url,
        }));
        await fetch(`/api/databases/${databaseId}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clips: saveable }),
        });
        lastAppliedRemoteSnapshotRef.current = JSON.stringify(saveable);
        setSavedAt(new Date().toLocaleTimeString());
      } catch {}
      finally { setSaving(false); }
    }, 3000);
    return () => clearTimeout(t);
  }, [clips, databaseId, loadedOnce]);

  useEffect(() => {
    if (!loadedOnce) return;
    lastLocalEditAtRef.current = Date.now();
  }, [clips, loadedOnce]);

  useEffect(() => {
    if (!databaseId || !loadedOnce) return;

    let cancelled = false;
    const poll = async () => {
      if (Date.now() - lastLocalEditAtRef.current < 1200) return;
      if (editingOverlayId) return;

      try {
        const res = await fetch(`/api/databases/${databaseId}/video`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.clips)) return;

        const restored = json.clips.map((c: Clip) => ({
          ...c,
          url: c.localFile ? "" : c.url,
        }));
        const snapshot = JSON.stringify(restored);
        if (snapshot === lastAppliedRemoteSnapshotRef.current) return;

        lastAppliedRemoteSnapshotRef.current = snapshot;
        setClips(restored);
        setSelectedClip((prev) => restored.find((c) => c.id === prev.id) || restored[0]);
      } catch {
        // Ignore transient collaborator polling errors.
      }
    };

    const t = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [databaseId, loadedOnce, editingOverlayId]);

  // ── Sync video props ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = sel.volume;
    v.playbackRate = sel.playbackRate;
  }, [sel.volume, sel.playbackRate, selectedClip.id]);

  // ── Handlers ──
  const updateClip = useCallback((updates: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === sel.id ? { ...c, ...updates } : c));
    setSelectedClip(prev => ({ ...prev, ...updates }));
  }, [sel.id]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100 || 0);
    if (sel.endTrim && v.currentTime >= sel.endTrim) { v.pause(); setIsPlaying(false); }
  };

  const handleLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    if (sel.startTrim > 0) v.currentTime = sel.startTrim;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !sel.url) return;
    if (isPlaying) v.pause(); else v.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = (Number(e.target.value) / 100) * duration;
    setProgress(Number(e.target.value));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const getFilter = (c: Clip) =>
    `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) hue-rotate(${c.hue}deg) blur(${c.blur}px) sepia(${c.sepia}%) grayscale(${c.grayscale}%)`;

  const getTransform = (c: Clip) =>
    `scaleX(${c.flipH ? -1 : 1}) scaleY(${c.flipV ? -1 : 1}) rotate(${c.rotate}deg)`;

  // ── Add from URL ──
  const addFromUrl = () => {
    if (!newUrl.trim()) { setUrlError("Enter a URL"); return; }
    const c = makeClip({ title: newTitle || "Untitled", url: newUrl });
    setClips(p => [...p, c]);
    setSelectedClip(c);
    setNewUrl(""); setNewTitle(""); setUrlError(""); setShowAddModal(false);
    setIsPlaying(false);
  };

  // ── Add from desktop file ──
  const addFromFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) { alert("Please select a video file."); return; }
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, ""); // strip extension
    const c = makeClip({ title, url, localFile: true });
    setClips(p => [...p, c]);
    setSelectedClip(c);
    setShowAddModal(false);
    setIsPlaying(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFromFile(file);
    e.target.value = "";
  };

  // ── Drag & drop file onto modal ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) addFromFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => setIsDraggingFile(false);

  // ── Clip ops ──
  const deleteClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (clip?.localFile && clip.url) URL.revokeObjectURL(clip.url); // free memory
    const remaining = clips.filter(c => c.id !== id);
    setClips(remaining);
    if (selectedClip.id === id && remaining.length > 0) setSelectedClip(remaining[0]);
  };

  const duplicateClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    const newClip = { ...clip, id: Date.now().toString(), title: clip.title + " (copy)" };
    setClips(p => [...p, newClip]);
  };

  const reorderClip = (id: string, dir: "up" | "down") => {
    const idx = clips.findIndex(c => c.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === clips.length - 1) return;
    const arr = [...clips];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setClips(arr);
  };

  // ── Text overlays ──
  const addTextOverlay = () => {
    if (!overlayText.trim()) return;
    const ov: TextOverlay = {
      id: Date.now().toString(), text: overlayText,
      startTime: currentTime, endTime: currentTime + 5,
      x: overlayX, y: overlayY, fontSize: overlayFontSize,
      color: overlayColor, bgColor: overlayBg,
      bold: overlayBold, italic: overlayItalic, fontFamily: overlayFont,
    };
    updateClip({ textOverlays: [...sel.textOverlays, ov] });
    setOverlayText("");
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    updateClip({
      textOverlays: sel.textOverlays.map(o => o.id === id ? { ...o, ...updates } : o),
    });
  };

  const removeOverlay = (id: string) =>
    updateClip({ textOverlays: sel.textOverlays.filter(o => o.id !== id) });

  const activeOverlays = sel.textOverlays.filter(
    o => currentTime >= o.startTime && currentTime <= o.endTime
  );

  // ── Export ──
  const handleExport = () => {
    if (!sel.url || sel.localFile) {
      alert("Local file export: use your browser's built-in tools or a screen recorder.\n\nFor URL-based clips, the file will download.");
      return;
    }
    const a = document.createElement("a");
    a.href = sel.url; a.download = sel.title; a.click();
  };

  const handleSnapshot = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = getFilter(sel);
    ctx.drawImage(v, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `snapshot-${Date.now()}.png`;
    a.click();
  };

  // ── Components ──
  const PanelBtn = ({ id, icon, label }: { id: typeof activePanel; icon: React.ReactNode; label: string }) => (
    <button onClick={() => setActivePanel(id)}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium transition whitespace-nowrap ${activePanel === id ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
      {icon}{label}
    </button>
  );

  const Slider = ({ label, value, min, max, step = 1, onChange, onReset, unit = "" }:
    { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onReset?: () => void; unit?: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-400 w-18 shrink-0 leading-tight">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-indigo-500 cursor-pointer"/>
      <span className="text-[9px] text-gray-400 w-10 text-right">{value}{unit}</span>
      {onReset && (
        <button onClick={onReset} title="Reset" className="text-gray-600 hover:text-gray-400 transition shrink-0">
          <RotateCcw size={9}/>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden rounded-2xl">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">🎥 Video Editor</span>
          {saving && <span className="text-[9px] text-amber-400 animate-pulse">● Saving</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
          {sel.localFile && <span className="text-[9px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">Local file</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleSnapshot} title="Snapshot current frame"
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
            📸 Snapshot
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
            <Download size={12}/> Export
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition">
            <Plus size={12}/> Add Clip
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Clip list ══ */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Clips ({clips.length})</p>
            {/* Quick upload button */}
            <label title="Upload from desktop" className="cursor-pointer p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition">
              <Upload size={12}/>
              <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {clips.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-600">
                <Film size={20}/>
                <p className="text-[10px] text-center px-4">No clips yet.<br/>Click + Add Clip</p>
              </div>
            )}
            {clips.map((c, idx) => (
              <div key={c.id}
                onClick={() => { setSelectedClip(c); setIsPlaying(false); }}
                className={`flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-gray-800 transition border-b border-gray-800 group ${selectedClip.id === c.id ? "bg-gray-800 border-l-2 border-l-indigo-500" : ""}`}>
                <div className="w-10 h-8 bg-gray-700 rounded flex items-center justify-center text-sm shrink-0 relative">
                  🎬
                  {c.localFile && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <Upload size={7}/>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{c.title}</p>
                  <p className="text-[9px] text-gray-500">{fmt(c.startTrim)} → {c.endTrim ? fmt(c.endTrim) : "end"}</p>
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button onClick={e => { e.stopPropagation(); duplicateClip(c.id); }} className="p-0.5 bg-blue-600 rounded text-white" title="Duplicate"><Copy size={8}/></button>
                  <button onClick={e => { e.stopPropagation(); deleteClip(c.id); }} className="p-0.5 bg-red-600 rounded text-white" title="Delete"><Trash2 size={8}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Drop zone in sidebar */}
          <div
            className="m-2 rounded-xl border-2 border-dashed border-gray-700 hover:border-indigo-500 transition cursor-pointer p-3 text-center"
            onClick={() => fileInputRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) addFromFile(f); }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={14} className="mx-auto mb-1 text-gray-500"/>
            <p className="text-[9px] text-gray-500 leading-tight">Drop video here<br/>or click to browse</p>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
          </div>
        </div>

        {/* ══ CENTER: Video preview ══ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Video */}
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {sel.url ? (
              <>
                <video ref={videoRef} src={sel.url} crossOrigin="anonymous"
  className="max-h-full max-w-full"
  style={{
    filter: getFilter(sel),
    transform: getTransform(sel),
    opacity: sel.opacity / 100,
  }}
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={handleLoaded}
  onEnded={() => setIsPlaying(false)}
  onClick={togglePlay}
/>

                {/* Vignette overlay */}
                {sel.vignette > 0 && (
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 ${sel.vignette * 3}px ${sel.vignette * 2}px rgba(0,0,0,0.8)` }}/>
                )}

                {/* Text overlays */}
                {activeOverlays.map(o => (
                  <div key={o.id} className="absolute pointer-events-none px-2 py-1 rounded select-none"
                    style={{
                      left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)",
                      fontSize: o.fontSize, color: o.color,
                      backgroundColor: o.bgColor === "transparent" ? "rgba(0,0,0,0)" : o.bgColor,
                      fontFamily: o.fontFamily,
                      fontWeight: o.bold ? "bold" : "normal",
                      fontStyle: o.italic ? "italic" : "normal",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}>
                    {o.text}
                  </div>
                ))}

                {/* Play overlay */}
                {!isPlaying && (
                  <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center cursor-pointer">
                    <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition">
                      <Play size={24} className="ml-0.5"/>
                    </div>
                  </div>
                )}

                {/* Crop overlay hint */}
                {cropMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-yellow-400 w-3/4 h-3/4 rounded"/>
                    <div className="absolute bg-yellow-400/20 inset-0"/>
                  </div>
                )}
              </>
            ) : (
              // Empty state — drop target
              <div
                className="flex flex-col items-center justify-center gap-3 text-gray-600 w-full h-full"
                onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) addFromFile(f); }}
                onDragOver={e => e.preventDefault()}
              >
                <Film size={40} className="opacity-30"/>
                <p className="text-sm text-gray-500">No video loaded</p>
                <p className="text-[11px] text-gray-600">Drop a video file here, or use the sidebar</p>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer transition flex items-center gap-2">
                  <Upload size={14}/> Upload Video
                  <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
                </label>
              </div>
            )}
          </div>

          {/* ── Timeline + Controls ── */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 shrink-0">
            {/* Progress / timeline */}
            <div className="relative mb-2">
              <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden cursor-pointer">
                {/* Trim zone */}
                <div className="absolute h-full bg-indigo-900/40 border-x-2 border-indigo-500"
                  style={{
                    left: `${(sel.startTrim / duration) * 100 || 0}%`,
                    right: `${100 - ((sel.endTrim || duration) / duration) * 100 || 0}%`,
                  }}/>
                {/* Progress fill */}
                <div className="absolute left-0 top-0 h-full bg-indigo-600/20 transition-all"
                  style={{ width: `${progress}%` }}/>
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                  style={{ left: `${progress}%` }}/>
                {/* Text overlay markers */}
                {sel.textOverlays.map(o => (
                  <div key={o.id} className="absolute top-0 h-1.5 bg-yellow-400 opacity-70 rounded-sm"
                    style={{
                      left: `${(o.startTime / duration) * 100}%`,
                      width: `${((o.endTime - o.startTime) / duration) * 100}%`,
                    }}/>
                ))}
                <input type="range" min={0} max={100} step={0.1} value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"/>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5 px-0.5">
                <span>{fmt(currentTime)}</span>
                <span className="text-gray-600">{sel.startTrim > 0 ? `Trim: ${fmt(sel.startTrim)} → ${sel.endTrim ? fmt(sel.endTrim) : fmt(duration)}` : ""}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = sel.startTrim; }}
                  className="text-gray-400 hover:text-white transition" title="Go to start"><SkipBack size={14}/></button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5); }}
                  className="text-gray-400 hover:text-white transition" title="Back 5s"><Rewind size={14}/></button>
                <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition">
                  {isPlaying ? <Pause size={14}/> : <Play size={14} className="ml-0.5"/>}
                </button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5); }}
                  className="text-gray-400 hover:text-white transition" title="Forward 5s"><FastForward size={14}/></button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = sel.endTrim || duration; }}
                  className="text-gray-400 hover:text-white transition" title="Go to end"><SkipForward size={14}/></button>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume */}
                <button onClick={() => updateClip({ volume: sel.volume > 0 ? 0 : 1 })}
                  className="text-gray-400 hover:text-white transition">
                  {sel.volume === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={sel.volume}
                  onChange={e => updateClip({ volume: Number(e.target.value) })}
                  className="w-16 h-1 accent-indigo-500 cursor-pointer"/>
                <span className="text-[9px] text-gray-400 w-6">{Math.round(sel.volume * 100)}%</span>

                {/* Speed */}
                <select value={sel.playbackRate}
                  onChange={e => updateClip({ playbackRate: Number(e.target.value) })}
                  className="h-5 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none">
                  {PLAYBACK_RATES.map(r => <option key={r} value={r}>{r}x</option>)}
                </select>

                {/* Fullscreen */}
                <button onClick={() => videoRef.current?.requestFullscreen()}
                  className="text-gray-400 hover:text-white transition"><Maximize size={14}/></button>
              </div>
            </div>
          </div>

          {/* ── Panel Tabs ── */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-900 border-t border-gray-800 shrink-0 overflow-x-auto">
            <PanelBtn id="clips"     icon={<Film size={12}/>}            label="Clips"/>
            <PanelBtn id="filter"    icon={<Palette size={12}/>}         label="Filter"/>
            <PanelBtn id="adjust"    icon={<Sliders size={12}/>}         label="Adjust"/>
            <PanelBtn id="transform" icon={<FlipHorizontal size={12}/>}  label="Transform"/>
            <PanelBtn id="text"      icon={<Type size={12}/>}            label="Text"/>
            <PanelBtn id="audio"     icon={<Music size={12}/>}           label="Audio"/>
            <PanelBtn id="speed"     icon={<FastForward size={12}/>}     label="Speed"/>
            <PanelBtn id="crop"      icon={<Scissors size={12}/>}        label="Trim"/>
          </div>
        </div>

        {/* ══ RIGHT: Tool Panels ══ */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 overflow-y-auto shrink-0 p-3 space-y-4">

          {/* ─ CLIPS ─ */}
          {activePanel === "clips" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Clip Settings</p>

              {/* Selected clip info */}
              <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-white truncate">{sel.title}</p>
                <p className="text-[9px] text-gray-500">Duration: {fmt(duration)}</p>
                {sel.localFile && <p className="text-[9px] text-blue-400">📁 Local file (not saved to cloud)</p>}
              </div>

              {/* Re-upload if local */}
              {sel.localFile && (
                <label className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs cursor-pointer transition">
                  <Upload size={12}/> Re-upload this clip
                  <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    updateClip({ url, title: file.name.replace(/\.[^/.]+$/, ""), localFile: true });
                    e.target.value = "";
                  }}/>
                </label>
              )}

              {/* Duplicate / Delete */}
              <div className="flex gap-2">
                <button onClick={() => duplicateClip(sel.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">
                  <Copy size={11}/> Duplicate
                </button>
                {clips.length > 1 && (
                  <button onClick={() => deleteClip(sel.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] rounded-lg transition">
                    <Trash2 size={11}/> Delete
                  </button>
                )}
              </div>

              {/* Reorder */}
              <div className="flex gap-2">
                <button onClick={() => reorderClip(sel.id, "up")}
                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">↑ Move Up</button>
                <button onClick={() => reorderClip(sel.id, "down")}
                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">↓ Move Down</button>
              </div>

              <Slider label="Opacity" value={sel.opacity} min={0} max={100}
                onChange={v => updateClip({ opacity: v })}
                onReset={() => updateClip({ opacity: 100 })} unit="%"/>
            </div>
          )}

          {/* ─ FILTER ─ */}
          {activePanel === "filter" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filter Presets</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FILTER_PRESETS.map(f => (
                  <button key={f.name} onClick={() => updateClip({ brightness:f.brightness, contrast:f.contrast, saturation:f.saturation, hue:f.hue, sepia:f.sepia, grayscale:f.grayscale })}
                    className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition border border-gray-700 hover:border-indigo-500">
                    <div className="w-full h-8 rounded mb-1 overflow-hidden">
                      <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-500"
                        style={{ filter:`brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%)` }}/>
                    </div>
                    <span className="text-[8px] text-gray-300">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ ADJUST ─ */}
          {activePanel === "adjust" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Adjustments</p>
                <button onClick={() => updateClip({ brightness:100,contrast:100,saturation:100,hue:0,blur:0,sepia:0,grayscale:0,vignette:0,temperature:0,sharpness:0 })}
                  className="flex items-center gap-1 text-[9px] text-gray-500 hover:text-gray-300 transition">
                  <RotateCcw size={9}/> Reset
                </button>
              </div>
              <Slider label="Brightness" value={sel.brightness} min={0}   max={200} onChange={v=>updateClip({brightness:v})}  onReset={()=>updateClip({brightness:100})} unit="%"/>
              <Slider label="Contrast"   value={sel.contrast}   min={0}   max={200} onChange={v=>updateClip({contrast:v})}    onReset={()=>updateClip({contrast:100})}   unit="%"/>
              <Slider label="Saturation" value={sel.saturation} min={0}   max={200} onChange={v=>updateClip({saturation:v})}  onReset={()=>updateClip({saturation:100})} unit="%"/>
              <Slider label="Hue"        value={sel.hue}        min={0}   max={360} onChange={v=>updateClip({hue:v})}         onReset={()=>updateClip({hue:0})}          unit="°"/>
              <Slider label="Blur"       value={sel.blur}       min={0}   max={20}  step={0.5} onChange={v=>updateClip({blur:v})} onReset={()=>updateClip({blur:0})}     unit="px"/>
              <Slider label="Sepia"      value={sel.sepia}      min={0}   max={100} onChange={v=>updateClip({sepia:v})}       onReset={()=>updateClip({sepia:0})}        unit="%"/>
              <Slider label="Grayscale"  value={sel.grayscale}  min={0}   max={100} onChange={v=>updateClip({grayscale:v})}  onReset={()=>updateClip({grayscale:0})}    unit="%"/>
              <Slider label="Vignette"   value={sel.vignette}   min={0}   max={30}  onChange={v=>updateClip({vignette:v})}   onReset={()=>updateClip({vignette:0})}     unit=""/>
            </div>
          )}

          {/* ─ TRANSFORM ─ */}
          {activePanel === "transform" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transform</p>

              {/* Flip */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Flip</p>
                <div className="flex gap-2">
                  <button onClick={() => updateClip({ flipH: !sel.flipH })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition ${sel.flipH ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    <FlipHorizontal size={12}/> Horizontal
                  </button>
                  <button onClick={() => updateClip({ flipV: !sel.flipV })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition ${sel.flipV ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    <FlipVertical size={12}/> Vertical
                  </button>
                </div>
              </div>

              {/* Rotate */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Rotation</p>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[0, 90, 180, 270].map(deg => (
                    <button key={deg} onClick={() => updateClip({ rotate: deg })}
                      className={`py-2 rounded text-[9px] font-medium transition ${sel.rotate === deg ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                      {deg}°
                    </button>
                  ))}
                </div>
                <Slider label="Custom" value={sel.rotate} min={-180} max={180}
                  onChange={v => updateClip({ rotate: v })}
                  onReset={() => updateClip({ rotate: 0 })} unit="°"/>
              </div>

              {/* Aspect ratio resize helper */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Aspect Ratio Info</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["16:9 (Landscape)","9:16 (Portrait)","1:1 (Square)","4:3 (Classic)"].map(r => (
                    <div key={r} className="py-1.5 px-2 bg-gray-800 rounded text-[9px] text-gray-400 text-center">{r}</div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-600 mt-1">Video aspect is controlled by the source file. Use rotate/flip to adjust display.</p>
              </div>
            </div>
          )}

          {/* ─ TEXT ─ */}
          {activePanel === "text" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Text Overlays</p>

              {/* Add new */}
              <div className="space-y-2">
                <textarea value={overlayText} onChange={e => setOverlayText(e.target.value)} rows={2}
                  placeholder="Overlay text…"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-indigo-500"/>

                <div className="grid grid-cols-2 gap-1.5">
                  <select value={overlayFont} onChange={e => setOverlayFont(e.target.value)}
                    className="h-6 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input type="number" value={overlayFontSize} onChange={e => setOverlayFontSize(Number(e.target.value))}
                    className="h-6 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none"
                    placeholder="Size" min={8} max={120}/>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-10">Color</span>
                  <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent"/>
                  <span className="text-[9px] text-gray-500 w-6">BG</span>
                  <input type="color" value={overlayBg === "transparent" ? "#000000" : overlayBg}
                    onChange={e => setOverlayBg(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent"/>
                  <button onClick={() => setOverlayBg("transparent")}
                    className="text-[8px] text-red-400 hover:text-red-300">None</button>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => setOverlayBold(!overlayBold)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition ${overlayBold ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}>B</button>
                  <button onClick={() => setOverlayItalic(!overlayItalic)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs italic transition ${overlayItalic ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}>I</button>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-500">Position</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 w-3">X</span>
                    <input type="range" min={5} max={95} value={overlayX} onChange={e => setOverlayX(Number(e.target.value))} className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-500 w-6">{overlayX}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 w-3">Y</span>
                    <input type="range" min={5} max={95} value={overlayY} onChange={e => setOverlayY(Number(e.target.value))} className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-500 w-6">{overlayY}%</span>
                  </div>
                </div>

                <p className="text-[9px] text-gray-600">Appears: {fmt(currentTime)} → {fmt(currentTime + 5)}</p>
                <button onClick={addTextOverlay}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition font-medium">
                  + Add at {fmt(currentTime)}
                </button>
              </div>

              {/* Existing overlays */}
              {sel.textOverlays.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 mb-1.5">Added ({sel.textOverlays.length})</p>
                  <div className="space-y-1">
                    {sel.textOverlays.map(o => (
                      <div key={o.id}
                        className={`bg-gray-800 rounded-lg px-2 py-1.5 group cursor-pointer border-2 transition ${editingOverlayId === o.id ? "border-indigo-500" : "border-transparent hover:border-gray-600"}`}
                        onClick={() => setEditingOverlayId(editingOverlayId === o.id ? null : o.id)}>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-white truncate flex-1">{o.text}</p>
                          <div className="flex gap-1 shrink-0 ml-1">
                            <button onClick={e => { e.stopPropagation(); if(videoRef.current)videoRef.current.currentTime=o.startTime; }}
                              className="text-[8px] text-gray-500 hover:text-white p-0.5"><Play size={8}/></button>
                            <button onClick={e => { e.stopPropagation(); removeOverlay(o.id); }}
                              className="text-[8px] text-red-500 p-0.5"><Trash2 size={8}/></button>
                          </div>
                        </div>
                        <p className="text-[8px] text-gray-600">{fmt(o.startTime)} → {fmt(o.endTime)}</p>

                        {/* Inline edit */}
                        {editingOverlayId === o.id && (
                          <div className="mt-2 space-y-1 pt-2 border-t border-gray-700">
                            <input value={o.text} onChange={e => updateOverlay(o.id, { text: e.target.value })}
                              className="w-full bg-gray-700 text-white text-[9px] rounded px-2 py-1 focus:outline-none"/>
                            <div className="flex gap-1">
                              <input type="number" value={o.startTime} step={0.5} onChange={e => updateOverlay(o.id, { startTime: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="Start"/>
                              <input type="number" value={o.endTime} step={0.5} onChange={e => updateOverlay(o.id, { endTime: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="End"/>
                            </div>
                            <div className="flex gap-1">
                              <input type="color" value={o.color} onChange={e => updateOverlay(o.id, { color: e.target.value })}
                                className="w-6 h-5 rounded cursor-pointer border-0"/>
                              <input type="number" value={o.fontSize} onChange={e => updateOverlay(o.id, { fontSize: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="Size"/>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─ AUDIO ─ */}
          {activePanel === "audio" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Audio</p>
              <Slider label="Volume" value={Math.round(sel.volume * 100)} min={0} max={150}
                onChange={v => updateClip({ volume: v / 100 })}
                onReset={() => updateClip({ volume: 1 })} unit="%"/>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[{label:"Mute",v:0},{label:"50%",v:50},{label:"100%",v:100},{label:"125%",v:125},{label:"150%",v:150}].map(p => (
                  <button key={p.label} onClick={() => updateClip({ volume: p.v / 100 })}
                    className={`py-1.5 text-[9px] rounded-lg transition font-medium ${Math.round(sel.volume*100)===p.v ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="bg-gray-800 rounded-lg p-2.5 text-[9px] text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300 mb-1">Note</p>
                <p>🔇 Mute: Remove all audio from clip</p>
                <p>📢 &gt;100%: Boost audio beyond original</p>
                <p className="text-gray-600 mt-1">Full audio mixing requires server-side processing tools like FFmpeg.</p>
              </div>
            </div>
          )}

          {/* ─ SPEED ─ */}
          {activePanel === "speed" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Playback Speed</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PLAYBACK_RATES.map(r => (
                  <button key={r} onClick={() => updateClip({ playbackRate: r })}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition ${sel.playbackRate === r ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                    {r}x
                    {r === 1 && <span className="text-[8px] block opacity-60">Normal</span>}
                    {r < 1  && <span className="text-[8px] block opacity-60">Slow</span>}
                    {r > 1  && <span className="text-[8px] block opacity-60">Fast</span>}
                  </button>
                ))}
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-[9px] text-gray-400 space-y-1">
                <p>🐢 0.25x — 0.5x: Slow motion</p>
                <p>⚡ 1x: Normal speed</p>
                <p>🚀 1.5x — 2x: Fast forward</p>
                <p>💨 3x — 4x: Time-lapse</p>
              </div>
            </div>
          )}

          {/* ─ TRIM / CROP ─ */}
          {activePanel === "crop" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trim & Cut</p>

              {/* Trim sliders */}
              <div>
                <p className="text-[9px] text-gray-500 mb-2">Set In / Out Points</p>
                <Slider label="Start (In)"
                  value={Number(sel.startTrim.toFixed(1))}
                  min={0} max={Math.max(duration - 0.1, 0)} step={0.1}
                  onChange={v => { updateClip({ startTrim: v }); if(videoRef.current)videoRef.current.currentTime=v; }}
                  onReset={() => updateClip({ startTrim: 0 })} unit="s"/>
                <div className="mt-2"/>
                <Slider label="End (Out)"
                  value={Number((sel.endTrim || duration).toFixed(1))}
                  min={sel.startTrim + 0.1} max={duration} step={0.1}
                  onChange={v => updateClip({ endTrim: v })}
                  onReset={() => updateClip({ endTrim: null })} unit="s"/>
              </div>

              {/* Quick trim buttons */}
              <div className="space-y-1.5">
                <button onClick={() => updateClip({ startTrim: currentTime })}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[10px] rounded-lg transition font-medium">
                  <Scissors size={11}/> Set In Point at {fmt(currentTime)}
                </button>
                <button onClick={() => updateClip({ endTrim: currentTime })}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[10px] rounded-lg transition font-medium">
                  <Scissors size={11}/> Set Out Point at {fmt(currentTime)}
                </button>
                <button onClick={() => updateClip({ startTrim: 0, endTrim: null })}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[9px] rounded-lg transition">
                  <RotateCcw size={9}/> Reset Trim
                </button>
              </div>

              {/* Trim summary */}
              {(sel.startTrim > 0 || sel.endTrim) && (
                <div className="bg-gray-800 rounded-lg p-2.5 text-[9px] space-y-1">
                  <p className="text-gray-400">Active trim:</p>
                  <p className="text-white font-mono">{fmt(sel.startTrim)} → {fmt(sel.endTrim || duration)}</p>
                  <p className="text-gray-500">Duration: {fmt((sel.endTrim || duration) - sel.startTrim)}</p>
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-3 text-[9px] text-gray-500 space-y-1">
                <p className="font-semibold text-gray-400">Tip</p>
                <p>Seek to a point in the video, then click &quot;Set In/Out Point&quot; to trim to that position.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ADD CLIP MODAL ══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}>
          <div className="bg-gray-900 rounded-2xl p-5 w-96 border border-gray-700 shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">Add Video Clip</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-800 rounded-xl p-1">
              {(["upload","url"] as const).map(tab => (
                <button key={tab} onClick={() => setAddTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${addTab===tab?"bg-indigo-600 text-white":"text-gray-400 hover:text-white"}`}>
                  {tab === "upload" ? "📁 From Desktop" : "🔗 From URL"}
                </button>
              ))}
            </div>

            {/* Upload Tab */}
            {addTab === "upload" && (
              <div className="space-y-3">
                <div
                  ref={uploadDropRef}
                  onDrop={e => { e.preventDefault(); setIsDraggingFile(false); const f=e.dataTransfer.files[0]; if(f)addFromFile(f); }}
                  onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  className={`flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed transition cursor-pointer ${isDraggingFile ? "border-indigo-400 bg-indigo-500/10" : "border-gray-600 hover:border-gray-500"}`}
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload size={28} className={isDraggingFile ? "text-indigo-400" : "text-gray-500"}/>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-300">
                      {isDraggingFile ? "Drop to add!" : "Drop video here"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">or click to browse from your computer</p>
                    <p className="text-[10px] text-gray-600 mt-1">MP4, WebM, MOV, AVI, MKV supported</p>
                  </div>
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition">
                    Browse Files
                    <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
                  </label>
                </div>
                <p className="text-[9px] text-gray-600 text-center">
                  📝 Note: Local files are not saved to the cloud. Re-upload after refreshing.
                </p>
              </div>
            )}

            {/* URL Tab */}
            {addTab === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block font-semibold">Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="My video"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 text-white"/>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block font-semibold">Video URL</label>
                  <input value={newUrl} onChange={e => { setNewUrl(e.target.value); setUrlError(""); }}
                    onKeyDown={e => e.key === "Enter" && addFromUrl()}
                    placeholder="https://example.com/video.mp4" autoFocus
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 text-white font-mono"/>
                  {urlError && <p className="text-red-400 text-[10px] mt-1">{urlError}</p>}
                  <p className="text-[9px] text-gray-600 mt-1">Direct link to .mp4, .webm, or .ogg file</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={addFromUrl} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-semibold transition">Add Video</button>
                  <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}