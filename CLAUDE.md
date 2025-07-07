# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 專案概述

**Raiy-PDCA** 是一個靈活的多代理協調系統，使用 5 個獨立的 Claude CLI 實例並行實現 PDCA（Plan-Do-Check-Act）方法論。系統支援多種風格配置，預設使用「職人精神」風格，追求極致簡潔、工匠品質和優雅體驗。

## 🛠️ 常用指令

### 系統執行（TypeScript 版本）
```bash
# 方式一：使用 -s 參數啟動（預設職人模式，推薦）
pdca -s "你的任務描述"

# 方式二：透過 Claude CLI 斜線指令
/pdca "你的任務描述"

# 管理指令
pdca status                    # 查看運行狀態
pdca stop                      # 停止系統
pdca init                      # 初始化專案

# 監控執行中的代理
tmux attach -t raiy-pdca
```

### 開發工具（可選）
```bash
# 如需開發或修改系統，可安裝開發工具
pip install black flake8 pytest

# 格式化程式碼
black .

# 執行 linter
flake8 .
```

**注意**：本系統已升級為 TypeScript 版本，採用「職人精神」設計。使用 `pdca -s` 指令即可啟動 5 個並行的 Claude 實例。

### tmux 操作快捷鍵
- **Ctrl+B 1-5**: 切換到代理視窗（plan/do/check/act/knowledge）
- **Ctrl+B 6**: 切換到監控視窗
- **Ctrl+B d**: 分離 session（背景執行）

## 🏗️ 系統架構

### 多代理系統
系統並行啟動 5 個獨立的 Claude CLI 實例：
1. **pdca-plan**: 需求分析、策略制定、任務協調
2. **pdca-do**: 架構設計、功能實作、代碼開發
3. **pdca-check**: 品質驗證、測試檢查、結果評估
4. **pdca-act**: 性能優化、問題改善、持續改進
5. **knowledge-agent**: 智能監聽、分類歸檔、經驗累積

### 核心技術
- **tmux**: 管理並行代理 sessions
- **git worktree**: 為每個代理提供隔離工作空間（在 git repo 中時）
- **檔案系統 IPC**: 代理透過 `.raiy-pdca/communication/` 通訊
- **TUI 監控**: 即時狀態監控介面 `.raiy-pdca/monitor.py`

### 目錄結構
```
.raiy-pdca/             # 核心系統（包含啟動器和監控）
├── launcher.py         # 主要進入點 - 創建 tmux、啟動代理
├── monitor.py          # TUI 監控介面 - 實時顯示代理狀態
├── agents/             # 代理配置（執行時建立）
├── worktrees/          # 隔離的 git 工作空間（執行時建立）
├── communication/      # 代理間訊息傳遞（執行時建立）
└── logs/               # 系統日誌（執行時建立）

memories/               # 知識庫
├── decisions/          # 決策記錄
├── solutions/          # 解決方案
├── patterns/           # 設計模式
├── learnings/          # 經驗教訓
└── progress/           # 進度追蹤

pdca_shokunin/          # Python 套件目錄（舊版本遺留，不影響運行）
```

## 🎯 開發準則

### 語言與溝通
- **主要語言**: 中文用於使用者介面和文檔
- **技術術語**: 保持英文（如 API、REST、tmux）
- **註解**: 中文說明 WHY/HOW，技術術語保留英文

### 程式碼風格
- **Python**: 遵循 PEP 8，公開函式加上 type hints
- **格式化**: 使用 `black`（在 pyproject.toml 中配置）
- **Linting**: 使用 `flake8`（無設定檔，使用預設值）

### Git 工作流程
- **原子化提交**: 每次只改一個功能
- **提交訊息**: 遵循格式 `[YYYYMMDD] type: 描述`
- **禁止詞彙**: 絕不在提交中使用 AI/Claude/Generated/Bot

### 測試策略
- 目前專案中無測試檔案
- 新增測試時使用 `pytest` 框架
- 測試放在 `tests/` 目錄或程式碼旁的 `test_*.py`

## ⚠️ 重要提醒

1. **系統特性**: 本系統為直接執行架構，無需安裝套件
2. **依賴需求**: Python 3.8+、tmux、git、Claude CLI
3. **Claude CLI 權限**: 已配置允許 Python 和檔案操作（.claude/settings.local.json）
4. **執行方式**: 使用 `/pdca` 斜線指令或直接執行 `.raiy-pdca/launcher.py`
5. **中文優先**: 所有使用者介面內容應優先使用中文

## 🚀 快速任務

### 新增功能
1. 啟動 PDCA 系統：`/pdca "新增功能 X"`
2. 監控進度：`tmux attach -t raiy-pdca`
3. 代理會自動協調工作

### 除錯問題
1. 檢查代理日誌：`.raiy-pdca/logs/`
2. 查看通訊內容：`.raiy-pdca/communication/`
3. 使用監控介面查看即時狀態

### 知識管理
- 決策記錄放在 `memories/decisions/`
- 解決方案放在 `memories/solutions/`
- 設計模式放在 `memories/patterns/`
- 所有記憶檔案應使用 Markdown 格式並以中文撰寫

## 🔄 記憶系統規範（強制）

### 記憶檔案結構
1. **長期記憶**：`memories/long_term/`，檔名格式 `YYYYMMDD_<slug>.md`
2. **短期記憶**：`memories/short_term/last_session.md`

### 讀取流程（每次對話開始時）
1. 載入 `last_session.md`
2. 拼接必要的長期記憶背景
3. 生成上下文摘要

### 寫入規則
- **重要業務決策** → 新增至 `memories/long_term/`
- **流程中的臨時狀態** → 更新 `memories/short_term/last_session.md`

### 同步提醒
- 完成重要工作後，在回覆結尾加上 `🔄` 提醒記憶檔案待同步
- 同步順序：`CLAUDE.md` → `docs/` → `memories/`

## 🔴 Git 提交規範（必須遵守）

### 重要提醒
**每次完成一段工作後必須進行 git commit**。這是強制性要求，不可省略。

### 提交檢查清單
在完成任何功能修改後：
1. 執行 `git status` 查看變更
2. 執行 `git add .` 加入變更
3. 使用正確格式提交：`[YYYYMMDD] type: 描述`
4. 確保無禁用詞彙（AI、Claude、Generated 等）
5. 提交訊息長度 ≤ 50 字元

### 提交時機
- ✅ 完成一個功能模組後
- ✅ 修正一個錯誤後
- ✅ 更新配置檔案後
- ✅ 重構程式碼後
- ❌ 不要累積過多變更才提交

### 範例
```bash
git add .
git commit -m "[20250707] feat: 實作多風格配置系統"
```