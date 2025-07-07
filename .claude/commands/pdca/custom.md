---
allowed-tools: Read, Write, Grep, Glob, LS, Bash(echo:*), Bash(cat:*)
description: PDCA 自定義模式 - 手動配置權限
---

# 🔧 PDCA 自定義權限模式

## 載入任務
當前任務：!`cat .pdca/current-task.txt 2>/dev/null || echo "未找到任務檔案"`

## 🎛️ 自定義權限配置

### 權限配置精靈

自定義模式允許您精確控制每個代理的權限範圍。請根據任務需求選擇所需的權限組合。

### 📋 可用權限類別

#### 🔍 檔案操作權限
- **Read**: 讀取檔案內容
- **Write**: 創建新檔案
- **Edit**: 修改現有檔案
- **MultiEdit**: 批量修改多個檔案
- **LS**: 列出目錄內容
- **Glob**: 檔案模式匹配
- **Grep**: 內容搜尋

#### 💻 系統操作權限
- **Bash(git:\*)**: Git 版本控制操作
- **Bash(npm run:\*)**: NPM 腳本執行
- **Bash(python:\*)**: Python 腳本執行
- **Bash(node:\*)**: Node.js 腳本執行
- **Bash(cat:\*)**: 檔案內容查看
- **Bash(echo:\*)**: 文字輸出
- **Bash(mkdir:\*)**: 創建目錄

#### 🌐 網路操作權限
- **WebFetch**: 網路請求（高風險）

#### ⚠️ 危險操作權限
- **Bash(rm:\*)**: 檔案刪除（極高風險）
- **Bash(sudo:\*)**: 管理員權限（極高風險）
- **Bash(npm install:\*)**: 套件安裝（中高風險）

## 🎯 預設配置模板

### 模板 1: 檔案編輯專用
適用於：程式碼修改、文檔更新
```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "MultiEdit", 
      "Grep", "Glob", "LS",
      "Bash(git add:*)", "Bash(git commit:*)",
      "Bash(echo:*)", "Bash(cat:*)"
    ]
  }
}
```

### 模板 2: 測試執行專用
適用於：執行測試、檢查程式碼品質
```json
{
  "permissions": {
    "allow": [
      "Read", "Grep", "Glob", "LS",
      "Bash(npm run test:*)",
      "Bash(npm run lint:*)",
      "Bash(python -m pytest:*)",
      "Bash(git status:*)"
    ]
  }
}
```

### 模板 3: 分析專用
適用於：程式碼分析、架構審查
```json
{
  "permissions": {
    "allow": [
      "Read", "Grep", "Glob", "LS",
      "Bash(cat:*)", "Bash(echo:*)"
    ]
  }
}
```

## ⚙️ 互動式配置

### 第一步：選擇基礎模板
請告訴我您的任務主要涉及哪些操作：

1. **檔案修改** - 需要編輯程式碼或文檔
2. **測試執行** - 需要運行測試或檢查
3. **純分析** - 只需要讀取和分析
4. **混合操作** - 需要多種權限組合
5. **完全自定義** - 手動選擇每個權限

### 第二步：風險評估
系統會根據您的選擇評估風險等級：
- 🟢 **低風險**：只讀或基本操作
- 🟡 **中風險**：檔案修改和測試執行
- 🟠 **中高風險**：包含網路或安裝操作
- 🔴 **高風險**：包含刪除或系統級操作

### 第三步：權限確認
在執行前會顯示完整的權限清單供您確認。

## 🛠️ 手動配置示例

如果您已經知道需要哪些權限，可以創建自定義配置檔：

!`cat > .pdca/custom-template.json << 'EOF'
{
  "name": "我的自定義配置",
  "description": "根據特定需求自定義的權限配置",
  "permissions": {
    "allow": [
      "Read",
      "Write", 
      "Edit",
      "Grep",
      "Glob",
      "LS",
      "Bash(git:*)",
      "Bash(npm run test:*)"
    ],
    "deny": [
      "Bash(rm:*)",
      "Bash(sudo:*)",
      "WebFetch"
    ]
  },
  "agents": {
    "plan": ["Read", "Grep", "Glob", "LS"],
    "do": ["Read", "Write", "Edit", "Bash(git:*)"],
    "check": ["Read", "Bash(npm run test:*)"],
    "act": ["Read", "Edit", "Bash(git:*)"],
    "knowledge": ["Read", "Write"]
  }
}
EOF`

## 📊 代理專用權限

### 進階配置：為每個代理設定不同權限

```json
{
  "agents": {
    "plan": {
      "description": "規劃師 - 分析和設計",
      "permissions": ["Read", "Grep", "Glob", "LS"]
    },
    "do": {
      "description": "執行者 - 實作開發",
      "permissions": ["Read", "Write", "Edit", "MultiEdit"]
    },
    "check": {
      "description": "檢查員 - 測試驗證", 
      "permissions": ["Read", "Bash(npm run test:*)"]
    },
    "act": {
      "description": "改善者 - 優化重構",
      "permissions": ["Read", "Edit", "Bash(git:*)"]
    },
    "knowledge": {
      "description": "知識管理 - 文檔記錄",
      "permissions": ["Read", "Write"]
    }
  }
}
```

## 🚀 啟動自定義模式

### 配置完成後啟動

!`echo "🔧 自定義模式配置 - $(date '+%Y-%m-%d %H:%M:%S')" >> .pdca/execution-log.txt`

**請按照以下步驟完成配置**：

1. **選擇或修改** 上述配置模板
2. **保存配置** 到 `.pdca/custom-config.json`
3. **確認權限** 範圍和風險等級
4. **執行啟動** 指令

**啟動指令**：
```bash
pdca "$(cat .pdca/current-task.txt)" --config .pdca/custom-config.json
```

## 💡 配置建議

### 最小權限原則
- 只給予完成任務所需的最小權限
- 優先使用預設模板，再根據需要調整
- 避免給予不必要的危險權限

### 漸進式權限
- 從最小權限開始
- 根據實際需要逐步增加
- 隨時可以停止並重新配置

### 安全檢查
- 定期檢查 `.pdca/execution-log.txt`
- 監控代理的實際操作
- 有疑慮時立即停止系統

---

## 📝 配置記錄

- **配置時間**：!`date '+%Y-%m-%d %H:%M:%S'`
- **模式**：🔧 自定義模式
- **狀態**：配置中
- **下一步**：完成權限配置並啟動

**自定義模式讓您可以精確控制每個代理的權限，在安全性和功能性之間找到最佳平衡。**