"use client";

import { useTheme } from "next-themes";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────
interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  resolved: boolean;
  selectionText: string;
  replies: { id: string; text: string; author: string; timestamp: string }[];
}

interface Version {
  id: string;
  content: string;
  title: string;
  timestamp: string;
  label: string;
}

// ── Template content ───────────────────────────────────────────────
const TEMPLATE_HTML: Record<string, string> = {
  blank: `<p style="font-size:11pt;font-family:Arial;"><br></p>`,
  resume: `
<h1 style="font-size:22pt;font-family:Arial;text-align:center;margin-bottom:4px">Your Full Name</h1>
<p style="font-size:10pt;font-family:Arial;text-align:center;color:#555;margin-bottom:16px">your.email@example.com &nbsp;•&nbsp; +1 (555) 000-0000 &nbsp;•&nbsp; City, State &nbsp;•&nbsp; linkedin.com/in/yourname</p>
<hr style="border:1px solid #ccc;margin:12px 0"/>
<h2 style="font-size:13pt;font-family:Arial;color:#1a73e8;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Professional Summary</h2>
<p style="font-size:11pt;font-family:Arial;">Results-driven professional with X+ years of experience in [your field]. Skilled in [skill 1], [skill 2], and [skill 3]. Proven ability to deliver high-quality results in fast-paced environments.</p>
<h2 style="font-size:13pt;font-family:Arial;color:#1a73e8;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-top:16px">Experience</h2>
<h3 style="font-size:12pt;font-family:Arial;font-weight:bold;margin-bottom:2px">Senior [Job Title] &mdash; Company Name</h3>
<p style="font-size:10pt;font-family:Arial;color:#555;margin-bottom:6px"><em>January 2022 &ndash; Present &nbsp;|&nbsp; City, State</em></p>
<ul style="font-size:11pt;font-family:Arial;margin-left:20px"><li>Led cross-functional team of 8 to deliver [project], resulting in 30% efficiency gain</li><li>Designed and implemented [system/process] that reduced costs by $X</li><li>Collaborated with stakeholders to define product roadmap and KPIs</li></ul>
<h3 style="font-size:12pt;font-family:Arial;font-weight:bold;margin-bottom:2px;margin-top:12px">[Job Title] &mdash; Previous Company</h3>
<p style="font-size:10pt;font-family:Arial;color:#555;margin-bottom:6px"><em>June 2019 &ndash; December 2021 &nbsp;|&nbsp; City, State</em></p>
<ul style="font-size:11pt;font-family:Arial;margin-left:20px"><li>Achievement one with quantifiable impact</li><li>Achievement two demonstrating key skills</li></ul>
<h2 style="font-size:13pt;font-family:Arial;color:#1a73e8;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-top:16px">Education</h2>
<h3 style="font-size:12pt;font-family:Arial;font-weight:bold;margin-bottom:2px">Bachelor of Science in [Major]</h3>
<p style="font-size:11pt;font-family:Arial;color:#555"><em>University Name &nbsp;|&nbsp; Graduated May 2019 &nbsp;|&nbsp; GPA: 3.8</em></p>
<h2 style="font-size:13pt;font-family:Arial;color:#1a73e8;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-top:16px">Skills</h2>
<p style="font-size:11pt;font-family:Arial;"><strong>Technical:</strong> Skill 1, Skill 2, Skill 3, Skill 4, Skill 5</p>
<p style="font-size:11pt;font-family:Arial;"><strong>Tools:</strong> Tool 1, Tool 2, Tool 3</p>
<p style="font-size:11pt;font-family:Arial;"><strong>Languages:</strong> English (Native), Spanish (Conversational)</p>`,
  report: `
<h1 style="font-size:20pt;font-family:Arial;text-align:center;margin-bottom:6px">Report Title</h1>
<p style="font-size:11pt;font-family:Arial;text-align:center;color:#555;margin-bottom:4px"><em>Prepared by: Author Name &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; Organization Name</em></p>
<hr style="border:2px solid #1a73e8;margin:16px 0"/>
<h2 style="font-size:14pt;font-family:Arial;color:#1a73e8">1. Executive Summary</h2>
<p style="font-size:11pt;font-family:Arial;">This report presents an analysis of [topic]. Key findings indicate [summary of findings]. Recommendations include [brief recommendations].</p>
<h2 style="font-size:14pt;font-family:Arial;color:#1a73e8;margin-top:20px">2. Introduction</h2>
<p style="font-size:11pt;font-family:Arial;">Background context and purpose of this report.</p>
<h2 style="font-size:14pt;font-family:Arial;color:#1a73e8;margin-top:20px">3. Findings</h2>
<p style="font-size:11pt;font-family:Arial;">Detailed description of the findings with supporting data and evidence.</p>
<h2 style="font-size:14pt;font-family:Arial;color:#1a73e8;margin-top:20px">4. Conclusion</h2>
<p style="font-size:11pt;font-family:Arial;">Summary of key findings and their implications.</p>`,
};

const FONTS = ["Arial","Arial Black","Courier New","Georgia","Helvetica","Impact","Palatino","Tahoma","Times New Roman","Trebuchet MS","Verdana","Comic Sans MS"];
const FONT_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72];
const LINE_SPACINGS = [
  { label:"Single", val:"1" },
  { label:"1.15",   val:"1.15" },
  { label:"1.5",    val:"1.5" },
  { label:"Double", val:"2" },
  { label:"2.5",    val:"2.5" },
  { label:"Triple", val:"3" },
];
const PARA_STYLES = [
  { label:"Normal text", block:"p",  size:"11" },
  { label:"Title",       block:"h1", size:"26", bold:true },
  { label:"Subtitle",    block:"h2", size:"15", color:"#666" },
  { label:"Heading 1",   block:"h1", size:"20" },
  { label:"Heading 2",   block:"h2", size:"16" },
  { label:"Heading 3",   block:"h3", size:"14" },
  { label:"Heading 4",   block:"h4", size:"12" },
  { label:"Heading 5",   block:"h5", size:"11" },
  { label:"Heading 6",   block:"h6", size:"10" },
];

const BLOCK_TO_STYLE_LABEL: Record<string, string> = {
  p: "Normal text",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
};

// ── Main Component ─────────────────────────────────────────────────
export default function DocumentationView({
  databaseId,
  templateName = "blank",
  
}: {
  databaseId: string;
  templateName?: string;
 
  activeViewId?: string;
  activeView?: unknown;
}) {
  const [title, setTitle]             = useState("Untitled Document");
  const [mode, setMode]               = useState<"editing"|"suggesting"|"viewing">("editing");
  const [zoom, setZoom]               = useState(100);
  const [showRuler, setShowRuler]     = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const [showComments, setShowComments]   = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showTableDlg, setShowTableDlg]   = useState(false);
  const [showLinkDlg, setShowLinkDlg]     = useState(false);
  const [showImgDlg, setShowImgDlg]       = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showVersions, setShowVersions]   = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [openMenu, setOpenMenu]       = useState<string|null>(null);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [versions, setVersions]       = useState<Version[]>([]);
  const [newComment, setNewComment]   = useState("");
  const [newReply, setNewReply]       = useState<{[key:string]:string}>({});
  const [outline, setOutline]         = useState<{tag:string;text:string;id:string}[]>([]);
  const [wordCount, setWordCount]     = useState(0);
  const [charCount, setCharCount]     = useState(0);
  const [saving, setSaving]           = useState(false);
  const [savedAt, setSavedAt]         = useState<string|null>(null);
  const [loadedOnce, setLoadedOnce]   = useState(false);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState(11);
  const [currentStyle, setCurrentStyle] = useState("Normal text");
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [findText, setFindText]       = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [tableRows, setTableRows]     = useState(3);
  const [tableCols, setTableCols]     = useState(3);
  const [linkUrl, setLinkUrl]         = useState("");
  const [linkText, setLinkText]       = useState("");
  const [imgUrl, setImgUrl]           = useState("");
  const [pageMargin, setPageMargin]   = useState(72);
  const [pageOrientation, setPageOrientation] = useState<"portrait"|"landscape">("portrait");
  const [pageBgColor, setPageBgColor] = useState("#ffffff");
  const [textColor, setTextColor]     = useState("#000000");
  const [isListening, setIsListening] = useState(false);

  const editorRef    = useRef<HTMLDivElement>(null);
  const saveTimer    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const imgUploadRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastLocalEditAtRef = useRef<number>(Date.now());
  const lastAppliedRemoteSnapshotRef = useRef<string>("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ── Close menus on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".doc-menu-trigger")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Load from DB ──
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${databaseId}/documents`);
        const json = await res.json();
        if (json.document) {
          const doc = json.document;
          lastAppliedRemoteSnapshotRef.current = JSON.stringify(doc);
          if (doc.title)       setTitle(doc.title);
          if (doc.comments)    setComments(doc.comments);
          if (doc.versions)    setVersions(doc.versions);
          if (doc.lineSpacing) setLineSpacing(doc.lineSpacing);
        if (editorRef.current && doc.content) {
  editorRef.current.innerHTML = doc.content;

  // 🔥 Extract font size from first element
  const el = editorRef.current.querySelector("[style*='font-size']") as HTMLElement;

  if (el) {
    const size = el.style.fontSize;
    if (size) {
      const parsed = Number.parseInt(size, 10);
      if (Number.isFinite(parsed)) {
        setCurrentSize(parsed); // e.g. "20pt" → 20
      }
    }
  }

  updateOutline();
  updateWordCount();
}
        } else if (editorRef.current) {
          const tmpl = templateName === "resume" ? "resume" : templateName === "report" ? "report" : "blank";
          editorRef.current.innerHTML = TEMPLATE_HTML[tmpl] || TEMPLATE_HTML.blank;
          updateOutline(); updateWordCount();
          editorRef.current.focus();
        }
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoadedOnce(true); }
    };
    setTimeout(load, 100);
  }, [databaseId, templateName]);

  useEffect(() => {
    if (!loadedOnce) return;
    lastLocalEditAtRef.current = Date.now();
  }, [title, comments, versions, lineSpacing, loadedOnce]);

  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    const markEdited = () => {
      lastLocalEditAtRef.current = Date.now();
    };
    editorEl.addEventListener("input", markEdited);
    return () => {
      editorEl.removeEventListener("input", markEdited);
    };
  }, [loadedOnce]);

  // ── Auto-save ──
  const scheduleSave = useCallback(() => {
    if (!loadedOnce) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveToDb, 2500);
  }, [loadedOnce]);

  const saveToDb = useCallback(async () => {
    if (!editorRef.current || !databaseId) return;
    setSaving(true);
    try {
      await fetch(`/api/databases/${databaseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            title,
            content: editorRef.current.innerHTML,
            comments,
            versions,
            lineSpacing,
          },
        }),
      });
      lastAppliedRemoteSnapshotRef.current = JSON.stringify({
        title,
        content: editorRef.current.innerHTML,
        comments,
        versions,
        lineSpacing,
      });
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) { console.error("Save failed:", e); }
    finally { setSaving(false); }
  }, [databaseId, title, comments, versions, lineSpacing]);

  useEffect(() => { if (loadedOnce) scheduleSave(); }, [title, comments, versions, lineSpacing, loadedOnce]);

  const updateWordCount = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  }, []);

  const updateOutline = useCallback(() => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll("h1,h2,h3,h4,h5,h6");
    const items = Array.from(headings).map((h, i) => {
      const id = `heading-${i}`;
      h.id = id;
      return { tag: h.tagName.toLowerCase(), text: h.textContent || "", id };
    });
    setOutline(items);
  }, []);

  useEffect(() => {
    if (!databaseId || !loadedOnce) return;

    let cancelled = false;
    const poll = async () => {
      if (Date.now() - lastLocalEditAtRef.current < 1200) return;
      if (editorRef.current && editorRef.current.contains(document.activeElement)) return;

      try {
        const res = await fetch(`/api/databases/${databaseId}/documents`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const remote = json?.document;
        if (!remote || cancelled) return;

        const snapshot = JSON.stringify(remote);
        if (snapshot === lastAppliedRemoteSnapshotRef.current) return;

        lastAppliedRemoteSnapshotRef.current = snapshot;
        if (typeof remote.title === "string") setTitle(remote.title);
        if (Array.isArray(remote.comments)) setComments(remote.comments);
        if (Array.isArray(remote.versions)) setVersions(remote.versions);
        if (typeof remote.lineSpacing === "string") setLineSpacing(remote.lineSpacing);
        if (editorRef.current && typeof remote.content === "string" && editorRef.current.innerHTML !== remote.content) {
          editorRef.current.innerHTML = remote.content;
          updateOutline();
          updateWordCount();
        }
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
  }, [databaseId, loadedOnce, updateOutline, updateWordCount]);

  const exec = useCallback((cmd: string, val?: string) => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    }

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, val);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }

    editorRef.current?.focus();
    updateWordCount(); updateOutline(); scheduleSave();
  }, [updateWordCount, updateOutline, scheduleSave]);

  const getSelectionElement = useCallback((): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const node = sel.getRangeAt(0).startContainer;
    if (!node) return null;

    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    if (!el || !editorRef.current || !editorRef.current.contains(el)) return null;

    return el;
  }, []);

  const isRangeInEditor = useCallback((range: Range | null): boolean => {
    if (!range || !editorRef.current) return false;
    const commonNode = range.commonAncestorContainer;
    const root = commonNode.nodeType === Node.TEXT_NODE ? commonNode.parentElement : (commonNode as HTMLElement);
    return !!(root && editorRef.current.contains(root));
  }, []);

  const syncToolbarFromSelection = useCallback(() => {
    const el = getSelectionElement();
    if (!el) return;

    const computed = window.getComputedStyle(el);

    // Keep toolbar font dropdown in sync with the selected text.
    const primaryFont = computed.fontFamily
      .split(",")[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, "");
    if (primaryFont) setCurrentFont(primaryFont);

    const px = Number.parseFloat(computed.fontSize);
    if (!Number.isNaN(px)) {
      const pt = Math.max(1, Math.round((px * 72) / 96));
      const nearest = FONT_SIZES.reduce((prev, next) =>
        Math.abs(next - pt) < Math.abs(prev - pt) ? next : prev
      );
      setCurrentSize(nearest);
    }

    const block = el.closest("p,h1,h2,h3,h4,h5,h6") as HTMLElement | null;
    if (block) {
      const styleLabel = BLOCK_TO_STYLE_LABEL[block.tagName.toLowerCase()] || "Normal text";
      setCurrentStyle(styleLabel);
    }
  }, [getSelectionElement]);

  const applyFontSize = useCallback((size: number) => {
    if (!Number.isFinite(size) || size <= 0) return;
    setCurrentSize(size);

    const liveSelection = window.getSelection();
    let targetRange: Range | null = null;

    if (liveSelection && liveSelection.rangeCount > 0) {
      const liveRange = liveSelection.getRangeAt(0);
      const commonNode = liveRange.commonAncestorContainer;
      const root = commonNode.nodeType === Node.TEXT_NODE ? commonNode.parentElement : (commonNode as HTMLElement);
      if (root && editorRef.current?.contains(root)) {
        targetRange = liveRange.cloneRange();
      }
    }

    if (!targetRange) {
      const savedRange = savedRangeRef.current?.cloneRange() ?? null;
      if (isRangeInEditor(savedRange)) {
        targetRange = savedRange;
      }
    }

    if (!targetRange) {
      const el = getSelectionElement();
      if (el) {
        el.style.fontSize = `${size}pt`;
        editorRef.current?.focus();
        syncToolbarFromSelection();
        updateWordCount();
        updateOutline();
        scheduleSave();
      }
      return;
    }

    // Collapsed cursor: apply size to nearest editable element.
    if (targetRange.collapsed) {
      const node = targetRange.startContainer;
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
      if (el && editorRef.current?.contains(el)) {
        el.style.fontSize = `${size}pt`;

        const blockEl = el.closest("p,h1,h2,h3,h4,h5,h6,li") as HTMLElement | null;
        if (blockEl) {
          const blockComputed = window.getComputedStyle(blockEl);
          const oldSizePx = Number.parseFloat(blockComputed.fontSize) || size;
          const ratio = size / oldSizePx;
          const mt = Number.parseFloat(blockComputed.marginTop);
          const mb = Number.parseFloat(blockComputed.marginBottom);

          if (Number.isFinite(mt) && mt > 0) blockEl.style.marginTop = `${Math.max(0, mt * ratio).toFixed(1)}px`;
          if (Number.isFinite(mb) && mb > 0) blockEl.style.marginBottom = `${Math.max(0, mb * ratio).toFixed(1)}px`;
        }
      }

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(targetRange);
      }
      savedRangeRef.current = targetRange.cloneRange();

      syncToolbarFromSelection();
      updateWordCount();
      updateOutline();
      scheduleSave();
      return;
    }

    const commonRoot = targetRange.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? targetRange.commonAncestorContainer.parentNode
      : targetRange.commonAncestorContainer;

    if (!commonRoot) return;

    const textParts: Array<{ node: Text; start: number; end: number }> = [];
    const walker = document.createTreeWalker(commonRoot, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      if (textNode.textContent && targetRange.intersectsNode(textNode)) {
        let start = 0;
        let end = textNode.textContent.length;

        if (textNode === targetRange.startContainer) {
          start = targetRange.startOffset;
        }
        if (textNode === targetRange.endContainer) {
          end = targetRange.endOffset;
        }

        if (end > start) {
          textParts.push({ node: textNode, start, end });
        }
      }
      current = walker.nextNode();
    }

    if (textParts.length === 0) {
      const el = getSelectionElement();
      if (el) {
        el.style.fontSize = `${size}pt`;

        const blockEl = el.closest("p,h1,h2,h3,h4,h5,h6,li") as HTMLElement | null;
        if (blockEl) {
          const blockComputed = window.getComputedStyle(blockEl);
          const oldSizePx = Number.parseFloat(blockComputed.fontSize) || size;
          const ratio = size / oldSizePx;
          const mt = Number.parseFloat(blockComputed.marginTop);
          const mb = Number.parseFloat(blockComputed.marginBottom);

          if (Number.isFinite(mt) && mt > 0) blockEl.style.marginTop = `${Math.max(0, mt * ratio).toFixed(1)}px`;
          if (Number.isFinite(mb) && mb > 0) blockEl.style.marginBottom = `${Math.max(0, mb * ratio).toFixed(1)}px`;
        }
      }
      savedRangeRef.current = targetRange.cloneRange();
      syncToolbarFromSelection();
      updateWordCount();
      updateOutline();
      scheduleSave();
      return;
    }

    if (editorRef.current) {
      const blocks = editorRef.current.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li");
      blocks.forEach((blockNode) => {
        if (!targetRange.intersectsNode(blockNode)) return;

        const blockRange = document.createRange();
        blockRange.selectNodeContents(blockNode);

        const fullySelected =
          targetRange.compareBoundaryPoints(Range.START_TO_START, blockRange) <= 0 &&
          targetRange.compareBoundaryPoints(Range.END_TO_END, blockRange) >= 0;

        if (!fullySelected) return;

        const blockEl = blockNode as HTMLElement;
        const computed = window.getComputedStyle(blockEl);
        const oldSizePx = Number.parseFloat(computed.fontSize) || size;
        const ratio = size / oldSizePx;
        const mt = Number.parseFloat(computed.marginTop);
        const mb = Number.parseFloat(computed.marginBottom);

        blockEl.style.fontSize = `${size}pt`;
        if (Number.isFinite(mt) && mt > 0) blockEl.style.marginTop = `${Math.max(0, mt * ratio).toFixed(1)}px`;
        if (Number.isFinite(mb) && mb > 0) blockEl.style.marginBottom = `${Math.max(0, mb * ratio).toFixed(1)}px`;
      });
    }

    const insertedSpans: HTMLElement[] = [];
    for (let i = textParts.length - 1; i >= 0; i--) {
      const part = textParts[i];
      const partRange = document.createRange();
      partRange.setStart(part.node, part.start);
      partRange.setEnd(part.node, part.end);

      const span = document.createElement("span");
      span.style.fontSize = `${size}pt`;

      const fragment = partRange.extractContents();
      span.appendChild(fragment);
      partRange.insertNode(span);
      insertedSpans.push(span);
    }

    const selection = window.getSelection();
    if (selection && insertedSpans.length > 0) {
      const newRange = document.createRange();
      newRange.setStartBefore(insertedSpans[insertedSpans.length - 1]);
      newRange.setEndAfter(insertedSpans[0]);
      selection.removeAllRanges();
      selection.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    } else {
      savedRangeRef.current = targetRange.cloneRange();
    }

    syncToolbarFromSelection();
    updateWordCount();
    updateOutline();
    scheduleSave();
  }, [getSelectionElement, isRangeInEditor, syncToolbarFromSelection, updateWordCount, updateOutline, scheduleSave]);

  const captureEditorSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (isRangeInEditor(range)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, [isRangeInEditor]);

  const applyFontFamily = useCallback((font: string) => {
    setCurrentFont(font);
    exec("fontName", font);
  }, [exec]);

  const applyParaStyle = useCallback((style: typeof PARA_STYLES[0]) => {
    setCurrentStyle(style.label);
    exec("formatBlock", style.block);
    if (style.size) applyFontSize(parseInt(style.size));
  }, [exec, applyFontSize]);

  const applyLineSpacing = useCallback((val: string) => {
    setLineSpacing(val);
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let container = range.commonAncestorContainer as HTMLElement;
    if (container.nodeType === 3) container = container.parentElement!;
    const block = container.closest("p,h1,h2,h3,h4,h5,h6,li,div") as HTMLElement;
    if (block) block.style.lineHeight = val;
    scheduleSave();
  }, [scheduleSave]);

  const insertTable = useCallback(() => {
    let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>`;
    for (let r = 0; r < tableRows; r++) {
      html += "<tr>";
      for (let c = 0; c < tableCols; c++) {
        html += `<td style="border:1px solid #ccc;padding:6px 8px;min-width:60px;height:24px"><br></td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
    setShowTableDlg(false);
  }, [tableRows, tableCols, exec]);

  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    exec("insertHTML", `<a href="${linkUrl}" target="_blank" style="color:#1a73e8">${text}</a>`);
    setLinkUrl(""); setLinkText(""); setShowLinkDlg(false);
  }, [linkUrl, linkText, exec]);

  const insertImage = useCallback((src: string) => {
    exec("insertHTML", `<img src="${src}" style="max-width:100%;height:auto;margin:4px 0" />`);
    setImgUrl(""); setShowImgDlg(false);
  }, [exec]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) insertImage(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFindReplace = useCallback((replaceAll: boolean) => {
    if (!findText || !editorRef.current) return;
    const content  = editorRef.current.innerHTML;
    const escaped  = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex    = new RegExp(escaped, "g");
    editorRef.current.innerHTML = content.replace(regex, `<mark style="background:#ffff00">${replaceAll ? replaceText : `<span>${replaceText}</span>`}</mark>`);
    updateWordCount(); scheduleSave();
  }, [findText, replaceText, updateWordCount, scheduleSave]);

  const toggleVoiceTyping = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice typing is not supported in this browser."); return; }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
        if (event.results[event.results.length - 1].isFinal) exec("insertText", transcript);
      };
      rec.onend = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      editorRef.current?.focus();
    }
  }, [isListening, exec]);

  const downloadTxt = () => {
    const text = editorRef.current?.innerText || "";
    const blob = new Blob([`${title}\n${"=".repeat(title.length)}\n\n${text}`], { type:"text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g,"_")}.txt`; a.click();
  };

  const downloadHtml = () => {
    const html = `<!DOCTYPE html><html><head><title>${title}</title><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px}</style></head><body><h1>${title}</h1>${editorRef.current?.innerHTML||""}</body></html>`;
    const blob = new Blob([html], { type:"text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g,"_")}.html`; a.click();
  };

  const printDoc = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.5}table{border-collapse:collapse;width:100%}td{border:1px solid #ccc;padding:6px}@media print{body{margin:0}}</style></head><body><h1>${title}</h1>${editorRef.current?.innerHTML||""}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const saveVersion = useCallback((label = "") => {
    if (!editorRef.current) return;
    const ver: Version = {
      id: Date.now().toString(),
      content: editorRef.current.innerHTML,
      title,
      timestamp: new Date().toISOString(),
      label: label || `Version ${new Date().toLocaleString()}`,
    };
    setVersions(prev => [ver, ...prev.slice(0, 19)]);
  }, [title]);

  const restoreVersion = useCallback((ver: Version) => {
    if (!editorRef.current) return;
    if (!confirm("Restore this version? Current content will be replaced.")) return;
    editorRef.current.innerHTML = ver.content;
    setTitle(ver.title);
    updateWordCount(); updateOutline(); scheduleSave();
    setShowVersions(false);
  }, [updateWordCount, updateOutline, scheduleSave]);

  const addComment = useCallback(() => {
    if (!newComment.trim()) return;
    const sel = window.getSelection();
    const selText = sel ? sel.toString() : "";
    const c: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: "You",
      timestamp: new Date().toLocaleString(),
      resolved: false,
      selectionText: selText,
      replies: [],
    };
    setComments(prev => [...prev, c]);
    setNewComment("");
  }, [newComment]);

  const addReply = useCallback((commentId: string) => {
    const text = newReply[commentId];
    if (!text?.trim()) return;
    setComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      replies: [...c.replies, { id: Date.now().toString(), text, author: "You", timestamp: new Date().toLocaleString() }],
    } : c));
    setNewReply(prev => ({ ...prev, [commentId]: "" }));
  }, [newReply]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!editorRef.current?.contains(document.activeElement) && !(e.target === document.body)) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      switch (e.key) {
        case "s": e.preventDefault(); saveToDb(); break;
        case "p": e.preventDefault(); printDoc(); break;
        case "f": e.preventDefault(); setShowFindReplace(true); break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [saveToDb]);

  useEffect(() => {
    const sync = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (isRangeInEditor(range)) {
          const editorHasFocus = !!editorRef.current?.contains(document.activeElement);
          const hasSaved = !!savedRangeRef.current;

          // Do not overwrite a useful text selection with a collapsed range
          // created while interacting with toolbar controls.
          if (!range.collapsed || editorHasFocus || !hasSaved) {
            savedRangeRef.current = range.cloneRange();
          }
        }
      }
      syncToolbarFromSelection();
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, [isRangeInEditor, syncToolbarFromSelection]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const captureSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const commonNode = range.commonAncestorContainer;
      const root = commonNode.nodeType === Node.TEXT_NODE ? commonNode.parentElement : (commonNode as HTMLElement);
      if (!root || !editor.contains(root)) return;
      savedRangeRef.current = range.cloneRange();
    };

    editor.addEventListener("mouseup", captureSelection);
    editor.addEventListener("keyup", captureSelection);

    return () => {
      editor.removeEventListener("mouseup", captureSelection);
      editor.removeEventListener("keyup", captureSelection);
    };
  }, []);

  const isViewOnly = mode === "viewing";

  // ── Menu item helper ──
  const MenuItem = ({ label, onClick, shortcut }: { label: React.ReactNode; onClick: () => void; shortcut?: string }) => (
    <button onClick={() => { onClick(); setOpenMenu(null); }}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${
        isDark
          ? "text-slate-100 hover:bg-slate-700 hover:text-white"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
      }`}>
      <span>{label}</span>
      {shortcut && <span className={`ml-6 text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? "text-slate-300 bg-slate-700" : "text-gray-400 bg-gray-100"}`}>{shortcut}</span>}
    </button>
  );
  const MenuDivider = () => <div className={`border-t my-1 mx-2 ${isDark ? "border-slate-700" : "border-gray-100"}`}/>;

  // ── Toolbar button ──
  const TB = ({
    title: t, onClick, active, disabled, children,
  }: {
    title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode;
  }) => (
    <button title={t} onClick={onClick} disabled={disabled || isViewOnly}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all ${
        active
          ? (isDark ? "bg-slate-600 text-white shadow-inner" : "bg-blue-100 text-blue-700 shadow-inner")
          : (isDark ? "text-slate-200 hover:bg-slate-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800")
      } disabled:opacity-30 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );

  const pageW = pageOrientation === "portrait" ? 794 : 1123;
  const pageH = pageOrientation === "portrait" ? 1123 : 794;

  // ── Mode badge colors ──
  const modeBadge = {
    editing:    { bg:"bg-emerald-100", text:"text-emerald-700", dot:"bg-emerald-500", label:"Editing" },
    suggesting: { bg:"bg-amber-100",   text:"text-amber-700",   dot:"bg-amber-500",   label:"Suggesting" },
    viewing:    { bg:"bg-gray-100",    text:"text-gray-600",    dot:"bg-gray-400",    label:"Viewing" },
  }[mode];

  return (
    <div className={`flex flex-col h-full overflow-hidden font-sans ${isDark ? "bg-slate-900 text-white" : "bg-[#eef0f3] text-gray-900"}`}>

      {/* ══ TITLE BAR ══ */}
      <div className="absolute z-30 right-2">
      <div className={`flex items-center gap-3 px-4 py-2.5 shrink-0 shadow-sm ${isDark ? "bg-slate-800 border-b border-slate-700" : "bg-white border-b border-gray-200/80"}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => scheduleSave()}
          className={`flex-1 text-[15px] font-semibold border-none outline-none bg-transparent px-2 py-1 rounded-lg transition-colors ${isDark ? "text-white hover:bg-slate-700 focus:bg-slate-700" : "text-gray-800 hover:bg-gray-50 focus:bg-gray-50"}`}
          placeholder="Untitled Document"
        />
        {/* Mode badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${modeBadge.bg} ${modeBadge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${modeBadge.dot}`}/>
          {modeBadge.label}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>Saving…
            </span>
          )}
          {!saving && savedAt && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Saved {savedAt}
            </span>
          )}
          <button onClick={() => saveToDb()}
            className="px-3 py-1.5 text-xs bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
            style={{ boxShadow:"0 2px 0 #1d4ed8" }}>
            Save
          </button>
        </div>
      </div>

      {/* ══ MENU BAR ══ */}
      <div className={`flex items-center gap-0.5 px-3 py-1 shrink-0 text-[12px] ${isDark ? "bg-slate-800 border-b border-slate-700 text-white" : "bg-white border-b border-gray-200/80"}`}>
        {[
          {
            name: "File",
            items: () => (
              <>
                <MenuItem label={<><span className="mr-2">💾</span>Save</>}                 onClick={saveToDb}                                   shortcut="Ctrl+S"/>
                <MenuItem label={<><span className="mr-2">🖨️</span>Print</>}                onClick={printDoc}                                   shortcut="Ctrl+P"/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">📥</span>Download as TXT</>}      onClick={downloadTxt}/>
                <MenuItem label={<><span className="mr-2">📄</span>Download as HTML</>}     onClick={downloadHtml}/>
                <MenuItem label={<><span className="mr-2">📋</span>Export as PDF</>}        onClick={printDoc}/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">🕐</span>Version History</>}      onClick={() => { saveVersion(); setShowVersions(true); }}/>
                <MenuItem label={<><span className="mr-2">⚙️</span>Page Setup…</>}          onClick={() => setShowPageSetup(true)}/>
              </>
            ),
          },
          {
            name: "Edit",
            items: () => (
              <>
                <MenuItem label={<><span className="mr-2">↩</span>Undo</>}              onClick={() => exec("undo")}      shortcut="Ctrl+Z"/>
                <MenuItem label={<><span className="mr-2">↪</span>Redo</>}              onClick={() => exec("redo")}      shortcut="Ctrl+Y"/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">✂️</span>Cut</>}              onClick={() => exec("cut")}       shortcut="Ctrl+X"/>
                <MenuItem label={<><span className="mr-2">📋</span>Copy</>}             onClick={() => exec("copy")}      shortcut="Ctrl+C"/>
                <MenuItem label={<><span className="mr-2">📌</span>Paste</>}            onClick={() => exec("paste")}     shortcut="Ctrl+V"/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">🔍</span>Find & Replace…</>} onClick={() => setShowFindReplace(true)} shortcut="Ctrl+F"/>
                <MenuItem label={<><span className="mr-2">☑️</span>Select All</>}       onClick={() => exec("selectAll")} shortcut="Ctrl+A"/>
              </>
            ),
          },
          {
            name: "View",
            items: () => (
              <>
                <MenuItem label={<><span className="mr-2">{showRuler?"✓":"  "}</span>Ruler</>}            onClick={() => setShowRuler(!showRuler)}/>
                <MenuItem label={<><span className="mr-2">{showOutline?"✓":"  "}</span>Document Outline</>}  onClick={() => setShowOutline(!showOutline)}/>
                <MenuItem label={<><span className="mr-2">{showComments?"✓":"  "}</span>Comments Panel</>}  onClick={() => setShowComments(!showComments)}/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">🔍</span>Zoom In</>}   onClick={() => setZoom(z => Math.min(z+10,200))}/>
                <MenuItem label={<><span className="mr-2">🔎</span>Zoom Out</>}  onClick={() => setZoom(z => Math.max(z-10,50))}/>
                <MenuItem label={<><span className="mr-2">↺</span>Reset Zoom</>} onClick={() => setZoom(100)}/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">✏️</span>Editing Mode</>}    onClick={() => setMode("editing")}/>
                <MenuItem label={<><span className="mr-2">💬</span>Suggesting Mode</>} onClick={() => setMode("suggesting")}/>
                <MenuItem label={<><span className="mr-2">👁️</span>Viewing Mode</>}    onClick={() => setMode("viewing")}/>
              </>
            ),
          },
          {
            name: "Insert",
            items: () => (
              <>
                <MenuItem label={<><span className="mr-2">🖼️</span>Image…</>}          onClick={() => setShowImgDlg(true)}/>
                <MenuItem label={<><span className="mr-2">🔗</span>Link…</>}           onClick={() => setShowLinkDlg(true)}/>
                <MenuItem label={<><span className="mr-2">⊞</span>Table…</>}           onClick={() => setShowTableDlg(true)}/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">➖</span>Horizontal Line</>} onClick={() => exec("insertHTML","<hr style='border:none;border-top:1px solid #e0e0e0;margin:12px 0'/>")}/>
                <MenuItem label={<><span className="mr-2">↲</span>Page Break</>}       onClick={() => exec("insertHTML","<div style='page-break-after:always;border-top:2px dashed #ccc;margin:16px 0;padding-top:4px;font-size:9pt;color:#999;text-align:center'>— Page Break —</div>")}/>
                <MenuItem label={<><span className="mr-2">📅</span>Date & Time</>}     onClick={() => exec("insertHTML",`<span>${new Date().toLocaleString()}</span>`)}/>
                <MenuItem label={<><span className="mr-2">✅</span>Checklist</>}       onClick={() => exec("insertHTML","<ul style='list-style:none;padding:0'><li><input type='checkbox'/> Checklist item</li></ul>")}/>
                <MenuItem label={<><span className="mr-2">⬛</span>Code Block</>}      onClick={() => exec("insertHTML","<pre style='background:#f4f4f4;border:1px solid #ddd;border-radius:6px;padding:12px;font-family:Courier New;font-size:10pt;overflow-x:auto'>// Code here\n</pre>")}/>
              </>
            ),
          },
          {
            name: "Format",
            items: () => (
              <>
                <MenuItem label={<><strong className="mr-2">B</strong>Bold</>}             onClick={() => exec("bold")}         shortcut="Ctrl+B"/>
                <MenuItem label={<><em className="mr-2">I</em>Italic</>}                   onClick={() => exec("italic")}       shortcut="Ctrl+I"/>
                <MenuItem label={<><u className="mr-2">U</u>Underline</>}                  onClick={() => exec("underline")}    shortcut="Ctrl+U"/>
                <MenuItem label={<><s className="mr-2">S</s>Strikethrough</>}              onClick={() => exec("strikeThrough")}/>
                <MenuDivider/>
                <MenuItem label="⬅ Align Left"    onClick={() => exec("justifyLeft")}/>
                <MenuItem label="≡ Align Center"   onClick={() => exec("justifyCenter")}/>
                <MenuItem label="➡ Align Right"    onClick={() => exec("justifyRight")}/>
                <MenuItem label="☰ Justify"        onClick={() => exec("justifyFull")}/>
                <MenuDivider/>
                <MenuItem label="• Bulleted List"  onClick={() => exec("insertUnorderedList")}/>
                <MenuItem label="1. Numbered List" onClick={() => exec("insertOrderedList")}/>
                <MenuDivider/>
                <MenuItem label="🗑️ Clear Formatting" onClick={() => exec("removeFormat")}/>
              </>
            ),
          },
          {
            name: "Tools",
            items: () => (
              <>
                <MenuItem label={<><span className="mr-2">🎤</span>{`Voice Typing${isListening?" (ON)":""}`}</>} onClick={toggleVoiceTyping}/>
                <MenuItem label={<><span className="mr-2">🔢</span>Word Count</>}         onClick={() => setShowWordCount(true)}/>
                <MenuItem label={<><span className="mr-2">🔍</span>Find & Replace…</>}    onClick={() => setShowFindReplace(true)} shortcut="Ctrl+F"/>
                <MenuDivider/>
                <MenuItem label={<><span className="mr-2">🌐</span>Translate</>}          onClick={() => window.open("https://translate.google.com/","_blank")}/>
                <MenuItem label={<><span className="mr-2">📖</span>Dictionary</>}         onClick={() => { const sel=window.getSelection()?.toString(); window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(sel||"")}`, "_blank"); }}/>
                <MenuItem label={<><span className="mr-2">🔬</span>Research</>}           onClick={() => { const sel=window.getSelection()?.toString(); window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(sel||"")}`, "_blank"); }}/>
              </>
            ),
          },
        ].map(menu => (
          <div key={menu.name} className="relative doc-menu-trigger">
            <button
              onClick={() => setOpenMenu(openMenu === menu.name ? null : menu.name)}
              className={`px-2.5 py-1 rounded-lg transition-colors text-[12px] font-medium ${
                isDark
                  ? `${openMenu === menu.name ? "bg-slate-700 text-white" : "text-slate-200 hover:bg-slate-700 hover:text-white"}`
                  : `${openMenu === menu.name ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
              }`}>
              {menu.name}
            </button>
            {openMenu === menu.name && (
              <div className={`absolute left-0 top-full z-50 rounded-xl shadow-2xl py-1.5 px-1.5 min-w-[220px] mt-0.5 ${isDark ? "bg-slate-800 border border-slate-600" : "bg-white border border-gray-200"}`}>
                {menu.items()}
              </div>
            )}
          </div>
        ))}

        {/* Right: Mode & Zoom */}
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
            {(["editing","suggesting","viewing"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold capitalize transition-all ${
                  mode===m
                    ? (isDark ? "bg-slate-600 shadow text-white" : "bg-white shadow text-gray-800")
                    : (isDark ? "text-slate-300 hover:text-white" : "text-gray-400 hover:text-gray-600")
                }`}>
                {m === "editing" ? "✏️ Edit" : m === "suggesting" ? "💬 Suggest" : "👁️ View"}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-0.5 rounded-lg px-1.5 py-1 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
            <button onClick={() => setZoom(z => Math.max(z-10,50))} className={`w-5 h-5 flex items-center justify-center rounded font-bold transition-all text-sm ${isDark ? "hover:bg-slate-600 text-slate-200" : "hover:bg-white text-gray-500"}`}>−</button>
            <span className={`text-[10px] w-10 text-center font-mono ${isDark ? "text-white" : "text-gray-500"}`}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z+10,200))} className={`w-5 h-5 flex items-center justify-center rounded font-bold transition-all text-sm ${isDark ? "hover:bg-slate-600 text-slate-200" : "hover:bg-white text-gray-500"}`}>+</button>
          </div>
        </div>
      </div>

      {/* ══ TOOLBAR ══ */}
      {mode !== "viewing" && (
        <div className={`flex flex-wrap items-center gap-0.5 px-2 py-1.5 shrink-0 overflow-x-auto ${isDark ? "bg-slate-800 border-b border-slate-700" : "bg-white border-b border-gray-200/80"}`}>

          <TB title="Undo (Ctrl+Z)" onClick={() => exec("undo")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          </TB>
          <TB title="Redo (Ctrl+Y)" onClick={() => exec("redo")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
          </TB>
          <TB title="Print (Ctrl+P)" onClick={printDoc}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </TB>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          <select value={currentStyle} onMouseDown={captureEditorSelection} onChange={e => { const s = PARA_STYLES.find(p => p.label === e.target.value); if(s) applyParaStyle(s); }} disabled={isViewOnly}
            className={`h-7 text-[11px] border rounded-md px-1.5 focus:outline-none min-w-[120px] cursor-pointer ${isDark ? "border-slate-600 bg-slate-700 text-white focus:border-slate-400" : "border-gray-200 bg-white text-gray-700 focus:border-blue-400"}`}>
            {PARA_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
          </select>

          <select value={currentFont} onMouseDown={captureEditorSelection} onChange={e => applyFontFamily(e.target.value)} disabled={isViewOnly}
            className={`h-7 text-[11px] border rounded-md px-1.5 focus:outline-none min-w-[100px] cursor-pointer ${isDark ? "border-slate-600 bg-slate-700 text-white focus:border-slate-400" : "border-gray-200 bg-white text-gray-700 focus:border-blue-400"}`}>
            {FONTS.map(f => <option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
          </select>

          <select
            onMouseDown={captureEditorSelection}
            value={Number.isFinite(currentSize) ? currentSize : 11}
            onChange={e => {
              const nextSize = Number(e.target.value);
              if (Number.isFinite(nextSize)) applyFontSize(nextSize);
            }}
            disabled={isViewOnly}
            className={`h-7 text-[11px] border rounded-md px-1.5 focus:outline-none w-16 cursor-pointer ${isDark ? "border-slate-600 bg-slate-700 text-white focus:border-slate-400" : "border-gray-200 bg-white text-gray-700 focus:border-blue-400"}`}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          <TB title="Bold (Ctrl+B)" onClick={() => exec("bold")}><span className="font-bold text-sm">B</span></TB>
          <TB title="Italic (Ctrl+I)" onClick={() => exec("italic")}><span className="italic text-sm font-serif">I</span></TB>
          <TB title="Underline (Ctrl+U)" onClick={() => exec("underline")}><span className="underline text-sm">U</span></TB>
          <TB title="Strikethrough" onClick={() => exec("strikeThrough")}><span className="line-through text-sm">S</span></TB>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          {/* Color pickers */}
          <div className="flex flex-col items-center gap-0.5" title="Text color">
            <span className="text-[8px] text-gray-400 leading-none">A</span>
            <input type="color" defaultValue="#000000" onChange={e => { setTextColor(e.target.value); exec("foreColor", e.target.value); }} disabled={isViewOnly}
              className="w-6 h-4 rounded cursor-pointer border-0 p-0" style={{padding:0}}/>
          </div>
          <div className="flex flex-col items-center gap-0.5" title="Highlight">
            <span className="text-[8px] text-gray-400 leading-none">H</span>
            <input type="color" defaultValue="#ffff00" onChange={e => exec("hiliteColor", e.target.value)} disabled={isViewOnly}
              className="w-6 h-4 rounded cursor-pointer border-0 p-0" style={{padding:0}}/>
          </div>
          <div className="flex flex-col items-center gap-0.5" title="Page background">
            <span className="text-[8px] text-gray-400 leading-none">🎨</span>
            <input type="color" defaultValue="#ffffff" onChange={e => setPageBgColor(e.target.value)} disabled={isViewOnly}
              className="w-6 h-4 rounded cursor-pointer border-0 p-0" style={{padding:0}}/>
          </div>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          <TB title="Align Left"   onClick={() => exec("justifyLeft")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          </TB>
          <TB title="Align Center" onClick={() => exec("justifyCenter")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </TB>
          <TB title="Align Right"  onClick={() => exec("justifyRight")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
          </TB>
          <TB title="Justify" onClick={() => exec("justifyFull")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </TB>

          <div className="w-px h-5 bg-gray-200 mx-0.5"/>

          <TB title="Bulleted List" onClick={() => exec("insertUnorderedList")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
          </TB>
          <TB title="Numbered List" onClick={() => exec("insertOrderedList")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </TB>
          <TB title="Increase Indent" onClick={() => exec("indent")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="7 10 11 12 7 14"/><line x1="11" y1="12" x2="21" y2="12"/></svg>
          </TB>
          <TB title="Decrease Indent" onClick={() => exec("outdent")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="11 10 7 12 11 14"/><line x1="7" y1="12" x2="21" y2="12"/></svg>
          </TB>

          <div className="w-px h-5 bg-gray-200 mx-0.5"/>

          <select value={lineSpacing} onChange={e => applyLineSpacing(e.target.value)} disabled={isViewOnly} title="Line spacing"
            className={`h-7 text-[11px] border rounded-md px-1.5 focus:outline-none w-[72px] cursor-pointer ${isDark ? "border-slate-600 bg-slate-700 text-white focus:border-slate-400" : "border-gray-200 bg-white text-gray-700 focus:border-blue-400"}`}>
            {LINE_SPACINGS.map(ls => <option key={ls.val} value={ls.val}>{ls.label}</option>)}
          </select>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          <TB title="Insert Link" onClick={() => setShowLinkDlg(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </TB>
          <TB title="Insert Image" onClick={() => setShowImgDlg(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </TB>
          <TB title="Insert Table" onClick={() => setShowTableDlg(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </TB>
          <TB title="Horizontal Rule" onClick={() => exec("insertHTML","<hr style='border:none;border-top:1px solid #e0e0e0;margin:12px 0'/>")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </TB>

          <div className={`w-px h-5 mx-0.5 ${isDark ? "bg-slate-600" : "bg-gray-200"}`}/>

          <TB title="Clear Formatting" onClick={() => exec("removeFormat")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4 8 20"/><line x1="17" y1="11" x2="22" y2="16"/><line x1="22" y1="11" x2="17" y2="16"/></svg>
          </TB>

          <button onClick={toggleVoiceTyping} title="Voice typing"
            className={`w-7 h-7 flex items-center justify-center rounded-md text-xs ml-0.5 transition-all ${isListening ? "bg-red-100 text-red-600 animate-pulse" : isDark ? "text-slate-200 hover:bg-slate-700" : "text-gray-400 hover:bg-gray-100"}`}>
            🎤
          </button>
          <TB title="Add Comment" onClick={() => setShowComments(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </TB>
        </div>
      )}

      {/* ══ RULER ══ — FIX: each tick is `position:relative` so the label number
           stays clipped inside it and never escapes to the bottom of the page */}
      {showRuler && (
        <div
          className="shrink-0 bg-gradient-to-b from-[#e8e9ec] to-[#dfe0e3] border-b border-gray-300 overflow-hidden select-none"
          style={{ height: 22 }}
        >
          <div
            className="flex items-end h-full"
            style={{ paddingLeft: (pageMargin / 2) + 16 }}
          >
            {Array.from({ length: Math.floor((pageW - pageMargin) / 10) }).map((_, i) => {
              const isMajor = i % 10 === 0;
              const isMid   = i % 5 === 0 && !isMajor;
              return (
                /* ✅ FIX: position:relative on every tick cell so the absolute
                     label is contained within this cell, not the page */
                <div
                  key={i}
                  className="relative flex-shrink-0 flex items-end justify-start"
                  style={{ width: 10, height: "100%" }}
                >
                  {/* tick line */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: 1,
                      height: isMajor ? 10 : isMid ? 6 : 3,
                      background: isMajor ? "#888" : isMid ? "#aaa" : "#ccc",
                    }}
                  />
                  {/* ✅ FIX: label is absolutely positioned inside its own relative
                       parent (width=10px), so it NEVER overflows the ruler bar */}
                  {isMajor && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 11,
                        left: 1,
                        fontSize: 7,
                        lineHeight: 1,
                        color: "#888",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      {i / 10}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden min-h-0 mt-40">

        {/* Document outline */}
        {showOutline && (
          <div className="w-52 bg-white border-r border-gray-200 overflow-y-auto shrink-0 p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Outline</p>
            {outline.length === 0
              ? <p className="text-[11px] text-gray-400 px-2">No headings found.<br/>Add H1–H6 to see them here.</p>
              : outline.map(item => (
                <button key={item.id}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior:"smooth" })}
                  className="w-full text-left text-[11px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition truncate"
                  style={{ paddingLeft: parseInt(item.tag.replace("h","")) * 10 }}>
                  {item.text || "(empty heading)"}
                </button>
              ))
            }
          </div>
        )}

        {/* Page canvas */}
        <div className={`flex-1 overflow-auto flex justify-center py-8 px-4 min-h-0 ${isDark ? "bg-slate-900 text-white" : "bg-gray-100"}`}
         >
          <div style={{ width: pageW * (zoom / 100), transformOrigin:"top center" }}>
            <div
              className="mx-auto rounded-sm"
              style={{
                width: pageW,
                minHeight: pageH,
                padding: pageMargin,
                backgroundColor: pageBgColor,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                boxSizing: "border-box",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <div
                ref={editorRef}
                contentEditable={!isViewOnly}
                suppressContentEditableWarning
                onInput={() => { updateWordCount(); updateOutline(); scheduleSave(); syncToolbarFromSelection(); }}
                onKeyUp={() => { updateWordCount(); syncToolbarFromSelection(); }}
                onClick={() => editorRef.current?.focus()}
                onMouseUp={syncToolbarFromSelection}
                tabIndex={0}
                style={{
                  outline: "none",
                  minHeight: 400,
                  // fontFamily: currentFont,
                  // fontSize: `${currentSize}pt`,
                  lineHeight: lineSpacing,
                  wordBreak: "break-word",
                  color: textColor,
                  cursor: isViewOnly ? "default" : "text",
                }}
                className="doc-editor"
              />
            </div>
            {/* word count under page */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400">
              <span>{wordCount} words · {charCount} characters</span>
              <span className="opacity-50">·</span>
              <span>{pageOrientation} · {pageW}×{pageH}px</span>
            </div>
          </div>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className={`w-72 ${isDark ? 'bg-slate-800' : 'bg-white'} border-l border-gray-200 overflow-hidden shrink-0 flex flex-col min-h-0`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-[12px] font-semibold text-gray-700">
                  Comments
                  {comments.filter(c => !c.resolved).length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                      {comments.filter(c => !c.resolved).length}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowComments(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-3 border-b border-gray-100 shrink-0">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3}
                placeholder="Add a comment…"
                className="w-full text-[11px] border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
              <button onClick={addComment}
                className="mt-2 w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] rounded-xl font-semibold transition-colors shadow-sm">
                Add Comment
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p className="text-[11px] text-center">No comments yet.<br/>Select text and add one.</p>
                </div>
              )}
              {comments.map(c => (
                <div key={c.id} className={`rounded-xl border p-2.5 transition-all ${c.resolved ? "opacity-40 bg-gray-50 border-gray-100" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                        {c.author[0]}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700">{c.author}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setComments(prev => prev.map(x => x.id===c.id ? {...x,resolved:!x.resolved} : x))}
                        title={c.resolved?"Re-open":"Resolve"}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                        {c.resolved ? "↩" : "✓"}
                      </button>
                      <button onClick={() => setComments(prev => prev.filter(x => x.id!==c.id))}
                        className="text-[9px] px-1 py-0.5 rounded-md text-red-400 hover:bg-red-50 transition-colors">✕</button>
                    </div>
                  </div>
                  {c.selectionText && (
                    <p className="text-[9px] text-blue-500 italic bg-blue-50 px-2 py-1 rounded-lg mb-1.5 truncate border-l-2 border-blue-300">
                      "{c.selectionText}"
                    </p>
                  )}
                  <p className="text-[11px] text-gray-700 leading-relaxed">{c.text}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{c.timestamp}</p>
                  {c.replies.map(r => (
                    <div key={r.id} className="ml-3 mt-2 border-l-2 border-blue-200 pl-2.5 space-y-0.5">
                      <span className="text-[9px] font-semibold text-gray-600">{r.author}</span>
                      <p className="text-[10px] text-gray-700">{r.text}</p>
                      <p className="text-[9px] text-gray-400">{r.timestamp}</p>
                    </div>
                  ))}
                  {!c.resolved && (
                    <div className="mt-2 flex gap-1.5">
                      <input value={newReply[c.id]||""} onChange={e => setNewReply(prev => ({...prev,[c.id]:e.target.value}))}
                        onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addReply(c.id);}}}
                        placeholder="Reply…"
                        className="flex-1 text-[10px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"/>
                      <button onClick={() => addReply(c.id)}
                        className="text-[10px] px-2.5 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold">↵</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ STATUS BAR ══ */}
      <div className={`flex items-center justify-between px-4 py-1.5 ${isDark ? 'bg-slate-800 border-t border-gray-600/80' : 'bg-white border-t border-gray-200/80'} shrink-0`}>
        <div className="flex items-center gap-4 text-[10px] text-gray-400">
          <span className="font-mono">{wordCount} words · {charCount} chars</span>
          <span>Zoom {zoom}%</span>
          {mode !== "editing" && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${mode==="suggesting"?"bg-amber-100 text-amber-600":"bg-gray-100 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${mode==="suggesting"?"bg-amber-400":"bg-gray-400"}`}/>
              {mode === "suggesting" ? "Suggesting" : "Viewing"}
            </span>
          )}
          {isListening && (
            <span className="flex items-center gap-1 text-red-500 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>Listening…
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <button onClick={() => setShowComments(!showComments)} className="hover:text-gray-600 transition-colors flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {comments.filter(c=>!c.resolved).length} comments
          </button>
          <button onClick={() => { saveVersion(); setShowVersions(true); }} className="hover:text-gray-600 transition-colors flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {versions.length} versions
          </button>
        </div>
      </div>

      {/* ══ DIALOGS ══ */}

      {showFindReplace && (
        <Dialog title="Find & Replace" onClose={() => setShowFindReplace(false)}>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block font-medium">Find</label>
              <input value={findText} onChange={e => setFindText(e.target.value)} autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block font-medium">Replace with</label>
              <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/></div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => handleFindReplace(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl font-medium transition-colors">Replace</button>
              <button onClick={() => handleFindReplace(true)}  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-medium transition-colors shadow-sm">Replace All</button>
            </div>
          </div>
        </Dialog>
      )}

      {showTableDlg && (
        <Dialog title="Insert Table" onClose={() => setShowTableDlg(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block font-medium">Rows</label>
                <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
              <div><label className="text-xs text-gray-500 mb-1 block font-medium">Columns</label>
                <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
            </div>
            <div className="border border-gray-200 rounded-xl p-2 overflow-auto max-h-32 bg-gray-50">
              <table className="w-full border-collapse text-[10px]" style={{ tableLayout:"fixed" }}>
                <tbody>
                  {Array.from({length:Math.min(tableRows,6)}).map((_,r)=>(
                    <tr key={r}>
                      {Array.from({length:Math.min(tableCols,6)}).map((_,c)=>(
                        <td key={c} className="border border-gray-300 p-1 text-center text-gray-400 bg-white">{r+1},{c+1}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={insertTable} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-semibold transition-colors shadow-sm">
              Insert {tableRows}×{tableCols} Table
            </button>
          </div>
        </Dialog>
      )}

      {showLinkDlg && (
        <Dialog title="Insert Link" onClose={() => setShowLinkDlg(false)}>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block font-medium">Display text</label>
              <input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Link text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block font-medium">URL</label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" autoFocus
                onKeyDown={e => e.key==="Enter" && insertLink()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
            <button onClick={insertLink} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-semibold transition-colors shadow-sm">Insert Link</button>
          </div>
        </Dialog>
      )}

      {showImgDlg && (
        <Dialog title="Insert Image" onClose={() => setShowImgDlg(false)}>
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Upload from computer</p>
                <p className="text-[11px] text-gray-400">Click to browse files</p>
              </div>
              <input ref={imgUploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile}/>
            </label>
            <div className="flex items-center gap-2"><div className="flex-1 border-t border-gray-200"/><span className="text-xs text-gray-400">or</span><div className="flex-1 border-t border-gray-200"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block font-medium">Image URL</label>
              <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://example.com/image.png"
                onKeyDown={e => e.key==="Enter" && imgUrl && insertImage(imgUrl)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/></div>
            <button onClick={() => imgUrl && insertImage(imgUrl)} disabled={!imgUrl}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded-xl font-semibold transition-colors shadow-sm">Insert from URL</button>
          </div>
        </Dialog>
      )}

      {showWordCount && (
        <Dialog title="Word Count" onClose={() => setShowWordCount(false)}>
          <div className="space-y-1 py-1">
            {[
              ["📄 Pages",                    "~" + Math.ceil(wordCount / 250)],
              ["✍️ Words",                    wordCount.toLocaleString()],
              ["🔡 Characters (no spaces)",   charCount.toLocaleString()],
              ["📝 Characters (with spaces)", (editorRef.current?.innerText.length||0).toLocaleString()],
              ["¶  Paragraphs",               editorRef.current?.querySelectorAll("p,h1,h2,h3,h4,h5,h6").length || 0],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-bold text-gray-800 font-mono">{val}</span>
              </div>
            ))}
          </div>
        </Dialog>
      )}

      {showVersions && (
        <Dialog title="Version History" onClose={() => setShowVersions(false)} wide>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {versions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p className="text-sm text-center">No saved versions yet.<br/>Versions are saved automatically.</p>
              </div>
            )}
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{v.label}</p>
                  <p className="text-[10px] text-gray-400">{new Date(v.timestamp).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-xs mt-0.5">{v.title}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { const win=window.open("","_blank"); if(win){win.document.write(`<html><body><h1>${v.title}</h1>${v.content}</body></html>`);win.document.close();} }}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">Preview</button>
                  <button onClick={() => restoreVersion(v)}
                    className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm">Restore</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => saveVersion(`Manual save — ${new Date().toLocaleString()}`)}
            className="mt-3 w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-xl transition-colors font-medium">
            + Save current version manually
          </button>
        </Dialog>
      )}

      {showPageSetup && (
        <Dialog title="Page Setup" onClose={() => setShowPageSetup(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-semibold">Orientation</label>
              <div className="flex gap-3">
                {(["portrait","landscape"] as const).map(o => (
                  <button key={o} onClick={() => setPageOrientation(o)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all capitalize ${pageOrientation===o ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className={`border-2 border-gray-400 rounded-sm ${o==="portrait"?"w-6 h-8":"w-10 h-6"} ${pageOrientation===o?"border-blue-500":""}`}/>
                    <span className="text-xs text-gray-600 font-medium">{o}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-semibold">Margins</label>
              <input type="range" min={24} max={120} value={pageMargin} onChange={e => setPageMargin(Number(e.target.value))}
                className="w-full h-1.5 accent-blue-500 rounded-full"/>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>Narrow (24px)</span>
                <span className="font-bold text-gray-600">{pageMargin}px</span>
                <span>Wide (120px)</span>
              </div>
            </div>
            <button onClick={() => setShowPageSetup(false)}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-semibold transition-colors shadow-sm">Apply</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Shared Dialog component ────────────────────────────────────────
function Dialog({
  title, children, onClose, wide,
}: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
      onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 ${wide ? "w-full max-w-xl" : "w-full max-w-sm"}`}
        style={{ boxShadow:"0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}