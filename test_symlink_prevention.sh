#!/bin/bash

echo "🧪 測試符號連結防護功能"
echo "=========================="

# 模擬 CLAUDE_TOOL_INPUT 環境變數 - 符號連結命令
export CLAUDE_TOOL_INPUT='{"command": "ln -s /some/path target"}'

echo "測試案例: 嘗試創建符號連結"
echo "輸入: $CLAUDE_TOOL_INPUT"

# 執行 Hook 邏輯
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null)

if echo "$COMMAND" | grep -q '^git commit'; then 
    echo '🔍 檢查 Git 提交格式...'
    if ! echo "$COMMAND" | grep -qE '\[20[0-9]{6}\]'; then 
        echo '❌ 提交格式錯誤：必須包含 [YYYYMMDD] 格式' >&2
        exit 1
    fi
    if echo "$COMMAND" | grep -qiE '(AI|Claude|Anthropic|LLM|機器人|自動生成|Generated|Automated|Bot|Assistant|🤖)'; then 
        echo '❌ 提交訊息包含禁止詞彙' >&2
        exit 1
    fi
    echo '✅ Git 提交格式檢查通過'
fi

if echo "$COMMAND" | grep -qE 'ln -s'; then 
    echo '❌ 避免創建符號連結：Google Drive 同步衝突' >&2
    echo "結果: Hook 成功阻止符號連結創建"
    exit 1
fi

echo "✅ 命令檢查通過"