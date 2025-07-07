# .pdca 目錄說明

這個目錄包含 PDCA 互動式權限系統的運行狀態和配置檔案。

## 目錄結構

```
.pdca/
├── README.md                    # 本說明檔案
├── config-template.json         # 系統配置模板
├── execution-log.txt           # 執行日誌
├── current-task.txt            # 當前任務（運行時建立）
├── risk-assessment.md          # 風險評估報告（運行時建立）
├── audit.log                   # 審計日誌（專家模式）
├── safe-permissions.json       # 安全模式權限配置
├── standard-permissions.json   # 標準模式權限配置
├── expert-permissions.json     # 專家模式權限配置
└── custom-config.json          # 自定義權限配置
```

## 檔案說明

### 配置檔案
- **config-template.json**: 系統基礎配置模板，定義所有安全模式
- **\*-permissions.json**: 各種模式的具體權限配置

### 狀態檔案  
- **current-task.txt**: 當前正在執行的任務描述
- **execution-log.txt**: 所有操作的執行記錄
- **audit.log**: 專家模式的詳細審計記錄

### 分析檔案
- **risk-assessment.md**: 任務風險評估報告

## 安全模式

### 🟢 安全模式 (Safe)
- **權限**: 只讀分析
- **用途**: 程式碼審查、架構分析
- **風險**: 極低

### 🟡 標準模式 (Standard)  
- **權限**: 開發操作，限制系統級命令
- **用途**: 功能開發、程式碼重構
- **風險**: 中等

### 🔴 專家模式 (Expert)
- **權限**: 完全系統權限
- **用途**: 系統管理、部署操作
- **風險**: 極高（需要二次確認）

### 🔧 自定義模式 (Custom)
- **權限**: 手動配置
- **用途**: 特殊需求的精確權限控制
- **風險**: 根據配置而定

## 使用方式

1. **任務分析**: `/pdca "任務描述"`
2. **選擇模式**: `/pdca:safe`, `/pdca:standard`, `/pdca:expert`, `/pdca:custom`
3. **監控執行**: 查看 `execution-log.txt` 和相關狀態檔案

## 緊急停止

如果需要緊急停止系統：
```bash
pdca stop
# 或
tmux kill-session -t pdca
```

## 注意事項

- 所有操作都會記錄在執行日誌中
- 專家模式會建立詳細的審計記錄
- 建議定期清理過期的狀態檔案
- 重要操作前請確保已備份重要資料