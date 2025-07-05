# Claude Code Hooks 開發文檔

## 🎯 目標

為 CLAUDE.md 規範建立強制執行機制，確保關鍵規則不再依賴 AI 記憶而是自動執行。

## 🔍 Hooks 基本概念

### 什麼是 Hooks？
Claude Code Hooks 是在特定生命週期事件觸發的 shell 命令，提供對 Claude Code 行為的確定性控制。

### Hook 事件類型
- **PreToolUse**: 工具執行前（可阻止執行）
- **PostToolUse**: 工具執行後
- **Notification**: 發送通知時  
- **Stop**: Claude 回應結束時

## 📁 配置位置

```
~/.claude/settings.json         # 全域設定（所有專案）
.claude/settings.json          # 專案設定（與團隊共享）
.claude/settings.local.json    # 個人設定（不入版控）
```

## 🔧 配置語法

### 基本結構
```json
{
  "hooks": {
    "[事件類型]": [
      {
        "matcher": "[工具或條件]",
        "hooks": [
          {
            "type": "command",
            "command": "[shell 命令]"
          }
        ]
      }
    ]
  }
}
```

### 實際範例
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Bash 工具即將執行' && echo \"$CLAUDE_TOOL_INPUT\" | jq ."
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo '對話結束' >> ~/.claude/session.log"
          }
        ]
      }
    ]
  }
}
```

## 🎯 我們要實作的 Hooks

### 1. Git 提交檢查 Hook

**目標**：阻止不符合格式的 git commit

**配置**：
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash", 
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.command' | grep -q '^git commit'; then echo '檢查 Git 提交格式...'; echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.command' | grep -E '\\[20[0-9]{6}\\]' || (echo '❌ 提交格式錯誤：必須包含 [YYYYMMDD]' && exit 1); fi"
          }
        ]
      }
    ]
  }
}
```

**檢查項目**：
- ✅ 提交訊息格式：`[YYYYMMDD] type: description`
- ✅ 禁止詞彙檢測（AI, Claude, Anthropic...）
- ❌ 阻止不合規提交

### 2. 記憶體自動更新 Hook

**目標**：記錄有意義的工作狀態和操作歷史

**配置**：

#### Stop Hook - 對話結束記錄
```json
{
  "Stop": [{
    "matcher": "",
    "hooks": [{
      "type": "command",
      "command": "記錄工作目錄、Git 分支、時間等資訊"
    }]
  }]
}
```

**功能**：
- ✅ 記錄最後工作時間和目錄
- ✅ 記錄當前 Git 分支
- ✅ 按月份歸檔會話日誌

#### PostToolUse Hook - Git 操作記錄
```json
{
  "PostToolUse": [{
    "matcher": "Bash",
    "hooks": [{
      "type": "command",
      "command": "記錄所有 Git 操作命令"
    }]
  }]
}
```

**功能**：
- ✅ 自動記錄 git add/commit/push/pull/merge 操作
- ✅ 按月份歸檔 Git 操作歷史
- ✅ 方便追蹤專案開發進度

## 🌍 環境變數

Hooks 可使用的環境變數：

- `$CLAUDE_FILE_PATHS`: 相關檔案路徑（空格分隔）
- `$CLAUDE_NOTIFICATION`: 通知內容（僅 Notification 事件）
- `$CLAUDE_TOOL_OUTPUT`: 工具輸出（僅 PostToolUse 事件）
- `$CLAUDE_TOOL_INPUT`: 工具輸入（JSON 格式）

## 📤 Hook 回應格式

Hooks 可回傳 JSON 控制行為：

```json
{
  "continue": true,           // 是否繼續執行（預設：true）
  "stopReason": "string",     // continue=false 時顯示的訊息
  "suppressOutput": true      // 隱藏 stdout（預設：false）
}
```

## 🧪 測試方式

### 測試 Git Hook
```bash
# 測試正確格式
git commit -m "[20250705] test: 測試提交格式"

# 測試錯誤格式（應被阻止）
git commit -m "隨便的提交訊息"
```

### 測試記憶體 Hook
```bash
# 啟動 Claude Code 會話
claude

# 執行一些操作後結束會話，檢查記憶體檔案是否更新
cat memories/logs/hook_$(date +%Y%m%d).log
```

## ⚠️ 注意事項

1. **安全性**：Hooks 以完整用戶權限執行，需謹慎設計
2. **效能**：避免長時間執行的命令，預設 60 秒逾時
3. **除錯**：Hook 錯誤會顯示在 Claude Code 輸出中
4. **路徑**：使用絕對路徑，並正確引用 shell 變數

## 🔄 迭代計劃

### 階段 1（當前）
- [x] Git 提交格式檢查
- [x] 基本記憶體更新

### 階段 2（未來）
- [ ] 檔案操作前置檢查
- [ ] 代碼品質閘門
- [ ] 禁止詞彙即時攔截

### 階段 3（未來）
- [ ] 定期自檢自動化
- [ ] 智能規範建議
- [ ] 跨專案規範同步

## 📚 參考資源

- [Claude Code Hooks 官方文檔](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code Settings 文檔](https://docs.anthropic.com/en/docs/claude-code/settings)
- [實際應用範例](https://medium.com/@joe.njenga/use-claude-code-hooks-newest-feature-to-fully-automate-your-workflow-341b9400cfbe)

---

**記住**：Hooks 是確保關鍵規範 100% 執行的利器，不再依賴 AI 記憶！