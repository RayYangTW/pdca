/**
 * PDCA 協調器 v2
 * 支援多風格配置的版本
 */

import { EventEmitter } from 'events';
import { TmuxManager } from '../../core/tmux-manager.js';
import { StyleEngine } from '../../core/style-engine.js';
import { MultiClaudeManager } from '../../core/multi-claude-manager.js';
import { CommunicationManager } from '../../core/communication-manager.js';
import { MessageFactory, MessageType, AgentRole } from '../../core/message-protocol.js';
import { LoopController } from '../../core/loop-controller.js';
import type { CLIOptions, Task, Agent } from '../../types/index.js';
import type { RuntimeConfig, ConfigLoadOptions } from '../../types/config.js';

export class PDCAOrchestrator extends EventEmitter {
  private tmuxManager: TmuxManager;
  private styleEngine: StyleEngine;
  private multiClaudeManager: MultiClaudeManager;
  private communicationManager: CommunicationManager;
  private agents: Map<string, Agent> = new Map();
  private currentTask?: Task;
  private runtimeConfig?: RuntimeConfig;
  private useMultiClaude: boolean = false;
  private loopController?: LoopController;
  private currentIteration: number = 0;
  private isLoopRunning: boolean = false;
  private lastQuality: number = 0;

  constructor() {
    super();
    this.styleEngine = new StyleEngine();
    this.tmuxManager = new TmuxManager('pdca');
    this.multiClaudeManager = new MultiClaudeManager('pdca');
    this.communicationManager = new CommunicationManager();
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
      
      // 5. 初始化循環控制器
      this.initializeLoopController();
      
      // 6. 啟動代理
      await this.startAgents(mission);
      
      // 7. 開始 PDCA 循環
      await this.startPDCALoop(mission);
      
      // 8. 設置監控（如果需要）
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
      this.tmuxManager = new TmuxManager(this.runtimeConfig.sessionName || 'pdca');
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
      // 停止 PDCA 循環
      if (this.isLoopRunning) {
        await this.stopLoop();
      }
      
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
    loop?: {
      isRunning: boolean;
      currentIteration: number;
      lastQuality: number;
    };
  } {
    return {
      isRunning: this.currentTask?.status === 'running',
      task: this.currentTask,
      profile: this.runtimeConfig?.name,
      agents: Array.from(this.agents.values()).map(agent => ({
        name: agent.name,
        status: agent.getStatus()
      })),
      loop: {
        isRunning: this.isLoopRunning,
        currentIteration: this.currentIteration,
        lastQuality: this.lastQuality
      }
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
   * 初始化循環控制器
   */
  private initializeLoopController(): void {
    if (!this.runtimeConfig) {
      throw new Error('運行時配置尚未載入');
    }

    // 從配置中獲取循環控制設定
    const loopConfig = (this.runtimeConfig as any).loop_control || {
      max_iterations: 3,
      quality_target: 8.5,
      marginal_threshold: 0.1,
      auto_continue: false,
      require_confirmation: true
    };

    const costConfig = (this.runtimeConfig as any).cost_control || {
      token_budget: 50000,
      cost_budget: 10.0,
      warning_threshold: 0.8,
      currency: 'USD'
    };

    this.loopController = new LoopController(loopConfig, costConfig);

    // 監聽循環控制事件
    this.loopController.on('iteration-completed', (data) => {
      this.emit('pdca-iteration-completed', data);
      console.log(`✅ PDCA 循環 ${data.iteration} 完成，品質評分: ${data.quality}`);
    });

    this.loopController.on('should-continue', async (decision) => {
      if (decision.continue) {
        console.log(`🔄 繼續下一個 PDCA 循環 (${decision.reason})`);
        await this.executeNextIteration();
      } else {
        console.log(`⏹️  停止 PDCA 循環: ${decision.reason}`);
        await this.finalizePDCALoop();
      }
    });

    this.loopController.on('cost-warning', (warning) => {
      console.warn(`💰 成本警告: ${warning.message}`);
    });
  }

  /**
   * 開始 PDCA 循環
   */
  private async startPDCALoop(mission: string): Promise<void> {
    if (!this.loopController) {
      throw new Error('循環控制器尚未初始化');
    }

    this.isLoopRunning = true;
    this.currentIteration = 1;

    console.log('🔄 開始 PDCA 循環流程...');
    
    // 開始第一個循環
    await this.executeIteration(mission);
  }

  /**
   * 執行單次 PDCA 循環
   */
  private async executeIteration(mission: string): Promise<void> {
    console.log(`\n📊 執行 PDCA 循環 ${this.currentIteration}`);

    const startTime = Date.now();

    try {
      // Plan - 規劃階段
      await this.executePlanPhase(mission);
      
      // Do - 執行階段
      await this.executeDoPhase();
      
      // Check - 檢查階段
      const quality = await this.executeCheckPhase();
      
      // Act - 行動階段
      const improvements = await this.executeActPhase();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 評估是否繼續循環
      const shouldContinue = await this.loopController!.shouldContinue({
        iterationNumber: this.currentIteration,
        qualityScore: quality,
        tokensUsed: this.estimateTokenUsage(),
        timeElapsed: duration,
        improvement: quality - (this.lastQuality || 0),
        agentResults: { improvements }
      });

      this.lastQuality = quality;

      this.emit('pdca-cycle-completed', {
        iteration: this.currentIteration,
        quality,
        improvements,
        duration
      });

    } catch (error) {
      console.error(`❌ PDCA 循環 ${this.currentIteration} 失敗:`, error);
      this.emit('pdca-cycle-error', { iteration: this.currentIteration, error });
      throw error;
    }
  }

  /**
   * 執行下一個迭代
   */
  private async executeNextIteration(): Promise<void> {
    this.currentIteration++;
    await this.executeIteration(`繼續改進 - 第 ${this.currentIteration} 輪`);
  }

  /**
   * 完成 PDCA 循環
   */
  private async finalizePDCALoop(): Promise<void> {
    this.isLoopRunning = false;
    console.log('\n🎯 PDCA 循環流程完成');
    
    console.log('📈 循環總結:');
    console.log(`  總迭代次數: ${this.currentIteration}`);
    console.log(`  最終品質: ${this.lastQuality}`);
    console.log(`  循環狀態: 已完成`);

    this.emit('pdca-loop-completed', {
      totalIterations: this.currentIteration,
      finalQuality: this.lastQuality
    });
  }

  /**
   * Plan 階段 - 讓規劃代理工作
   */
  private async executePlanPhase(mission: string): Promise<void> {
    console.log('📋 Plan 階段 - 分析需求和制定策略');
    
    const planAgent = this.findAgentByRole('plan') || this.findAgentByRole('planner');
    if (planAgent) {
      await planAgent.sendMessage(`執行 Plan 階段:\n${mission}\n\n請分析需求並制定執行策略。`);
      await this.sleep(3000); // 給代理時間處理
    }
  }

  /**
   * Do 階段 - 讓執行代理工作
   */
  private async executeDoPhase(): Promise<void> {
    console.log('🛠️  Do 階段 - 實施解決方案');
    
    const doAgent = this.findAgentByRole('do') || this.findAgentByRole('developer');
    if (doAgent) {
      await doAgent.sendMessage('執行 Do 階段：根據 Plan 階段的策略實施解決方案。');
      await this.sleep(5000); // 給代理更多時間實施
    }
  }

  /**
   * Check 階段 - 讓檢查代理評估品質
   */
  private async executeCheckPhase(): Promise<number> {
    console.log('🔍 Check 階段 - 評估結果品質');
    
    const checkAgent = this.findAgentByRole('check') || this.findAgentByRole('tester');
    if (checkAgent) {
      await checkAgent.sendMessage('執行 Check 階段：評估當前結果的品質，給出 1-10 分的評分。');
      await this.sleep(3000);
    }
    
    // 模擬品質評分（實際應從代理反饋中獲取）
    return 7.5 + Math.random() * 2; // 7.5-9.5 之間的隨機評分
  }

  /**
   * Act 階段 - 讓改進代理提出優化建議
   */
  private async executeActPhase(): Promise<string[]> {
    console.log('⚡ Act 階段 - 分析改進機會');
    
    const actAgent = this.findAgentByRole('act') || this.findAgentByRole('optimizer');
    if (actAgent) {
      await actAgent.sendMessage('執行 Act 階段：分析當前結果，提出具體的改進建議。');
      await this.sleep(3000);
    }
    
    // 模擬改進建議（實際應從代理反饋中獲取）
    return ['優化性能', '改善用戶體驗', '增強錯誤處理'];
  }

  /**
   * 根據角色查找代理
   */
  private findAgentByRole(role: string): Agent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.role.toLowerCase().includes(role.toLowerCase())) {
        return agent;
      }
    }
    return Array.from(this.agents.values())[0]; // 如果找不到，返回第一個代理
  }

  /**
   * 估算 Token 使用量
   */
  private estimateTokenUsage(): number {
    // 簡化的 token 估算（實際應該更精確）
    return 1000 + Math.floor(Math.random() * 2000);
  }

  /**
   * 獲取循環狀態
   */
  getLoopStatus(): {
    isRunning: boolean;
    currentIteration: number;
    lastQuality: number;
  } {
    return {
      isRunning: this.isLoopRunning,
      currentIteration: this.currentIteration,
      lastQuality: this.lastQuality
    };
  }

  /**
   * 手動停止循環
   */
  async stopLoop(): Promise<void> {
    if (this.isLoopRunning) {
      console.log('🛑 手動停止 PDCA 循環...');
      await this.finalizePDCALoop();
    }
  }

  /**
   * 休眠工具函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}