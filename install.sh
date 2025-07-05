#!/bin/bash

echo "🎯 安裝 PDCA 命令行工具"
echo "========================"

# 獲取腳本所在目錄
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 方案 1：建立軟連結（需要 sudo）
echo ""
echo "方案 1：建立系統軟連結"
echo "執行命令：sudo ln -sf $SCRIPT_DIR/pdca /usr/local/bin/pdca"
echo "需要輸入系統密碼"
echo ""

# 方案 2：添加到 PATH
echo "方案 2：添加到 PATH（推薦）"
echo ""
echo "請將以下內容加入您的 shell 配置檔（~/.zshrc 或 ~/.bashrc）："
echo ""
echo "# PDCA 命令"
echo "export PATH=\"$SCRIPT_DIR:\$PATH\""
echo ""
echo "然後執行：source ~/.zshrc（或 source ~/.bashrc）"
echo ""

# 方案 3：創建 alias
echo "方案 3：創建 alias"
echo ""
echo "請將以下內容加入您的 shell 配置檔："
echo ""
echo "# PDCA 命令別名"
echo "alias pdca='$SCRIPT_DIR/pdca'"
echo ""

echo "========================"
echo "選擇您偏好的安裝方式，完成後即可使用 pdca 命令！"