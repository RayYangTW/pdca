# 🎌 PDCA-Shokunin Project Context

**專案名稱**: raiy-pdca-shokunin  
**版本**: 3.0 (職人版)  
**最後更新**: 2025-07-06  
**狀態**: 系統建構完成，待測試

## 📋 專案概要

PDCA-Shokunin 是一個**職人級多代理協調系統**，實現真正的 AI 多代理並行協作。系統採用 PDCA 循環方法論，由 5 個獨立的 Claude 實例組成，透過 tmux 和文件系統進行協調。

### 核心特色
- **真正的多代理並行**：5 個獨立 Claude CLI 實例同時運作
- **職人精神**：極致簡潔、工匠品質、一鍵啟動
- **PDCA + Knowledge**：4 個 PDCA 循環代理 + 1 個知識管理代理
- **中文為主**：介面中文友好，技術術語保持英文

## 🏗️ 系統架構

### 代理配置
1. **🎯 pdca-plan**: Plan 階段協調者 - 需求分析、策略制定、任務協調
2. **🎨 pdca-do**: Do 階段執行者 - 架構設計、功能實作、代碼開發
3. **🔍 pdca-check**: Check 階段驗證者 - 品質驗證、測試檢查、結果評估
4. **🚀 pdca-act**: Act 階段改善者 - 性能優化、問題改善、持續改進
5. **📝 knowledge-agent**: 知識管理代理 - 智能監聽、分類歸檔、經驗累積

### 技術架構
- **tmux session 管理**：`pdca-shokunin` session 包含 6 個窗口（5 代理 + 1 監控）
- **git worktree 隔離**：每個代理有獨立工作目錄（如果在 git repo 中）
- **文件系統通訊**：透過 `.pdca-shokunin/communication/` 協調
- **TUI 監控介面**：實時顯示所有代理狀態和進度

## 🔑 關鍵決策

### 1. PDCA vs PDCA-R 命名
- **問題**：Record Agent 不是 PDCA 原生概念
- **決策**：系統命名為 `PDCA-Shokunin`，不強調 R
- **實作**：Knowledge Agent 作為獨立支援代理，不是 PDCA 循環成員

### 2. 真實多代理 vs 角色扮演
- **問題**：最初誤解為 prompt 生成器
- **決策**：實現真正的多代理系統，5 個獨立 Claude 實例
- **理由**：用戶明確要求「真正的多代理套件」，不是角色扮演

### 3. 中文介面設計
- **問題**：初版設計了日文風格 TUI
- **決策**：中文為主，英文為輔，技術術語保持英文
- **理由**：主要用戶群體為中文/英文使用者

### 4. 職人版定位
- **核心**：追求極致簡潔和工匠品質
- **標準**：「連傻子都會用」的設計哲學
- **承諾**：一個指令搞定所有事

## 📁 專案結構

```
raiy-pdca-shokunin/
├── .claude/                    # Claude 配置
│   ├── commands/               
│   │   └── pdca.md            # /pdca 斜線指令定義
│   └── agents/                # 代理配置（目前為空目錄）
├── .pdca-shokunin/            # 核心系統
│   ├── launcher.py            # 主啟動器（創建 tmux、啟動代理）
│   ├── monitor.py             # TUI 監控介面
│   ├── agents/                # 代理配置
│   ├── worktrees/             # git worktree 工作區
│   ├── communication/         # 代理間通訊
│   └── logs/                  # 系統日誌
├── memories/                  # 記憶庫（標準 PDCA 分類）
├── pdca_shokunin/             # Python 套件（舊版本，保留相容性）
├── docs/                      # 文檔
├── setup.py                   # Python 套件配置
└── README.md                  # 使用說明
```

## 🚀 使用方式

### 基本使用
```bash
# 在 Claude CLI 中使用斜線指令
/pdca "建立用戶登入系統"

# 或直接執行啟動器
python3 .pdca-shokunin/launcher.py "任務描述"
```

### 系統管理
```bash
# 連接到 tmux session
tmux attach -t pdca-shokunin

# 查看所有代理窗口
tmux list-windows -t pdca-shokunin

# 切換到特定代理（Ctrl+B 然後按數字）
Ctrl+B 1  # pdca-plan
Ctrl+B 2  # pdca-do
Ctrl+B 3  # pdca-check
Ctrl+B 4  # pdca-act
Ctrl+B 5  # knowledge-agent
Ctrl+B 6  # monitor
```

## ⚠️ 已知問題

1. **git worktree 失敗**：如果不在 git repo 中，會顯示警告但不影響運作
2. **Claude 實例啟動**：需要有效的 Claude CLI 環境
3. **tmux 依賴**：系統需要安裝 tmux

## 🎯 下一步計劃

1. **測試完整流程**：在真實環境測試多代理協作
2. **優化通訊機制**：改進代理間的訊息傳遞
3. **增強監控介面**：加入更多實時狀態資訊
4. **文檔完善**：補充更多使用案例和最佳實踐

## 📝 重要提醒

- 專案位置：`/Users/rayyang/Raiy_Workspace/00_Raiy/dev/raiy-pdca-shokunin/`
- 不是在 `/raiy-pdca/` 目錄（那是另一個專案）
- 系統已清理，只保留核心檔案
- tmux session 名稱：`pdca-shokunin`
- 斜線指令：`/pdca`

## 🔄 最近變更

### 2025-07-06
- 重新設計為 PDCA + Knowledge Agent 架構
- 實現真正的多代理並行系統
- 建立 tmux + 文件系統協調機制
- 創建 TUI 監控介面
- 清理專案目錄，移除所有非核心檔案
- 更新 README.md 為職人版說明

---

**Context 準備完成**：系統已建構完成，所有核心功能就緒，等待測試驗證。