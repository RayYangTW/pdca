/**
 * PDCA 協調器 v2
 * 支援多風格配置的版本
 */

import { EventEmitter } from 'events';
import { TmuxManager } from '../../core/tmux-manager.js';
import { StyleEngine } from '../../core/style-engine.js';
import type { CLIOptions, Task, Agent } from '../../types/index.js';
import type { RuntimeConfig, ConfigLoadOptions } from '../../types/config.js';

export class PDCAOrchestrator extends EventEmitter {
  private tmuxManager: TmuxManager;
  private styleEngine: StyleEngine;
  private agents: Map<string, Agent> = new Map();
  private currentTask?: Task;
  private runtimeConfig?: RuntimeConfig;

  constructor() {
    super();
    this.styleEngine = new StyleEngine();
    this.tmuxManager = new TmuxManager('pdca');
  }

  /**
   * 啟動 PDCA 系統
   */
  async start(mission: string, options: CLIOptions & ConfigLoadOptions = {}): Promise<void> {
    try {
      console.log('🎯 正在啟動 PDCA 系統...');
      
      // 1. 載入風格配置
      await this.loadConfiguration(options);
      
      // 2. 使用風格引擎創建代理
      console.log('🎭 創建代理實例...');
      this.agents = this.styleEngine.createAgents();
      console.log(`  ✅ 已創建 ${this.agents.size} 個代理`);
      
      // 3. 創建任務
      this.currentTask = this.createTask(mission);
      
      // 4. 準備 tmux 環境
      await this.setupTmuxEnvironment();
      
      // 5. 啟動代理
      await this.startAgents(mission);
      
      // 6. 設置監控（如果需要）
      if (options.monitor) {
        await this.startMonitoring();
      }
      
      this.emit('system-started', {
        sessionName: this.runtimeConfig?.sessionId,
        task: this.currentTask,
        profile: this.runtimeConfig?.name
      });
      
      console.log(`\n✨ ${this.runtimeConfig?.name} 風格已啟動`);
      console.log(`📊 查看狀態: tmux attach -t ${this.tmuxManager.getSessionName()}`);
      
    } catch (error) {
      this.emit('system-error', { error });
      throw error;
    }
  }

  /**
   * 載入配置
   */
  private async loadConfiguration(options: ConfigLoadOptions): Promise<void> {
    console.log('📋 載入配置...');
    
    // 載入風格配置
    this.runtimeConfig = await this.styleEngine.loadStyle(options);
    
    // 更新 tmux session 名稱
    if (this.runtimeConfig.sessionId) {
      this.tmuxManager = new TmuxManager(this.runtimeConfig.sessionName || 'raiy-pdca');
    }
    
    console.log(`  ✅ 已載入 "${this.runtimeConfig.name}" 風格`);
  }

  /**
   * 啟動代理
   */
  private async startAgents(mission: string): Promise<void> {
    // 為每個代理設置 tmux target
    let windowIndex = 0;
    for (const [key, agent] of this.agents.entries()) {
      agent.setTmuxTarget(`${this.tmuxManager.getSessionName()}:${windowIndex}`);
      windowIndex++;
    }
    
    // 啟動所有代理
    await this.startAllAgents(mission);
  }

  /**
   * 設置 tmux 環境
   */
  private async setupTmuxEnvironment(): Promise<void> {
    console.log('🖥️  設置 tmux 環境...');
    
    // 創建主 session
    await this.tmuxManager.createSession();
    
    // 第一個窗口已經由 createSession 創建為 'pdca-plan'
    // 我們為其餘代理創建窗口
    const agentKeys = Array.from(this.agents.keys());
    
    // 從第二個代理開始創建窗口（第一個用預設的 pdca-plan）
    for (let i = 1; i < agentKeys.length; i++) {
      const agentKey = agentKeys[i];
      const agent = this.agents.get(agentKey)!;
      await this.tmuxManager.createWindow(agent.name, i);
    }
    
    // 創建監控窗口
    await this.tmuxManager.createWindow('monitor', agentKeys.length);
  }

  /**
   * 啟動所有代理
   */
  private async startAllAgents(mission: string): Promise<void> {
    console.log('🚀 啟動代理...');
    
    const agents = Array.from(this.agents.values());
    
    // 按順序啟動代理（避免資源競爭）
    for (const agent of agents) {
      try {
        console.log(`  ${agent.icon} 啟動 ${agent.role}...`);
        await agent.start(mission);
        
        // 稍等一下再啟動下一個代理
        await this.sleep(this.runtimeConfig?.execution.startup_delay || 1500);
      } catch (error) {
        console.error(`啟動 ${agent.name} 失敗:`, error);
        throw error;
      }
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
    profile?: string;
    agents: Array<{ name: string; status: string }>;
  } {
    return {
      isRunning: this.currentTask?.status === 'running',
      task: this.currentTask,
      profile: this.runtimeConfig?.name,
      agents: Array.from(this.agents.values()).map(agent => ({
        name: agent.name,
        status: agent.getStatus()
      }))
    };
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
    console.log('📊 啟動監控介面...');
    
    // 動態導入監控模組（避免在非監控模式下載入 blessed）
    const { startMonitor } = await import('../../core/monitor.js');
    
    const monitor = startMonitor({
      sessionName: this.tmuxManager.getSessionName(),
      workingDir: process.cwd(),
      updateInterval: 2000 // 每2秒更新一次
    });
    
    // 設置代理和任務
    monitor.setAgents(Array.from(this.agents.values()));
    if (this.currentTask) {
      monitor.setTask(this.currentTask);
    }
    
    // 監聽代理事件並更新監控
    this.agents.forEach((agent, name) => {
      agent.on('starting', () => {
        monitor.updateAgent(name, { status: 'starting' });
        monitor.log('info', `${agent.role} 開始啟動`);
      });
      
      agent.on('started', () => {
        monitor.updateAgent(name, { status: 'running' });
        monitor.log('info', `${agent.role} 啟動完成`);
      });
      
      agent.on('error', (error: any) => {
        monitor.updateAgent(name, { status: 'error', message: error.message });
        monitor.log('error', `${agent.role} 發生錯誤: ${error.message}`);
      });
      
      agent.on('completed', () => {
        monitor.updateAgent(name, { status: 'completed' });
        monitor.log('info', `${agent.role} 完成任務`);
      });
    });
    
    // 監聽系統事件
    this.on('system-error', ({ error }) => {
      monitor.log('error', `系統錯誤: ${error.message}`);
    });
    
    monitor.on('stop', () => {
      console.log('監控介面已關閉');
    });
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
   * 取得可用的風格列表
   */
  async getAvailableStyles(): Promise<string[]> {
    return this.styleEngine.getAvailableStyles();
  }

  /**
   * 切換風格（需要重啟系統）
   */
  async switchStyle(styleName: string): Promise<void> {
    console.log(`切換到 ${styleName} 風格...`);
    
    // 停止當前系統
    if (this.currentTask?.status === 'running') {
      await this.stop();
    }
    
    // 重新載入新風格
    await this.styleEngine.loadStyle({ profile: styleName });
    
    console.log(`已切換到 ${styleName} 風格，請重新啟動系統`);
  }

  /**
   * 休眠工具函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}