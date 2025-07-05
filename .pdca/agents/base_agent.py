#!/usr/bin/env python3
"""
PDCA 基礎代理類
實現正確的質疑機制：質疑解決方案，而非用戶需求
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import asyncio
import json
from pathlib import Path

# 導入協議模組
import sys
sys.path.append(str(Path(__file__).parent.parent))
from coordinator.protocols import Message, MessageType, AgentIdentity, ProtocolFormatter

@dataclass
class Solution:
    """解決方案結構"""
    description: str                      # 方案描述
    confidence_level: float              # 信心水平 (0-1)
    pros: List[str]                      # 優點
    cons: List[str]                      # 缺點
    alternatives: List[str]              # 替代方案
    created_at: str = None              # 創建時間
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

class BaseAgent(ABC):
    """所有專業代理的基類"""
    
    def __init__(self, agent_id: str, display_name: str, emoji: str):
        self.agent_id = agent_id
        self.display_name = display_name
        self.emoji = emoji
        self.current_task = None
        self.current_solution = None
        self.solution_history = []
        self.doubts = []
        self.research_findings = []
        self.state = "idle"
        
        # 四大核心屬性
        self.skeptical_inquiry = True     # 質疑精神
        self.pursuit_excellence = True    # 追求卓越
        self.autonomous_research = True   # 自主搜尋
        self.tech_currency = True        # 技術敏銳度
    
    @abstractmethod
    def generate_initial_solution(self, task: str) -> Solution:
        """生成初步解決方案（子類實現）"""
        pass
    
    @abstractmethod
    def generate_doubts(self, solution: Solution) -> List[str]:
        """對自己的解決方案產生質疑（子類實現）"""
        pass
    
    @abstractmethod
    def research_better_solutions(self, solution: Solution, doubts: List[str]) -> List[Dict[str, Any]]:
        """研究更好的解決方案（子類實現）"""
        pass
    
    @abstractmethod
    def optimize_solution(self, initial: Solution, findings: List[Dict]) -> Solution:
        """基於研究優化解決方案（子類實現）"""
        pass
    
    async def process_task(self, task: str) -> Dict[str, Any]:
        """處理任務的完整流程"""
        self.current_task = task
        self.state = "working"
        
        # 第一步：生成初步方案（不質疑需求）
        initial_solution = self.generate_initial_solution(task)
        self.current_solution = initial_solution
        self.solution_history.append(initial_solution)
        
        # 輸出初步方案
        self._output(f"我建議：{initial_solution.description}")
        
        # 第二步：質疑自己的解決方案
        if self.skeptical_inquiry:
            doubts = self.generate_doubts(initial_solution)
            self.doubts = doubts
            
            for doubt in doubts[:1]:  # 只顯示最重要的質疑
                self._output(f"  🤔 但我在質疑：{doubt}")
        
        # 第三步：自主搜尋更好方案
        if self.autonomous_research:
            self._output(f"  🔍 正在搜尋：相關的最新最佳實踐...")
            await asyncio.sleep(0.5)  # 模擬搜尋時間
            
            findings = self.research_better_solutions(initial_solution, doubts)
            self.research_findings = findings
        
        # 第四步：追求卓越，優化方案
        if self.pursuit_excellence and findings:
            optimized_solution = self.optimize_solution(initial_solution, findings)
            self.current_solution = optimized_solution
            self.solution_history.append(optimized_solution)
            
            self._output(f"  💡 發現：{optimized_solution.description}")
        
        self.state = "ready"
        
        # 返回處理結果
        return {
            "agent_id": self.agent_id,
            "task": task,
            "initial_solution": initial_solution.description,
            "doubts": doubts,
            "findings": findings,
            "final_solution": self.current_solution.description,
            "confidence": self.current_solution.confidence_level
        }
    
    def _output(self, message: str):
        """統一輸出格式"""
        print(f"{self.display_name} {message}")
    
    def apply_user_instruction(self, instruction: str) -> Solution:
        """應用用戶指示調整方案"""
        # 基於用戶指示修改當前方案
        adjusted_solution = Solution(
            description=f"根據您的指示「{instruction}」，已調整方案",
            confidence_level=0.9,
            pros=[f"符合用戶要求：{instruction}"],
            cons=["可能需要進一步驗證"],
            alternatives=[]
        )
        
        self.current_solution = adjusted_solution
        self.solution_history.append(adjusted_solution)
        
        return adjusted_solution
    
    def get_status(self) -> Dict[str, Any]:
        """獲取代理當前狀態"""
        return {
            "agent_id": self.agent_id,
            "state": self.state,
            "current_solution": self.current_solution.description if self.current_solution else None,
            "confidence": self.current_solution.confidence_level if self.current_solution else 0,
            "doubts_count": len(self.doubts),
            "findings_count": len(self.research_findings),
            "solution_iterations": len(self.solution_history)
        }
    
    def reset(self):
        """重置代理狀態"""
        self.current_task = None
        self.current_solution = None
        self.solution_history = []
        self.doubts = []
        self.research_findings = []
        self.state = "idle"

class DesignExpert(BaseAgent):
    """設計專家 - 負責架構設計"""
    
    def __init__(self):
        super().__init__(
            agent_id="design",
            display_name="[🎨 設計專家]",
            emoji="🎨"
        )
    
    def generate_initial_solution(self, task: str) -> Solution:
        """生成初步架構方案"""
        # 分析任務，提出基礎架構
        if "登入" in task or "認證" in task:
            return Solution(
                description="採用傳統的Session-based認證架構",
                confidence_level=0.6,
                pros=["實作簡單", "技術成熟", "易於理解"],
                cons=["擴展性有限", "不適合分散式系統", "狀態管理複雜"],
                alternatives=["JWT Token", "OAuth2", "SSO"]
            )
        else:
            return Solution(
                description="採用單體式三層架構",
                confidence_level=0.5,
                pros=["開發快速", "部署簡單", "易於維護"],
                cons=["擴展性差", "技術債累積", "團隊協作困難"],
                alternatives=["微服務", "無服務器", "事件驅動"]
            )
    
    def generate_doubts(self, solution: Solution) -> List[str]:
        """質疑架構方案"""
        doubts = []
        
        # 基於信心水平產生質疑
        if solution.confidence_level < 0.7:
            doubts.append("這個架構真的能滿足未來的擴展需求嗎？")
        
        # 基於缺點產生質疑
        if "擴展性" in str(solution.cons):
            doubts.append("當用戶量增長10倍時，這個架構還能支撐嗎？")
        
        # 技術趨勢質疑
        doubts.append("有沒有更現代、更優雅的架構模式？")
        
        # 安全性質疑
        doubts.append("這個架構的安全性是否經過充分考慮？")
        
        return doubts
    
    def research_better_solutions(self, solution: Solution, doubts: List[str]) -> List[Dict[str, Any]]:
        """研究更好的架構方案"""
        findings = []
        
        # 基於質疑進行研究
        if "擴展" in str(doubts):
            findings.append({
                "source": "2024架構最佳實踐",
                "finding": "微服務架構配合API Gateway可提供更好的擴展性",
                "benefits": ["獨立部署", "技術異構", "故障隔離"],
                "considerations": ["複雜度增加", "需要服務治理"]
            })
        
        if "安全" in str(doubts):
            findings.append({
                "source": "OWASP 2024指南",
                "finding": "Zero Trust架構正在成為新標準",
                "benefits": ["更高安全性", "細粒度控制", "減少攻擊面"],
                "considerations": ["實施複雜", "性能開銷"]
            })
        
        # 總是研究最新趨勢
        findings.append({
            "source": "技術雷達2024",
            "finding": "無服務器架構在適合的場景下可大幅降低運維成本",
            "benefits": ["按需付費", "自動擴展", "零運維"],
            "considerations": ["冷啟動", "供應商鎖定"]
        })
        
        return findings
    
    def optimize_solution(self, initial: Solution, findings: List[Dict]) -> Solution:
        """優化架構方案"""
        # 基於研究結果生成優化方案
        if any("微服務" in str(f) for f in findings):
            return Solution(
                description="採用微服務架構 + API Gateway + 服務網格的現代化架構",
                confidence_level=0.85,
                pros=["高度可擴展", "技術靈活性", "故障隔離", "獨立部署"],
                cons=["初期複雜度高", "需要DevOps文化", "分散式系統挑戰"],
                alternatives=["Serverless", "Event-driven", "CQRS"]
            )
        else:
            return Solution(
                description="採用模組化單體架構，為未來微服務化預留空間",
                confidence_level=0.75,
                pros=["漸進式演進", "複雜度可控", "易於開始"],
                cons=["需要嚴格的模組邊界", "重構風險"],
                alternatives=["直接微服務", "混合架構"]
            )

# 測試
async def test_agent():
    """測試代理功能"""
    print("測試新的代理架構")
    print("=" * 50)
    
    # 創建設計專家
    designer = DesignExpert()
    
    # 處理任務
    result = await designer.process_task("建立一個用戶登入系統")
    
    print("\n" + "=" * 50)
    print("處理結果：")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 50)
    print("應用用戶指示：")
    adjusted = designer.apply_user_instruction("需要支援SSO和多因子認證")
    print(f"調整後方案：{adjusted.description}")

if __name__ == "__main__":
    asyncio.run(test_agent())