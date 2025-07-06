#!/usr/bin/env python3
"""
PDCA-Shokunin Multi-Agent System Launcher
職人級多代理協調系統啟動器

Features:
- 創建 tmux session 管理 5 個代理
- 設置 git worktree 工作空間隔離
- 啟動獨立 Claude 實例
- 提供實時 TUI 監控介面
"""

import sys
import os
import subprocess
import json
import time
from pathlib import Path
from datetime import datetime

class ShokuninLauncher:
    """PDCA-Shokunin 系統啟動器"""
    
    def __init__(self, base_dir=".pdca-shokunin"):
        self.base_dir = Path(base_dir)
        self.session_name = "pdca-shokunin"
        
        # PDCA 循環代理 + Knowledge Agent
        self.agents = [
            "pdca-plan",      # Plan 階段協調者
            "pdca-do",        # Do 階段執行者
            "pdca-check",     # Check 階段驗證者
            "pdca-act",       # Act 階段改善者
            "knowledge-agent" # 知識管理代理
        ]
        
        self.agent_configs = {
            "pdca-plan": {
                "role": "Plan 階段協調者",
                "description": "需求分析、策略制定、任務協調",
                "icon": "🎯"
            },
            "pdca-do": {
                "role": "Do 階段執行者", 
                "description": "架構設計、功能實作、代碼開發",
                "icon": "🎨"
            },
            "pdca-check": {
                "role": "Check 階段驗證者",
                "description": "品質驗證、測試檢查、結果評估", 
                "icon": "🔍"
            },
            "pdca-act": {
                "role": "Act 階段改善者",
                "description": "性能優化、問題改善、持續改進",
                "icon": "🚀"
            },
            "knowledge-agent": {
                "role": "知識管理代理",
                "description": "智能監聽、分類歸檔、經驗累積",
                "icon": "📝"
            }
        }
    
    def launch_system(self, task_description):
        """啟動 PDCA-Shokunin 多代理系統"""
        
        print("🎌 PDCA-Shokunin Multi-Agent System")
        print("=" * 50)
        print(f"📋 任務: {task_description}")
        print("🚀 系統啟動中...")
        print()
        
        try:
            # 1. 環境準備
            print("📁 準備工作環境...")
            self.setup_environment()
            
            # 2. 檢查 tmux 可用性
            print("🖥️  檢查 tmux 環境...")
            if not self.check_tmux_available():
                print("❌ tmux 未安裝或不可用")
                self.suggest_tmux_installation()
                return False
            
            # 3. 創建 tmux session
            print("🔧 創建 tmux session...")
            self.create_tmux_session()
            
            # 4. 設置 git worktrees
            print("📂 設置 git worktree 工作空間...")
            self.setup_git_worktrees()
            
            # 5. 創建任務檔案
            print("📝 創建任務配置...")
            task_id = self.create_task_config(task_description)
            
            # 6. 啟動代理實例
            print("🎭 啟動 5 個代理實例...")
            self.start_agent_instances(task_description)
            
            # 7. 啟動監控介面
            print("📊 啟動監控介面...")
            self.start_monitor_interface()
            
            print()
            print("✅ PDCA-Shokunin 系統啟動完成！")
            print(f"📊 監控介面: tmux attach -t {self.session_name}")
            print("💡 按 Ctrl+B 然後按數字鍵切換代理窗口")
            print("💡 按 Ctrl+B 然後按 d 分離 session")
            
            return True
            
        except Exception as e:
            print(f"❌ 啟動失敗: {e}")
            self.cleanup_on_error()
            return False
    
    def setup_environment(self):
        """環境設置"""
        # 創建主目錄結構
        for dir_name in ["agents", "worktrees", "communication", "tmux", "logs"]:
            (self.base_dir / dir_name).mkdir(parents=True, exist_ok=True)
        
        # 創建代理專用目錄
        for agent in self.agents:
            (self.base_dir / "agents" / agent).mkdir(parents=True, exist_ok=True)
            (self.base_dir / "communication" / agent).mkdir(parents=True, exist_ok=True)
        
        # 創建 memories 目錄
        memories_dir = Path("memories")
        for subdir in ["decisions", "solutions", "patterns", "learnings", "progress"]:
            (memories_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    def check_tmux_available(self):
        """檢查 tmux 是否可用"""
        try:
            result = subprocess.run(["tmux", "-V"], capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def suggest_tmux_installation(self):
        """建議 tmux 安裝方法"""
        print("📦 請安裝 tmux:")
        print("  macOS: brew install tmux")
        print("  Ubuntu: sudo apt install tmux") 
        print("  CentOS: sudo yum install tmux")
    
    def create_tmux_session(self):
        """創建 tmux session"""
        # 檢查 session 是否已存在
        check_cmd = ["tmux", "has-session", "-t", self.session_name]
        if subprocess.run(check_cmd, capture_output=True).returncode == 0:
            # Session 存在，殺掉重建
            subprocess.run(["tmux", "kill-session", "-t", self.session_name])
        
        # 創建新 session，第一個窗口為 pdca-plan
        subprocess.run([
            "tmux", "new-session", "-d", "-s", self.session_name,
            "-n", "pdca-plan", "-c", str(self.base_dir / "worktrees" / "pdca-plan")
        ])
        
        # 為其他代理創建窗口
        for i, agent in enumerate(self.agents[1:], 2):
            subprocess.run([
                "tmux", "new-window", "-t", f"{self.session_name}:{i}",
                "-n", agent, "-c", str(self.base_dir / "worktrees" / agent)
            ])
        
        # 創建監控窗口
        subprocess.run([
            "tmux", "new-window", "-t", f"{self.session_name}:6",
            "-n", "monitor", "-c", str(self.base_dir)
        ])
    
    def setup_git_worktrees(self):
        """設置 git worktree 工作空間"""
        worktrees_dir = self.base_dir / "worktrees"
        
        for agent in self.agents:
            worktree_path = worktrees_dir / agent
            
            # 如果 worktree 已存在，跳過
            if worktree_path.exists():
                continue
                
            try:
                # 創建 git worktree
                subprocess.run([
                    "git", "worktree", "add", str(worktree_path), "main"
                ], check=True, cwd=".")
                
                # 創建代理專用配置
                self.create_agent_config(agent, worktree_path)
                
            except subprocess.CalledProcessError as e:
                print(f"⚠️ 無法為 {agent} 創建 worktree: {e}")
                # 創建普通目錄作為後備
                worktree_path.mkdir(parents=True, exist_ok=True)
    
    def create_agent_config(self, agent, worktree_path):
        """為代理創建配置檔案"""
        config = {
            "agent_name": agent,
            "role": self.agent_configs[agent]["role"],
            "description": self.agent_configs[agent]["description"],
            "workspace": str(worktree_path),
            "created_at": datetime.now().isoformat()
        }
        
        config_file = worktree_path / ".agent_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
    
    def create_task_config(self, task_description):
        """創建任務配置"""
        task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        task_config = {
            "task_id": task_id,
            "task_description": task_description,
            "created_at": datetime.now().isoformat(),
            "status": "initiated",
            "agents": {agent: {"status": "waiting", "progress": 0} for agent in self.agents}
        }
        
        config_file = self.base_dir / "current_task.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(task_config, f, indent=2, ensure_ascii=False)
        
        return task_id
    
    def start_agent_instances(self, task_description):
        """啟動代理實例"""
        for i, agent in enumerate(self.agents, 1):
            config = self.agent_configs[agent]
            
            # 構建 Claude 啟動命令
            claude_cmd = self.build_claude_command(agent, task_description)
            
            # 在對應的 tmux 窗口中啟動 Claude
            subprocess.run([
                "tmux", "send-keys", "-t", f"{self.session_name}:{i}",
                claude_cmd, "Enter"
            ])
            
            print(f"  {config['icon']} {agent}: {config['role']}")
            time.sleep(1)  # 避免同時啟動造成資源競爭
    
    def build_claude_command(self, agent, task_description):
        """構建 Claude 啟動命令"""
        # 基礎命令
        base_cmd = "claude"
        
        # 根據代理類型載入對應的 system prompt
        if agent == "pdca-plan":
            prompt = f"你是 PDCA Plan 階段協調者。任務：{task_description}。請開始需求分析和任務規劃。"
        elif agent == "pdca-do": 
            prompt = f"你是 PDCA Do 階段執行者。等待 Plan 協調者的任務分配，準備進行架構設計和實作。"
        elif agent == "pdca-check":
            prompt = f"你是 PDCA Check 階段驗證者。等待 Do 階段的成果，準備進行品質驗證和測試。"
        elif agent == "pdca-act":
            prompt = f"你是 PDCA Act 階段改善者。等待 Check 階段的結果，準備進行優化和改善。"
        elif agent == "knowledge-agent":
            prompt = f"你是知識管理代理。請監聽其他代理的工作，智能記錄重要決策和經驗。"
        
        return f'{base_cmd} -p "{prompt}"'
    
    def start_monitor_interface(self):
        """啟動監控介面"""
        monitor_cmd = f"python3 {self.base_dir}/monitor.py"
        
        subprocess.run([
            "tmux", "send-keys", "-t", f"{self.session_name}:monitor",
            monitor_cmd, "Enter"
        ])
    
    def cleanup_on_error(self):
        """錯誤時清理資源"""
        try:
            # 殺掉 tmux session
            subprocess.run(["tmux", "kill-session", "-t", self.session_name], 
                          capture_output=True)
        except:
            pass

def main():
    """主入口函數"""
    if len(sys.argv) < 2:
        print("使用方式: python3 launcher.py '任務描述'")
        print("範例: python3 launcher.py '建立用戶登入系統'")
        return
    
    task_description = " ".join(sys.argv[1:])
    
    launcher = ShokuninLauncher()
    success = launcher.launch_system(task_description)
    
    if success:
        print(f"\\n🎯 PDCA-Shokunin 系統運行中...")
        print(f"📊 查看狀態: tmux attach -t {launcher.session_name}")
    else:
        print("\\n❌ 系統啟動失敗")
        sys.exit(1)

if __name__ == "__main__":
    main()