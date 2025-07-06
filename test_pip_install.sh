#!/bin/bash

echo "🚀 測試 PDCA Shokunin pip 安裝"
echo "================================"

# 建立測試環境
TEST_DIR="/tmp/pdca_test_$(date +%s)"
echo "📁 建立測試目錄：$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 建立虛擬環境
echo "🐍 建立 Python 虛擬環境..."
python3 -m venv venv
source venv/bin/activate

# 升級 pip
echo "⬆️ 升級 pip..."
pip install --upgrade pip

# 從本地安裝套件
PACKAGE_DIR="/Users/rayyang/Raiy_Workspace/00_Raiy/dev/raiy-pdca-shokunin"
echo "📦 從本地安裝 PDCA Shokunin..."
pip install "$PACKAGE_DIR"

# 測試命令是否可用
echo ""
echo "🧪 測試 pdca 命令..."
if command -v pdca &> /dev/null; then
    echo "✅ pdca 命令安裝成功"
    pdca help
else
    echo "❌ pdca 命令未找到"
fi

echo ""
echo "🧪 測試 pdca-recorder 命令..."
if command -v pdca-recorder &> /dev/null; then
    echo "✅ pdca-recorder 命令安裝成功"
else
    echo "❌ pdca-recorder 命令未找到"
fi

# 測試基本功能
echo ""
echo "🧪 測試基本功能（模擬模式）..."
pdca "測試安裝是否成功"

# 測試狀態命令
echo ""
echo "🧪 測試狀態命令..."
pdca status

# 清理
echo ""
echo "🧹 清理測試環境..."
deactivate
rm -rf "$TEST_DIR"

echo ""
echo "✅ pip 安裝測試完成！"