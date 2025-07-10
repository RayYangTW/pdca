# 🎯 PDCA - AI 驅動的多代理開發系統

<p align="center">
  <a href="#"><img src="https://img.shields.io/npm/v/pdca.svg" alt="npm version"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
  <a href="#"><img src="https://img.shields.io/badge/AI-Claude%20%7C%20Gemini%20%7C%20OpenAI-green.svg" alt="AI Support"></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg" alt="node version"></a>
</p>

<p align="center">
  <b>使用 5 個 AI 代理並行實現 PDCA（Plan-Do-Check-Act）方法論的智能開發系統</b>
</p>

<p align="center">
  <a href="README.zh-TW.md">繁體中文</a> | <a href="README.en.md">English</a>
</p>

---

## ✨ 特色

- 🤖 **多 AI 引擎支援** - 自動檢測並使用 Claude CLI、Gemini CLI、OpenAI CLI
- 🔄 **真正的並行處理** - 5 個獨立 AI 實例同時工作
- 🎯 **PDCA 方法論** - Plan → Do → Check → Act 循環改進
- 📊 **即時監控** - 視覺化追蹤所有代理狀態
- 🔧 **一鍵安裝** - 自動處理所有依賴和配置
- 🌐 **跨平台支援** - macOS、Linux、WSL

## 🚀 快速開始

### 一行安裝

```bash
npm install -g pdca
```

### 立即使用

```bash
# 方式 1：CLI 直接啟動
pdca "實作使用者登入功能"

# 方式 2：在 Claude Code 中使用斜線指令（僅 Claude CLI）
claude
> /pdca:start

# 方式 3：查看系統狀態
pdca status

# 方式 4：指定 AI 引擎
pdca "任務描述" --engine gemini
```

## 📖 目錄

- [系統架構](#-系統架構)
- [安裝指南](#-安裝指南)
- [使用說明](#-使用說明)
- [AI 引擎支援](#-ai-引擎支援)
- [配置選項](#️-配置選項)
- [常見問題](#-常見問題)
- [貢獻指南](#-貢獻指南)

## 🏗️ 系統架構

### PDCA 代理角色

| 代理 | 職責 | 主要輸出 |
|------|------|----------|
| **Plan** | 需求分析、架構設計、任務規劃 | 執行計畫、技術方案、任務分解 |
| **Do** | 功能實作、程式碼開發、文檔撰寫 | 原始碼、測試程式、API 文檔 |
| **Check** | 品質檢查、測試執行、代碼審查 | 測試報告、問題清單、改進建議 |
| **Act** | 效能優化、程式重構、最佳實踐 | 優化程式碼、效能報告、重構方案 |
| **Knowledge** | 經驗記錄、知識管理、決策追蹤 | 決策記錄、最佳實踐、學習筆記 |

### 技術架構

```
PDCA System
├── AI Engine Layer          # AI 引擎適配層
│   ├── Claude Adapter       # Claude CLI 支援
│   ├── Gemini Adapter       # Gemini CLI 支援（推薦）
│   └── OpenAI Adapter       # OpenAI CLI 支援
├── Orchestration Layer      # 協調層
│   ├── Task Distributor     # 任務分配器
│   ├── Message Queue        # 訊息隊列
│   └── State Manager        # 狀態管理
├── Agent Layer             # 代理層
│   └── 5 × AI Instances    # 5 個並行 AI 實例
└── Monitoring Layer        # 監控層
    ├── TUI Dashboard       # 終端監控介面
    └── Activity Logger     # 活動日誌
```

## 🛠️ 技術特色

### 真正的多代理並行
- **tmux session**: 5 個獨立 Claude 實例同時運作
- **git worktree**: 代理工作空間完全隔離
- **實時 TUI**: 監控介面顯示所有代理狀態
- **智能通訊**: 文件系統協調代理間協作

### 職人級體驗
- **一鍵啟動**: 零配置即用
- **隨時介入**: 實時查看和指導任一代理
- **工匠品質**: 每個細節都追求完美
- **中文友好**: 主要介面使用中文，技術術語保持英文

## 📁 專案結構

```
pdca/
├── .claude/                    # Claude 配置
│   ├── commands/               # 斜線指令
│   │   └── pdca.md            # /pdca 指令定義
│   └── agents/                # 代理配置
├── .pdca-shokunin/            # PDCA-Shokunin 系統
│   ├── launcher.py            # 主啟動器
│   ├── monitor.py             # TUI 監控介面
│   ├── agents/                # 代理配置
│   ├── worktrees/             # git worktree 工作區
│   ├── communication/         # 代理間通訊
│   └── logs/                  # 系統日誌
├── memories/                  # 記憶庫
│   ├── decisions/             # 決策記錄
│   ├── solutions/             # 解決方案
│   ├── patterns/              # 設計模式
│   ├── learnings/             # 經驗教訓
│   └── progress/              # 進度追蹤
├── pdca_shokunin/             # Python 套件
├── setup.py                   # 套件安裝配置
└── README.md                  # 本文件
```

## 🎯 使用場景

### 軟體開發
```bash
pdca "建立 RESTful API"
pdca "優化資料庫性能" -p enterprise
pdca "設計微服務架榶" -p agile
```

### 系統分析
```bash
pdca "分析系統瓶頸" -v
pdca "設計擴展方案" -p startup
pdca "建立監控體系" -m
```

### 學習研究
```bash
pdca "學習 Kubernetes 部署" -p research
pdca "研究最新前端框架"
pdca "分析競品技術方案" -a 7
```

## ⚙️ 配置選項

### 全域配置

```yaml
# ~/.pdca/config.yaml
ai_engine:
  preferred: auto        # auto | gemini | claude | openai
  
agents:
  parallel_limit: 5      # 並行代理數量
  timeout: 300          # 超時時間（秒）
  
logging:
  level: info           # debug | info | warn | error
  file: ~/.pdca/pdca.log
```

### 專案配置

```yaml
# .pdca/project.yaml
project:
  name: "我的專案"
  description: "專案描述"
  
# 自定義代理提示詞
agents:
  plan:
    prompt: "你是資深架構師，擅長..."
  do:
    prompt: "你是全端工程師，精通..."
```

## ❓ 常見問題

### Q: 沒有 Claude CLI 怎麼辦？

A: 系統會自動使用 Gemini CLI（免費且功能完整）：
```bash
# 安裝 Gemini CLI
npm install -g @google/gemini-cli
gemini auth  # 使用 Google 帳號
```

### Q: 如何查看代理執行過程？

A: 使用 tmux 連接：
```bash
tmux attach -t pdca
# 使用 Ctrl+B 加數字鍵切換視窗
```

### Q: 系統卡住了怎麼辦？

A: 執行診斷和重啟：
```bash
pdca doctor          # 診斷問題
pdca stop --force    # 強制停止
pdca clean          # 清理狀態
```

### Q: 支援 Windows 嗎？

A: 支援 WSL（Windows Subsystem for Linux）：
1. 安裝 WSL2
2. 在 WSL 中安裝 Node.js 和 tmux
3. 按照 Linux 步驟安裝 PDCA

## 🤝 貢獻指南

歡迎貢獻！請查看 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 開發環境

```bash
# Clone 專案
git clone https://github.com/RayYangTW/pdca
cd pdca

# 安裝依賴
npm install

# 開發模式
npm run dev

# 構建
npm run build

# 測試
npm test
```

## 📚 技術參考

### 相關專案
- [Claude Squad](https://github.com/smtg-ai/claude-squad) - 多 AI 終端管理
- [Claude Flow](https://github.com/ruvnet/claude-flow) - AI 群體協調平台
- [VibeTunnel](https://github.com/amantus-ai/vibetunnel) - 遠端終端監控

### 核心依賴
- [tmux](https://github.com/tmux/tmux) - 終端多路復用
- [blessed](https://github.com/chjj/blessed) - 終端 UI
- [commander](https://github.com/tj/commander.js) - CLI 框架

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE)

## 🙏 致謝

- [Anthropic](https://anthropic.com) - Claude CLI
- [Google](https://cloud.google.com/gemini) - Gemini CLI
- 所有貢獻者和使用者

---

<p align="center">
  Made with ❤️ by the PDCA Community
</p>

<p align="center">
  <a href="https://github.com/RayYangTW/pdca/issues">回報問題</a> •
  <a href="https://github.com/RayYangTW/pdca/discussions">討論區</a> •
  <a href="https://github.com/RayYangTW/pdca/wiki">Wiki</a>
</p>