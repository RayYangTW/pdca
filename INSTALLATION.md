# 🚀 PDCA-Shokunin 安裝指南

## 🎯 推薦：使用 npm 安裝（最簡單）

### 全局安裝（推薦）
```bash
npm install -g pdca-shokunin
```

安裝後可在任何地方使用：
```bash
# 初始化專案
pdca-shokunin init

# 啟動系統
pdca-shokunin "你的任務"
```

### 專案本地安裝
```bash
npm install pdca-shokunin
npx pdca-shokunin init
npx pdca-shokunin "你的任務"
```

## 🔧 備選：Shell 腳本安裝

如果沒有 npm，可使用 shell 腳本安裝：

### 方法一：使用 curl
```bash
curl -sL https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh | bash
```

### 方法二：使用 wget
```bash
wget -qO- https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh | bash
```

### 方法三：手動下載安裝腳本
```bash
# 下載安裝腳本
curl -O https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh

# 執行安裝
bash install.sh
```

## 📋 系統需求

安裝前請確保系統已安裝：

- **Python 3.8+**
- **tmux**
- **git**
- **Claude CLI** ([安裝說明](https://docs.anthropic.com/claude/docs/claude-code))

### 快速檢查指令
```bash
python3 --version
tmux -V
git --version
claude --version
```

## 🛠️ 安裝內容

安裝腳本會自動：

1. **檢查系統需求**
2. **下載核心檔案**
   - `.pdca-shokunin/launcher.py` - 系統啟動器
   - `.pdca-shokunin/monitor.py` - 監控介面
3. **設置 Claude 指令**
   - `.claude/commands/pdca.md` - 斜線指令配置
   - `.claude/settings.local.json` - 權限設置
4. **創建目錄結構**
   ```
   memories/
   ├── decisions/     # 決策記錄
   ├── solutions/     # 解決方案
   ├── patterns/      # 設計模式
   ├── learnings/     # 經驗教訓
   └── progress/      # 進度追蹤
   ```
5. **生成快速啟動腳本** `./pdca`

## 🎌 使用方法

安裝完成後，有三種方式啟動系統：

### 1. Claude CLI 斜線指令（推薦）
```bash
/pdca "建立用戶登入系統"
```

### 2. 快速啟動腳本
```bash
./pdca "建立用戶登入系統"
```

### 3. 直接執行
```bash
python3 .pdca-shokunin/launcher.py "建立用戶登入系統"
```

## 📊 監控與管理

### 查看運行狀態
```bash
tmux attach -t pdca-shokunin
```

### tmux 快捷鍵
- `Ctrl+B 1-5`: 切換到各個代理窗口
- `Ctrl+B 6`: 切換到監控窗口
- `Ctrl+B d`: 分離 session（保持後台運行）

## 🔧 手動安裝

如果自動安裝失敗，可以手動執行以下步驟：

1. **克隆專案**
   ```bash
   git clone https://github.com/raiyyang/pdca-shokunin.git pdca-temp
   ```

2. **複製核心檔案**
   ```bash
   cp -r pdca-temp/.pdca-shokunin .
   cp -r pdca-temp/.claude .
   cp -r pdca-temp/memories .
   ```

3. **設置權限**
   ```bash
   chmod +x .pdca-shokunin/launcher.py
   chmod +x .pdca-shokunin/monitor.py
   ```

4. **清理臨時檔案**
   ```bash
   rm -rf pdca-temp
   ```

## ❓ 常見問題

### 1. tmux 未安裝
```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux

# CentOS/RHEL
sudo yum install tmux
```

### 2. Claude CLI 未安裝
請參考官方文檔：https://docs.anthropic.com/claude/docs/claude-code

### 3. Python 版本過低
建議使用 Python 3.8 或更高版本。可以使用 pyenv 或 conda 管理 Python 版本。

### 4. 權限問題
如果遇到權限錯誤，確保腳本有執行權限：
```bash
chmod +x .pdca-shokunin/launcher.py
chmod +x .pdca-shokunin/monitor.py
chmod +x pdca
```

## 📝 更新系統

要更新到最新版本，重新執行安裝腳本即可：
```bash
curl -sL https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/install.sh | bash
```

## 🤝 支援

- GitHub Issues: https://github.com/raiyyang/pdca-shokunin/issues
- 文檔: https://github.com/raiyyang/pdca-shokunin/wiki

---

**PDCA-Shokunin** - 職人級多代理協調系統 🎌