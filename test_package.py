#!/usr/bin/env python3
"""
測試 PDCA Shokunin 套件功能
驗證真實多代理系統是否正常運作
"""

import asyncio
import sys
import os

# 添加當前目錄到 Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pdca_shokunin import PDCAOrchestrator


async def test_mock_mode():
    """測試模擬模式"""
    print("🧪 測試模擬模式...")
    
    orchestrator = PDCAOrchestrator(api_key=None)  # 強制模擬模式
    results = await orchestrator.execute_parallel("建立一個簡單網站")
    
    assert results["mode"] == "mock_simulation"
    assert "results" in results
    assert len(results["results"]) >= 4  # 至少四個專家
    
    print("✅ 模擬模式測試通過")
    return results


async def test_real_mode():
    """測試真實模式（如果有 API Key）"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("⏭️ 跳過真實模式測試（未設定 ANTHROPIC_API_KEY）")
        return None
    
    print("🧪 測試真實多代理模式...")
    
    try:
        orchestrator = PDCAOrchestrator(api_key=api_key, enable_recorder=False)
        results = await orchestrator.execute_parallel("測試系統功能")
        
        assert results["mode"] == "real_parallel"
        assert "execution_time" in results
        assert "agents" in results
        
        print("✅ 真實模式測試通過")
        print(f"⏱️ 執行時間：{results['execution_time']:.2f}秒")
        print(f"👥 代理數量：{results['agents']}")
        
        return results
        
    except Exception as e:
        print(f"⚠️ 真實模式測試失敗：{e}")
        return None


def test_cli_import():
    """測試 CLI 模組導入"""
    print("🧪 測試 CLI 模組導入...")
    
    try:
        from pdca_shokunin.cli import main, recorder_main
        print("✅ CLI 模組導入成功")
        return True
    except ImportError as e:
        print(f"❌ CLI 模組導入失敗：{e}")
        return False


def test_agents_import():
    """測試代理模組導入"""
    print("🧪 測試代理模組導入...")
    
    try:
        from pdca_shokunin.agents import (
            DesignAgent, DeveloperAgent, QualityAgent, 
            OptimizationAgent, RecorderAgent
        )
        print("✅ 代理模組導入成功")
        return True
    except ImportError as e:
        print(f"❌ 代理模組導入失敗：{e}")
        return False


async def run_all_tests():
    """運行所有測試"""
    print("🚀 PDCA Shokunin 套件測試開始")
    print("=" * 50)
    
    results = {}
    
    # 測試模組導入
    results["cli_import"] = test_cli_import()
    results["agents_import"] = test_agents_import()
    
    # 測試核心功能
    results["mock_mode"] = await test_mock_mode()
    results["real_mode"] = await test_real_mode()
    
    print("\n" + "=" * 50)
    print("📊 測試結果摘要")
    
    # 統計結果
    passed = 0
    total = 0
    
    for test_name, result in results.items():
        total += 1
        if result:
            passed += 1
            status = "✅ 通過"
        else:
            status = "❌ 失敗"
        
        print(f"{test_name}: {status}")
    
    print(f"\n📈 測試通過率：{passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 所有測試通過！套件已準備就緒")
        return True
    else:
        print("⚠️ 部分測試失敗，請檢查問題")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)