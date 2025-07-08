---
allowed-tools: Bash(tmux:*), Bash(echo:*), Bash(rm:*), Bash(cat:*)
description: PDCA 多代理系統 - 停止所有代理
---

# 🛑 停止 PDCA 系統

## 📋 停止前檢查

### 當前狀態
!`tmux list-sessions 2>/dev/null | grep pdca || echo "❌ PDCA 系統未運行"`

### 進行中的任務
!`cat .pdca/current-task.txt 2>/dev/null || echo "無進行中的任務"`

## 🔴 執行停止操作

### 1. 通知所有代理準備停止
!`echo "SYSTEM_SHUTDOWN" > .raiy-pdca/communication/system.cmd`

### 2. 等待代理回應（給予 2 秒緩衝）
!`sleep 2`

### 3. 停止 tmux session
!`tmux kill-session -t pdca 2>/dev/null && echo "✅ PDCA 系統已停止" || echo "❌ 停止失敗或系統未運行"`

### 4. 清理狀態檔案
!`rm -f .raiy-pdca/agents/*.status 2>/dev/null`
!`rm -f .raiy-pdca/communication/*.cmd 2>/dev/null`
!`rm -f .pdca/current-task.txt 2>/dev/null`

## ✅ 清理完成

**PDCA 多代理系統已完全停止。**

### 📊 停止摘要
- 所有 Claude CLI 代理已關閉
- 通訊檔案已清理
- 狀態檔案已重置

## 💡 下一步

如需重新啟動系統，使用：
```
/pdca:start
```

如需查看歷史日誌，檢查：
```
.raiy-pdca/logs/
```