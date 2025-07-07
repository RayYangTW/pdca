---
allowed-tools: Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash(npm run:*), Bash(git:*), Bash(python:*), Bash(node:*), Bash(cat:*), Bash(echo:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*)
description: PDCA 標準模式 - 開發權限，限制系統操作
---

# 🟡 PDCA 標準模式執行

## 載入任務
當前任務：!`cat .pdca/current-task.txt 2>/dev/null || echo "未找到任務檔案"`

## ⚖️ 標準模式權限
**此模式提供平衡的開發權限，適合大部分開發任務**

### ✅ 允許的操作
- 檔案讀取、編輯和創建
- Git 版本控制操作
- 執行測試和建置腳本
- 程式碼格式化和 linting
- 基本檔案系統操作
- Python/Node.js 腳本執行

### ❌ 禁止的操作
- 系統級命令（sudo、chmod）
- 套件安裝（npm install、pip install）
- 刪除操作（rm -rf）
- 網路下載或上傳
- 修改系統配置

### ⚠️ 受限制的操作
- 某些 bash 命令需要明確許可
- 敏感檔案操作會提示確認

## 📋 執行前檢查
- **環境狀態**：!`pwd`
- **Git 狀態**：!`git status --short 2>/dev/null || echo "非 Git 專案"`
- **任務複雜度**：開發和實作任務
- **風險等級**：🟡 中等風險
- **建議用途**：功能開發、程式碼重構、測試撰寫

## 🔧 權限配置生成

正在為標準模式生成 Claude 權限配置...

!`cat > .pdca/standard-permissions.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Read",
      "Write", 
      "Edit",
      "MultiEdit",
      "Grep",
      "Glob",
      "LS",
      "Bash(npm run:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(python:*)",
      "Bash(node:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(mkdir:*)",
      "Bash(cp:*)",
      "Bash(mv:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(chmod:*)",
      "Bash(npm install:*)",
      "Bash(pip install:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "WebFetch"
    ]
  }
}
EOF`

## 🚀 啟動 PDCA 系統（標準模式）

正在以標準模式啟動 5 個 PDCA 代理...

**系統配置**：
- 權限級別：開發權限（標準）
- 代理模式：實作優先
- 輸出方式：直接執行 + 報告

### 代理啟動序列

🎯 **Plan 代理（規劃師）**
- 角色：需求分析和技術規劃
- 權限：讀取 + 基本檔案操作
- 能力：創建規劃文檔、分析現有程式碼

🎨 **Do 代理（執行者）**  
- 角色：程式碼實作和開發
- 權限：完整編輯權限
- 能力：編寫程式碼、創建檔案、執行測試

🔍 **Check 代理（檢查員）**
- 角色：品質保證和測試
- 權限：讀取 + 測試執行
- 能力：運行測試、程式碼審查、格式檢查

🚀 **Act 代理（改善者）**
- 角色：重構和優化
- 權限：編輯 + Git 操作
- 能力：程式碼重構、性能優化、版本控制

📝 **Knowledge 代理（知識管理）**
- 角色：文檔和知識管理
- 權限：讀寫文檔
- 能力：更新文檔、記錄決策、知識歸檔

---

## 🎯 執行參數

**啟動指令**：
!`pdca "$(cat .pdca/current-task.txt)" --security standard --agents 5`

**配置參數**：
- `--security standard`: 使用標準安全配置
- `--agents 5`: 啟動 5 個代理
- `--config .pdca/standard-permissions.json`: 權限配置檔
- `--tmux-session pdca-standard`: 自定義 session 名稱

---

## 📊 執行能力範圍

標準模式下，PDCA 系統可以：

1. **程式碼開發**：創建、修改、重構程式碼
2. **測試執行**：運行單元測試、整合測試
3. **版本控制**：Git 提交、分支操作
4. **檔案管理**：組織專案結構
5. **文檔維護**：更新 README、註解

**無法執行**：
- 安裝新的依賴套件
- 修改系統配置
- 執行危險的刪除操作
- 存取外部網路資源

---

## 💡 安全提醒

⚠️ **使用標準模式時請注意**：

1. **代理可以修改您的檔案**，請確保有備份
2. **Git 操作會實際執行**，建議在新分支上工作
3. **測試可能會執行**，確保測試環境安全
4. **如有疑慮**，可以隨時切換到安全模式：`/pdca:safe`

---

## 📝 執行記錄

- **執行時間**：!`date '+%Y-%m-%d %H:%M:%S'`
- **模式**：🟡 標準模式
- **任務狀態**：執行中
- **權限配置**：已生成標準權限檔

!`echo "🟡 標準模式 - $(date '+%Y-%m-%d %H:%M:%S') - $(cat .pdca/current-task.txt)" >> .pdca/execution-log.txt`

**系統正在以標準權限執行您的任務，可以進行檔案修改和開發操作...**