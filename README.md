# 🎌 PDCA-Shokunin Multi-Agent System

> **職人級多代理協調系統** - 中文為主，英文為輔的極致 PDCA 體驗

## 🚀 快速開始

### 方式一：npm 全局安裝（推薦）
```bash
# 安裝
npm install -g pdca-shokunin

# 在專案中初始化
pdca-shokunin init

# 啟動系統
pdca-shokunin "建立用戶登入系統"
```

### 方式二：Shell 腳本安裝
```bash
# 使用 curl
curl -sL https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh | bash

# 或使用 wget
wget -qO- https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh | bash
```

### 安裝後使用
```bash
# 方式一：使用 -s 參數啟動 Shokunin 模式（推薦）
pdca -s "建立用戶登入系統"

# 方式二：在 Claude CLI 中使用斜線指令
/pdca "建立用戶登入系統"

# 快速管理指令
pdca status                    # 查看運行狀態
pdca stop                      # 停止系統
pdca init                      # 初始化專案
```

**特色**：本系統採用「職人精神」設計，現已全面升級為 TypeScript 版本，支援 `pdca -s` 指令格式。詳細說明請參考 [INSTALLATION.md](./INSTALLATION.md)。

### 查看狀態
```bash
# 連接到 tmux session
tmux attach -t pdca-shokunin

# 查看所有窗口
tmux list-windows -t pdca-shokunin
```

## 🎭 系統架構

### PDCA 循環代理
- 🎯 **pdca-plan**: Plan 階段協調者 - 需求分析、策略制定、任務協調
- 🎨 **pdca-do**: Do 階段執行者 - 架構設計、功能實作、代碼開發
- 🔍 **pdca-check**: Check 階段驗證者 - 品質驗證、測試檢查、結果評估
- 🚀 **pdca-act**: Act 階段改善者 - 性能優化、問題改善、持續改進

### 知識管理代理
- 📝 **knowledge-agent**: 專職記錄和知識管理 - 智能監聽、分類歸檔、經驗累積

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
raiy-pdca-shokunin/
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
/pdca "建立 RESTful API"
/pdca "優化資料庫性能"
/pdca "設計微服務架構"
```

### 系統分析
```bash
/pdca "分析系統瓶頸"
/pdca "設計擴展方案"
/pdca "建立監控體系"
```

### 學習研究
```bash
/pdca "學習 Kubernetes 部署"
/pdca "研究最新前端框架"
/pdca "分析競品技術方案"
```

## 🔧 環境需求

### 必要依賴
- Python 3.8+
- tmux
- git
- Claude Code CLI

### 使用步驟（無需安裝）
```bash
# 1. 克隆專案
git clone <repository-url>
cd raiy-pdca-shokunin

# 2. 直接使用（零配置）
/pdca "測試任務"
# 或
python3 .pdca-shokunin/launcher.py "測試任務"
```

**注意**：`pdca_shokunin/` 目錄是舊版本套件，保留僅為相容性考慮。實際系統運行完全依賴 `.pdca-shokunin/` 目錄中的啟動器。

## 💡 操作指引

### tmux 快捷鍵
- **Ctrl+B 1-5**: 直接切換到對應代理窗口
- **Ctrl+B 6**: 切換到監控窗口
- **Ctrl+B d**: 分離 session (背景運行)
- **Ctrl+B ?**: 顯示 tmux 幫助

### 監控介面操作
- **↑/↓**: 切換選中的代理
- **Enter**: 切換到選中代理的 tmux 窗口
- **Space**: 查看選中代理的詳細資訊
- **R**: 重新載入任務和狀態
- **Q**: 退出監控介面

## 🎌 職人哲學

### 設計原則
- **極致簡潔**: 一個指令解決所有問題
- **工匠品質**: 每個細節都精雕細琢
- **使用者導向**: 連新手都能立即上手
- **持續改進**: 永遠追求更好的解決方案

### 品質承諾
- **永遠簡單**: 不管加什麼功能，使用都是一個指令
- **永不出錯**: 任何環境任何情況都能優雅工作
- **極致性能**: 啟動快、運行流暢、資源消耗最小
- **完美體驗**: 介面、功能、文檔都是藝術品級別

---

**PDCA-Shokunin**: 中文的溫度，技術的深度，職人的態度！