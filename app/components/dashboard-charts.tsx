"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

import type { CountRow } from "@/lib/admin-types";

const PIE_COLORS = [
  "#f97fb3", "#3b82f6", "#22c55e", "#f59e0b",
  "#8b5cf6", "#14b8a6", "#ef4444", "#94a3b8",
];
const DONE_COLOR = "#22c55e";
const PENDING_COLOR = "#94a3b8";
const PIC_COLOR = "#f97fb3";

/* Tema (ikut class "dark" di <html>) */

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function useIsDark() {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

function themeColors(isDark: boolean) {
  return isDark
    ? { text: "#e5e7eb", muted: "#9ca3af", line: "#374151", tipBg: "#1f2937", tipBorder: "#374151" }
    : { text: "#111827", muted: "#6b7280", line: "#e5e7eb", tipBg: "#ffffff", tipBorder: "#e5e7eb" };
}

/** Nama dari data pengguna masuk ke HTML tooltip, jadi harus di-escape. */
function esc(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

/* Wrapper ECharts */

function EChart({ option, className }: { option: EChartsOption; className?: string }) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={elRef} className={className} />;
}

/* Kartu dan bagian kecil */

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="py-6 text-center text-sm text-muted">Belum ada data.</p>;
}

function ChartSummary({ firstLabel, rows }: { firstLabel: string; rows: CountRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          <th className="py-1.5 font-medium">{firstLabel}</th>
          <th className="py-1.5 text-right font-medium">Selesai</th>
          <th className="py-1.5 text-right font-medium">Total</th>
          <th className="py-1.5 text-right font-medium">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-border last:border-b-0">
            <td className="py-1.5">{row.label}</td>
            <td className="py-1.5 text-right tabular-nums">{row.done}</td>
            <td className="py-1.5 text-right tabular-nums">{row.total}</td>
            <td className="py-1.5 text-right tabular-nums text-muted">
              {row.total ? Math.round((row.done / row.total) * 100) : 0}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Opsi chart */

type TooltipItem = { name?: string; seriesName?: string; value?: unknown; marker?: string; data?: unknown };

function baseAxes(labels: string[], t: ReturnType<typeof themeColors>) {
  return {
    grid: { left: 8, right: 12, top: 40, bottom: 8, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: t.line } },
      axisLabel: {
        color: t.muted,
        interval: 0,
        width: 80,
        overflow: "truncate" as const,
      },
    },
    yAxis: {
      type: "value" as const,
      minInterval: 1,
      axisLabel: { color: t.muted },
      splitLine: { lineStyle: { color: t.line, type: "dashed" as const } },
    },
  };
}

function tooltipBase(t: ReturnType<typeof themeColors>) {
  return {
    backgroundColor: t.tipBg,
    borderColor: t.tipBorder,
    textStyle: { color: t.text, fontSize: 12 },
    extraCssText: "box-shadow: 0 4px 16px rgba(0,0,0,.15); border-radius: 8px;",
  };
}

function jenisOption(rows: CountRow[], isDark: boolean): EChartsOption {
  const t = themeColors(isDark);
  const axes = baseAxes(rows.map((r) => r.label), t);

  return {
    ...axes,
    legend: {
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: t.muted },
    },
    tooltip: {
      ...tooltipBase(t),
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,.12)" } },
      formatter: (params: unknown) => {
        const items = params as TooltipItem[];
        const total = items.reduce((n, p) => n + Number(p.value ?? 0), 0);
        const done = Number(items.find((p) => p.seriesName === "Selesai")?.value ?? 0);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const lines = items
          .map(
            (p) =>
              `<div style="display:flex;justify-content:space-between;gap:16px">` +
              `<span>${p.marker ?? ""}${esc(p.seriesName)}</span><b>${esc(p.value)}</b></div>`,
          )
          .join("");
        return (
          `<div style="font-weight:600;margin-bottom:4px">${esc(items[0]?.name)}</div>${lines}` +
          `<div style="margin-top:4px;padding-top:4px;border-top:1px solid ${t.tipBorder};` +
          `display:flex;justify-content:space-between;gap:16px"><span>Total</span>` +
          `<b>${total} (${pct}% selesai)</b></div>`
        );
      },
    },
    series: [
      {
        name: "Selesai",
        type: "bar",
        stack: "total",
        barMaxWidth: 48,
        data: rows.map((r) => r.done),
        itemStyle: { color: DONE_COLOR, borderRadius: [6, 6, 0, 0], borderColor: t.tipBg, borderWidth: 2 },
        label: {
          show: true,
          color: "#fff",
          fontSize: 11,
          formatter: (p: { value?: unknown }) => (Number(p.value) > 0 ? String(p.value) : ""),
        },
        emphasis: {
          focus: "series",
          itemStyle: { shadowBlur: 14, shadowColor: "rgba(34,197,94,.55)" },
        },
      },
      {
        name: "Belum selesai",
        type: "bar",
        stack: "total",
        barMaxWidth: 48,
        data: rows.map((r) => r.total - r.done),
        itemStyle: { color: PENDING_COLOR, borderRadius: [6, 6, 0, 0], borderColor: t.tipBg, borderWidth: 2 },
        label: {
          show: true,
          color: "#fff",
          fontSize: 11,
          formatter: (p: { value?: unknown }) => (Number(p.value) > 0 ? String(p.value) : ""),
        },
        emphasis: {
          focus: "series",
          itemStyle: { shadowBlur: 14, shadowColor: "rgba(148,163,184,.55)" },
        },
      },
    ],
  };
}

function picOption(rows: CountRow[], isDark: boolean): EChartsOption {
  const t = themeColors(isDark);
  const axes = baseAxes(rows.map((r) => r.label), t);

  return {
    ...axes,
    grid: { ...axes.grid, top: 24 },
    tooltip: {
      ...tooltipBase(t),
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,.12)" } },
      formatter: (params: unknown) => {
        const item = (params as TooltipItem[])[0];
        const data = item?.data as { value: number; total: number } | undefined;
        const done = data?.value ?? 0;
        const total = data?.total ?? 0;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return (
          `<div style="font-weight:600;margin-bottom:4px">${esc(item?.name)}</div>` +
          `<div style="display:flex;justify-content:space-between;gap:16px">` +
          `<span>${item?.marker ?? ""}Selesai</span><b>${done}</b></div>` +
          `<div style="display:flex;justify-content:space-between;gap:16px">` +
          `<span>Total konten</span><b>${total}</b></div>` +
          `<div style="display:flex;justify-content:space-between;gap:16px">` +
          `<span>Persentase</span><b>${pct}%</b></div>`
        );
      },
    },
    series: [
      {
        name: "Selesai",
        type: "bar",
        barMaxWidth: 48,
        showBackground: true,
        backgroundStyle: { color: isDark ? "rgba(148,163,184,.08)" : "rgba(148,163,184,.12)", borderRadius: [6, 6, 0, 0] },
        data: rows.map((r) => ({ value: r.done, total: r.total })),
        itemStyle: { color: PIC_COLOR, borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: "top", color: t.muted, fontSize: 11 },
        emphasis: {
          itemStyle: { color: "#f45a9d", shadowBlur: 16, shadowColor: "rgba(249,127,179,.6)" },
        },
      },
    ],
  };
}

function pieOption(rows: CountRow[], isDark: boolean): EChartsOption {
  const t = themeColors(isDark);

  return {
    color: PIE_COLORS,
    tooltip: {
      ...tooltipBase(t),
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name?: string; value?: number; percent?: number; marker?: string };
        return (
          `<div style="font-weight:600;margin-bottom:4px">${esc(p.name)}</div>` +
          `<div style="display:flex;justify-content:space-between;gap:16px">` +
          `<span>${p.marker ?? ""}Konten</span><b>${p.value} (${Math.round(p.percent ?? 0)}%)</b></div>`
        );
      },
    },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: t.muted },
    },
    series: [
      {
        name: "Jenis konten",
        type: "pie",
        radius: ["45%", "68%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: t.tipBg, borderWidth: 2 },
        label: { show: false, position: "center" },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: { shadowBlur: 18, shadowColor: "rgba(0,0,0,.25)" },
          label: {
            show: true,
            color: t.text,
            fontSize: 16,
            fontWeight: "bold",
            formatter: "{b}\n{d}%",
          },
        },
        labelLine: { show: false },
        data: rows.map((r) => ({ name: r.label, value: r.total })),
      },
    ],
  };
}

/* Dashboard */

export function DashboardCharts({
  byJenis,
  byPic,
}: {
  byJenis: CountRow[];
  byPic: CountRow[];
}) {
  const isDark = useIsDark();

  const jenis = useMemo(() => jenisOption(byJenis, isDark), [byJenis, isDark]);
  const pie = useMemo(() => pieOption(byJenis, isDark), [byJenis, isDark]);
  const pic = useMemo(() => picOption(byPic, isDark), [byPic, isDark]);

  const hasJenisTotal = byJenis.some((r) => r.total > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card
        title="Realisasi produksi per jenis konten"
        // description="Tinggi bar = total konten, bagian hijau = yang sudah selesai. Arahkan kursor untuk detail."
      >
        {byJenis.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            <EChart option={jenis} className="h-72 w-full" />
            <ChartSummary firstLabel="Jenis" rows={byJenis} />
          </div>
        )}
      </Card>

      <Card
        title="Proporsi jenis konten"
        // description="Persentase dari total konten. Arahkan kursor ke potongan untuk detail."
      >
        {hasJenisTotal ? <EChart option={pie} className="h-80 w-full" /> : <Empty />}
      </Card>

      <Card
        title="Produktivitas tim"
        // description="Jumlah konten yang berstatus selesai per PIC. Arahkan kursor untuk melihat total dan persentasenya."
      >
        {byPic.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            <EChart option={pic} className="h-72 w-full" />
            <ChartSummary firstLabel="PIC" rows={byPic} />
          </div>
        )}
      </Card>
    </div>
  );
}