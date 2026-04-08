"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Cell, ResponsiveContainer, LabelList, ReferenceLine,
} from "recharts";
import { Download, Upload, Plus, Trash2, RefreshCw, Link2, Database, X, FileSpreadsheet } from "lucide-react";
import type { DbView } from "@/components/DatabaseViewtabs";
import { exportChart } from "@/lib/exportChart";
// ── Types ──────────────────────────────────────────────────────────
type ChartType = "bar" | "line" | "pie" | "area" | "scatter" | "column" | "bubble";
type DataSource = "manual" | "import" | "table";

interface ChartConfig {
  title: string;
  chartType: ChartType;
  xAxisKey: string;
  yAxisKeys: string[];
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  dataLabels: boolean;
  curved: boolean;
  stacked: boolean;
  fillOpacity: number;
  linkedTableId: string | null;
  showDots: boolean;
  strokeWidth: number;
  borderRadius: number;
  bgColor: string;
}

interface LinkedDB {
  _id: string;
  name: string;
  icon: string;
  viewType: string;
}

// ── Default data per template ──────────────────────────────────────
const TEMPLATE_DATA: Record<ChartType, { columns: string[]; rows: (string | number)[][] }> = {
  bar: {
    columns: ["Product", "Q1", "Q2", "Q3", "Q4"],
    rows: [["Product A", 4200, 3800, 5100, 5900], ["Product B", 2400, 2900, 3100, 3400], ["Product C", 1800, 2100, 2400, 2800], ["Product D", 3100, 3500, 3900, 4200]],
  },
  column: {
    columns: ["Month", "Revenue", "Expenses", "Profit"],
    rows: [["Jan", 85000, 62000, 23000], ["Feb", 92000, 65000, 27000], ["Mar", 98000, 68000, 30000], ["Apr", 115000, 72000, 43000], ["May", 108000, 70000, 38000], ["Jun", 132000, 78000, 54000]],
  },
  line: {
    columns: ["Week", "Users", "New Users", "Active Users"],
    rows: [["W1", 1200, 200, 800], ["W2", 1500, 350, 950], ["W3", 1800, 280, 1100], ["W4", 2200, 420, 1400], ["W5", 2600, 380, 1600], ["W6", 3100, 500, 1900]],
  },
  area: {
    columns: ["Quarter", "Revenue", "Expenses", "Profit"],
    rows: [["Q1 2023", 120000, 85000, 35000], ["Q2 2023", 145000, 92000, 53000], ["Q3 2023", 162000, 98000, 64000], ["Q4 2023", 195000, 110000, 85000], ["Q1 2024", 210000, 118000, 92000], ["Q2 2024", 245000, 125000, 120000]],
  },
  pie: {
    columns: ["Segment", "Market Share"],
    rows: [["Company A", 35], ["Company B", 25], ["Company C", 20], ["Company D", 12], ["Others", 8]],
  },
  scatter: {
    columns: ["Experience (yrs)", "Salary ($k)", "Performance Score"],
    rows: [[2, 45, 72], [5, 75, 85], [8, 95, 88], [3, 55, 76], [10, 120, 91], [1, 38, 65], [7, 88, 89], [4, 65, 80], [6, 82, 86], [9, 108, 92]],
  },
  bubble: {
    columns: ["Country", "GDP ($B)", "HDI", "Population (M)"],
    rows: [["USA", 21400, 0.92, 331], ["China", 14700, 0.76, 1400], ["Germany", 3800, 0.94, 83], ["India", 2800, 0.64, 1380], ["Japan", 5000, 0.91, 125], ["UK", 2700, 0.93, 67], ["France", 2700, 0.90, 67], ["Brazil", 1800, 0.75, 213]],
  },
};

const DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#14b8a6"];
const PRESET_PALETTES = [
  { name: "Ocean",  colors: ["#3b82f6", "#06b6d4", "#0ea5e9", "#38bdf8", "#7dd3fc"] },
  { name: "Forest", colors: ["#10b981", "#22c55e", "#84cc16", "#a3e635", "#4ade80"] },
  { name: "Sunset", colors: ["#f97316", "#ef4444", "#ec4899", "#f59e0b", "#fb923c"] },
  { name: "Purple", colors: ["#8b5cf6", "#a78bfa", "#6366f1", "#c084fc", "#7c3aed"] },
  { name: "Mono",   colors: ["#f8fafc", "#cbd5e1", "#94a3b8", "#64748b", "#334155"] },
  { name: "Vivid",  colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] },
];

const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: "bar",     label: "Bar",     icon: "📊" },
  { type: "column",  label: "Column",  icon: "📊" },
  { type: "line",    label: "Line",    icon: "📈" },
  { type: "area",    label: "Area",    icon: "📉" },
  { type: "pie",     label: "Pie",     icon: "🥧" },
  { type: "scatter", label: "Scatter", icon: "🔵" },
  { type: "bubble",  label: "Bubble",  icon: "🌐" },
];

// ── Component ──────────────────────────────────────────────────────
export default function ChartView({
  databaseId, projectId, templateName = "column", activeView,
}: {
  databaseId: string; projectId?: string; templateName?: string; activeView?: DbView;
}) {
  const initType = (Object.keys(TEMPLATE_DATA).includes(templateName) ? templateName : "column") as ChartType;
  const initData = TEMPLATE_DATA[initType];

  const [config, setConfig] = useState<ChartConfig>({
    title: "My Chart",
    chartType: initType,
    xAxisKey: initData.columns[0],
    yAxisKeys: initData.columns.slice(1),
    colors: DEFAULT_COLORS,
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    dataLabels: false,
    curved: true,
    stacked: false,
    fillOpacity: 0.3,
    linkedTableId: null,
    showDots: true,
    strokeWidth: 2,
    borderRadius: 2,
    // ✅ FIX: changed default from pure "#111827" to transparent so chart area
    //    doesn't look like a solid black void when the component first mounts.
    bgColor: "#0f172a",
  });

  const [columns, setColumns]     = useState<string[]>(initData.columns);
  const [rows, setRows]           = useState<(string | number)[][]>(initData.rows);
  const [dataTab, setDataTab]     = useState<DataSource>("manual");
  const [linkedDBs, setLinkedDBs] = useState<LinkedDB[]>([]);
  const [loadingLink, setLoadingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [savedAt, setSavedAt]     = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [csvText, setCsvText]     = useState("");
  const [activePanel, setActivePanel] = useState<"axes" | "style" | "data_info">("axes");
  const [inputActivated, setInputActivated] = useState(false);

  const modeKey = `${activeView?.type || ""} ${activeView?.label || ""}`.toLowerCase();
  const isInputActive = modeKey.includes("input") || modeKey.includes("by-status");

  const isShowData = modeKey.includes("show-data") || modeKey.includes("my-tasks");
  // ✅ FIX: track the measured pixel height of the chart wrapper so
  //    ResponsiveContainer always gets an explicit numeric height instead of
  //    "100%" — this prevents Recharts SVG from escaping its clipping rect.
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  // const chartRef        = useRef<HTMLDivElement>(null);
  const saveTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveAbortRef    = useRef<AbortController | null>(null);
  const fileRef         = useRef<HTMLInputElement>(null);
  const [chartHeight, setChartHeight] = useState(300);
  const [showChart, setShowChart] = useState(false);
  const lastLocalEditAtRef = useRef<number>(Date.now());
  const lastAppliedRemoteSnapshotRef = useRef<string>("");

  useEffect(() => {
    if (!chartWrapperRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const h = e.contentRect.height;
        if (h > 0) setChartHeight(h);
      }
    });
    ro.observe(chartWrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Derived data ──
  const chartData = useMemo(() => {
    return rows.map(row => {
      const obj: Record<string, string | number> = {};
      columns.forEach((col, i) => { obj[col] = row[i] ?? ""; });
      return obj;
    });
  }, [rows, columns]);

  const pieData = useMemo(() => {
    const nameKey = config.xAxisKey || columns[0];
    const valKey  = config.yAxisKeys[0] || columns[1];
    return chartData.map(d => ({ name: String(d[nameKey] ?? ""), value: Number(d[valKey]) || 0 }));
  }, [chartData, config.xAxisKey, config.yAxisKeys, columns]);

  const scatterData = useMemo(() => {
    const xk = config.xAxisKey || columns[0];
    const yk = config.yAxisKeys[0] || columns[1];
    const zk = config.yAxisKeys[1] || columns[2];
    return chartData.map(d => ({
      x: Number(d[xk]) || 0,
      y: Number(d[yk]) || 0,
      z: Number(d[zk]) || 10,
      label: String(d[columns[0]] || ""),
    }));
  }, [chartData, config.xAxisKey, config.yAxisKeys, columns]);

  // ── Load from DB ──
  useEffect(() => {
    if (!databaseId) {
      setLoadedOnce(true);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${encodeURIComponent(databaseId)}/chart`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load chart (${res.status})`);
        }
        const json = await res.json();
        if (json.chart) {
          const c = json.chart;
          lastAppliedRemoteSnapshotRef.current = JSON.stringify(c);
          if (c.config)          setConfig(prev => ({ ...prev, ...c.config }));
          if (c.columns?.length) setColumns(c.columns);
          if (c.rows?.length)    setRows(c.rows);
        }
      } catch (e) {
        // Ignore cancellation during tab switches/unmounts.
        if ((e as Error).name !== "AbortError") {
          console.error("Load chart failed:", e);
        }
      }
      finally { setLoadedOnce(true); }
    };
    load();

    return () => controller.abort();
  }, [databaseId]);

  // Track local edits to avoid remote poll clobbering in-flight changes.
  useEffect(() => {
    if (!loadedOnce) return;
    lastLocalEditAtRef.current = Date.now();
  }, [config, columns, rows, loadedOnce]);

  // ── Live sync for collaborators (chart is not Yjs-backed yet) ──
  useEffect(() => {
    if (!databaseId || !loadedOnce) return;

    let cancelled = false;

    const poll = async () => {
      // If user is actively editing, skip this tick.
      if (Date.now() - lastLocalEditAtRef.current < 1000) {
        return;
      }

      try {
        const res = await fetch(`/api/databases/${encodeURIComponent(databaseId)}/chart`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const json = await res.json();
        const remote = json?.chart;
        if (!remote || cancelled) return;

        const snapshot = JSON.stringify(remote);
        if (snapshot === lastAppliedRemoteSnapshotRef.current) {
          return;
        }

        lastAppliedRemoteSnapshotRef.current = snapshot;
        if (remote.config) {
          setConfig(prev => ({ ...prev, ...remote.config }));
        }
        if (Array.isArray(remote.columns) && remote.columns.length) {
          setColumns(remote.columns);
        }
        if (Array.isArray(remote.rows)) {
          setRows(remote.rows);
        }
      } catch {
        // Ignore intermittent network errors in background polling.
      }
    };

    const t = setInterval(() => {
      void poll();
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [databaseId, loadedOnce]);

  // ── Auto-save ──
  const scheduleSave = useCallback(() => {
    if (!loadedOnce || !databaseId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    // Cancel the previous in-flight save so only the latest snapshot is persisted.
    if (saveAbortRef.current) {
      saveAbortRef.current.abort();
      saveAbortRef.current = null;
    }

    saveTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      saveAbortRef.current = controller;
      setSaving(true);
      try {
        const response = await fetch(`/api/databases/${encodeURIComponent(databaseId)}/chart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ chart: { config, columns, rows } }),
        });
        if (!response.ok) {
          throw new Error(`Failed to save chart (${response.status})`);
        }
        lastAppliedRemoteSnapshotRef.current = JSON.stringify({ config, columns, rows });
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) {
        const err = e as Error;
        if (err.name !== "AbortError" && err.message !== "Failed to fetch") {
          console.error("Save chart failed:", e);
        }
      }
      finally {
        if (saveAbortRef.current === controller) {
          saveAbortRef.current = null;
        }
        setSaving(false);
      }
    }, 2500);
  }, [loadedOnce, databaseId, config, columns, rows]);

  useEffect(() => { if (loadedOnce) scheduleSave(); }, [config, columns, rows, loadedOnce]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      if (saveAbortRef.current) {
        saveAbortRef.current.abort();
        saveAbortRef.current = null;
      }
    };
  }, []);

  // ── Fetch project databases for table linking ──
  useEffect(() => {
    if (!projectId || dataTab !== "table") return;
    const controller = new AbortController();

    const fetch_ = async () => {
      try {
        const r    = await fetch(`/api/databases?projectId=${encodeURIComponent(projectId)}`, {
          signal: controller.signal,
        });
        if (!r.ok) {
          throw new Error(`Failed to load databases (${r.status})`);
        }
        const data = await r.json();
        setLinkedDBs(Array.isArray(data) ? data.filter((d: LinkedDB) => d._id !== databaseId) : []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Load linkable databases failed:", e);
        }
      }
    };
    fetch_();

    return () => controller.abort();
  }, [projectId, dataTab, databaseId]);

  // ── Link table ──
  const loadFromTable = async (tableId: string) => {
    if (!tableId) return;

    setLoadingLink(true);
    setLinkError(null);
    try {
      const res  = await fetch(`/api/databases/${encodeURIComponent(tableId)}/tablerows`);
      if (!res.ok) {
        throw new Error(`Failed to fetch table rows (${res.status})`);
      }
      const json = await res.json();
      if (json.columns?.length && json.rows?.length) {
        setColumns(json.columns);
        setRows(json.rows);
        autoConfigAxes(json.columns, json.rows);
        setConfig(prev => ({ ...prev, linkedTableId: tableId }));
        setDataTab("manual");
      } else {
        setLinkError("No row data found in that database. Try importing CSV instead.");
      }
    } catch {
      setLinkError("Failed to fetch table data.");
    } finally {
      setLoadingLink(false);
    }
  };

  // ── Auto-configure axes ──
  const autoConfigAxes = (cols: string[], dataRows: (string | number)[][]) => {
    if (!cols.length || !dataRows.length) return;
    const isNum    = cols.map((_, ci) => dataRows.slice(0, 5).every(r => r[ci] !== "" && !isNaN(Number(r[ci]))));
    const firstStr = cols.find((_, i) => !isNum[i]) || cols[0];
    const numericCols = cols.filter((_, i) => isNum[i]);
    setConfig(prev => ({ ...prev, xAxisKey: firstStr, yAxisKeys: numericCols.slice(0, 4) }));
  };

  // ── CSV import ──
  const handleCSVText = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;
    const cols     = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const dataRows = lines.slice(1).map(line =>
      line.split(",").map(cell => {
        const v = cell.trim().replace(/^"|"$/g, "");
        return isNaN(Number(v)) || v === "" ? v : Number(v);
      })
    );
    setColumns(cols); setRows(dataRows);
    autoConfigAxes(cols, dataRows);
    setCsvText("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.name.endsWith(".csv") || file.type === "text/csv") {
      handleCSVText(await file.text());
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as (string | number)[][];
      if (data.length > 1) {
        const cols = data[0].map(String);
        const dataRows = data.slice(1);
        setColumns(cols); setRows(dataRows);
        autoConfigAxes(cols, dataRows);
      }
    } catch {
      alert("Excel import requires: npm install xlsx\nPlease import as CSV instead.");
    }
  };

  // ── Export ──
// const exportSVG = () => {
//   const wrapper = chartRef.current;
//   if (!wrapper) return;

//   const svg = wrapper.querySelector("svg");
//   if (!svg) return;

//   const clone = svg.cloneNode(true);

//   const width = wrapper.offsetWidth;
//   const height = wrapper.offsetHeight;

//   clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
//   clone.setAttribute("width", width);
//   clone.setAttribute("height", height);
//   clone.setAttribute("viewBox", `0 0 ${width} ${height}`);

//   // 🔥 Add background (important)
//   const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
//   bg.setAttribute("width", "100%");
//   bg.setAttribute("height", "100%");
//   bg.setAttribute("fill", "#0f172a"); // your dark bg
//   clone.insertBefore(bg, clone.firstChild);

//   const serializer = new XMLSerializer();
//   const svgString = serializer.serializeToString(clone);

//   const blob = new Blob([svgString], {
//     type: "image/svg+xml;charset=utf-8",
//   });

//   const url = URL.createObjectURL(blob);

//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `${config.title || "chart"}.svg`;
//   a.click();

//   URL.revokeObjectURL(url);
// };

  const exportCSV = () => {
    const lines = [columns.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${config.title.replace(/\s+/g, "_")}.csv`;
    a.click();
  };

  // ── Row / column helpers ──
  const addRow    = () => setRows(prev => [...prev, columns.map(() => "")]);
  const addCol    = () => { const name = `Col ${columns.length + 1}`; setColumns(prev => [...prev, name]); setRows(prev => prev.map(r => [...r, ""])); };
  const removeRow = (i: number) => setRows(prev => prev.filter((_, ri) => ri !== i));
  const removeCol = (i: number) => { setColumns(prev => prev.filter((_, ci) => ci !== i)); setRows(prev => prev.map(r => r.filter((_, ci) => ci !== i))); };
  const updateCell    = (ri: number, ci: number, val: string) => { const num = Number(val); setRows(prev => { const next = prev.map(r => [...r]); next[ri][ci] = isNaN(num) || val === "" ? val : num; return next; }); };
  const updateColName = (i: number, val: string) => { setColumns(prev => { const n = [...prev]; n[i] = val; return n; }); };
  const updCfg = useCallback(<K extends keyof ChartConfig>(key: K, val: ChartConfig[K]) => { setConfig(prev => ({ ...prev, [key]: val })); }, []);
  const chartRef=useRef(null);
  const switchChartType = (t: ChartType) => {
    const newData = TEMPLATE_DATA[t];
    updCfg("chartType", t);
    if (columns.length <= 2 && rows.length <= 5) {
      setColumns(newData.columns); setRows(newData.rows);
      autoConfigAxes(newData.columns, newData.rows);
    } else {
      autoConfigAxes(columns, rows);
    }
  };

  // ── Render chart ──
  // ✅ FIX: ResponsiveContainer now receives an explicit `height={chartHeight}`
  //    (measured in pixels via ResizeObserver) instead of height="100%".
  //    This prevents the Recharts SVG from computing an unbounded height and
  //    painting tick labels outside the clipping region of the page.
  const renderChart = () => {
    const {
      chartType, xAxisKey, yAxisKeys, colors, showLegend, showGrid, showTooltip,
      dataLabels, curved, stacked, fillOpacity, showDots, strokeWidth, borderRadius,
    } = config;

    const STROKE = "#374151";
    const TICK   = { fill: "#9ca3af", fontSize: 12 };
    const sharedProps = { margin: { top: 12, right: 20, left: 0, bottom: 4 } };

    const xAxis  = <XAxis dataKey={xAxisKey} tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false} />;
    const yAxis  = <YAxis tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false} width={48} />;
    const grid   = showGrid   ? <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" /> : null;
    const tip    = showTooltip ? (
      <Tooltip
        contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
        labelStyle={{ color: "#e5e7eb" }}
        itemStyle={{ color: "#d1d5db" }}
      />
    ) : null;
    const legend = showLegend ? <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} /> : null;

    // ── Column / Bar ──
    if (chartType === "column" || chartType === "bar") {
      const layout = chartType === "bar" ? "vertical" : "horizontal";
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout={layout} {...sharedProps}>
            {layout === "vertical"
              ? <><XAxis type="number" tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false} /><YAxis dataKey={xAxisKey} type="category" tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false} width={80} /></>
              : <>{xAxis}{yAxis}</>}
            {grid}{tip}{legend}
            {yAxisKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]}
                radius={[borderRadius, borderRadius, 0, 0]}
                stackId={stacked ? "stack" : undefined}>
                {dataLabels && <LabelList dataKey={key} position="top" style={{ fill: "#9ca3af", fontSize: 10 }} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ── Line ──
    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} {...sharedProps}>
            {xAxis}{yAxis}{grid}{tip}{legend}
            {yAxisKeys.map((key, i) => (
              <Line key={key} type={curved ? "monotone" : "linear"} dataKey={key}
                stroke={colors[i % colors.length]} strokeWidth={strokeWidth}
                dot={showDots ? { r: 3, fill: colors[i % colors.length] } : false}
                activeDot={{ r: 5 }}>
                {dataLabels && <LabelList dataKey={key} position="top" style={{ fill: "#9ca3af", fontSize: 10 }} />}
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // ── Area ──
    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} {...sharedProps}>
            <defs>
              {yAxisKeys.map((_, i) => (
                <linearGradient key={i} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={colors[i % colors.length]} stopOpacity={fillOpacity + 0.3} />
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {xAxis}{yAxis}{grid}{tip}{legend}
            {yAxisKeys.map((key, i) => (
              <Area key={key} type={curved ? "monotone" : "linear"} dataKey={key}
                stroke={colors[i % colors.length]} strokeWidth={strokeWidth}
                fill={`url(#ag${i})`}
                stackId={stacked ? "stack" : undefined} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // ── Pie ──
    if (chartType === "pie") {
      const RADIAN = Math.PI / 180;
      const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        return percent > 0.05 ? (
          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10}>
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        ) : null;
      };
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            {tip}{legend}
            <Pie data={pieData} cx="50%" cy="50%" outerRadius="70%" dataKey="value"
              label={dataLabels ? renderLabel : undefined} labelLine={false}>
              {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} stroke="none" />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // ── Scatter / Bubble ──
    if (chartType === "scatter" || chartType === "bubble") {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart {...sharedProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="x" type="number" name={config.xAxisKey} tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false}
              label={{ value: config.xAxisKey, position: "insideBottom", offset: -4, fill: "#6b7280", fontSize: 11 }} />
            <YAxis dataKey="y" type="number" name={config.yAxisKeys[0]} tick={TICK} axisLine={{ stroke: STROKE }} tickLine={false} width={48}
              label={{ value: config.yAxisKeys[0], angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }} />
            {chartType === "bubble" && <ZAxis dataKey="z" range={[30, 600]} name={config.yAxisKeys[1]} />}
            {tip}
            <Scatter data={scatterData} name={config.title}>
              {scatterData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.75} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // ── Panel button ──
  const PBtn = ({ id, label }: { id: typeof activePanel; label: string }) => (
    <button onClick={() => setActivePanel(id)}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${activePanel === id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
      {label}
    </button>
  );

  if (isInputActive) {
    return (
      // <div className="flex flex-col h-full rounded-xl border border-gray-800 bg-[#18191d] p-4 gap-3">
      //   <input
      //     readOnly
      //     value=""
      //     placeholder="Input..."
      //     aria-label="Input"
      //     title="Input"
      //     onClick={() => setInputActivated(true)}
      //     className="w-full rounded-lg border border-gray-700 bg-[#111317] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-400 outline-none"
      //   />

      //   {inputActivated && (
      //     <div className="rounded-lg border border-gray-700 bg-[#111317] p-4 text-sm text-gray-200">
      //       Input active
      //     </div>
      //   )}
      // </div>


       <div className="w-full bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 min-h-0">
          <div className="flex border-b border-gray-800 shrink-0">
            {(["manual", "import", "table"] as DataSource[]).map(t => (
              <button key={t} onClick={() => setDataTab(t)}
                className={`flex-1 py-2 text-[10px] font-semibold capitalize transition border-b-2 ${dataTab === t ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                {t === "manual" ? "✏️ Data" : t === "import" ? "📥 Import" : "🔗 Table"}
              </button>
            ))}
          </div>

          {/* ✅ FIX: `min-h-0` here so overflow-auto actually scrolls instead of expanding */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* Manual data table */}
            {dataTab === "manual" && (
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
  <table className="min-w-max w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="sticky top-0 bg-gray-850 z-10">
                      <th className="w-6 p-1 text-gray-600">#</th>
                      {columns.map((col, ci) => (
                        <th key={ci} className="p-0 border-b border-gray-800 group min-w-[60px]">
                          <div className="flex items-center">
                            <input value={col} onChange={e => updateColName(ci, e.target.value)}
                              className="w-full bg-transparent text-gray-300 font-semibold px-1.5 py-1 focus:outline-none focus:bg-gray-800 text-[10px]" />
                            <button onClick={() => removeCol(ci)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-400 transition shrink-0">
                              <X size={8} />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="p-1">
                        <button onClick={addCol} title="Add column"
                          className="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition">
                          <Plus size={9} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-gray-800/50 group">
                        <td className="p-1 text-gray-600 text-center">{ri + 1}</td>
                        {row.map((cell, ci) => (
                          <td key={ci} className="p-0 border-b border-gray-800/50">
                            <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                              className="w-full bg-transparent text-gray-300 px-1.5 py-1 focus:outline-none focus:bg-gray-800 text-[10px] min-w-0" />
                          </td>
                        ))}
                        <td className="p-0.5">
                          <button onClick={() => removeRow(ri)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-400 transition">
                            <X size={8} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="sticky bottom-0 p-2 bg-gray-900 border-t border-gray-800 flex gap-2">
                  <button onClick={addRow}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">
                    <Plus size={10} /> Add Row
                  </button>
                  <button onClick={() => autoConfigAxes(columns, rows)}
                    className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg transition" title="Auto-detect axes">
                    <RefreshCw size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* Import tab */}
            {dataTab === "import" && (
              <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-2">Upload File</p>
                  <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl cursor-pointer transition">
                    <Upload size={20} className="text-gray-500" />
                    <div className="text-center">
                      <p className="text-[11px] text-gray-400 font-medium">Drop CSV or Excel file</p>
                      <p className="text-[10px] text-gray-600">or click to browse</p>
                      <p className="text-[9px] text-gray-700 mt-1">.csv, .xlsx, .xls</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
                  </label>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-2">Paste CSV</p>
                  <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6}
                    placeholder={"Name,Value\nJan,400\nFeb,300"}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-mono rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-blue-500" />
                  <button onClick={() => handleCSVText(csvText)} disabled={!csvText.trim()}
                    className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] rounded-lg transition font-semibold">
                    Parse & Apply
                  </button>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-2.5 text-[10px] text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-400">Format:</p>
                  <p>• First row = column names</p>
                  <p>• Numeric values auto-detected</p>
                  <p>• Comma-separated values</p>
                  <p className="text-gray-600 mt-1">Excel: requires <code className="bg-gray-700 px-1 rounded">npm install xlsx</code></p>
                </div>
              </div>
            )}

            {/* Link table tab */}
            {dataTab === "table" && (
              <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
                <p className="text-[10px] text-gray-400 font-semibold">Select a table from this project</p>
                {linkError && (
                  <div className="bg-red-900/30 border border-red-700/40 rounded-lg p-2 text-[10px] text-red-400">{linkError}</div>
                )}
                {linkedDBs.length === 0 && (
                  <p className="text-[10px] text-gray-600 text-center py-6">No other databases found in this project.</p>
                )}
                {linkedDBs.map(db => (
                  <button key={db._id} onClick={() => loadFromTable(db._id)} disabled={loadingLink}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition text-left ${config.linkedTableId === db._id ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800"}`}>
                    <span className="text-lg">{db.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-white truncate">{db.name}</p>
                      <p className="text-[9px] text-gray-500">{db.viewType}</p>
                    </div>
                    {loadingLink && config.linkedTableId === db._id
                      ? <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                      : <Link2 size={12} className="text-gray-600 shrink-0" />}
                  </button>
                ))}
                <div className="bg-gray-800/50 rounded-xl p-2.5 text-[10px] text-gray-500 space-y-1 mt-2">
                  <p>Links to table-type databases in the same project and imports their row data.</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 px-3 py-2 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-600">{rows.length} rows · {columns.length} cols</span>
            {config.linkedTableId && (
              <span className="text-[9px] text-blue-400 flex items-center gap-1">
                <Link2 size={9} /> Linked
              </span>
            )}
          </div>
        </div>
    );
  }

  if(isShowData){
    return (
      <div className="flex flex-col h-full rounded-xl border border-gray-800 bg-[#18191d] p-4 gap-3">
        <div className="rounded-lg border border-gray-700 bg-[#111317] p-4 text-sm text-gray-200">
          Show data...
        </div>
      </div>
    );
  }
  return (
    // ✅ FIX: root div must be `overflow-hidden` so no child can paint outside it.
    <div className="flex flex-col h-full bg-transparent text-white overflow-y-auto rounded-xl">

      {/* ══ TOP BAR ══ */}
      <div className="flex justify-between items-center  gap-2 px-3 py-2 bg-transparent border-b border-gray-800 shrink-0">
         <div className="max-w-[420px] overflow-x-auto bg-gray-800 rounded-xl p-0.5 shrink-0">
          <div className="flex items-center gap-0.5 min-w-max">
          {CHART_TYPES.map(ct => (
            <button key={ct.type} onClick={() => switchChartType(ct.type)} title={ct.label}
              className={`w-[100px] shrink-0 flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${config.chartType === ct.type ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>
              <span className="text-sm">{ct.icon}</span>
              <span className="hidden sm:inline">{ct.label}</span>
            </button>
          ))}
          </div>
        </div>
        {/* <input value={config.title} onChange={e => updCfg("title", e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent hover:border-gray-600 focus:border-blue-500 px-1 py-0.5 transition" /> */}

       

        <div className="flex items-center gap-1 shrink-0">
          {saving  && <span className="text-[9px] text-amber-400 animate-pulse">● Saving</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
          <button onClick={() => exportChart(chartRef, config.title)} title="Export SVG"
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[11px] rounded-lg transition">
            <Download size={11} /> SVG
          </button>
         
          <button onClick={exportCSV} title="Export CSV"
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[11px] rounded-lg transition">
            <FileSpreadsheet size={11} /> CSV
          </button>

        </div>
      </div>

      {/* ✅ FIX: `min-h-0` on this row prevents it from pushing flex children
           beyond the parent's height, which is the root cause of the leaked
           axis tick numbers appearing below the card boundary. */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ══ LEFT: Data panel ══ */}
        {/* ✅ FIX: `min-h-0` added so the inner scroll area stays within bounds */}
        {/* <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 min-h-0"> */}
          {/* <div className="flex border-b border-gray-800 shrink-0">
            {(["manual", "import", "table"] as DataSource[]).map(t => (
              <button key={t} onClick={() => setDataTab(t)}
                className={`flex-1 py-2 text-[10px] font-semibold capitalize transition border-b-2 ${dataTab === t ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                {t === "manual" ? "✏️ Data" : t === "import" ? "📥 Import" : "🔗 Table"}
              </button>
            ))}
          </div> */}

          {/* ✅ FIX: `min-h-0` here so overflow-auto actually scrolls instead of expanding */}
          
        {/* </div> */}

        {/* ══ CENTER: Chart preview ══ */}
        {/* ✅ FIX: `min-h-0` and `min-w-0` ensure this flex child doesn't
             grow past the container — without these, Recharts' SVG can
             measure an unbounded offsetHeight and render ticks beyond the page. */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-950 min-w-0 min-h-0">

          {/* ✅ FIX: The chart wrapper uses `relative` + `overflow-hidden` so the
               Recharts SVG is hard-clipped. `ref={chartWrapperRef}` feeds real
               pixel height to `chartHeight` state → passed as explicit `height`
               prop to every `<ResponsiveContainer>`. */}
          <div
            ref={chartWrapperRef}
            className="flex-1 overflow-hidden relative min-h-0 p-4"
            style={{ backgroundColor: config.bgColor }}
          >
            <div ref={chartRef} className="absolute inset-4 overflow-hidden">
              {rows.length > 0 && columns.length > 0 ? (
                renderChart()
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                  <span className="text-5xl opacity-30">📊</span>
                  <p className="text-sm">No data yet — add rows or import a file</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-t border-gray-800 shrink-0 text-[10px] text-gray-600">
            <span>{config.chartType} chart · {rows.length} data points</span>
            <span>X: {config.xAxisKey} · Y: {config.yAxisKeys.join(", ")}</span>
          </div>
        </div>

        {/* ══ RIGHT: Settings panel ══ */}
        {/* ✅ FIX: `min-h-0` added so inner overflow-y-auto works correctly */}
         
        
          <div className="w-56 bg-gray-900 border-l border-gray-800 overflow-y-auto shrink-0 flex flex-col min-h-0">
       
          <div className="flex gap-0.5 p-1.5 border-b border-gray-800 shrink-0">
            <PBtn id="axes"      label="Axes" />
            <PBtn id="style"     label="Style" />
            <PBtn id="data_info" label="Info" />
          </div>
 
          <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
              
            {/* ── AXES panel ── */}
          
            
            {activePanel === "axes" && (
              <div className="space-y-3">
                <div>
                {config.chartType !== "pie" && config.chartType !== "scatter" && config.chartType !== "bubble" && (
                  <>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">X Axis (Category)</p>
                      <select value={config.xAxisKey} onChange={e => updCfg("xAxisKey", e.target.value)}
                        className="w-full h-7 text-[11px] bg-gray-800 border border-gray-700 text-white rounded-lg px-2 focus:outline-none focus:border-blue-500">
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Y Axis (Values)</p>
                      <div className="space-y-1">
                        {columns.filter(c => c !== config.xAxisKey).map(c => (
                          <label key={c} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox"
                              checked={config.yAxisKeys.includes(c)}
                              onChange={e => {
                                const keys = e.target.checked
                                  ? [...config.yAxisKeys, c]
                                  : config.yAxisKeys.filter(k => k !== c);
                                updCfg("yAxisKeys", keys.length ? keys : [c]);
                              }}
                              className="accent-blue-500" />
                            <span className="text-[11px] text-gray-300 truncate">{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(config.chartType === "scatter" || config.chartType === "bubble") && (
                  <>
                    {[["X Variable", "xAxisKey"], ["Y Variable (Y-Axis)", null], ["Z Variable (Size)", null]].map(([label, key], idx) => (
                      idx === 0 ? (
                        <div key={label as string}>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">{label}</p>
                          <select value={config.xAxisKey} onChange={e => updCfg("xAxisKey", e.target.value)}
                            className="w-full h-7 text-[11px] bg-gray-800 border border-gray-700 text-white rounded-lg px-2 focus:outline-none">
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div key={label as string}>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">{label}</p>
                          <select value={config.yAxisKeys[idx - 1] || ""}
                            onChange={e => { const keys = [...config.yAxisKeys]; keys[idx - 1] = e.target.value; updCfg("yAxisKeys", keys); }}
                            className="w-full h-7 text-[11px] bg-gray-800 border border-gray-700 text-white rounded-lg px-2 focus:outline-none">
                            <option value="">— none —</option>
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      )
                    ))}
                  </>
                )}

                {config.chartType === "pie" && (
                  <>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Label Column</p>
                      <select value={config.xAxisKey} onChange={e => updCfg("xAxisKey", e.target.value)}
                        className="w-full h-7 text-[11px] bg-gray-800 border border-gray-700 text-white rounded-lg px-2 focus:outline-none">
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Value Column</p>
                      <select value={config.yAxisKeys[0] || ""} onChange={e => updCfg("yAxisKeys", [e.target.value])}
                        className="w-full h-7 text-[11px] bg-gray-800 border border-gray-700 text-white rounded-lg px-2 focus:outline-none">
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
                </div>
               
           
           

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  {[
                    ["Legend",     "showLegend"],
                    ["Grid",       "showGrid"],
                    ["Tooltip",    "showTooltip"],
                    ["Data Labels","dataLabels"],
                    ...(["line", "area"].includes(config.chartType) ? [["Smooth Curves", "curved"], ["Show Dots", "showDots"]] : [] as any[]),
                    ...(["bar", "column", "area"].includes(config.chartType) ? [["Stacked", "stacked"]] : [] as any[]),
                  ].map(([label, key]) => (
                    <label key={key as string} className="flex items-center justify-between cursor-pointer">
                      <span className="text-[11px] text-gray-400">{label as string}</span>
                      <button onClick={() => updCfg(key as keyof ChartConfig, !(config as any)[key as string] as any)}
                        className={`w-9 h-5 rounded-full transition relative ${(config as any)[key as string] ? "bg-blue-600" : "bg-gray-700"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(config as any)[key as string] ? "left-4" : "left-0.5"}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── STYLE panel ── */}
            {activePanel === "style" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Color Palette</p>
                  <div className="space-y-1.5">
                    {PRESET_PALETTES.map(p => (
                      <button key={p.name} onClick={() => updCfg("colors", p.colors)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition">
                        <div className="flex gap-0.5">
                          {p.colors.slice(0, 5).map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Series Colors</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {config.colors.slice(0, 10).map((c, i) => (
                      <div key={i} className="relative group">
                        <input type="color" value={c}
                          onChange={e => { const next = [...config.colors]; next[i] = e.target.value; updCfg("colors", next); }}
                          className="w-8 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent p-0.5" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Chart Background</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.bgColor} onChange={e => updCfg("bgColor", e.target.value)}
                      className="w-10 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                    <div className="flex gap-1 flex-wrap">
                      {["#0f172a", "#111827", "#1e1b4b", "#ffffff", "#f8fafc"].map(bg => (
                        <button key={bg} onClick={() => updCfg("bgColor", bg)}
                          className={`w-6 h-6 rounded border transition ${config.bgColor === bg ? "border-blue-400" : "border-gray-700 hover:border-gray-500"}`}
                          style={{ backgroundColor: bg, boxShadow: bg === "#ffffff" ? "inset 0 0 0 1px #e5e7eb" : undefined }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {["line", "area"].includes(config.chartType) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-20 shrink-0">Stroke Width</span>
                      <input type="range" min={1} max={6} step={0.5} value={config.strokeWidth}
                        onChange={e => updCfg("strokeWidth", Number(e.target.value))}
                        className="flex-1 h-1 accent-blue-500" />
                      <span className="text-[10px] text-gray-500 w-4">{config.strokeWidth}</span>
                    </div>
                  )}
                  {config.chartType === "area" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-20 shrink-0">Fill Opacity</span>
                      <input type="range" min={0} max={1} step={0.05} value={config.fillOpacity}
                        onChange={e => updCfg("fillOpacity", Number(e.target.value))}
                        className="flex-1 h-1 accent-blue-500" />
                      <span className="text-[10px] text-gray-500 w-6">{(config.fillOpacity * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {["bar", "column"].includes(config.chartType) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-20 shrink-0">Bar Radius</span>
                      <input type="range" min={0} max={12} step={1} value={config.borderRadius}
                        onChange={e => updCfg("borderRadius", Number(e.target.value))}
                        className="flex-1 h-1 accent-blue-500" />
                      <span className="text-[10px] text-gray-500 w-4">{config.borderRadius}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DATA INFO panel ── */}
            {activePanel === "data_info" && (
              <div className="space-y-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">Dataset Statistics</p>
                <div className="space-y-2">
                  {config.yAxisKeys.map(key => {
                    const vals = rows.map(r => {
                      const ci = columns.indexOf(key);
                      return ci >= 0 ? Number(r[ci]) : 0;
                    }).filter(v => !isNaN(v));
                    const sum   = vals.reduce((a, b) => a + b, 0);
                    const avg   = vals.length ? sum / vals.length : 0;
                    const max   = vals.length ? Math.max(...vals) : 0;
                    const min   = vals.length ? Math.min(...vals) : 0;
                    const color = config.colors[config.yAxisKeys.indexOf(key) % config.colors.length];
                    return (
                      <div key={key} className="bg-gray-800 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[11px] font-semibold text-white truncate">{key}</span>
                        </div>
                        {[
                          ["Sum",   sum.toLocaleString(undefined, { maximumFractionDigits: 2 })],
                          ["Avg",   avg.toLocaleString(undefined, { maximumFractionDigits: 2 })],
                          ["Max",   max.toLocaleString()],
                          ["Min",   min.toLocaleString()],
                          ["Count", vals.length],
                        ].map(([label, val]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">{label}</span>
                            <span className="text-[10px] font-mono text-gray-300">{val}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {config.yAxisKeys.length === 0 && (
                    <p className="text-[11px] text-gray-600 text-center py-4">Select Y-axis columns to see stats.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}