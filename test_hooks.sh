#!/bin/bash

echo "🧪 測試 Claude Code Hooks 邏輯"
echo "================================"

# 模擬 CLAUDE_TOOL_INPUT 環境變數
export CLAUDE_TOOL_INPUT='{"command": "git commit -m \"測試錯誤格式\""}'

echo "測試案例 1: 錯誤格式（應該失敗）"
echo "輸入: $CLAUDE_TOOL_INPUT"

# 執行 Hook 邏輯
if echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null | grep -q '^git commit'; then 
    echo '🔍 檢查 Git 提交格式...'
    COMMIT_MSG=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null)
    
    if ! echo "$COMMIT_MSG" | grep -qE '\[20[0-9]{6}\]'; then 
        echo '❌ 提交格式錯誤：必須包含 [YYYYMMDD] 格式'
        echo "結果: Hook 正常阻止"
    else
        echo '✅ Git 提交格式檢查通過'
    fi
    
    if echo "$COMMIT_MSG" | grep -qiE '(AI|Claude|Anthropic|LLM|機器人|自動生成|Generated|Automated|Bot|Assistant|🤖)'; then 
        echo '❌ 提交訊息包含禁止詞彙'
        echo "結果: Hook 正常阻止"
    fi
fi

echo ""
echo "測試案例 2: 正確格式（應該通過）"

export CLAUDE_TOOL_INPUT='{"command": "git commit -m \"[20250705] feat: 新增 Hooks 功能\""}'
echo "輸入: $CLAUDE_TOOL_INPUT"

if echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null | grep -q '^git commit'; then 
    echo '🔍 檢查 Git 提交格式...'
    COMMIT_MSG=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null)
    
    if ! echo "$COMMIT_MSG" | grep -qE '\[20[0-9]{6}\]'; then 
        echo '❌ 提交格式錯誤：必須包含 [YYYYMMDD] 格式'
    else
        echo '✅ Git 提交格式檢查通過'
    fi
    
    if echo "$COMMIT_MSG" | grep -qiE '(AI|Claude|Anthropic|LLM|機器人|自動生成|Generated|Automated|Bot|Assistant|🤖)'; then 
        echo '❌ 提交訊息包含禁止詞彙'
    else
        echo '✅ 禁止詞彙檢查通過'
    fi
fi

echo ""
echo "測試案例 3: 包含禁止詞彙（應該被阻止）"

export CLAUDE_TOOL_INPUT='{"command": "git commit -m \"[20250705] feat: 由 Claude 自動生成\""}'
echo "輸入: $CLAUDE_TOOL_INPUT"

if echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null | grep -q '^git commit'; then 
    echo '🔍 檢查 Git 提交格式...'
    COMMIT_MSG=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command' 2>/dev/null)
    
    if ! echo "$COMMIT_MSG" | grep -qE '\[20[0-9]{6}\]'; then 
        echo '❌ 提交格式錯誤：必須包含 [YYYYMMDD] 格式'
    else
        echo '✅ Git 提交格式檢查通過'
    fi
    
    if echo "$COMMIT_MSG" | grep -qiE '(AI|Claude|Anthropic|LLM|機器人|自動生成|Generated|Automated|Bot|Assistant|🤖)'; then 
        echo '❌ 提交訊息包含禁止詞彙'
        echo "結果: Hook 正常阻止"
    else
        echo '✅ 禁止詞彙檢查通過'
    fi
fi

echo ""
echo "🔄 測試記憶體更新 Hook"
echo "================================"

# 測試記憶體更新邏輯
if [ -d "memories" ]; then 
    mkdir -p memories/logs memories/short_term 
    echo "$(date '+%Y-%m-%d %H:%M:%S'): Claude Code 對話結束" >> memories/logs/hook_$(date +%Y%m%d).log 
    echo "最後更新時間: $(date '+%Y-%m-%d %H:%M:%S')" > memories/short_term/last_session_updated.txt 
    echo '🔄 記憶體系統已更新'
    
    echo "檢查更新結果:"
    echo "- Hook 日誌: $(tail -1 memories/logs/hook_$(date +%Y%m%d).log)"
    echo "- 最後更新: $(cat memories/short_term/last_session_updated.txt)"
fi

echo ""
echo "🎯 測試完成！"