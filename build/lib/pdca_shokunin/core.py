"""
PDCA 真實多代理協調核心
基於 Anthropic 官方模式的並行執行引擎
"""

import asyncio
import os
import time
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import json

try:
    from anthropic import AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    print("⚠️ anthropic 套件未安裝，將使用模擬模式")


class PDCAOrchestrator:
    """輕量級真實多代理協調者"""
    
    def __init__(self, api_key: Optional[str] = None, enable_recorder: bool = True):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.enable_recorder = enable_recorder
        self.client = None
        self.agents = []
        self.results = {}
        
        # 初始化 Claude 客戶端
        if ANTHROPIC_AVAILABLE and self.api_key:
            self.client = AsyncAnthropic(api_key=self.api_key)
            self.mode = "real"
        else:
            self.mode = "mock"
            if not self.api_key:
                print("💡 提示：設定 ANTHROPIC_API_KEY 環境變數以啟用真實多代理模式")
    
    def setup_agents(self, task: str):
        """設置五大專家代理"""
        from .agents import DesignAgent, DeveloperAgent, QualityAgent, OptimizationAgent, RecorderAgent
        
        self.agents = [
            DesignAgent(self.client, task),
            DeveloperAgent(self.client, task), 
            QualityAgent(self.client, task),
            OptimizationAgent(self.client, task)
        ]
        
        if self.enable_recorder:
            self.agents.append(RecorderAgent(self.client, task))
    
    async def execute_parallel(self, task: str) -> Dict[str, Any]:
        """並行執行多代理任務"""
        if self.mode == "mock":
            return self._execute_mock(task)
            
        self.setup_agents(task)
        
        # 真實並行執行
        start_time = time.time()
        
        try:
            # 使用 asyncio.gather 並行調用所有代理，設定超時
            tasks = [agent.process() for agent in self.agents]
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=120.0  # 2分鐘超時
            )
            
            # 處理結果
            agent_results = {}
            errors = 0
            
            for i, (agent, result) in enumerate(zip(self.agents, results)):
                if isinstance(result, Exception):
                    agent_results[agent.name] = f"❌ 錯誤：{str(result)}"
                    errors += 1
                else:
                    agent_results[agent.name] = result
            
            execution_time = time.time() - start_time
            
            # 如果錯誤過多，降級到模擬模式
            if errors >= len(self.agents) // 2:
                print(f"⚠️ 多數代理失敗 ({errors}/{len(self.agents)})，回退到模擬模式")
                return self._execute_mock(task)
            
            return {
                "mode": "real_parallel",
                "execution_time": execution_time,
                "agents": len(self.agents),
                "errors": errors,
                "results": agent_results,
                "summary": self._generate_summary(agent_results)
            }
            
        except asyncio.TimeoutError:
            print("⚠️ 執行超時，回退到模擬模式")
            return self._execute_mock(task)
        except Exception as e:
            print(f"⚠️ 並行執行失敗，回退到模擬模式：{e}")
            return self._execute_mock(task)
    
    def _execute_mock(self, task: str) -> Dict[str, Any]:
        """模擬模式執行（向後兼容）"""
        return {
            "mode": "mock_simulation", 
            "task": task,
            "results": {
                "🎨 設計專家": f"針對「{task}」進行架構設計分析...",
                "💻 開發專家": f"實現「{task}」的核心功能...",
                "🔍 品質專家": f"為「{task}」建立測試策略...",
                "🚀 優化專家": f"優化「{task}」的效能表現...",
            },
            "summary": "模擬模式：專家團隊已完成初步分析，等待真實 API 整合啟用"
        }
    
    def _generate_summary(self, results: Dict[str, str]) -> str:
        """生成執行摘要"""
        successful = sum(1 for r in results.values() if not r.startswith("❌"))
        total = len(results)
        
        return f"✅ {successful}/{total} 代理成功執行，真實並行協作完成"


class TokenMonitor:
    """輕量級 Token 使用監控"""
    
    def __init__(self):
        self.usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    
    def track(self, response):
        """追蹤 API 回應的 token 使用"""
        if hasattr(response, "usage"):
            self.usage["prompt_tokens"] += response.usage.input_tokens or 0
            self.usage["completion_tokens"] += response.usage.output_tokens or 0
            self.usage["total_tokens"] = self.usage["prompt_tokens"] + self.usage["completion_tokens"]
    
    def report(self) -> str:
        """回報使用狀況"""
        return f"📊 Token 使用：{self.usage['total_tokens']} (輸入:{self.usage['prompt_tokens']}, 輸出:{self.usage['completion_tokens']})"