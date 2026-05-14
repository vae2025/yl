# 电商商品价格自动化采集与对比（CLI + 演示网页）

本项目提供一个可直接运行的“价格采集→清洗去重→横向对比→趋势沉淀→导出报告”的工具链：
- CLI：适合批量跑关键词、落盘 CSV/JSON/HTML 报告
- 演示网页：输入关键词后现场触发一次采集并展示结果（默认演示数据模式）

## 目录结构
- [price_compare](file:///workspace/price_compare)：核心采集/清洗/入库/导出逻辑（Python）
- [server](file:///workspace/server)：FastAPI 演示后端（任务运行、结果与导出接口）
- [web](file:///workspace/web)：React 演示前端（输入关键词、日志、对比表、趋势图）
- [outputs](file:///workspace/outputs)：运行后生成的 SQLite、导出文件与任务产物（自动创建）

## 快速开始（推荐：演示数据模式）

### 1) 安装后端依赖

```bash
python -m pip install -r requirements.txt
```

### 2) CLI 跑一次（演示数据）

```bash
python -m price_compare --keyword 充电宝 --demo --export all --out outputs
```

会生成：
- `outputs/<keyword>.json`
- `outputs/<keyword>.csv`
- `outputs/<keyword>.report.html`
- `outputs/price_compare.sqlite3`（历史库，多次运行会形成趋势）

### 3) 启动演示后端

```bash
uvicorn server.app:app --host 0.0.0.0 --port 8000
```

### 4) 启动演示前端

```bash
cd web
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

浏览器打开 Vite 提示的地址，输入关键词即可运行。

## 真实平台采集说明（京东/淘宝/拼多多）

项目内提供了基于 Playwright 的“搜索页抓取”适配器（`jd/taobao/pdd`），但实际可用性会受到平台反爬、登录、验证码、页面结构变更等影响。

如需启用：

```bash
python -m pip install playwright
playwright install chromium
python -m price_compare --keyword iPhone --platforms jd,taobao,pdd --export html
```

建议优先使用平台官方/授权 API 或企业合规数据源；在实际环境中请遵守平台条款与 robots 协议。
