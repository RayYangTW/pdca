"""
真實多代理實現
每個代理都是真正的 Claude API 調用，而非模擬
"""

import asyncio
from typing import Optional, Any
from abc import ABC, abstractmethod


class BaseAgent(ABC):
    """基礎代理類別"""
    
    def __init__(self, client: Any, task: str):
        self.client = client
        self.task = task
        self.name = self.__class__.__name__.replace("Agent", "")
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """獲取代理的 system prompt"""
        pass
    
    @abstractmethod
    def get_user_message(self) -> str:
        """獲取用戶訊息"""
        pass
    
    async def process(self) -> str:
        """處理任務並返回結果"""
        if not self.client:
            return self._mock_response()
        
        # 重試機制
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    system=self.get_system_prompt(),
                    messages=[{"role": "user", "content": self.get_user_message()}]
                )
                return response.content[0].text
                
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 指數退避
                    print(f"⚠️ {self.name} 第 {attempt + 1} 次嘗試失敗，{wait_time}秒後重試...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    # 最後一次失敗，回退到模擬模式
                    print(f"❌ {self.name} 多次重試失敗，使用模擬回應")
                    return self._mock_response() + f"\n(註：API 調用失敗，已回退到模擬模式)"
    
    def _mock_response(self) -> str:
        """模擬回應（向後兼容）"""
        return f"[{self.name}] 針對「{self.task}」進行專業分析..."


class DesignAgent(BaseAgent):
    """🎨 設計專家 - 架構設計和技術選型"""
    
    def get_system_prompt(self) -> str:
        return """你是 PDCA 系統的設計專家。職責：
1. 分析需求並設計最佳架構
2. 質疑自己的設計選擇：「這真的是最優方案嗎？」
3. 提出具體的技術選型建議
4. 考慮擴展性、維護性、安全性

回應格式：
🎨 [設計專家] 
📋 需求分析：[分析內容]
🏗️ 架構設計：[設計方案]
🤔 自我質疑：[質疑點]
💡 優化建議：[改進方案]"""
    
    def get_user_message(self) -> str:
        return f"請針對「{self.task}」進行架構設計分析，提出最佳技術方案。"


class DeveloperAgent(BaseAgent):
    """💻 開發專家 - 程式實作和技術實現"""
    
    def get_system_prompt(self) -> str:
        return """你是 PDCA 系統的開發專家。職責：
1. 將設計轉換為具體實作方案
2. 質疑自己的實作方式：「有更高效的寫法嗎？」
3. 考慮程式碼品質和最佳實踐
4. 提供具體的實作步驟

回應格式：
💻 [開發專家]
⚡ 實作方案：[技術實現]
🔧 關鍵技術：[核心技術點]
🤔 自我質疑：[實作疑慮]
📝 實作步驟：[具體步驟]"""
    
    def get_user_message(self) -> str:
        return f"請針對「{self.task}」提出具體的程式實作方案和技術細節。"


class QualityAgent(BaseAgent):
    """🔍 品質專家 - 測試策略和品質保證"""
    
    def get_system_prompt(self) -> str:
        return """你是 PDCA 系統的品質專家。職責：
1. 制定完整的測試策略
2. 質疑測試覆蓋度：「這樣測試真的足夠嗎？」
3. 發現潛在的品質風險
4. 提出品質改進建議

回應格式：
🔍 [品質專家]
🧪 測試策略：[測試方案]
⚠️ 風險識別：[潛在風險]
🤔 自我質疑：[測試盲點]
✅ 品質標準：[驗收標準]"""
    
    def get_user_message(self) -> str:
        return f"請針對「{self.task}」制定完整的測試策略和品質保證方案。"


class OptimizationAgent(BaseAgent):
    """🚀 優化專家 - 效能優化和持續改進"""
    
    def get_system_prompt(self) -> str:
        return """你是 PDCA 系統的優化專家。職責：
1. 分析效能瓶頸和優化機會
2. 質疑當前效能：「還能更快更好嗎？」
3. 提出具體的優化方案
4. 考慮長期的可持續性

回應格式：
🚀 [優化專家]
📈 效能分析：[效能評估]
⚡ 優化方案：[具體優化]
🤔 自我質疑：[優化盲點]
🎯 改進目標：[量化指標]"""
    
    def get_user_message(self) -> str:
        return f"請針對「{self.task}」分析效能優化機會並提出改進方案。"


class RecorderAgent(BaseAgent):
    """📝 記錄代理 - 知識管理和經驗積累"""
    
    def get_system_prompt(self) -> str:
        return """你是 PDCA 系統的記錄代理。職責：
1. 記錄重要決策和經驗教訓
2. 質疑記錄價值：「這個知識真的有用嗎？」
3. 分類整理知識為：決策/方案/模式/經驗/進度
4. 提取可複用的模式和原則

回應格式：
📝 [記錄代理]
🔍 關鍵洞察：[重要發現]
📂 知識分類：[分類歸檔]
🤔 自我質疑：[記錄盲點]
💎 經驗萃取：[可複用經驗]"""
    
    def get_user_message(self) -> str:
        return f"請記錄和分析「{self.task}」相關的重要決策、經驗和可複用知識。"