---
allowed-tools: Bash(tmux:*), Bash(node:*), Bash(cat:*)
description: PDCA 多代理系統 - 連接監控介面
---

# 🖥️ PDCA 監控介面

## 📊 連接到監控系統

### 檢查監控狀態
!`tmux list-windows -t pdca 2>/dev/null | grep monitor || echo "❌ 監控介面未運行"`

### 連接方式選擇

#### 選項 1：直接連接到監控窗口
```bash
tmux attach -t pdca:5
```

#### 選項 2：在當前終端開啟監控
!`node dist/core/monitor.js 2>/dev/null || echo "❌ 監控程式未建置"`

## 📈 監控介面功能

**TUI 監控介面提供**：
- 🎯 各代理即時狀態
- 📊 任務進度追蹤
- 📝 訊息流量監控
- 🔄 系統健康檢查
- ⚡ 效能指標顯示

## 🎮 監控介面操作

**快捷鍵**：
- `↑/↓` - 上下導航
- `Enter` - 查看詳情
- `Tab` - 切換面板
- `q` - 退出監控
- `r` - 重新整理
- `1-5` - 快速切換到對應代理

## 💡 提示

如果監控介面未運行，可能需要：
1. 先啟動 PDCA 系統：`/pdca:start`
2. 確保 TypeScript 已建置：`npm run build`

**返回主 Claude CLI**：
- 如果在 tmux 中：按 `Ctrl+B d` 分離
- 如果在獨立監控中：按 `q` 退出