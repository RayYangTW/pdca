#!/usr/bin/env python3
"""
PDCA 通信協議
定義統一的訊息格式和身份標識系統
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum
import json

class MessageType(Enum):
    """訊息類型"""
    TASK_ASSIGNMENT = "task_assignment"      # 任務分派
    INITIAL_SOLUTION = "initial_solution"    # 初步方案
    SELF_DOUBT = "self_doubt"               # 自我質疑
    RESEARCH_FINDING = "research_finding"    # 搜尋發現
    SOLUTION_UPDATE = "solution_update"      # 方案更新
    USER_INTERVENTION = "user_intervention"  # 用戶介入
    STATUS_REPORT = "status_report"         # 狀態報告
    COLLABORATION = "collaboration"         # 代理協作

class AgentIdentity:
    """代理身份定義"""
    COORDINATOR = ("coordinator", "[協調者]", "🎯", "主協調者")
    DESIGN = ("design", "[🎨 設計專家]", "🎨", "架構設計")
    DEVELOP = ("develop", "[💻 開發專家]", "💻", "程式實作")
    QUALITY = ("quality", "[🔍 品質專家]", "🔍", "測試驗證")
    OPTIMIZE = ("optimize", "[🚀 優化專家]", "🚀", "性能改善")
    SYSTEM = ("system", "[系統]", "⚙️", "系統訊息")
    
    @classmethod
    def get_display_name(cls, agent_id: str) -> str:
        """根據ID獲取顯示名稱"""
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, tuple) and attr[0] == agent_id:
                return attr[1]
        return f"[{agent_id}]"
    
    @classmethod
    def get_emoji(cls, agent_id: str) -> str:
        """根據ID獲取表情符號"""
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, tuple) and attr[0] == agent_id:
                return attr[2]
        return "❓"

@dataclass
class Message:
    """統一訊息格式"""
    sender_id: str              # 發送者ID
    receiver_id: str            # 接收者ID
    message_type: MessageType   # 訊息類型
    content: Dict[str, Any]     # 訊息內容
    timestamp: str = None       # 時間戳記
    message_id: str = None      # 訊息ID
    reply_to: str = None        # 回覆的訊息ID
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
        if not self.message_id:
            self.message_id = f"{self.sender_id}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message_type": self.message_type.value,
            "content": self.content,
            "timestamp": self.timestamp,
            "reply_to": self.reply_to
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        """從字典創建"""
        return cls(
            sender_id=data["sender_id"],
            receiver_id=data["receiver_id"],
            message_type=MessageType(data["message_type"]),
            content=data["content"],
            timestamp=data.get("timestamp"),
            message_id=data.get("message_id"),
            reply_to=data.get("reply_to")
        )
    
    def format_display(self) -> str:
        """格式化顯示"""
        sender_name = AgentIdentity.get_display_name(self.sender_id)
        
        # 根據訊息類型格式化內容
        if self.message_type == MessageType.INITIAL_SOLUTION:
            return f"{sender_name} 我建議：{self.content.get('solution', '')}"
        
        elif self.message_type == MessageType.SELF_DOUBT:
            return f"{sender_name}   🤔 但我在質疑：{self.content.get('doubt', '')}"
        
        elif self.message_type == MessageType.RESEARCH_FINDING:
            action = self.content.get('action', '搜尋')
            finding = self.content.get('finding', '')
            if action == "searching":
                return f"{sender_name}   🔍 正在搜尋：{finding}"
            else:
                return f"{sender_name}   💡 發現：{finding}"
        
        elif self.message_type == MessageType.USER_INTERVENTION:
            return f"{sender_name} {self.content.get('instruction', '')}"
        
        elif self.message_type == MessageType.STATUS_REPORT:
            status = self.content.get('status', '')
            detail = self.content.get('detail', '')
            return f"{sender_name} {status} {detail}"
        
        else:
            return f"{sender_name} {self.content.get('message', str(self.content))}"

class MessageQueue:
    """訊息隊列管理"""
    
    def __init__(self, base_path: str = ".pdca/messages"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.queues = {}  # 每個代理的訊息隊列
        self._load_queues()
    
    def _load_queues(self):
        """載入現有隊列"""
        for agent_dir in self.base_path.glob("*/"):
            if agent_dir.is_dir():
                agent_id = agent_dir.name
                self.queues[agent_id] = []
                
                # 載入該代理的訊息
                inbox = agent_dir / "inbox"
                if inbox.exists():
                    for msg_file in inbox.glob("*.json"):
                        try:
                            with open(msg_file, "r", encoding="utf-8") as f:
                                msg_data = json.load(f)
                                self.queues[agent_id].append(Message.from_dict(msg_data))
                        except:
                            pass
    
    def send_message(self, message: Message):
        """發送訊息"""
        # 確保接收者隊列存在
        receiver_path = self.base_path / message.receiver_id / "inbox"
        receiver_path.mkdir(parents=True, exist_ok=True)
        
        # 保存訊息
        msg_file = receiver_path / f"{message.message_id}.json"
        with open(msg_file, "w", encoding="utf-8") as f:
            json.dump(message.to_dict(), f, indent=2, ensure_ascii=False)
        
        # 更新內存隊列
        if message.receiver_id not in self.queues:
            self.queues[message.receiver_id] = []
        self.queues[message.receiver_id].append(message)
    
    def get_messages(self, agent_id: str, clear: bool = False) -> List[Message]:
        """獲取代理的訊息"""
        messages = self.queues.get(agent_id, [])
        
        if clear:
            # 清空隊列
            self.queues[agent_id] = []
            # 清空檔案
            inbox = self.base_path / agent_id / "inbox"
            if inbox.exists():
                for msg_file in inbox.glob("*.json"):
                    msg_file.unlink()
        
        return messages

class ProtocolFormatter:
    """協議格式化工具"""
    
    @staticmethod
    def format_agent_thinking(agent_id: str, thoughts: List[str]) -> str:
        """格式化代理思考過程"""
        display_name = AgentIdentity.get_display_name(agent_id)
        emoji = AgentIdentity.get_emoji(agent_id)
        
        output = f"\n{display_name} 思考過程：\n"
        output += "-" * 30 + "\n"
        
        for thought in thoughts:
            output += f"{emoji} {thought}\n"
        
        return output
    
    @staticmethod
    def format_solution_evolution(agent_id: str, 
                                 initial: str, 
                                 doubt: str, 
                                 research: str, 
                                 final: str) -> str:
        """格式化方案演進過程"""
        display_name = AgentIdentity.get_display_name(agent_id)
        
        output = f"\n{display_name} 方案演進：\n"
        output += f"  初步方案：{initial}\n"
        output += f"  ↓ 質疑：{doubt}\n"
        output += f"  ↓ 研究：{research}\n"
        output += f"  ✓ 優化方案：{final}\n"
        
        return output
    
    @staticmethod
    def format_collaboration(sender_id: str, 
                            receiver_id: str, 
                            topic: str, 
                            suggestion: str) -> str:
        """格式化代理間協作"""
        sender_name = AgentIdentity.get_display_name(sender_id)
        receiver_name = AgentIdentity.get_display_name(receiver_id)
        
        return f"{sender_name} → {receiver_name}: 關於{topic}，建議{suggestion}"
    
    @staticmethod
    def format_status_summary(agents_status: Dict[str, Dict]) -> str:
        """格式化狀態摘要"""
        output = "\n📊 團隊狀態摘要\n"
        output += "=" * 40 + "\n"
        
        for agent_id, status in agents_status.items():
            display_name = AgentIdentity.get_display_name(agent_id)
            emoji = AgentIdentity.get_emoji(agent_id)
            
            status_text = status.get("status", "unknown")
            status_emoji = {
                "working": "🔄",
                "ready": "✅",
                "waiting": "⏳",
                "error": "❌"
            }.get(status_text, "❓")
            
            output += f"{emoji} {display_name}: {status_emoji} {status_text}\n"
            
            if status.get("current_solution"):
                output += f"   方案: {status['current_solution']}\n"
            
            if status.get("progress"):
                output += f"   進度: {status['progress']}%\n"
        
        return output

# 導入必要的模組
from pathlib import Path

# 示例使用
if __name__ == "__main__":
    # 測試訊息格式
    msg = Message(
        sender_id="design",
        receiver_id="coordinator",
        message_type=MessageType.INITIAL_SOLUTION,
        content={
            "solution": "採用微服務架構配合API Gateway"
        }
    )
    
    print("訊息物件：")
    print(msg.to_dict())
    print("\n格式化顯示：")
    print(msg.format_display())
    
    # 測試身份系統
    print("\n身份系統測試：")
    print(f"設計專家顯示名: {AgentIdentity.get_display_name('design')}")
    print(f"設計專家表情: {AgentIdentity.get_emoji('design')}")
    
    # 測試格式化工具
    print("\n格式化工具測試：")
    print(ProtocolFormatter.format_agent_thinking(
        "design", 
        ["這個架構夠靈活嗎？", "安全性考慮足夠嗎？", "擴展性如何？"]
    ))
    
    print(ProtocolFormatter.format_solution_evolution(
        "design",
        "單體架構",
        "擴展性不足",
        "研究微服務模式",
        "微服務 + API Gateway"
    ))