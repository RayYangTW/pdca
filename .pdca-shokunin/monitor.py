#!/usr/bin/env python3
"""
PDCA-Shokunin Multi-Agent System Monitor
職人級多代理協調系統監控介面

Features:
- 實時顯示 PDCA + Knowledge Agent 狀態
- 支援代理間切換和介入
- 美觀的 TUI 介面
- 任務進度追蹤
"""

import json
import time
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import threading

class ShokuninMonitor:
    """PDCA-Shokunin 監控介面"""
    
    def __init__(self, base_dir=".pdca-shokunin"):
        self.base_dir = Path(base_dir)
        self.session_name = "pdca-shokunin"
        self.running = True
        
        # PDCA 代理配置
        self.agents = {
            "pdca-plan": {"icon": "🎯", "name": "Plan 協調", "phase": "PDCA", "window": 1},
            "pdca-do": {"icon": "🎨", "name": "Do 執行", "phase": "PDCA", "window": 2},
            "pdca-check": {"icon": "🔍", "name": "Check 檢查", "phase": "PDCA", "window": 3},
            "pdca-act": {"icon": "🚀", "name": "Act 改善", "phase": "PDCA", "window": 4},
            "knowledge-agent": {"icon": "📝", "name": "Knowledge", "phase": "Support", "window": 5}
        }
        
        # 當前狀態
        self.current_task = None
        self.agent_status = {}
        self.selected_agent = "pdca-plan"
        
        # 初始化狀態
        self.load_current_task()
        self.init_agent_status()
    
    def load_current_task(self):
        """載入當前任務資訊"""
        task_file = self.base_dir / "current_task.json"
        if task_file.exists():
            with open(task_file, 'r', encoding='utf-8') as f:
                self.current_task = json.load(f)
    
    def init_agent_status(self):
        """初始化代理狀態"""
        for agent_id in self.agents:
            self.agent_status[agent_id] = {
                "status": "waiting",
                "progress": 0,
                "current_task": "準備中...",
                "last_update": datetime.now().isoformat()
            }
    
    def update_agent_status(self, agent_id, status_data):
        """更新代理狀態"""
        if agent_id in self.agent_status:
            self.agent_status[agent_id].update(status_data)
            self.agent_status[agent_id]["last_update"] = datetime.now().isoformat()
    
    def get_overall_progress(self):
        """計算整體進度"""
        if not self.agent_status:
            return 0
        
        total_progress = sum(agent["progress"] for agent in self.agent_status.values())
        return total_progress / len(self.agent_status)
    
    def get_pdca_phase_status(self):
        """獲取 PDCA 各階段狀態"""
        pdca_agents = ["pdca-plan", "pdca-do", "pdca-check", "pdca-act"]
        phase_status = {}
        
        for agent in pdca_agents:
            if agent in self.agent_status:
                phase = agent.replace("pdca-", "").upper()
                phase_status[phase] = self.agent_status[agent]
        
        return phase_status
    
    def draw_header(self):
        """繪製標題"""
        print("\\033[2J\\033[H")  # 清屏並移動到左上角
        print("🎌 \\033[1mPDCA-Shokunin Multi-Agent System\\033[0m")
        print("=" * 60)
        
        if self.current_task:
            print(f"📋 任務: {self.current_task.get('task_description', 'N/A')}")
            
        overall_progress = self.get_overall_progress()
        progress_bar = "█" * int(overall_progress/10) + "░" * (10 - int(overall_progress/10))
        eta = self.estimate_completion_time()
        print(f"⏱️  進度: {progress_bar} {overall_progress:.0f}% {eta}")
        print()
    
    def draw_pdca_status(self):
        """繪製 PDCA 循環狀態"""
        print("\\033[1mPDCA 循環狀態:\\033[0m")
        
        pdca_phases = ["PLAN", "DO", "CHECK", "ACT"]
        phase_status = self.get_pdca_phase_status()
        
        for phase in pdca_phases:
            if phase in phase_status:
                status = phase_status[phase]
                agent_id = f"pdca-{phase.lower()}"
                icon = self.agents[agent_id]["icon"]
                
                progress_bar = "█" * int(status["progress"]/10) + "░" * (10 - int(status["progress"]/10))
                
                # 高亮選中的代理
                highlight = "\\033[7m" if agent_id == self.selected_agent else ""
                reset = "\\033[0m" if agent_id == self.selected_agent else ""
                
                line = f"{highlight}{icon} {phase:6} 階段  {progress_bar} {status['progress']:>3}%  {status['current_task'][:30]}{reset}"
                print(line)
        print()
    
    def draw_knowledge_agent_status(self):
        """繪製知識管理代理狀態"""
        print("\\033[1m知識管理:\\033[0m")
        
        if "knowledge-agent" in self.agent_status:
            status = self.agent_status["knowledge-agent"]
            icon = self.agents["knowledge-agent"]["icon"]
            
            progress_bar = "█" * int(status["progress"]/10) + "░" * (10 - int(status["progress"]/10))
            
            highlight = "\\033[7m" if "knowledge-agent" == self.selected_agent else ""
            reset = "\\033[0m" if "knowledge-agent" == self.selected_agent else ""
            
            line = f"{highlight}{icon} Knowledge Agent {progress_bar} {status['progress']:>3}%  {status['current_task'][:30]}{reset}"
            print(line)
        print()
    
    def draw_controls(self):
        """繪製操作說明"""
        print("\\033[2m" + "─" * 60 + "\\033[0m")
        print("💡 操作指引:")
        print("  [↑/↓] 切換代理  [Enter] 介入指導  [Space] 查看詳情")
        print("  [R] 重新載入    [Q] 結束監控    [H] 幫助")
        print()
        
        if self.selected_agent:
            agent_info = self.agents[self.selected_agent]
            print(f"🎯 當前選中: {agent_info['icon']} {agent_info['name']}")
            print(f"   視窗切換: tmux select-window -t {self.session_name}:{agent_info['window']}")
    
    def estimate_completion_time(self):
        """估算完成時間"""
        overall_progress = self.get_overall_progress()
        if overall_progress == 0:
            return "(估算中...)"
        elif overall_progress >= 100:
            return "(已完成)"
        else:
            # 簡單估算：假設線性進度
            remaining = 100 - overall_progress
            eta_minutes = int(remaining / 10)  # 大概每10%需要1分鐘
            return f"(預計{eta_minutes}分鐘完成)"
    
    def draw_recent_activity(self):
        """繪製最近活動"""
        print("\\033[1m最近活動:\\033[0m")
        
        # 簡單顯示一些模擬活動
        activities = [
            "• Plan: 完成需求分析，開始任務分配",
            "• Do: 接收任務，開始架構設計", 
            "• Knowledge: 記錄需求分析結果",
            "• Check: 準備測試策略"
        ]
        
        for activity in activities[-4:]:
            print(f"  {activity}")
        print()
    
    def handle_input(self):
        """處理用戶輸入"""
        import termios, tty
        
        try:
            # 設置終端為非阻塞模式
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            tty.setraw(sys.stdin.fileno())
            
            while self.running:
                char = sys.stdin.read(1)
                
                if char.lower() == 'q':
                    self.running = False
                elif char.lower() == 'r':
                    self.load_current_task()
                elif char == '\\033':  # ESC sequence
                    char = sys.stdin.read(2)
                    if char == '[A':  # Up arrow
                        self.select_previous_agent()
                    elif char == '[B':  # Down arrow
                        self.select_next_agent()
                elif char == '\\r' or char == '\\n':  # Enter
                    self.intervene_agent()
                elif char == ' ':  # Space
                    self.show_agent_details()
                elif char.lower() == 'h':
                    self.show_help()
                    
        except Exception as e:
            pass
        finally:
            # 恢復終端設置
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    
    def select_previous_agent(self):
        """選擇上一個代理"""
        agents = list(self.agents.keys())
        current_index = agents.index(self.selected_agent) if self.selected_agent in agents else 0
        self.selected_agent = agents[(current_index - 1) % len(agents)]
    
    def select_next_agent(self):
        """選擇下一個代理"""
        agents = list(self.agents.keys())
        current_index = agents.index(self.selected_agent) if self.selected_agent in agents else 0
        self.selected_agent = agents[(current_index + 1) % len(agents)]
    
    def intervene_agent(self):
        """介入指導代理"""
        if self.selected_agent:
            agent_info = self.agents[self.selected_agent]
            window = agent_info["window"]
            
            print(f"\\n🎯 切換到 {agent_info['name']} 代理窗口...")
            subprocess.run([
                "tmux", "select-window", "-t", f"{self.session_name}:{window}"
            ])
    
    def show_agent_details(self):
        """顯示代理詳情"""
        if self.selected_agent and self.selected_agent in self.agent_status:
            status = self.agent_status[self.selected_agent]
            agent_info = self.agents[self.selected_agent]
            
            print(f"\\n📊 {agent_info['icon']} {agent_info['name']} 詳情:")
            print(f"   狀態: {status['status']}")
            print(f"   進度: {status['progress']}%")
            print(f"   當前任務: {status['current_task']}")
            print(f"   最後更新: {status['last_update']}")
            print("\\n按任意鍵返回...")
            
            try:
                sys.stdin.read(1)
            except:
                pass
    
    def show_help(self):
        """顯示幫助資訊"""
        print("\\n🆘 PDCA-Shokunin 監控介面幫助:")
        print("=" * 40)
        print("操作說明:")
        print("  ↑/↓ 方向鍵  - 切換選中的代理")
        print("  Enter       - 切換到選中代理的 tmux 窗口")
        print("  Space       - 查看選中代理的詳細資訊")
        print("  R           - 重新載入任務和狀態")
        print("  Q           - 退出監控介面")
        print("  H           - 顯示此幫助")
        print()
        print("tmux 快捷鍵:")
        print("  Ctrl+B 1-5  - 直接切換到對應代理窗口")
        print("  Ctrl+B d    - 分離 session (背景運行)")
        print("  Ctrl+B ?    - 顯示 tmux 幫助")
        print("\\n按任意鍵返回...")
        
        try:
            sys.stdin.read(1)
        except:
            pass
    
    def run(self):
        """運行監控介面"""
        print("🎌 PDCA-Shokunin 監控介面啟動中...")
        
        # 啟動輸入處理線程
        input_thread = threading.Thread(target=self.handle_input, daemon=True)
        input_thread.start()
        
        try:
            while self.running:
                # 繪製介面
                self.draw_header()
                self.draw_pdca_status()
                self.draw_knowledge_agent_status()
                self.draw_recent_activity()
                self.draw_controls()
                
                # 等待一段時間後更新
                time.sleep(2)
                
        except KeyboardInterrupt:
            self.running = False
        
        print("\\n👋 監控介面已退出")

def main():
    """主入口函數"""
    monitor = ShokuninMonitor()
    monitor.run()

if __name__ == "__main__":
    main()