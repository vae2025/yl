from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from .models import ProductItem
from .storage import TrendSeries


def export_json(path: Path, *, keyword: str, items: list[ProductItem], recommended_ids: list[str]) -> None:
    payload = {
        "keyword": keyword,
        "items": [it.__dict__ for it in items],
        "summary": {
            "total": len(items),
            "lowestPrice": min([it.price for it in items], default=None),
            "recommendedIds": recommended_ids,
        },
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def export_csv(path: Path, *, items: list[ProductItem]) -> None:
    fieldnames = ["platform", "title", "price", "sales", "shop_rating", "url", "fetched_at", "score", "tags"]
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for it in items:
            row = {
                "platform": it.platform,
                "title": it.title,
                "price": it.price,
                "sales": it.sales,
                "shop_rating": it.shop_rating,
                "url": it.url,
                "fetched_at": it.fetched_at,
                "score": it.score,
                "tags": ",".join(it.tags),
            }
            w.writerow(row)


def export_html_report(
    path: Path,
    *,
    keyword: str,
    items: list[ProductItem],
    recommended_ids: list[str],
    trend: list[TrendSeries],
) -> None:
    def to_trend_obj() -> list[dict[str, Any]]:
        out = []
        for s in trend:
            out.append(
                {
                    "productId": s.product_id,
                    "title": s.title,
                    "points": [{"ts": p.ts, "value": p.value} for p in s.points],
                }
            )
        return out

    data = {
        "keyword": keyword,
        "items": [it.__dict__ for it in items],
        "summary": {
            "total": len(items),
            "lowestPrice": min([it.price for it in items], default=None),
            "recommendedIds": recommended_ids,
        },
        "trend": to_trend_obj(),
    }
    payload = json.dumps(data, ensure_ascii=False)
    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>比价报告：{keyword}</title>
  <style>
    :root {{
      --bg: #0b0f16;
      --panel: #111827;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --accent: #22c55e;
      --warn: #f59e0b;
      --line: rgba(255,255,255,0.08);
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }}
    body {{
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans SC", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: radial-gradient(1200px 600px at 20% 0%, rgba(34,197,94,0.10), transparent 50%), var(--bg);
      color: var(--text);
    }}
    header {{
      padding: 28px 28px 14px;
      border-bottom: 1px solid var(--line);
    }}
    h1 {{
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.2px;
    }}
    .meta {{
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
      font-family: var(--mono);
    }}
    main {{
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 16px;
      padding: 16px 28px 28px;
    }}
    .card {{
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
    }}
    .card .hd {{
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }}
    .card .hd .t {{
      font-size: 13px;
      color: var(--muted);
      font-family: var(--mono);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }}
    th {{
      position: sticky;
      top: 0;
      background: rgba(17,24,39,0.95);
      text-align: left;
      font-size: 12px;
      color: var(--muted);
      font-family: var(--mono);
      z-index: 2;
    }}
    td a {{
      color: #93c5fd;
      text-decoration: none;
    }}
    td a:hover {{
      text-decoration: underline;
    }}
    .pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      color: var(--text);
      margin-right: 6px;
      margin-bottom: 4px;
    }}
    .pill.rec {{
      border-color: rgba(34,197,94,0.40);
      background: rgba(34,197,94,0.12);
      color: #bbf7d0;
    }}
    .pill.low {{
      border-color: rgba(245,158,11,0.45);
      background: rgba(245,158,11,0.12);
      color: #fde68a;
    }}
    #chart {{
      width: 100%;
      height: 420px;
    }}
    .side {{
      display: grid;
      gap: 16px;
      align-content: start;
    }}
    .kpi {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 12px 14px 14px;
    }}
    .k {{
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 10px 12px;
      background: rgba(0,0,0,0.14);
    }}
    .k .n {{
      font-size: 12px;
      color: var(--muted);
      font-family: var(--mono);
    }}
    .k .v {{
      margin-top: 10px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }}
    .foot {{
      padding: 10px 14px 14px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px solid var(--line);
      font-family: var(--mono);
    }}
    @media (max-width: 980px) {{
      main {{ grid-template-columns: 1fr; }}
    }}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <header>
    <h1>比价报告：{keyword}</h1>
    <div class="meta">items={len(items)} recommended={len(recommended_ids)}</div>
  </header>
  <main>
    <section class="card">
      <div class="hd">
        <div class="t">横向对比（价格从低到高）</div>
      </div>
      <div style="max-height: 520px; overflow: auto;">
        <table>
          <thead>
            <tr>
              <th>平台</th>
              <th>商品</th>
              <th>价格</th>
              <th>销量</th>
              <th>店铺评分</th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>
    <aside class="side">
      <section class="card">
        <div class="hd">
          <div class="t">概览</div>
        </div>
        <div class="kpi">
          <div class="k">
            <div class="n">最低价</div>
            <div class="v" id="kpiLowest">-</div>
          </div>
          <div class="k">
            <div class="n">候选数</div>
            <div class="v" id="kpiTotal">-</div>
          </div>
        </div>
        <div class="foot">提示：平台页面结构可能变化；采集失败时建议使用演示数据模式。</div>
      </section>
      <section class="card">
        <div class="hd">
          <div class="t">价格趋势（历史）</div>
        </div>
        <div id="chart"></div>
      </section>
    </aside>
  </main>

  <script>
    const data = {payload};
    const tbody = document.getElementById('rows');
    document.getElementById('kpiTotal').textContent = data.summary.total;
    document.getElementById('kpiLowest').textContent = data.summary.lowestPrice == null ? '-' : '¥' + data.summary.lowestPrice.toFixed(2);

    for (const it of data.items) {{
      const tr = document.createElement('tr');
      const title = document.createElement('a');
      title.href = it.url;
      title.target = '_blank';
      title.rel = 'noreferrer';
      title.textContent = it.title;
      const tagTd = document.createElement('td');
      for (const t of (it.tags || [])) {{
        const s = document.createElement('span');
        s.className = 'pill ' + (t === '推荐' ? 'rec' : (t === '最低价' ? 'low' : ''));
        s.textContent = t;
        tagTd.appendChild(s);
      }}
      tr.innerHTML = `
        <td>${{it.platform}}</td>
        <td></td>
        <td>¥${{Number(it.price).toFixed(2)}}</td>
        <td>${{it.sales == null ? '-' : it.sales}}</td>
        <td>${{it.shop_rating == null ? '-' : it.shop_rating}}</td>
      `;
      tr.children[1].appendChild(title);
      tr.appendChild(tagTd);
      tbody.appendChild(tr);
    }}

    const el = document.getElementById('chart');
    const chart = echarts.init(el);
    const series = (data.trend || []).map(s => {{
      return {{
        name: s.title,
        type: 'line',
        showSymbol: false,
        smooth: true,
        data: (s.points || []).map(p => [p.ts, p.value]),
      }};
    }});
    chart.setOption({{
      backgroundColor: 'transparent',
      textStyle: {{ color: '#e5e7eb' }},
      tooltip: {{ trigger: 'axis' }},
      legend: {{
        type: 'scroll',
        textStyle: {{ color: '#9ca3af' }},
      }},
      grid: {{ left: 40, right: 20, top: 40, bottom: 30 }},
      xAxis: {{
        type: 'time',
        axisLabel: {{ color: '#9ca3af' }},
        splitLine: {{ lineStyle: {{ color: 'rgba(255,255,255,0.06)' }} }},
      }},
      yAxis: {{
        type: 'value',
        axisLabel: {{ color: '#9ca3af' }},
        splitLine: {{ lineStyle: {{ color: 'rgba(255,255,255,0.06)' }} }},
      }},
      series,
    }});
    window.addEventListener('resize', () => chart.resize());
  </script>
</body>
</html>
"""
    path.write_text(html, encoding="utf-8")
