/**
 * Raiy-PDCA 協調器
 * 管理 5 個代理的並行執行
 */

import { EventEmitter } from 'events';
import { TmuxManager } from '../../core/tmux-manager.js';
import { PdcaPlanAgent } from './agents/pdca-plan.js';
import { PdcaDoAgent } from './agents/pdca-do.js';
import { PdcaCheckAgent } from './agents/pdca-check.js';
import { PdcaActAgent } from './agents/pdca-act.js';
import { KnowledgeAgent } from './agents/knowledge-agent.js';
import type { ShokuninConfig, CLIOptions, Task, Agent } from '../../types/index.js';

export class ShokuninOrchestrator extends EventEmitter {
  private config: ShokuninConfig;
  private tmuxManager: TmuxManager;
  private agents: Map<string, Agent> = new Map();
  private currentTask?: Task;

  constructor(config: ShokuninConfig) {
    super();
    this.config = config;
    this.tmuxManager = new TmuxManager(config.sessionName);
    
    this.initializeAgents();
  }

  /**
   * 啟動 Raiy-PDCA 系統
   */
  async start(mission: string, options: CLIOptions = {}): Promise<void> {
    try {
      console.log('🎯 正在啟動 Raiy-PDCA 系統...');
      
      // 1. 創建任務
      this.currentTask = this.createTask(mission);
      
      // 2. 準備 tmux 環境
      await this.setupTmuxEnvironment();
      
      // 3. 啟動所有代理
      await this.startAllAgents(mission);
      
      // 4. 設置監控（如果需要）
      if (options.monitor) {
        await this.startMonitoring();
      }
      
      this.emit('system-started', {
        sessionName: this.config.sessionName,
        task: this.currentTask
      });
      
    } catch (error) {
      this.emit('system-error', { error });
      throw error;
    }
  }

  /**
   * 停止系統
   */
  async stop(): Promise<void> {
    console.log('🛑 正在停止 Raiy-PDCA 系統...');
    
    try {
      // 停止所有代理
      await this.stopAllAgents();
      
      // 清理 tmux session
      await this.tmuxManager.killSession();
      
      this.emit('system-stopped');
    } catch (error) {
      this.emit('system-error', { error });
      throw error;
    }
  }

  /**
   * 獲取系統狀態
   */
  getStatus(): {
    isRunning: boolean;
    task?: Task;
    agents: Array<{ name: string; status: string }>;
  } {
    return {
      isRunning: this.currentTask?.status === 'running',
      task: this.currentTask,
      agents: Array.from(this.agents.values()).map(agent => ({
        name: agent.name,
        status: agent.getStatus()
      }))
    };
  }

  /**
   * 初始化代理
   */
  private initializeAgents(): void {
    // 創建 PDCA + Knowledge 代理
    const agents = [
      new PdcaPlanAgent(),
      new PdcaDoAgent(),
      new PdcaCheckAgent(),
      new PdcaActAgent(),
      new KnowledgeAgent()
    ];

    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
      
      // 監聽代理事件
      agent.on('started', (data) => {
        console.log(`${agent.icon} ${agent.role} 已啟動`);
        this.emit('agent-started', data);
      });
      
      agent.on('error', (data) => {
        console.error(`${agent.icon} ${agent.role} 發生錯誤:`, data.error);
        this.emit('agent-error', data);
      });
      
      agent.on('status-changed', (data) => {
        this.emit('agent-status-changed', data);
      });
    });
  }

  /**
   * 設置 tmux 環境
   */
  private async setupTmuxEnvironment(): Promise<void> {
    console.log('🖥️  設置 tmux 環境...');
    
    // 創建主 session
    await this.tmuxManager.createSession();
    
    // 為每個代理創建窗口
    const agentNames = Array.from(this.agents.keys());
    
    for (let i = 1; i < agentNames.length; i++) {
      const agentName = agentNames[i];
      await this.tmuxManager.createWindow(agentName, i + 1);
    }
    
    // 創建監控窗口
    await this.tmuxManager.createWindow('monitor', agentNames.length + 1);
    
    // 為每個代理設置 tmux target
    agentNames.forEach((agentName, index) => {
      const agent = this.agents.get(agentName)!;
      const windowIndex = index + 1;
      agent.setTmuxTarget(`${this.config.sessionName}:${windowIndex}`);
    });
  }

  /**
   * 啟動所有代理
   */
  private async startAllAgents(mission: string): Promise<void> {
    console.log('🎭 啟動代理實例...');
    
    const agents = Array.from(this.agents.values());
    
    // 按順序啟動代理（避免資源競爭）
    for (const agent of agents) {
      try {
        console.log(`  ${agent.icon} 啟動 ${agent.role}...`);
        await agent.start(mission);
        
        // 稍等一下再啟動下一個代理
        await this.sleep(1500);
      } catch (error) {
        console.error(`啟動 ${agent.name} 失敗:`, error);
        throw error;
      }
    }
  }

  /**
   * 停止所有代理
   */
  private async stopAllAgents(): Promise<void> {
    const stopPromises = Array.from(this.agents.values()).map(agent =>
      agent.stop().catch(error => {
        console.warn(`停止代理 ${agent.name} 時發生錯誤:`, error);
      })
    );
    
    await Promise.all(stopPromises);
  }

  /**
   * 啟動監控
   */
  private async startMonitoring(): Promise<void> {
    // TODO: 實現 blessed 監控介面
    console.log('📊 啟動監控介面...');
  }

  /**
   * 創建任務
   */
  private createTask(mission: string): Task {
    const taskId = `task_${Date.now()}`;
    const agentProgress: Record<string, any> = {};
    
    Array.from(this.agents.keys()).forEach(agentName => {
      agentProgress[agentName] = {
        status: 'pending',
        progress: 0
      };
    });

    return {
      id: taskId,
      description: mission,
      createdAt: new Date(),
      status: 'pending',
      agents: agentProgress
    };
  }

  /**
   * 休眠工具函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}