---
allowed-tools: Read, Write, Edit, Bash(tmux:*), Bash(ps:*), Bash(echo:*), Bash(cat:*), Bash(mkdir:*), Bash(node:*), Bash(npm run:*)
description: PDCA 多代理系統 - 啟動並行協作
---

# 🚀 PDCA 多代理系統啟動

## 📋 系統檢查

### 當前狀態
- **工作目錄**：!`pwd`
- **Git 狀態**：!`git status --short 2>/dev/null || echo "非 Git 專案"`
- **PDCA 安裝**：!`[ -f node_modules/.bin/pdca ] && echo "✅ 已安裝" || echo "❌ 未安裝"`
- **現有 Session**：!`tmux list-sessions 2>/dev/null | grep pdca || echo "無運行中的 PDCA"`

## 🎯 啟動多代理系統

### 初始化通訊目錄
!`mkdir -p .raiy-pdca/communication .raiy-pdca/agents .raiy-pdca/logs`

### 檢查並停止現有 Session
!`tmux kill-session -t pdca 2>/dev/null || echo "沒有現有 session"`

### 建置系統（如果需要）
!`cd /Users/rayyang/Raiy_Workspace/00_Raiy/dev/raiy-pdca && [ -d dist ] || npm run build`

### 啟動協調器
我將作為主協調者，管理 5 個並行的 Claude CLI 代理...

```javascript
// 初始化協調器介面
const { coordinatorInterface } = await import('/Users/rayyang/Raiy_Workspace/00_Raiy/dev/raiy-pdca/dist/core/coordinator-interface.js');

// 啟動系統
await coordinatorInterface.start();

// 設置全域函數供後續使用
globalThis.pdca = {
  assignTask: (task) => coordinatorInterface.assignTask(task),
  status: () => coordinatorInterface.getStatus(),
  help: () => coordinatorInterface.displayHelp()
};
```

### 檢查啟動狀態
!`sleep 2`
!`tmux list-windows -t pdca 2>/dev/null || echo "系統正在初始化..."`

## ✅ 系統已啟動

**PDCA 多代理系統已成功啟動！**

### 🎮 快速操作指南

**查看所有代理**：
```bash
tmux attach -t pdca
```

**快捷鍵**：
- `Ctrl+B 0` - 切換到 Plan 代理
- `Ctrl+B 1` - 切換到 Do 代理
- `Ctrl+B 2` - 切換到 Check 代理
- `Ctrl+B 3` - 切換到 Act 代理
- `Ctrl+B 4` - 切換到 Knowledge 代理
- `Ctrl+B 5` - 查看監控介面
- `Ctrl+B d` - 分離 session（背景執行）

### 🎯 主代理協調模式

我（主 Claude CLI）現在將作為協調者，負責：
1. **任務分配** - 將您的任務分解並分配給各代理
2. **進度追蹤** - 監控各代理的執行狀態
3. **結果整合** - 收集並整合各代理的輸出

### 📊 使用其他指令

- `/pdca:status` - 查看當前系統狀態
- `/pdca:monitor` - 開啟監控介面
- `/pdca:stop` - 停止所有代理

---

## 🎯 下一步

**請告訴我您的任務，我將協調 5 個專門代理為您工作！**

例如：
- "幫我分析這個專案的架構並提出優化建議"
- "實作一個使用者登入功能"
- "重構現有程式碼以提高性能"

💡 **提示**：各代理會並行工作，您可以隨時切換到任何代理查看進度或直接互動。