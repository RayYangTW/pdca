#!/bin/bash
# 🎌 PDCA-Shokunin 一鍵安裝腳本
# 職人級多代理協調系統快速部署工具

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 顯示 Banner
echo -e "${BLUE}🎌 PDCA-Shokunin Multi-Agent System${NC}"
echo -e "${BLUE}職人級多代理協調系統 - 一鍵安裝${NC}"
echo "================================================"
echo

# 檢查系統需求
check_requirements() {
    echo -e "${YELLOW}📋 檢查系統需求...${NC}"
    
    # 檢查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 未安裝${NC}"
        echo "請先安裝 Python 3.8 或更高版本"
        exit 1
    fi
    
    # 檢查 Python 版本
    python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [[ $(echo "$python_version < 3.8" | bc) -eq 1 ]]; then
        echo -e "${RED}❌ Python 版本過低 ($python_version)${NC}"
        echo "需要 Python 3.8 或更高版本"
        exit 1
    fi
    echo -e "${GREEN}✓ Python $python_version${NC}"
    
    # 檢查 tmux
    if ! command -v tmux &> /dev/null; then
        echo -e "${RED}❌ tmux 未安裝${NC}"
        echo "請安裝 tmux："
        echo "  macOS: brew install tmux"
        echo "  Ubuntu: sudo apt install tmux"
        echo "  CentOS: sudo yum install tmux"
        exit 1
    fi
    echo -e "${GREEN}✓ tmux $(tmux -V | cut -d' ' -f2)${NC}"
    
    # 檢查 git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git 未安裝${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ git $(git --version | cut -d' ' -f3)${NC}"
    
    # 檢查 Claude CLI
    if ! command -v claude &> /dev/null; then
        echo -e "${YELLOW}⚠️  Claude CLI 未安裝${NC}"
        echo "請參考 https://docs.anthropic.com/claude/docs/claude-code 安裝"
        echo "安裝後再次執行此腳本"
        exit 1
    fi
    echo -e "${GREEN}✓ Claude CLI${NC}"
    
    echo
}

# 下載核心檔案
download_files() {
    echo -e "${YELLOW}📥 下載 PDCA-Shokunin 核心檔案...${NC}"
    
    # 創建 .pdca-shokunin 目錄
    mkdir -p .pdca-shokunin
    
    # 基礎 URL（使用 raw.githubusercontent.com）
    BASE_URL="https://raw.githubusercontent.com/raiyyang/pdca-shokunin/main/.pdca-shokunin"
    
    # 下載核心檔案
    echo "下載 launcher.py..."
    curl -sL "$BASE_URL/launcher.py" -o .pdca-shokunin/launcher.py
    
    echo "下載 monitor.py..."
    curl -sL "$BASE_URL/monitor.py" -o .pdca-shokunin/monitor.py
    
    # 設置執行權限
    chmod +x .pdca-shokunin/launcher.py
    chmod +x .pdca-shokunin/monitor.py
    
    echo -e "${GREEN}✓ 核心檔案下載完成${NC}"
    echo
}

# 設置 Claude 指令
setup_claude_command() {
    echo -e "${YELLOW}⚙️  設置 Claude 斜線指令...${NC}"
    
    # 創建 .claude 目錄結構
    mkdir -p .claude/commands
    
    # 創建 pdca.md 指令檔案
    cat > .claude/commands/pdca.md << 'EOF'
# PDCA-Shokunin Multi-Agent System

啟動 PDCA 職人級多代理協調系統處理任務：**$ARGUMENTS**

## 🎌 系統啟動

```bash
python3 .pdca-shokunin/launcher.py "$ARGUMENTS"
```

這將創建真正的多代理非同步協作環境：

### 🔄 PDCA 循環代理
- 🎯 **pdca-plan**: Plan 階段協調者 - 需求分析、策略制定、任務協調
- 🎨 **pdca-do**: Do 階段執行者 - 架構設計、功能實作、代碼開發
- 🔍 **pdca-check**: Check 階段驗證者 - 品質驗證、測試檢查、結果評估
- 🚀 **pdca-act**: Act 階段改善者 - 性能優化、問題改善、持續改進

### 📝 知識管理代理
- **knowledge-agent**: 專職記錄和知識管理 - 智能監聽、分類歸檔、經驗累積

## 🛠️ 技術架構

- **tmux session**: 5 個獨立 Claude 實例並行運作
- **git worktree**: 代理工作空間完全隔離
- **實時 TUI**: 監控介面顯示所有代理狀態
- **智能通訊**: 文件系統協調代理間協作

## 🎯 職人承諾

- **一鍵啟動**: 零配置即用
- **真正並行**: 5 個獨立 AI 代理同時工作  
- **隨時介入**: 實時查看和指導任一代理
- **工匠品質**: 每個細節都追求完美

---

**正在啟動 PDCA-Shokunin 系統...**
EOF

    # 創建權限配置
    cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(python:*)",
      "Bash(mv:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "Bash(tmux:*)"
    ],
    "deny": []
  }
}
EOF

    echo -e "${GREEN}✓ Claude 指令設置完成${NC}"
    echo
}

# 創建記憶體目錄
create_memories() {
    echo -e "${YELLOW}📁 創建記憶體目錄結構...${NC}"
    
    mkdir -p memories/{decisions,solutions,patterns,learnings,progress,logs,short_term,long_term}
    
    # 創建 project.md
    cat > memories/project.md << 'EOF'
# 🎌 PDCA-Shokunin Project Context

**專案名稱**: $(basename $(pwd))
**初始化日期**: $(date +%Y-%m-%d)
**系統版本**: PDCA-Shokunin v3.0

## 📋 專案概要

此專案已配置 PDCA-Shokunin 多代理協調系統。

## 🚀 快速開始

```bash
# 啟動系統
/pdca "你的任務描述"

# 或直接執行
python3 .pdca-shokunin/launcher.py "你的任務描述"
```

## 📝 記憶體結構

- `decisions/` - 決策記錄
- `solutions/` - 解決方案
- `patterns/` - 設計模式
- `learnings/` - 經驗教訓
- `progress/` - 進度追蹤

---
EOF

    echo -e "${GREEN}✓ 記憶體目錄創建完成${NC}"
    echo
}

# 創建快速啟動腳本
create_quick_start() {
    echo -e "${YELLOW}🚀 創建快速啟動腳本...${NC}"
    
    cat > pdca << 'EOF'
#!/bin/bash
# PDCA-Shokunin 快速啟動腳本

if [ $# -eq 0 ]; then
    echo "使用方式: ./pdca \"任務描述\""
    echo "範例: ./pdca \"建立用戶登入系統\""
    exit 1
fi

python3 .pdca-shokunin/launcher.py "$@"
EOF

    chmod +x pdca
    
    echo -e "${GREEN}✓ 快速啟動腳本創建完成${NC}"
    echo
}

# 主安裝流程
main() {
    echo -e "${YELLOW}🔍 當前目錄: $(pwd)${NC}"
    echo
    
    # 檢查是否在 git 倉庫中
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 檢測到 git 倉庫${NC}"
    else
        echo -e "${YELLOW}⚠️  未檢測到 git 倉庫，建議先初始化 git${NC}"
    fi
    echo
    
    # 執行安裝步驟
    check_requirements
    download_files
    setup_claude_command
    create_memories
    create_quick_start
    
    # 完成提示
    echo -e "${GREEN}✨ PDCA-Shokunin 安裝完成！${NC}"
    echo
    echo "使用方法："
    echo -e "  ${BLUE}1. Claude CLI 中：${NC} /pdca \"你的任務\""
    echo -e "  ${BLUE}2. 終端機中：${NC} ./pdca \"你的任務\""
    echo -e "  ${BLUE}3. 直接執行：${NC} python3 .pdca-shokunin/launcher.py \"你的任務\""
    echo
    echo "tmux 操作："
    echo "  - 查看狀態: tmux attach -t pdca-shokunin"
    echo "  - 切換窗口: Ctrl+B 然後按數字 1-6"
    echo "  - 分離會話: Ctrl+B 然後按 d"
    echo
    echo -e "${YELLOW}📚 詳細文檔請參考 .pdca-shokunin/README.md${NC}"
}

# 執行主函數
main