---
allowed-tools: Read, Bash(tmux:*), Bash(ps:*), Bash(cat:*), Bash(ls:*), Bash(tail:*)
description: PDCA 多代理系統 - 查看運行狀態
---

# 📊 PDCA 系統狀態

## 🔍 檢查系統狀態

### Tmux Session 狀態
!`tmux list-sessions 2>/dev/null | grep pdca || echo "❌ PDCA 系統未運行"`

### 代理窗口狀態
!`tmux list-windows -t pdca 2>/dev/null || echo "無法獲取窗口資訊"`

### 代理狀態檔案
**Plan 代理**：
!`cat .raiy-pdca/agents/plan.status 2>/dev/null || echo "狀態未知"`

**Do 代理**：
!`cat .raiy-pdca/agents/do.status 2>/dev/null || echo "狀態未知"`

**Check 代理**：
!`cat .raiy-pdca/agents/check.status 2>/dev/null || echo "狀態未知"`

**Act 代理**：
!`cat .raiy-pdca/agents/act.status 2>/dev/null || echo "狀態未知"`

**Knowledge 代理**：
!`cat .raiy-pdca/agents/knowledge.status 2>/dev/null || echo "狀態未知"`

## 📁 通訊目錄狀態

### 訊息佇列
!`ls -la .raiy-pdca/communication/ 2>/dev/null | grep -E "\.(msg|task|result)$" | tail -10 || echo "通訊目錄為空"`

### 最新日誌
!`tail -n 20 .raiy-pdca/logs/system.log 2>/dev/null || echo "無系統日誌"`

## 🎯 當前任務
!`cat .pdca/current-task.txt 2>/dev/null || echo "無進行中的任務"`

## 📈 系統資源使用
!`ps aux | grep -E "(claude|tmux)" | grep -v grep | head -10`

---

## 💡 操作提示

如果系統未運行，使用：
```
/pdca:start
```

如果需要查看即時監控，使用：
```
/pdca:monitor
```

如果需要停止系統，使用：
```
/pdca:stop
```