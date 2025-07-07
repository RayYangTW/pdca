---
allowed-tools: "*"
description: PDCA 專家模式最終確認與啟動
---

# 🔴 PDCA 專家模式 - 最終確認

## 載入任務
當前任務：!`cat .pdca/current-task.txt 2>/dev/null || echo "未找到任務檔案"`

## ✅ 確認檢查清單

### 必要條件確認
- **任務載入**：!`[ -f .pdca/current-task.txt ] && echo "✅ 任務已載入" || echo "❌ 未找到任務"`
- **風險評估**：!`[ -f .pdca/risk-assessment.md ] && echo "✅ 風險評估完成" || echo "❌ 請先執行 /pdca:expert"`
- **當前時間**：!`date '+%Y-%m-%d %H:%M:%S'`

### 🚨 最後警告

您即將啟動具有 **完全系統權限** 的 5 個 AI 代理：

1. **🎯 規劃師**：可以分析和修改任何檔案
2. **🎨 執行者**：可以創建、修改、刪除檔案，安裝軟體
3. **🔍 檢查員**：可以執行任何測試和系統檢查
4. **🚀 改善者**：可以執行系統級優化和部署
5. **📝 知識管理**：可以記錄和修改所有文檔

### ⚠️ 不可逆操作風險
- 檔案可能被永久刪除
- 系統設定可能被修改
- 可能安裝未知軟體
- 可能執行危險命令

## 🛡️ 安全措施確認

請在心中確認以下安全措施：

1. ✅ **我已經完整備份所有重要資料**
2. ✅ **我在安全的隔離環境中執行（Docker/VM）**
3. ✅ **我理解並接受所有風險**
4. ✅ **我確實需要完全權限才能完成此任務**
5. ✅ **我知道如何緊急停止系統**

## 🔧 權限配置生成

生成專家模式完全權限配置...

!`cat > .pdca/expert-permissions.json << 'EOF'
{
  "permissions": {
    "allow": ["*"],
    "deny": [],
    "warning": "完全權限模式 - 極高風險",
    "audit": true,
    "log_all_operations": true
  }
}
EOF`

## 🚀 啟動專家模式

### 執行記錄
!`echo "🔴 專家模式確認啟動 - $(date '+%Y-%m-%d %H:%M:%S') - 任務: $(cat .pdca/current-task.txt)" >> .pdca/execution-log.txt`

### 審計日誌啟動
!`echo "=== PDCA 專家模式審計日誌 ===" > .pdca/audit.log`
!`echo "啟動時間: $(date '+%Y-%m-%d %H:%M:%S')" >> .pdca/audit.log`
!`echo "任務: $(cat .pdca/current-task.txt)" >> .pdca/audit.log`
!`echo "執行環境: $(pwd)" >> .pdca/audit.log`
!`echo "用戶: $(whoami)" >> .pdca/audit.log`
!`echo "=========================" >> .pdca/audit.log`

### 系統啟動序列

**🔴 PDCA 專家模式正在啟動...**

**啟動參數**：
- 權限級別：完全權限（危險）
- 代理數量：5 個
- 監控級別：最高（記錄所有操作）
- Session 名稱：pdca-expert

**啟動指令**：
!`pdca "$(cat .pdca/current-task.txt)" --security expert --agents 5 --audit --session pdca-expert`

---

## 📊 專家模式運行中

### 代理權限範圍

🎯 **Plan 代理**：
- ✅ 完全檔案系統存取
- ✅ 系統資訊讀取
- ✅ 網路資源存取
- ✅ 環境變數存取

🎨 **Do 代理**：
- ✅ 完全檔案操作權限
- ✅ 套件安裝和管理
- ✅ 系統命令執行
- ✅ 服務啟動和管理

🔍 **Check 代理**：
- ✅ 完全測試執行權限
- ✅ 系統診斷工具
- ✅ 安全掃描工具
- ✅ 性能監控工具

🚀 **Act 代理**：
- ✅ 系統配置修改
- ✅ 部署和發布操作
- ✅ 資料庫操作
- ✅ 雲服務整合

📝 **Knowledge 代理**：
- ✅ 完全文檔權限
- ✅ 日誌和審計記錄
- ✅ 備份和歸檔
- ✅ 報告生成

### 🚨 監控和緊急停止

**監控指令**：
```bash
# 查看即時日誌
tail -f .pdca/audit.log

# 查看代理狀態
tmux attach -t pdca-expert

# 查看執行記錄
cat .pdca/execution-log.txt
```

**緊急停止指令**：
```bash
# 立即停止所有代理
pdca stop

# 強制終止（如果正常停止失敗）
tmux kill-session -t pdca-expert

# 查看停止前的最後操作
tail -20 .pdca/audit.log
```

---

## ⚡ 系統已啟動

**🔴 專家模式已啟動！請密切監控代理的操作。**

- **審計日誌**：`.pdca/audit.log`
- **執行記錄**：`.pdca/execution-log.txt`
- **tmux Session**：`pdca-expert`

**請記住：隨時可以使用 `pdca stop` 停止系統！**