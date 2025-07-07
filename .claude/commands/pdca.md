---
allowed-tools: Read, Grep, Glob, LS, Write, Bash(echo:*), Bash(cat:*), Bash(pwd:*), Bash(git status:*), Bash(ls:*), Bash(test:*)
description: PDCA 多代理系統 - 智能安全評估與啟動
---

# 🔒 PDCA 多代理系統 - 任務：$ARGUMENTS

## 🔍 第一階段：任務分析與安全評估

### 保存當前任務
!`echo "$ARGUMENTS" > .pdca/current-task.txt`

### 📋 環境分析
- **當前目錄**：!`pwd`
- **Git 狀態**：!`git status --short 2>/dev/null || echo "❌ 非 Git 專案"`
- **專案類型**：!`[ -f package.json ] && echo "✅ Node.js 專案" || [ -f requirements.txt ] && echo "✅ Python 專案" || [ -f Cargo.toml ] && echo "✅ Rust 專案" || echo "❓ 未知類型"`
- **現有配置**：!`[ -f .pdca/config.yaml ] && echo "✅ 已有 PDCA 配置" || echo "⚪ 首次使用"`

### 🛡️ 智能安全評估

正在分析任務「**$ARGUMENTS**」的風險等級和所需權限...

#### 🎯 任務複雜度分析

**基於關鍵詞的初步評估**：

- **高風險關鍵詞檢測**：
  - 系統操作：`rm`, `delete`, `install`, `deploy`, `configure`
  - 網路操作：`fetch`, `download`, `upload`, `API`, `database`
  - 權限操作：`sudo`, `chmod`, `permission`, `admin`

- **中風險關鍵詞檢測**：
  - 檔案操作：`create`, `modify`, `update`, `edit`, `write`
  - 程式碼操作：`refactor`, `implement`, `build`, `test`

- **低風險關鍵詞檢測**：
  - 分析操作：`analyze`, `review`, `read`, `check`, `audit`
  - 文檔操作：`document`, `explain`, `comment`

### 📊 自動風險評估結果

基於以上分析，我推薦以下執行方式：

---

## 🎨 第二階段：選擇執行模式

### 🟢 安全模式（推薦用於分析任務）
**權限範圍**：只讀分析，無修改權限
- ✅ 可以：程式碼審查、架構分析、文檔生成
- ❌ 不可：檔案修改、執行命令、安裝套件

**使用方式**：
```
/pdca:safe
```

### 🟡 標準模式（推薦用於開發任務）
**權限範圍**：開發權限，限制系統操作
- ✅ 可以：檔案編輯、測試執行、Git 操作
- ✅ 可以：npm/pip 腳本、程式碼格式化
- ❌ 不可：系統命令、套件安裝、刪除操作

**使用方式**：
```
/pdca:standard
```

### 🔴 專家模式（需要特別謹慎）
**權限範圍**：完全權限，高風險
- ✅ 可以：所有檔案操作、系統命令
- ✅ 可以：套件安裝、環境配置
- ⚠️  風險：可能造成不可逆變更

**使用方式**：
```
/pdca:expert
```

### 🔧 自定義模式
**權限範圍**：手動配置所需權限
- 適合特殊需求的精確控制

**使用方式**：
```
/pdca:custom
```

---

## 💡 智能建議

**根據您的任務分析，我建議**：

如果您的任務包含「分析」、「審查」、「理解」等關鍵詞，建議使用 **🟢 安全模式**。

如果您的任務包含「實作」、「修改」、「建立」等關鍵詞，建議使用 **🟡 標準模式**。

如果您的任務需要「部署」、「安裝」、「配置」系統，請謹慎考慮使用 **🔴 專家模式**。

---

## 📝 任務記錄

- **任務內容**：$ARGUMENTS
- **分析時間**：!`date '+%Y-%m-%d %H:%M:%S'`
- **建議模式**：待用戶選擇
- **狀態檔案**：已保存至 `.pdca/current-task.txt`

---

## 🚀 下一步

請選擇上述任一模式來執行您的 PDCA 多代理任務。每個模式都經過精心設計，以在功能性和安全性之間取得最佳平衡。

**記住**：您隨時可以從較安全的模式開始，如果需要更多權限，再切換到其他模式。