# ⚠️ 舊版本套件目錄

此目錄 (`pdca_shokunin/`) 包含舊版本的 Python 套件實作，僅保留作為歷史參考和向後相容性考慮。

## 重要說明

**本專案已升級為直接執行架構，不再需要安裝 Python 套件。**

### 當前系統架構
- 核心系統位於 `.pdca-shokunin/` 目錄
- 使用 `launcher.py` 直接啟動多代理系統
- 透過 tmux 管理 5 個並行的 Claude 實例

### 如何使用新系統
```bash
# 方式一：Claude CLI 斜線指令
/pdca "你的任務"

# 方式二：直接執行
python3 .pdca-shokunin/launcher.py "你的任務"
```

### 此目錄內容
- `__init__.py` - 套件初始化
- `cli.py` - 舊版命令行介面
- `core.py` - 舊版核心邏輯
- `agents.py` - 舊版代理實作

這些檔案不影響新系統的運行，可安全忽略。

---
更新日期：2025-07-06