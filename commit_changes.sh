#!/bin/bash

echo "🔍 檢查 Git 狀態..."
cd "$(dirname "$0")"

# 檢查 Git 狀態
git status

echo ""
echo "📋 即將提交的變更："
echo "✅ 真實多代理並行執行系統"
echo "✅ pip 套件化 (pdca-shokunin)"
echo "✅ asyncio.gather 並行處理"
echo "✅ 智能降級和錯誤處理"
echo "✅ 完整測試套件"

echo ""
read -p "確認提交這些變更？(y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "📦 添加所有變更..."
    git add .
    
    echo "💾 提交變更..."
    git commit -m "[$(date +%Y%m%d)] feat: 實現真實多代理並行執行系統

- 轉換為真正的多代理並行執行（非模擬）
- 基於 Anthropic 官方 asyncio.gather 模式
- 支援 pip 安裝 (pdca-shokunin)
- 智能降級機制：API 失敗時自動回退
- 指數退避重試和超時保護
- 輕量設計：18.2KB 核心，最小依賴
- 完整測試套件和自我評估
- 保持向後兼容的命令行介面"

    echo "✅ 提交完成！"
    
    echo ""
    echo "📊 最新 commit："
    git log --oneline -1
    
else
    echo "❌ 取消提交"
fi