#!/usr/bin/env python3
"""
PDCA 主協調者 (Master Coordinator)
用戶唯一對話窗口，負責協調所有專業代理
"""

import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum

class AgentType(Enum):
    """代理類型"""
    DESIGN = ("design", "🎨 設計專家", "設計架構方案")
    DEVELOP = ("develop", "💻 開發專家", "實作程式碼")
    QUALITY = ("quality", "🔍 品質專家", "測試與驗證")
    OPTIMIZE = ("optimize", "🚀 優化專家", "改善與提升")

class InterventionCommand(Enum):
    """用戶介入指令"""
    INTERVENE = "intervene"  # 介入特定代理
    CONTINUE = "continue"    # 繼續執行
    STATUS = "status"        # 查看狀態
    PAUSE = "pause"         # 暫停所有代理
    RESUME = "resume"       # 恢復執行

class MasterCoordinator:
    """主協調者 - 用戶唯一對話介面"""
    
    def __init__(self):
        self.base_path = Path(".pdca")
        self.messages_path = self.base_path / "messages"
        self.coordinator_path = self.base_path / "coordinator"
        self.current_task = None
        self.agents_status = {}
        self.conversation_history = []
        self._ensure_directories()
    
    def _ensure_directories(self):
        """確保必要目錄存在"""
        self.coordinator_path.mkdir(parents=True, exist_ok=True)
        (self.coordinator_path / "sessions").mkdir(exist_ok=True)
        (self.coordinator_path / "interventions").mkdir(exist_ok=True)
    
    def output(self, message: str, source: str = "協調者"):
        """統一輸出格式"""
        formatted = f"[{source}] {message}"
        print(formatted)
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "source": source,
            "message": message
        })
        return formatted
    
    async def receive_task(self, user_request: str):
        """接收用戶需求（神聖不可質疑）"""
        self.current_task = {
            "request": user_request,
            "received_at": datetime.now().isoformat(),
            "status": "analyzing"
        }
        
        self.output(f"收到您的需求：{user_request}")
        self.output("正在分析需求並分派給專業團隊...")
        
        # 保存任務
        self._save_current_task()
        
        # 開始協調流程
        await self.coordinate_agents()
    
    async def coordinate_agents(self):
        """協調所有代理工作"""
        self.output("以下是團隊的初步分析：")
        print()
        
        # 初始化所有代理狀態
        for agent_type in AgentType:
            self.agents_status[agent_type.value[0]] = {
                "status": "working",
                "current_solution": None,
                "doubts": [],
                "alternatives": []
            }
        
        # 並行啟動所有代理
        tasks = []
        for agent_type in AgentType:
            task = asyncio.create_task(
                self._agent_work(agent_type)
            )
            tasks.append(task)
        
        # 等待所有代理完成初步分析
        await asyncio.gather(*tasks)
        
        # 提供介入點
        self._show_intervention_point()
    
    async def _agent_work(self, agent_type: AgentType):
        """模擬代理工作過程"""
        agent_id, display_name, role = agent_type.value
        
        # 模擬初步方案
        initial_solution = self._generate_initial_solution(agent_id)
        self.output(f"我建議：{initial_solution}", display_name)
        
        # 質疑自己的解決方案
        doubt = self._generate_self_doubt(agent_id, initial_solution)
        self.output(f"  🤔 但我在質疑：{doubt}", display_name)
        
        # 主動搜尋更好的方案
        self.output(f"  🔍 正在搜尋：相關的最新最佳實踐...", display_name)
        
        # 發現更好的方案
        better_solution = self._discover_better_solution(agent_id)
        self.output(f"  💡 發現：{better_solution}", display_name)
        print()
        
        # 更新代理狀態
        self.agents_status[agent_id].update({
            "current_solution": initial_solution,
            "doubts": [doubt],
            "alternatives": [better_solution]
        })
    
    def _generate_initial_solution(self, agent_id: str) -> str:
        """生成初步解決方案"""
        solutions = {
            "design": "使用傳統的三層架構",
            "develop": "使用基礎的框架實作",
            "quality": "進行基本的單元測試",
            "optimize": "優化最明顯的性能瓶頸"
        }
        return solutions.get(agent_id, "標準解決方案")
    
    def _generate_self_doubt(self, agent_id: str, solution: str) -> str:
        """生成自我質疑"""
        doubts = {
            "design": "這真的是最具擴展性的架構嗎？",
            "develop": "有沒有更高效的實作方式？",
            "quality": "測試覆蓋率真的足夠嗎？",
            "optimize": "這解決了根本問題嗎？"
        }
        return doubts.get(agent_id, "這是最佳方案嗎？")
    
    def _discover_better_solution(self, agent_id: str) -> str:
        """發現更好的解決方案"""
        better_solutions = {
            "design": "微服務架構配合事件驅動可能更適合",
            "develop": "使用最新的框架可提升50%效率",
            "quality": "採用行為驅動測試能更好覆蓋業務場景",
            "optimize": "從架構層面重新設計可能更有效"
        }
        return better_solutions.get(agent_id, "發現更優的方案")
    
    def _show_intervention_point(self):
        """顯示介入點"""
        self.output("-" * 50)
        self.output("💡 介入點：您想要調整任何方案嗎？")
        self.output("   輸入 /intervene [代理名] [指示] 來介入")
        self.output("   輸入 /continue 讓團隊繼續")
        self.output("   輸入 /status 查看當前進度")
        self.output("   範例: /intervene design 請考慮微服務架構")
    
    async def handle_user_intervention(self, command: str):
        """處理用戶介入"""
        parts = command.strip().split(maxsplit=2)
        
        if not parts or not parts[0].startswith('/'):
            self.output("無效的指令格式。請使用 /command 格式", "系統")
            return
        
        cmd = parts[0][1:]  # 移除 /
        
        if cmd == InterventionCommand.CONTINUE.value:
            self.output("團隊繼續工作中...")
            await self._continue_work()
        
        elif cmd == InterventionCommand.STATUS.value:
            self._show_status()
        
        elif cmd == InterventionCommand.INTERVENE.value:
            if len(parts) < 3:
                self.output("介入指令格式: /intervene [代理名] [指示]", "系統")
                return
            agent_name = parts[1]
            instruction = parts[2]
            await self._intervene_agent(agent_name, instruction)
        
        elif cmd == InterventionCommand.PAUSE.value:
            self._pause_all_agents()
        
        elif cmd == InterventionCommand.RESUME.value:
            await self._resume_all_agents()
        
        else:
            self.output(f"未知的指令: {cmd}", "系統")
    
    async def _intervene_agent(self, agent_name: str, instruction: str):
        """介入特定代理"""
        # 找到對應的代理
        agent_type = None
        for atype in AgentType:
            if agent_name in atype.value[0] or agent_name in atype.value[1]:
                agent_type = atype
                break
        
        if not agent_type:
            self.output(f"找不到代理: {agent_name}", "系統")
            return
        
        agent_id, display_name, _ = agent_type.value
        
        self.output(f"正在轉達您的指示給{display_name}...")
        self.output(f"收到！正在根據「{instruction}」調整方案...", display_name)
        
        # 更新代理狀態
        self.agents_status[agent_id]["status"] = "adjusting"
        self.agents_status[agent_id]["user_instruction"] = instruction
        
        # 模擬代理調整方案
        await asyncio.sleep(1)  # 模擬處理時間
        
        adjusted_solution = f"根據您的指示，已調整方案以{instruction}"
        self.output(f"✅ 調整完成：{adjusted_solution}", display_name)
        
        self.agents_status[agent_id]["current_solution"] = adjusted_solution
        self.agents_status[agent_id]["status"] = "ready"
    
    def _show_status(self):
        """顯示當前狀態"""
        self.output("📊 當前團隊狀態：")
        for agent_type in AgentType:
            agent_id, display_name, _ = agent_type.value
            status = self.agents_status.get(agent_id, {})
            status_emoji = {
                "working": "🔄",
                "ready": "✅",
                "adjusting": "🔧",
                "paused": "⏸️"
            }.get(status.get("status", "unknown"), "❓")
            
            self.output(f"{display_name}: {status_emoji} {status.get('status', 'unknown')}")
            if status.get("current_solution"):
                self.output(f"  當前方案：{status['current_solution']}")
    
    async def _continue_work(self):
        """繼續工作流程"""
        self.output("團隊正在整合所有方案...")
        
        # 模擬整合過程
        await asyncio.sleep(2)
        
        self.output("✅ 方案整合完成！以下是最終建議：")
        self._show_final_recommendations()
    
    def _show_final_recommendations(self):
        """顯示最終建議"""
        self.output("-" * 50)
        self.output("📋 綜合建議：")
        
        for agent_type in AgentType:
            agent_id, display_name, role = agent_type.value
            solution = self.agents_status[agent_id].get("current_solution", "待定")
            self.output(f"{display_name}: {solution}")
        
        self.output("-" * 50)
        self.output("🎯 下一步行動：開始實施或繼續討論？")
    
    def _pause_all_agents(self):
        """暫停所有代理"""
        self.output("⏸️ 已暫停所有代理工作")
        for agent_id in self.agents_status:
            self.agents_status[agent_id]["status"] = "paused"
    
    async def _resume_all_agents(self):
        """恢復所有代理"""
        self.output("▶️ 恢復所有代理工作")
        for agent_id in self.agents_status:
            self.agents_status[agent_id]["status"] = "working"
        await self.coordinate_agents()
    
    def _save_current_task(self):
        """保存當前任務狀態"""
        session_file = self.coordinator_path / "sessions" / f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        session_data = {
            "task": self.current_task,
            "agents_status": self.agents_status,
            "conversation_history": self.conversation_history
        }
        
        with open(session_file, "w", encoding="utf-8") as f:
            json.dump(session_data, f, indent=2, ensure_ascii=False)

# 測試用主函數
async def main():
    """測試主協調者"""
    coordinator = MasterCoordinator()
    
    # 模擬用戶請求
    await coordinator.receive_task("建立一個用戶登入系統")
    
    # 模擬用戶介入
    print("\n" + "="*50)
    print("模擬用戶介入...")
    print("="*50 + "\n")
    
    await coordinator.handle_user_intervention("/intervene design 請考慮支援SSO")
    await coordinator.handle_user_intervention("/status")
    await coordinator.handle_user_intervention("/continue")

if __name__ == "__main__":
    asyncio.run(main())