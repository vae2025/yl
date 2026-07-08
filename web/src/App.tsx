import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import {
  exportUrl,
  getResult,
  getTaskStatus,
  getTrend,
  runTask,
  type Platform,
  type ProductItem,
  type TaskStatus,
  type TrendResponse
} from "./api";

type RunState = {
  taskId: string;
  status: TaskStatus["status"];
};

const platformLabels: Record<Platform, string> = {
  jd: "京东",
  taobao: "淘宝",
  pdd: "拼多多",
  demo: "演示数据"
};

function classNames(...xs: Array<string | false | undefined | null>): string {
  return xs.filter(Boolean).join(" ");
}

export default function App() {
  const [keyword, setKeyword] = useState("充电宝");
  const [demoMode, setDemoMode] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>(["demo"]);
  const [limit, setLimit] = useState(20);
  const [concurrency, setConcurrency] = useState(3);

  const [runState, setRunState] = useState<RunState | null>(null);
  const [logs, setLogs] = useState<TaskStatus["logs"]>([]);
  const [result, setResult] = useState<{ keyword: string; items: ProductItem[]; summary: any } | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInst = useRef<echarts.ECharts | null>(null);

  const canRun = keyword.trim().length > 0 && (!runState || runState.status !== "running");

  const visiblePlatforms = useMemo<Platform[]>(() => {
    if (demoMode) return ["demo"];
    return ["jd", "taobao", "pdd"];
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) setPlatforms(["demo"]);
    else setPlatforms((prev) => prev.filter((p) => p !== "demo"));
  }, [demoMode]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInst.current = echarts.init(chartRef.current);
    const onResize = () => chartInst.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chartInst.current?.dispose();
      chartInst.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInst.current) return;
    const series = (trend?.series || []).map((s) => ({
      name: s.title,
      type: "line" as const,
      showSymbol: false,
      smooth: true,
      data: s.points.map((p) => [p.ts, p.value])
    }));
    chartInst.current.setOption({
      backgroundColor: "transparent",
      textStyle: { color: "#e5e7eb" },
      tooltip: { trigger: "axis" },
      legend: { type: "scroll", textStyle: { color: "#9ca3af" } },
      grid: { left: 42, right: 16, top: 36, bottom: 28 },
      xAxis: {
        type: "time",
        axisLabel: { color: "#9ca3af" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } }
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#9ca3af" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } }
      },
      series
    });
  }, [trend]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, []);

  async function start() {
    setError(null);
    setResult(null);
    setTrend(null);
    setLogs([]);
    try {
      const res = await runTask({
        keyword: keyword.trim(),
        platforms: demoMode ? ["demo"] : platforms,
        limitPerPlatform: limit,
        concurrency,
        demoMode
      });
      setRunState({ taskId: res.taskId, status: "queued" });
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(async () => {
        try {
          const st = await getTaskStatus(res.taskId);
          setRunState({ taskId: st.taskId, status: st.status });
          setLogs(st.logs);
          if (st.status === "succeeded") {
            window.clearInterval(pollingRef.current!);
            pollingRef.current = null;
            const r = await getResult(st.taskId);
            setResult(r);
            const t = await getTrend(st.taskId);
            setTrend(t);
          }
          if (st.status === "failed") {
            window.clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setError(st.error || "任务失败");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
        }
      }, 700);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      return [...prev, p];
    });
  }

  const items = result?.items || [];
  const recommendedSet = useMemo(() => new Set(result?.summary?.recommendedIds || []), [result]);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <header className="flex items-end justify-between gap-6">
            <div>
              <div className="text-sm font-mono text-slate-400">PRICE COMPARE / DEMO</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">电商商品价格自动化采集与对比</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                输入关键词后触发一次采集（默认演示数据模式）。结果会清洗去重并按价格排序，给出性价比推荐与历史趋势。
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <a
                className={classNames(
                  "rounded-full border border-line bg-white/5 px-4 py-2 text-sm",
                  "hover:bg-white/10 transition"
                )}
                href="https://example.com/"
                target="_blank"
                rel="noreferrer"
              >
                使用说明
              </a>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-line bg-white/5 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="text-sm font-mono text-slate-300">INPUT</div>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                  />
                  演示数据模式（不访问外网）
                </label>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-slate-400">关键词</label>
                    <input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-accent/60"
                      placeholder="例如：充电宝 / iPhone 15 / 机械键盘"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400">每平台条数</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none focus:border-accent/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400">并发</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={concurrency}
                      onChange={(e) => setConcurrency(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none focus:border-accent/60"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-mono text-slate-400">平台</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visiblePlatforms.map((p) => {
                      const active = platforms.includes(p) || (demoMode && p === "demo");
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => (!demoMode ? togglePlatform(p) : null)}
                          className={classNames(
                            "rounded-full border px-3 py-1.5 text-xs font-mono transition",
                            active ? "border-accent/60 bg-accent/10 text-green-200" : "border-line bg-white/5 text-slate-300",
                            demoMode ? "cursor-not-allowed opacity-80" : "hover:bg-white/10"
                          )}
                        >
                          {platformLabels[p]}
                        </button>
                      );
                    })}
                  </div>
                  {!demoMode && platforms.length === 0 ? (
                    <div className="mt-2 text-xs text-amber-200">至少选择一个平台。</div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!canRun || (!demoMode && platforms.length === 0)}
                    onClick={start}
                    className={classNames(
                      "rounded-xl px-4 py-3 text-sm font-semibold transition",
                      "bg-accent text-ink hover:bg-green-300",
                      (!canRun || (!demoMode && platforms.length === 0)) && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {runState?.status === "running" ? "运行中…" : "开始采集与对比"}
                  </button>
                  {runState ? (
                    <div className="text-xs font-mono text-slate-400">
                      task={runState.taskId.slice(0, 8)} status={runState.status}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">建议先使用演示数据验证流程，再启用真实平台。</div>
                  )}
                </div>

                {error ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white/5 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="text-sm font-mono text-slate-300">LOG</div>
                <div className="text-xs font-mono text-slate-500">{logs.length} lines</div>
              </div>
              <div className="h-[290px] overflow-auto px-5 py-4 font-mono text-xs leading-6">
                {logs.length === 0 ? (
                  <div className="text-slate-500">等待运行…</div>
                ) : (
                  logs.map((l, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-slate-500">{l.ts.slice(11, 19)}</span>
                      <span
                        className={classNames(
                          l.level === "error" && "text-red-300",
                          l.level === "warn" && "text-amber-200",
                          l.level === "info" && "text-slate-200"
                        )}
                      >
                        {l.level.toUpperCase()}
                      </span>
                      <span className="text-slate-300">{l.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-line bg-white/5 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="text-sm font-mono text-slate-300">COMPARE</div>
                {runState && result ? (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <a className="rounded-full border border-line bg-white/5 px-3 py-1 hover:bg-white/10" href={exportUrl(runState.taskId, "json")}>
                      JSON
                    </a>
                    <a className="rounded-full border border-line bg-white/5 px-3 py-1 hover:bg-white/10" href={exportUrl(runState.taskId, "csv")}>
                      CSV
                    </a>
                    <a className="rounded-full border border-line bg-white/5 px-3 py-1 hover:bg-white/10" href={exportUrl(runState.taskId, "html")}>
                      HTML 报告
                    </a>
                  </div>
                ) : null}
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-panel/95 backdrop-blur">
                    <tr className="text-xs font-mono text-slate-400">
                      <th className="px-4 py-3">平台</th>
                      <th className="px-4 py-3">商品</th>
                      <th className="px-4 py-3">价格</th>
                      <th className="px-4 py-3">销量</th>
                      <th className="px-4 py-3">店铺评分</th>
                      <th className="px-4 py-3">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={6}>
                          暂无数据
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => {
                        const rec = recommendedSet.has(it.id);
                        const low = (it.tags || []).includes("最低价");
                        return (
                          <tr
                            key={it.id}
                            className={classNames(
                              "border-t border-line",
                              rec && "bg-accent/10",
                              !rec && low && "bg-amber-500/10"
                            )}
                          >
                            <td className="px-4 py-3 text-slate-200">{platformLabels[it.platform]}</td>
                            <td className="px-4 py-3">
                              <a className="text-accent2 hover:underline" href={it.url} target="_blank" rel="noreferrer">
                                {it.title}
                              </a>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-100">¥{it.price.toFixed(2)}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{it.sales ?? "-"}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{it.shop_rating ?? "-"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {(it.tags || []).map((t) => (
                                  <span
                                    key={t}
                                    className={classNames(
                                      "rounded-full border px-2 py-0.5 text-xs font-mono",
                                      t === "推荐" && "border-accent/60 bg-accent/10 text-green-200",
                                      t === "最低价" && "border-amber-300/40 bg-amber-500/10 text-amber-100",
                                      t !== "推荐" && t !== "最低价" && "border-line bg-white/5 text-slate-200"
                                    )}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white/5 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="text-sm font-mono text-slate-300">TREND</div>
                <div className="text-xs font-mono text-slate-500">
                  {trend?.series?.length ? `${trend.series.length} series` : "no data"}
                </div>
              </div>
              <div className="p-4">
                <div ref={chartRef} className="h-[420px] w-full" />
                <div className="mt-3 text-xs text-slate-400">
                  趋势来自 SQLite 历史库：同关键词多次运行会累积时间序列。
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
