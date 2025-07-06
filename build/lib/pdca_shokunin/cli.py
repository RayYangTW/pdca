"""
PDCA Shokunin 命令行介面
保持向後兼容，同時支援真實多代理並行執行
"""

import asyncio
import sys
import json
import os
from .core import PDCAOrchestrator
from .agents import RecorderAgent


def main():
    """主要 pdca 命令入口"""
    if len(sys.argv) < 2:
        print_usage()
        return
    
    # 解析命令行參數
    args = sys.argv[1:]
    enable_recorder = True
    
    # 處理特殊參數
    if "--no-recorder" in args:
        enable_recorder = False
        args.remove("--no-recorder")
    
    if "status" in args:
        show_status()
        return
        
    if "help" in args:
        print_help()
        return
    
    # 組合任務描述
    task = " ".join(args)
    
    if not task:
        print("❌ 請提供任務描述")
        print_usage()
        return
    
    # 執行 PDCA 協調
    run_pdca(task, enable_recorder)


def run_pdca(task: str, enable_recorder: bool = True):
    """運行 PDCA 多代理協調"""
    print(f"🎯 PDCA 多代理協調系統 2.0")
    print(f"任務：{task}")
    print("-" * 50)
    
    # 檢查 API Key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        print("✅ 真實多代理模式啟動")
        print("⚡ 五大專家並行協作中...")
    else:
        print("💡 模擬模式（設定 ANTHROPIC_API_KEY 環境變數以啟用真實模式）")
    
    print("-" * 50)
    
    # 創建協調者並執行
    orchestrator = PDCAOrchestrator(enable_recorder=enable_recorder)
    
    try:
        # 執行非同步協調
        results = asyncio.run(orchestrator.execute_parallel(task))
        
        # 顯示結果
        print_results(results)
        
        # 保存當前任務狀態
        save_current_task(task, results)
        
    except KeyboardInterrupt:
        print("\n⏹️ 用戶中斷執行")
    except Exception as e:
        print(f"❌ 執行錯誤：{e}")


def print_results(results: dict):
    """格式化顯示執行結果"""
    mode = results.get("mode", "unknown")
    
    if mode == "real_parallel":
        print(f"🚀 真實並行執行完成")
        print(f"⏱️ 執行時間：{results['execution_time']:.2f}秒")
        print(f"👥 代理數量：{results['agents']}")
        print("-" * 30)
        
        # 顯示各代理結果
        for agent_name, result in results["results"].items():
            print(f"\n{agent_name}：")
            print(result[:200] + "..." if len(result) > 200 else result)
        
        print(f"\n📊 {results['summary']}")
        
    elif mode == "mock_simulation":
        print("🎭 模擬模式執行")
        print("-" * 30)
        
        for agent_name, result in results["results"].items():
            print(f"\n{agent_name}：")
            print(result)
        
        print(f"\n💡 {results['summary']}")


def recorder_main():
    """記錄代理命令入口"""
    print("📝 PDCA 記錄代理啟動")
    
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
        print(f"🎯 分析任務：{task}")
    else:
        task = "分析最近的 PDCA 執行過程"
    
    # 生成記錄代理 prompt
    prompt = f"""# 📝 記錄代理分析

## 任務背景
{task}

作為 **[記錄代理]**，請針對最近的 PDCA 執行過程進行深度分析：

### 🔍 關鍵洞察識別
- 重要決策點和選擇理由
- 技術方案的優缺點分析
- 遇到的問題和解決思路

### 📂 知識分類歸檔
請將發現的知識分類到：
- **decisions/**: 重要架構和技術決策
- **solutions/**: 具體問題解決方案
- **patterns/**: 可複用的設計模式
- **learnings/**: 經驗教訓和改進心得
- **progress/**: 里程碑和進度追蹤

### 🤔 自我質疑檢視
- 這些記錄真的有價值嗎？
- 是否遺漏了重要的洞察？
- 如何讓這些知識更容易被複用？

### 💎 經驗萃取
- 提取可在未來專案中複用的原則和模式
- 識別需要避免的反模式
- 建議改進的工作流程

請進行深度分析並提出具體的記錄建議。"""
    
    print("-" * 50)
    print(prompt)


def show_status():
    """顯示當前狀態"""
    current_task_file = ".pdca/current_task.json"
    
    if os.path.exists(current_task_file):
        try:
            with open(current_task_file, 'r', encoding='utf-8') as f:
                task_data = json.load(f)
            
            print("📊 PDCA 系統狀態")
            print("-" * 30)
            print(f"當前任務：{task_data.get('task', 'N/A')}")
            print(f"創建時間：{task_data.get('created_at', 'N/A')}")
            print(f"執行狀態：{task_data.get('status', 'N/A')}")
            print(f"任務來源：{task_data.get('source', 'N/A')}")
            
        except Exception as e:
            print(f"❌ 讀取狀態失敗：{e}")
    else:
        print("📊 目前沒有執行中的任務")


def save_current_task(task: str, results: dict):
    """保存當前任務狀態"""
    os.makedirs(".pdca", exist_ok=True)
    
    task_data = {
        "task": task,
        "created_at": results.get("timestamp", ""),
        "status": "completed",
        "mode": results.get("mode", "unknown"),
        "source": "pip_package"
    }
    
    try:
        with open(".pdca/current_task.json", 'w', encoding='utf-8') as f:
            json.dump(task_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ 保存狀態失敗：{e}")


def print_usage():
    """顯示使用方法"""
    print("""
🎯 PDCA Shokunin 使用指南

基本用法：
  pdca [任務描述]              # 啟動五大專家協作
  pdca --no-recorder [任務]    # 不啟用記錄代理
  pdca status                  # 查看當前狀態
  pdca help                    # 顯示詳細幫助

記錄代理：
  pdca-recorder [分析主題]     # 手動觸發記錄分析

範例：
  pdca 建立一個部落格系統
  pdca --no-recorder 快速原型開發
  pdca-recorder 分析登入系統開發過程

整合 Claude CLI：
  claude -p "$(pdca 優化資料庫查詢)"
  claude -p "pdca 設計微服務架構"
""")


def print_help():
    """顯示詳細幫助"""
    print("""
🎯 PDCA Shokunin 2.0 - 真實多代理協調系統

## 核心特色
✅ 真實並行執行：5個代理同時工作（需 ANTHROPIC_API_KEY）
✅ 智能降級：API 失敗時自動回退到模擬模式
✅ 輕量設計：零配置啟動，開箱即用
✅ 職人精神：質疑方案而非需求，追求極致品質

## 環境設定
export ANTHROPIC_API_KEY="your-api-key"

## 五大專家
🎨 設計專家 - 架構設計和技術選型
💻 開發專家 - 程式實作和技術實現  
🔍 品質專家 - 測試策略和品質保證
🚀 優化專家 - 效能優化和持續改進
📝 記錄代理 - 知識管理和經驗積累（可選）

## 使用模式
1. 獨立使用：直接執行 pdca 命令
2. Claude 整合：配合 Claude CLI 使用
3. 記錄分析：使用 pdca-recorder 進行知識管理

更多資訊請參考：https://github.com/raiyyang/pdca-shokunin
""")


if __name__ == "__main__":
    main()