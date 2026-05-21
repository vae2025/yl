export type Platform = "jd" | "taobao" | "pdd" | "demo";

export type RunRequest = {
  keyword: string;
  platforms: Platform[];
  limitPerPlatform: number;
  concurrency: number;
  demoMode: boolean;
};

export type RunResponse = { taskId: string };

export type LogEvent = { ts: string; level: "info" | "warn" | "error"; message: string };

export type TaskStatus = {
  taskId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  logs: LogEvent[];
  error?: string | null;
};

export type ProductItem = {
  id: string;
  platform: Platform;
  title: string;
  price: number;
  sales?: number | null;
  shop_rating?: number | null;
  url: string;
  fetched_at: string;
  score?: number | null;
  tags?: string[];
};

export type ResultResponse = {
  keyword: string;
  items: ProductItem[];
  summary: { total: number; lowestPrice: number | null; recommendedIds: string[] };
};

export type TrendResponse = {
  keyword: string;
  series: { productId: string; title: string; points: { ts: string; value: number }[] }[];
};

const API_BASE = "/pcapi";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

export async function runTask(req: RunRequest): Promise<RunResponse> {
  const q = new URLSearchParams();
  q.set("keyword", req.keyword);
  q.set("platforms", req.platforms.join(","));
  q.set("limitPerPlatform", String(req.limitPerPlatform));
  q.set("concurrency", String(req.concurrency));
  q.set("demoMode", req.demoMode ? "1" : "0");
  return http<RunResponse>(`${API_BASE}/run?${q.toString()}`);
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  return http<TaskStatus>(`${API_BASE}/task/${taskId}`);
}

export async function getResult(taskId: string): Promise<ResultResponse> {
  return http<ResultResponse>(`${API_BASE}/task/${taskId}/result`);
}

export async function getTrend(taskId: string): Promise<TrendResponse> {
  return http<TrendResponse>(`${API_BASE}/task/${taskId}/trend`);
}

export function exportUrl(taskId: string, format: "json" | "csv" | "html"): string {
  return `${API_BASE}/task/${taskId}/export?format=${format}`;
}
