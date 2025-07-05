#!/usr/bin/env python3
"""
PDCA 極簡版 - 5秒上手，0學習成本
"""
import sys

def pdca(task):
    """一句話搞定 PDCA"""
    print(f"\n🎯 {task}")
    print("-" * 30)
    print("🤔 質疑方案：我的設計是最優的嗎？")
    print("🔍 搜尋實踐：有更好的解決方案嗎？")  
    print("💎 追求卓越：不滿足於能用，要最好")
    print("📡 技術敏銳：採用最新最適合的工具")
    print("-" * 30)
    print("✅ 開始實作，持續優化！\n")

# 超簡單入口
if len(sys.argv) > 1:
    pdca(" ".join(sys.argv[1:]))
else:
    print("用法: pdca_mini 你要做什麼")
    print("例子: pdca_mini 做個部落格")