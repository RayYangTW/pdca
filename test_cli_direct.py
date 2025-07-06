#!/usr/bin/env python3
"""
直接測試 CLI 功能（避免相對導入問題）
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 導入測試
try:
    from pdca_shokunin.core import PDCAOrchestrator
    from pdca_shokunin.agents import DesignAgent, DeveloperAgent
    print("✅ 導入成功")
except Exception as e:
    print(f"❌ 導入失敗：{e}")
    sys.exit(1)

# 基本功能測試
async def test_basic_functionality():
    print("\n🧪 測試基本功能...")
    
    # 測試協調者創建
    orchestrator = PDCAOrchestrator(api_key=None)  # 強制模擬模式
    print(f"協調者模式：{orchestrator.mode}")
    
    # 測試任務執行
    import asyncio
    results = await orchestrator.execute_parallel("測試系統")
    
    print(f"執行模式：{results['mode']}")
    print(f"結果數量：{len(results.get('results', {}))}")
    
    return results

if __name__ == "__main__":
    import asyncio
    try:
        results = asyncio.run(test_basic_functionality())
        print("✅ 基本功能測試通過")
    except Exception as e:
        print(f"❌ 測試失敗：{e}")
        sys.exit(1)