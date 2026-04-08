"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, Copy, Download, Play, ChevronLeft, ChevronRight,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Type, Square, Circle, Minus, Move, Palette, Layout,
  ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Grid,
} from "lucide-react";

interface TextBox {
  id: string;
  text: string;
  x: number; y: number;
  width: number; height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  zIndex: number;
}

interface Shape {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "arrow" | "star" | "line";
  x: number; y: number;
  width: number; height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  zIndex: number;
}

interface ImageItem {
  id: string;
  src: string;
  x: number; y: number;
  width: number; height: number;
  opacity: number;
  zIndex: number;
}

interface Slide {
  id: string;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  textBoxes: TextBox[];
  shapes: Shape[];
  images: ImageItem[];
  notes: string;
  transition: "none" | "fade" | "slide" | "zoom";
}

const FONTS = ["Arial", "Georgia", "Times New Roman", "Helvetica", "Verdana", "Trebuchet MS", "Impact", "Comic Sans MS", "Courier New", "sans-serif"];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];
const COLORS_PALETTE = [
  "#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4",
  "#7f1d1d","#7c2d12","#713f12","#14532d","#164e63","#1e1b4b","#581c87","#831843","#6b7280","#374151",
];
const BG_PRESETS = [
  { label: "Dark Blue",  value: "#1e1b4b" },
  { label: "Slate",      value: "#0f172a" },
  { label: "Dark",       value: "#111827" },
  { label: "Forest",     value: "#14532d" },
  { label: "Crimson",    value: "#7f1d1d" },
  { label: "Ocean",      value: "#1d4ed8" },
  { label: "Purple",     value: "#6d28d9" },
  { label: "Rose",       value: "#831843" },
  { label: "White",      value: "#ffffff" },
  { label: "Light",      value: "#f8fafc" },
];

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: Date.now().toString() + Math.random(),
    backgroundColor: "#1e1b4b",
    textBoxes: [],
    shapes: [],
    images: [],
    notes: "",
    transition: "none",
    ...overrides,
  };
}

function makeTextBox(overrides: Partial<TextBox> = {}): TextBox {
  return {
    id: Date.now().toString() + Math.random(),
    text: "Click to edit",
    x: 100, y: 100,
    width: 300, height: 80,
    fontSize: 24,
    fontFamily: "Arial",
    color: "#ffffff",
    bold: false, italic: false, underline: false,
    align: "left",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    opacity: 100,
    zIndex: 1,
    ...overrides,
  };
}

const STARTER_SLIDES: Slide[] = [
  makeSlide({
    id: "1",
    backgroundColor: "#1e1b4b",
    textBoxes: [
      makeTextBox({ id: "t1", text: "Welcome to Presentation", x: 60, y: 150, width: 680, height: 80, fontSize: 42, bold: true, align: "center" }),
      makeTextBox({ id: "t2", text: "Click to edit this slide", x: 60, y: 260, width: 680, height: 50, fontSize: 20, color: "#a5b4fc", align: "center" }),
    ],
  }),
];

export default function PresentationView({ databaseId, templateName = "blank" }: { databaseId: string; templateName?: string }) {
  const [slides, setSlides] = useState<Slide[]>(STARTER_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "shape" | "image">("select");
  const [activeShape, setActiveShape] = useState<Shape["type"]>("rectangle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"design" | "animate" | "insert">("design");
  const [strokeColor, setStrokeColor] = useState("#3b82f6");
  const [fillColorState, setFillColorState] = useState("#3b82f6");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState("");
  const [loadedOnce, setLoadedOnce] = useState(false); // ✅ Added here
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastLocalEditAtRef = useRef<number>(Date.now());
  const lastAppliedRemoteSnapshotRef = useRef<string>("");

  const slide = slides[currentIndex];

  const updateSlide = useCallback((updater: (s: Slide) => Slide) => {
    setSlides((prev) => prev.map((s, i) => i === currentIndex ? updater(s) : s));
  }, [currentIndex]);

  const saveToDb = useCallback(async (data: Slide[]) => {
    if (!databaseId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/databases/${databaseId}/presentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: data }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("Save failed", res.status, text);
      } else {
        lastAppliedRemoteSnapshotRef.current = JSON.stringify(data);
        try {
          const json = text ? JSON.parse(text) : null;
          // optional: use json response if needed
        } catch (e) {
          console.warn("Save returned non-JSON response:", text);
        }
        setSavedAt(new Date().toLocaleTimeString());
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }, [databaseId]);

  // ✅ Auto-save - only after initial load
  useEffect(() => {
    if (!loadedOnce) return; // Don't save before load completes
    const t = setTimeout(() => saveToDb(slides), 3000);
    return () => clearTimeout(t);
  }, [slides, loadedOnce, saveToDb]);

  // ✅ Load - sets loadedOnce when complete
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/databases/${databaseId}/presentation`);
        const text = await res.text();

        // If server returned HTML (e.g. an error page), avoid calling res.json()
        if (!res.ok) {
          console.error("Load failed", res.status, text);
        } else {
          try {
            const data = text ? JSON.parse(text) : null;
            if (data?.slides?.length) {
              lastAppliedRemoteSnapshotRef.current = JSON.stringify(data.slides);
              setSlides(data.slides);
            }
          } catch (e) {
            console.error("Failed to parse JSON from presentation GET:", e, text);
          }
        }
      } catch (e) {
        console.error(e);
      } finally { setLoadedOnce(true); }
    };
    load();
  }, [databaseId]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      if (e.key === "ArrowRight") setCurrentIndex(p => Math.min(p + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setCurrentIndex(p => Math.max(p - 1, 0));
      if (e.key === "Escape") { setIsFullscreen(false); setSelectedId(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        updateSlide(s => ({
          ...s,
          textBoxes: s.textBoxes.filter(t => t.id !== selectedId),
          shapes: s.shapes.filter(sh => sh.id !== selectedId),
          images: s.images.filter(im => im.id !== selectedId),
        }));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, selectedId, currentIndex, slides.length, updateSlide]);

  useEffect(() => {
    if (!loadedOnce) return;
    lastLocalEditAtRef.current = Date.now();
  }, [slides, loadedOnce]);

  useEffect(() => {
    if (!databaseId || !loadedOnce) return;

    let cancelled = false;
    const poll = async () => {
      if (Date.now() - lastLocalEditAtRef.current < 1200) return;
      if (editingId || isDragging || isResizing) return;

      try {
        const res = await fetch(`/api/databases/${databaseId}/presentation`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data?.slides)) return;

        const snapshot = JSON.stringify(data.slides);
        if (snapshot === lastAppliedRemoteSnapshotRef.current) return;

        lastAppliedRemoteSnapshotRef.current = snapshot;
        setSlides(data.slides);
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
  }, [databaseId, loadedOnce, editingId, isDragging, isResizing]);

  // ── Add elements ──
  const addTextBox = () => {
    const tb = makeTextBox({ x: 80, y: 80 + slides[currentIndex].textBoxes.length * 90, fontSize, fontFamily, color: textColor });
    updateSlide(s => ({ ...s, textBoxes: [...s.textBoxes, tb] }));
    setSelectedId(tb.id);
    setEditingId(tb.id);
    setActiveTool("select");
  };

  const addShape = () => {
    const sh: Shape = {
      id: Date.now().toString(),
      type: activeShape,
      x: 100, y: 100, width: 160, height: 100,
      fill: fillColorState, stroke: strokeColor,
      strokeWidth: 2, opacity: 100, zIndex: 1,
    };
    updateSlide(s => ({ ...s, shapes: [...s.shapes, sh] }));
    setSelectedId(sh.id);
  };

  const addSlide = () => {
    const ns = makeSlide({ backgroundColor: slide.backgroundColor });
    setSlides(prev => [...prev.slice(0, currentIndex + 1), ns, ...prev.slice(currentIndex + 1)]);
    setCurrentIndex(currentIndex + 1);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length === 1) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setCurrentIndex(Math.min(currentIndex, slides.length - 2));
  };

  const duplicateSlide = (idx: number) => {
    const ns = { ...JSON.parse(JSON.stringify(slides[idx])), id: Date.now().toString() };
    setSlides(prev => [...prev.slice(0, idx + 1), ns, ...prev.slice(idx + 1)]);
    setCurrentIndex(idx + 1);
  };

  // ── Element selection ──
  const getSelected = () => {
    if (!selectedId) return null;
    return slide.textBoxes.find(t => t.id === selectedId)
      || slide.shapes.find(s => s.id === selectedId)
      || slide.images.find(i => i.id === selectedId);
  };

  const updateTextBox = (id: string, updates: Partial<TextBox>) => {
    updateSlide(s => ({ ...s, textBoxes: s.textBoxes.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    updateSlide(s => ({ ...s, shapes: s.shapes.map(sh => sh.id === id ? { ...sh, ...updates } : sh) }));
  };

  const updateImage = (id: string, updates: Partial<ImageItem>) => {
    updateSlide(s => ({ ...s, images: s.images.map(im => im.id === id ? { ...im, ...updates } : im) }));
  };

  // ── Drag ──
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    const el = getElemById(id);
    if (!el) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const getElemById = (id: string) =>
    slide.textBoxes.find(t => t.id === id) ||
    slide.shapes.find(s => s.id === id) ||
    slide.images.find(i => i.id === id);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    const isText = slide.textBoxes.some(t => t.id === selectedId);
    const isShape = slide.shapes.some(s => s.id === selectedId);
    if (isText) updateTextBox(selectedId, { x, y });
    else if (isShape) updateShape(selectedId, { x, y });
    else updateImage(selectedId, { x, y });
  }, [isDragging, selectedId, dragOffset, slide]);

  const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };

  // ── Add image from URL ──
  const addImageFromUrl = (url: string) => {
    const im: ImageItem = {
      id: Date.now().toString(),
      src: url, x: 100, y: 100,
      width: 300, height: 200,
      opacity: 100, zIndex: 1,
    };
    updateSlide(s => ({ ...s, images: [...s.images, im] }));
    setSelectedId(im.id);
  };

  const sel = getSelected();
  const selTextBox = slide.textBoxes.find(t => t.id === selectedId);
  const selShape = slide.shapes.find(s => s.id === selectedId);
  const selImage = slide.images.find(i => i.id === selectedId);

  // ── Export to PNG ──
  const exportSlide = async () => {
    alert("Export: Use browser screenshot or add html2canvas for production export.");
  };

  // ── Download JSON ──
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presentation-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const ToolBtn = ({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) => (
    <button onClick={onClick} title={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition text-xs font-medium
        ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
      {icon}
    </button>
  );

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${isFullscreen ? "fixed inset-0 z-50" : "rounded-2xl"}`}>

      {/* ══ TOOLBAR ══ */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0 flex-wrap gap-1">

          {/* Left: slide count + save */}
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-semibold">🎯 Presentation</span>
            <span className="text-gray-400 text-[10px] bg-gray-700 px-2 py-0.5 rounded-full">{currentIndex + 1}/{slides.length}</span>
            {saving && <span className="text-[10px] text-amber-400 animate-pulse">● Saving</span>}
            {!saving && savedAt && <span className="text-[10px] text-emerald-400">✓ {savedAt}</span>}
          </div>

          {/* Center: tools */}
          <div className="flex items-center gap-0.5">

            {/* Insert tools */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-700">
              <ToolBtn label="Select (V)" icon={<Move size={13}/>} active={activeTool==="select"} onClick={()=>setActiveTool("select")} />
              <ToolBtn label="Add Text" icon={<Type size={13}/>} active={activeTool==="text"} onClick={()=>{setActiveTool("text"); addTextBox();}} />
              <ToolBtn label="Add Shape" icon={<Square size={13}/>} active={activeTool==="shape"} onClick={()=>{setActiveTool("shape"); addShape();}} />
            </div>

            {/* Shape types */}
            <div className="flex items-center gap-0.5 px-2 border-r border-gray-700">
              {([["rectangle","□"],["circle","○"],["triangle","△"],["line","—"],["star","★"]] as const).map(([s,icon])=>(
                <button key={s} onClick={()=>{setActiveShape(s as Shape["type"]); addShape(); setActiveTool("select");}}
                  className={`w-7 h-7 flex items-center justify-center rounded text-sm transition ${activeShape===s?"bg-indigo-600 text-white":"text-gray-400 hover:bg-white/10"}`}
                  title={s}>
                  {icon}
                </button>
              ))}
            </div>

            {/* Text formatting — shown when text selected */}
            {selTextBox && (
              <div className="flex items-center gap-0.5 px-2 border-r border-gray-700">
                <select value={selTextBox.fontFamily}
                  onChange={e=>updateTextBox(selTextBox.id,{fontFamily:e.target.value})}
                  className="h-6 text-[10px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none">
                  {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
                <select value={selTextBox.fontSize}
                  onChange={e=>updateTextBox(selTextBox.id,{fontSize:Number(e.target.value)})}
                  className="h-6 w-12 text-[10px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none">
                  {FONT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={()=>updateTextBox(selTextBox.id,{bold:!selTextBox.bold})}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition ${selTextBox.bold?"bg-indigo-600 text-white":"text-gray-400 hover:bg-white/10"}`}>B</button>
                <button onClick={()=>updateTextBox(selTextBox.id,{italic:!selTextBox.italic})}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs italic transition ${selTextBox.italic?"bg-indigo-600 text-white":"text-gray-400 hover:bg-white/10"}`}>I</button>
                <button onClick={()=>updateTextBox(selTextBox.id,{underline:!selTextBox.underline})}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs underline transition ${selTextBox.underline?"bg-indigo-600 text-white":"text-gray-400 hover:bg-white/10"}`}>U</button>
                <div className="w-px h-4 bg-gray-600 mx-0.5" />
                {(["left","center","right"] as const).map(a=>(
                  <button key={a} onClick={()=>updateTextBox(selTextBox.id,{align:a})}
                    className={`w-6 h-6 flex items-center justify-center rounded transition ${selTextBox.align===a?"bg-indigo-600 text-white":"text-gray-400 hover:bg-white/10"}`}>
                    {a==="left"?<AlignLeft size={10}/>:a==="center"?<AlignCenter size={10}/>:<AlignRight size={10}/>}
                  </button>
                ))}
                <div className="w-px h-4 bg-gray-600 mx-0.5" />
                <input type="color" value={selTextBox.color}
                  onChange={e=>updateTextBox(selTextBox.id,{color:e.target.value})}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600" title="Text color" />
                <input type="color" value={selTextBox.backgroundColor==="transparent"?"#1e1b4b":selTextBox.backgroundColor}
                  onChange={e=>updateTextBox(selTextBox.id,{backgroundColor:e.target.value})}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600" title="Box fill" />
              </div>
            )}

            {/* Shape formatting */}
            {selShape && (
              <div className="flex items-center gap-0.5 px-2 border-r border-gray-700">
                <input type="color" value={selShape.fill}
                  onChange={e=>updateShape(selShape.id,{fill:e.target.value})}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600" title="Fill" />
                <input type="color" value={selShape.stroke}
                  onChange={e=>updateShape(selShape.id,{stroke:e.target.value})}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600" title="Stroke" />
                <input type="range" min={0} max={10} value={selShape.strokeWidth}
                  onChange={e=>updateShape(selShape.id,{strokeWidth:Number(e.target.value)})}
                  className="w-14 h-1 accent-indigo-500" title="Stroke width" />
                <input type="range" min={0} max={100} value={selShape.opacity}
                  onChange={e=>updateShape(selShape.id,{opacity:Number(e.target.value)})}
                  className="w-14 h-1 accent-indigo-500" title="Opacity" />
              </div>
            )}

            {/* Zoom */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-700">
              <button onClick={()=>setZoom(z=>Math.max(25,z-10))} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 font-bold">−</button>
              <span className="text-[10px] text-gray-400 w-8 text-center">{zoom}%</span>
              <button onClick={()=>setZoom(z=>Math.min(200,z+10))} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 font-bold">+</button>
            </div>

            {/* View toggles */}
            <div className="flex items-center gap-0.5 px-2 border-r border-gray-700">
              <ToolBtn label="Toggle grid" icon={<Grid size={13}/>} active={showGrid} onClick={()=>setShowGrid(!showGrid)} />
              <ToolBtn label="Speaker notes" icon={<Eye size={13}/>} active={showNotes} onClick={()=>setShowNotes(!showNotes)} />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            <button onClick={()=>saveToDb(slides)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition" title="Save">
              <Save size={14}/>
            </button>
            <button onClick={downloadJSON} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition" title="Download JSON">
              <Download size={14}/>
            </button>
            <button onClick={addSlide} className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition">
              <Plus size={13}/>Slide
            </button>
            <button onClick={()=>setIsFullscreen(true)} className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
              <Play size={13}/>Present
            </button>
          </div>
        </div>
      )}

      {/* ══ MAIN AREA ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Slide Thumbnails */}
        {!isFullscreen && (
          <div className="w-36 bg-gray-800 border-r border-gray-700 overflow-y-auto flex flex-col gap-1.5 p-2 shrink-0">
            {slides.map((s, idx) => (
              <div key={s.id} className="relative group">
                <div
                  onClick={()=>{setCurrentIndex(idx);setSelectedId(null);}}
                  className={`rounded-lg overflow-hidden cursor-pointer border-2 transition flex flex-col items-center justify-center text-center p-1 ${
                    idx===currentIndex?"border-indigo-500":"border-gray-600 hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: s.backgroundColor, height: "80px" }}
                >
                  {s.textBoxes.slice(0,1).map(t=>(
                    <p key={t.id} className="text-[8px] truncate max-w-full" style={{color:t.color,fontWeight:t.bold?"bold":"normal"}}>{t.text}</p>
                  ))}
                  <span className="absolute top-0.5 right-0.5 text-[8px] text-gray-300 bg-black/50 px-1 rounded">{idx+1}</span>
                </div>
                <div className="absolute -right-0.5 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-0.5">
                  <button onClick={()=>duplicateSlide(idx)} className="p-0.5 bg-blue-600 rounded text-white" title="Duplicate"><Copy size={9}/></button>
                  {slides.length>1&&<button onClick={()=>deleteSlide(idx)} className="p-0.5 bg-red-600 rounded text-white" title="Delete"><Trash2 size={9}/></button>}
                </div>
              </div>
            ))}
            <button onClick={addSlide}
              className="w-full py-2 rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 text-gray-500 hover:text-indigo-400 text-xs transition">
              + Slide
            </button>
          </div>
        )}

        {/* CENTER: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundColor: isFullscreen?"#000":"#1f2937"}}>
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <div
              ref={canvasRef}
              className="relative shadow-2xl overflow-hidden select-none"
              style={{
                width: "800px",
                height: "500px",
                backgroundColor: slide.backgroundColor,
                backgroundImage: slide.backgroundGradient || "none",
                transform: `scale(${zoom/100})`,
                transformOrigin: "top left",
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={e=>{
                if(e.target===canvasRef.current) setSelectedId(null);
                if(activeTool==="text") addTextBox();
                else if(activeTool==="shape") addShape();
              }}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage:"linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
                  backgroundSize:"40px 40px"
                }}/>
              )}

              {/* Shapes */}
              {slide.shapes.map(sh=>(
                <div key={sh.id}
                  style={{
                    position:"absolute", left:sh.x, top:sh.y,
                    width:sh.width, height:sh.height,
                    opacity:sh.opacity/100, zIndex:sh.zIndex,
                    cursor: activeTool==="select"?"move":"default",
                  }}
                  onMouseDown={e=>handleMouseDown(e,sh.id)}
                  className={selectedId===sh.id?"ring-2 ring-indigo-400 ring-offset-1":""}
                >
                  <svg width="100%" height="100%" overflow="visible">
                    {sh.type==="rectangle"&&<rect x={sh.strokeWidth/2} y={sh.strokeWidth/2} width={sh.width-sh.strokeWidth} height={sh.height-sh.strokeWidth} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.strokeWidth} rx="4"/>}
                    {sh.type==="circle"&&<ellipse cx={sh.width/2} cy={sh.height/2} rx={(sh.width-sh.strokeWidth)/2} ry={(sh.height-sh.strokeWidth)/2} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.strokeWidth}/>}
                    {sh.type==="triangle"&&<polygon points={`${sh.width/2},${sh.strokeWidth} ${sh.width-sh.strokeWidth},${sh.height-sh.strokeWidth} ${sh.strokeWidth},${sh.height-sh.strokeWidth}`} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.strokeWidth}/>}
                    {sh.type==="line"&&<line x1={sh.strokeWidth} y1={sh.height/2} x2={sh.width-sh.strokeWidth} y2={sh.height/2} stroke={sh.stroke} strokeWidth={sh.strokeWidth}/>}
                    {sh.type==="star"&&<polygon points={`${sh.width/2},${sh.strokeWidth} ${sh.width*0.62},${sh.height*0.38} ${sh.width-sh.strokeWidth},${sh.height*0.38} ${sh.width*0.72},${sh.height*0.62} ${sh.width*0.82},${sh.height-sh.strokeWidth} ${sh.width/2},${sh.height*0.76} ${sh.width*0.18},${sh.height-sh.strokeWidth} ${sh.width*0.28},${sh.height*0.62} ${sh.strokeWidth},${sh.height*0.38} ${sh.width*0.38},${sh.height*0.38}`} fill={sh.fill} stroke={sh.stroke} strokeWidth={sh.strokeWidth}/>}
                    {sh.type==="arrow"&&<>
                      <line x1={sh.strokeWidth} y1={sh.height/2} x2={sh.width-20} y2={sh.height/2} stroke={sh.stroke} strokeWidth={sh.strokeWidth}/>
                      <polygon points={`${sh.width},${sh.height/2} ${sh.width-20},${sh.height/2-10} ${sh.width-20},${sh.height/2+10}`} fill={sh.stroke}/>
                    </>}
                  </svg>
                  {/* Resize handles */}
                  {selectedId===sh.id&&(
                    <div onMouseDown={e=>{e.stopPropagation();setIsResizing(true);setResizeDir("se");}}
                      className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border border-white rounded-sm cursor-se-resize"/>
                  )}
                </div>
              ))}

              {/* Images */}
              {slide.images.map(im=>(
                <div key={im.id}
                  style={{ position:"absolute", left:im.x, top:im.y, width:im.width, height:im.height, opacity:im.opacity/100, zIndex:im.zIndex, cursor:"move" }}
                  onMouseDown={e=>handleMouseDown(e,im.id)}
                  className={selectedId===im.id?"ring-2 ring-indigo-400":""}
                >
                  <img src={im.src} alt="" className="w-full h-full object-cover pointer-events-none" />
                  {selectedId===im.id&&(
                    <div onMouseDown={e=>{e.stopPropagation();setIsResizing(true);}}
                      className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border border-white rounded-sm cursor-se-resize"/>
                  )}
                </div>
              ))}

              {/* Text boxes */}
              {slide.textBoxes.map(tb=>(
                <div key={tb.id}
                  style={{
                    position:"absolute", left:tb.x, top:tb.y,
                    width:tb.width, minHeight:tb.height,
                    zIndex:tb.zIndex, opacity:tb.opacity/100,
                    cursor: activeTool==="select"?"move":"text",
                    backgroundColor: tb.backgroundColor,
                    border: tb.borderWidth>0?`${tb.borderWidth}px solid ${tb.borderColor}`:"none",
                    padding:"4px 6px",
                  }}
                  onMouseDown={e=>handleMouseDown(e,tb.id)}
                  onDoubleClick={()=>setEditingId(tb.id)}
                  className={selectedId===tb.id?"ring-2 ring-indigo-400":""}
                >
                  {editingId===tb.id ? (
                    <textarea
                      autoFocus
                      value={tb.text}
                      onChange={e=>updateTextBox(tb.id,{text:e.target.value})}
                      onBlur={()=>setEditingId(null)}
                      style={{
                        fontSize:tb.fontSize, fontFamily:tb.fontFamily,
                        color:tb.color, fontWeight:tb.bold?"bold":"normal",
                        fontStyle:tb.italic?"italic":"normal",
                        textDecoration:tb.underline?"underline":"none",
                        textAlign:tb.align,
                        width:"100%", minHeight:"60px",
                        background:"transparent", border:"none", outline:"none",
                        resize:"none", lineHeight:1.4,
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize:tb.fontSize, fontFamily:tb.fontFamily,
                      color:tb.color, fontWeight:tb.bold?"bold":"normal",
                      fontStyle:tb.italic?"italic":"normal",
                      textDecoration:tb.underline?"underline":"none",
                      textAlign:tb.align, lineHeight:1.4, whiteSpace:"pre-wrap",
                    }}>
                      {tb.text}
                    </div>
                  )}
                  {selectedId===tb.id&&(
                    <>
                      <div onMouseDown={e=>{e.stopPropagation();setIsResizing(true);setResizeDir("e");}}
                        className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize"/>
                      <div onMouseDown={e=>{e.stopPropagation();setIsResizing(true);setResizeDir("s");}}
                        className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize"/>
                      <div onMouseDown={e=>{e.stopPropagation();setIsResizing(true);setResizeDir("se");}}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border border-white rounded-sm cursor-se-resize"/>
                    </>
                  )}
                </div>
              ))}

              {/* Fullscreen exit */}
              {isFullscreen&&(
                <button onClick={()=>setIsFullscreen(false)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs z-50">✕ Exit</button>
              )}
            </div>
          </div>

          {/* Speaker notes */}
          {showNotes && !isFullscreen && (
            <div className="h-24 bg-gray-800 border-t border-gray-700 p-2 shrink-0">
              <p className="text-[10px] text-gray-500 mb-1">Speaker Notes</p>
              <textarea
                value={slide.notes}
                onChange={e=>updateSlide(s=>({...s,notes:e.target.value}))}
                className="w-full h-16 bg-gray-700 text-gray-200 text-xs p-2 rounded outline-none resize-none"
                placeholder="Add speaker notes here..."
              />
            </div>
          )}

          {/* Nav */}
          {!isFullscreen && (
            <div className="flex items-center justify-center gap-4 py-2 bg-gray-800 border-t border-gray-700 shrink-0">
              <button onClick={()=>setCurrentIndex(p=>Math.max(p-1,0))} disabled={currentIndex===0}
                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white transition">
                <ChevronLeft size={16}/>
              </button>
              <span className="text-gray-400 text-xs">{currentIndex+1} / {slides.length}</span>
              <button onClick={()=>setCurrentIndex(p=>Math.min(p+1,slides.length-1))} disabled={currentIndex===slides.length-1}
                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white transition">
                <ChevronRight size={16}/>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Properties panel */}
        {!isFullscreen && (
          <div className="w-52 bg-gray-800 border-l border-gray-700 overflow-y-auto shrink-0 p-3 space-y-4">

            {/* Slide background */}
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Background</p>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {BG_PRESETS.map(p=>(
                  <button key={p.value} onClick={()=>updateSlide(s=>({...s,backgroundColor:p.value}))}
                    className={`w-7 h-7 rounded-md border-2 transition ${slide.backgroundColor===p.value?"border-indigo-400":"border-transparent hover:border-gray-500"}`}
                    style={{backgroundColor:p.value}} title={p.label}/>
                ))}
              </div>
              <input type="color" value={slide.backgroundColor}
                onChange={e=>updateSlide(s=>({...s,backgroundColor:e.target.value}))}
                className="w-full h-7 rounded border border-gray-600 cursor-pointer bg-transparent"/>
            </div>

            {/* Slide transition */}
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Transition</p>
              <select value={slide.transition}
                onChange={e=>updateSlide(s=>({...s,transition:e.target.value as Slide["transition"]}))}
                className="w-full h-7 text-[10px] bg-gray-700 border border-gray-600 text-white rounded px-2 focus:outline-none">
                {["none","fade","slide","zoom"].map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>

            {/* Selected element props */}
            {selTextBox && (
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Text Box</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 w-8">X</span>
                    <input type="number" value={Math.round(selTextBox.x)} onChange={e=>updateTextBox(selTextBox.id,{x:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none"/>
                    <span className="text-[9px] text-gray-500 w-8">Y</span>
                    <input type="number" value={Math.round(selTextBox.y)} onChange={e=>updateTextBox(selTextBox.id,{y:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none"/>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 w-8">W</span>
                    <input type="number" value={Math.round(selTextBox.width)} onChange={e=>updateTextBox(selTextBox.id,{width:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none"/>
                    <span className="text-[9px] text-gray-500 w-8">H</span>
                    <input type="number" value={Math.round(selTextBox.height)} onChange={e=>updateTextBox(selTextBox.id,{height:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1 focus:outline-none"/>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500">Opacity</span>
                    <input type="range" min={0} max={100} value={selTextBox.opacity} onChange={e=>updateTextBox(selTextBox.id,{opacity:Number(e.target.value)})}
                      className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-400 w-6">{selTextBox.opacity}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500">Border</span>
                    <input type="number" min={0} max={10} value={selTextBox.borderWidth} onChange={e=>updateTextBox(selTextBox.id,{borderWidth:Number(e.target.value)})}
                      className="w-10 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1"/>
                    <input type="color" value={selTextBox.borderColor==="transparent"?"#ffffff":selTextBox.borderColor}
                      onChange={e=>updateTextBox(selTextBox.id,{borderColor:e.target.value})}
                      className="w-6 h-6 rounded border border-gray-600 cursor-pointer"/>
                  </div>
                </div>
              </div>
            )}

            {selShape && (
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Shape</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 w-8">X</span>
                    <input type="number" value={Math.round(selShape.x)} onChange={e=>updateShape(selShape.id,{x:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1"/>
                    <span className="text-[9px] text-gray-500 w-8">Y</span>
                    <input type="number" value={Math.round(selShape.y)} onChange={e=>updateShape(selShape.id,{y:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1"/>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 w-8">W</span>
                    <input type="number" value={Math.round(selShape.width)} onChange={e=>updateShape(selShape.id,{width:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1"/>
                    <span className="text-[9px] text-gray-500 w-8">H</span>
                    <input type="number" value={Math.round(selShape.height)} onChange={e=>updateShape(selShape.id,{height:Number(e.target.value)})}
                      className="flex-1 h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-1"/>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-500">Fill</span>
                    <input type="color" value={selShape.fill} onChange={e=>updateShape(selShape.id,{fill:e.target.value})}
                      className="w-6 h-6 rounded border border-gray-600 cursor-pointer"/>
                    <span className="text-[9px] text-gray-500">Stroke</span>
                    <input type="color" value={selShape.stroke} onChange={e=>updateShape(selShape.id,{stroke:e.target.value})}
                      className="w-6 h-6 rounded border border-gray-600 cursor-pointer"/>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500">Opacity</span>
                    <input type="range" min={0} max={100} value={selShape.opacity} onChange={e=>updateShape(selShape.id,{opacity:Number(e.target.value)})}
                      className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-400 w-6">{selShape.opacity}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add image */}
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Insert Image</p>
              <input type="text" placeholder="Image URL..."
                className="w-full h-6 text-[9px] bg-gray-700 border border-gray-600 text-white rounded px-2 focus:outline-none mb-1"
                onKeyDown={e=>{ if(e.key==="Enter") { addImageFromUrl((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value=""; }}}
              />
              <p className="text-[9px] text-gray-500">Press Enter to add</p>
            </div>

            {/* Delete selected */}
            {selectedId && (
              <button onClick={()=>{
                updateSlide(s=>({...s,textBoxes:s.textBoxes.filter(t=>t.id!==selectedId),shapes:s.shapes.filter(sh=>sh.id!==selectedId),images:s.images.filter(im=>im.id!==selectedId)}));
                setSelectedId(null);
              }} className="w-full py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg transition flex items-center justify-center gap-1">
                <Trash2 size={12}/> Delete Element
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen nav */}
      {isFullscreen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur px-4 py-2 rounded-full z-50">
          <button onClick={()=>setCurrentIndex(p=>Math.max(p-1,0))} disabled={currentIndex===0}
            className="text-white disabled:opacity-30"><ChevronLeft size={20}/></button>
          <span className="text-white text-sm">{currentIndex+1} / {slides.length}</span>
          <button onClick={()=>setCurrentIndex(p=>Math.min(p+1,slides.length-1))} disabled={currentIndex===slides.length-1}
            className="text-white disabled:opacity-30"><ChevronRight size={20}/></button>
        </div>
      )}
    </div>
  );
}
