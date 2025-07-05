#!/usr/bin/env python3
"""
PDCA 極簡版 - 5秒上手，0學習成本
"""
import sys

def pdca(task):
    """一句話搞定 PDCA"""
    print(f"\n🎯 {task}")
    print("-" * 30)
    print("🤔 先想想：這真的需要做嗎？")
    print("🔍 搜一下：GitHub有沒有現成的？")  
    print("💎 做最好：簡單但要做好")
    print("📡 用新的：看看最新工具")
    print("-" * 30)
    print("✅ 開始做吧！\n")

# 超簡單入口
if len(sys.argv) > 1:
    pdca(" ".join(sys.argv[1:]))
else:
    print("用法: pdca_mini 你要做什麼")
    print("例子: pdca_mini 做個部落格")