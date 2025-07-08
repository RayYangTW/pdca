/**
 * PDCA 協調器 v3
 * 支援多 Claude CLI 實例的版本
 */

import { EventEmitter } from 'events';
import { MultiClaudeManager } from '../../core/multi-claude-manager.js';
import { CommunicationManager } from '../../core/communication-manager.js';
import { 
  MessageFactory, 
  MessageType, 
  AgentRole,
  PDCAMessage,
  TaskAssignment,
  ProgressUpdate,
  ResultReport 
} from '../../core/message-protocol.js';

export interface OrchestratorOptions {
  sessionName?: string;
  enableMonitoring?: boolean;
  communicationDir?: string;
}

export class PDCAOrchestratorV3 extends EventEmitter {
  private multiClaudeManager: MultiClaudeManager;
  private communicationManager: CommunicationManager;
  private currentTasks: Map<string, TaskAssignment> = new Map();
  private agentProgress: Map<AgentRole, number> = new Map();

  constructor(options: OrchestratorOptions = {}) {
    super();
    
    const sessionName = options.sessionName || 'pdca';
    this.multiClaudeManager = new MultiClaudeManager(sessionName);
    this.communicationManager = new CommunicationManager({
      baseDir: options.communicationDir || '.raiy-pdca/communication'
    });

    this.initializeEventHandlers();
  }

  /**
   * 初始化事件處理
   */
  private initializeEventHandlers(): void {
    // 監聽通訊管理器的訊息
    this.communicationManager.on('message-received', (message: PDCAMessage) => {
      this.handleMessage(message);
    });

    // 監聽多 Claude 管理器的事件
    this.multiClaudeManager.on('task-sent', (task: string) => {
      this.emit('task-distributed', task);
    });

    this.multiClaudeManager.on('system-stopped', () => {
      this.emit('system-stopped');
    });
  }

  /**
   * 啟動系統
   */
  async start(): Promise<void> {
    console.log('🚀 啟動 PDCA 多代理協調系統...');

    // 初始化代理
    this.multiClaudeManager.initializeAgents();

    // 啟動所有 Claude CLI 實例
    await this.multiClaudeManager.startAllAgents();

    // 開始監聽協調器訊息
    this.communicationManager.startListening('coordinator');

    // 初始化代理進度
    Object.values(AgentRole).forEach(role => {
      this.agentProgress.set(role as AgentRole, 0);
    });

    console.log('✅ 系統啟動完成！');
    console.log('📊 使用 tmux attach -t pdca 查看各代理');
    
    this.emit('system-started');
  }

  /**
   * 分配任務
   */
  async assignTask(taskDescription: string): Promise<void> {
    console.log(`\n📋 接收任務: ${taskDescription}`);

    // 創建任務分解計畫
    const taskPlan = this.createTaskPlan(taskDescription);

    // 發送給 Plan 代理開始
    const planTask = MessageFactory.createTaskAssignment(
      'coordinator',
      AgentRole.PLAN,
      {
        title: '分析並規劃任務',
        description: taskDescription,
        requirements: [
          '深入理解任務需求',
          '制定詳細執行計畫',
          '定義成功標準',
          '識別潛在風險'
        ]
      }
    );

    this.currentTasks.set(planTask.content.taskId, planTask);
    await this.communicationManager.sendMessage(planTask);

    // 通知所有代理新任務
    await this.multiClaudeManager.sendTask(taskDescription);

    console.log('✅ 任務已分配給代理團隊');
  }

  /**
   * 創建任務計畫
   */
  private createTaskPlan(description: string): Map<AgentRole, string[]> {
    const plan = new Map<AgentRole, string[]>();

    plan.set(AgentRole.PLAN, [
      '分析任務需求',
      '制定執行策略',
      '分配子任務'
    ]);

    plan.set(AgentRole.DO, [
      '等待 Plan 的指示',
      '實作功能',
      '編寫程式碼'
    ]);

    plan.set(AgentRole.CHECK, [
      '等待 Do 的產出',
      '執行品質檢查',
      '運行測試'
    ]);

    plan.set(AgentRole.ACT, [
      '等待 Check 的結果',
      '實施改進',
      '優化效能'
    ]);

    plan.set(AgentRole.KNOWLEDGE, [
      '持續記錄過程',
      '整理知識點',
      '更新文檔'
    ]);

    return plan;
  }

  /**
   * 處理接收到的訊息
   */
  private handleMessage(message: PDCAMessage): void {
    console.log(`\n📨 收到來自 ${message.from} 的訊息: ${message.type}`);

    switch (message.type) {
      case MessageType.PROGRESS_UPDATE:
        this.handleProgressUpdate(message as ProgressUpdate);
        break;
      
      case MessageType.RESULT_REPORT:
        this.handleResultReport(message as ResultReport);
        break;
      
      case MessageType.REQUEST_HELP:
        this.handleHelpRequest(message);
        break;
      
      case MessageType.ERROR_REPORT:
        this.handleErrorReport(message);
        break;
    }

    this.emit('message-processed', message);
  }

  /**
   * 處理進度更新
   */
  private handleProgressUpdate(update: ProgressUpdate): void {
    const agent = update.from as AgentRole;
    this.agentProgress.set(agent, update.content.progress);

    console.log(`📊 ${agent} 進度: ${update.content.progress}%`);
    console.log(`   當前步驟: ${update.content.currentStep}`);

    // 計算整體進度
    const overallProgress = this.calculateOverallProgress();
    this.emit('progress-updated', {
      agent,
      progress: update.content.progress,
      overall: overallProgress
    });
  }

  /**
   * 處理結果報告
   */
  private async handleResultReport(report: ResultReport): Promise<void> {
    const agent = report.from as AgentRole;
    
    console.log(`\n📋 ${agent} 完成報告:`);
    console.log(`   成功: ${report.content.success ? '✅' : '❌'}`);
    console.log(`   摘要: ${report.content.summary}`);

    // 根據代理角色決定下一步
    await this.orchestrateNextStep(agent, report);

    this.emit('result-received', report);
  }

  /**
   * 協調下一步行動
   */
  private async orchestrateNextStep(fromAgent: AgentRole, report: ResultReport): Promise<void> {
    // 根據 PDCA 流程決定下一個代理
    const nextAgent = this.getNextAgent(fromAgent);
    
    if (nextAgent && report.content.success) {
      const nextTask = MessageFactory.createTaskAssignment(
        'coordinator',
        nextAgent,
        {
          title: `基於 ${fromAgent} 的結果繼續工作`,
          description: `請根據 ${fromAgent} 的輸出進行下一步工作`,
          requirements: report.content.nextSteps || [],
          dependencies: [report.content.taskId]
        }
      );

      await this.communicationManager.sendMessage(nextTask);
      console.log(`\n➡️ 任務已傳遞給 ${nextAgent}`);
    }
  }

  /**
   * 獲取下一個代理
   */
  private getNextAgent(currentAgent: AgentRole): AgentRole | null {
    const flow: Record<AgentRole, AgentRole | null> = {
      [AgentRole.PLAN]: AgentRole.DO,
      [AgentRole.DO]: AgentRole.CHECK,
      [AgentRole.CHECK]: AgentRole.ACT,
      [AgentRole.ACT]: null, // 循環結束
      [AgentRole.KNOWLEDGE]: null // 知識代理獨立運作
    };

    return flow[currentAgent];
  }

  /**
   * 處理求助請求
   */
  private async handleHelpRequest(message: PDCAMessage): Promise<void> {
    console.log(`\n🆘 ${message.from} 請求協助`);
    
    // 可以將求助轉發給其他代理或人工介入
    await this.communicationManager.broadcastMessage({
      ...message,
      type: MessageType.REQUEST_HELP
    });
  }

  /**
   * 處理錯誤報告
   */
  private handleErrorReport(message: PDCAMessage): void {
    console.error(`\n❌ ${message.from} 報告錯誤:`, message.content);
    this.emit('error-reported', message);
  }

  /**
   * 計算整體進度
   */
  private calculateOverallProgress(): number {
    const progresses = Array.from(this.agentProgress.values());
    if (progresses.length === 0) return 0;
    
    const sum = progresses.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / progresses.length);
  }

  /**
   * 獲取系統狀態
   */
  getSystemStatus(): {
    agents: ReturnType<MultiClaudeManager['getAgentStatuses']>;
    tasks: Map<string, TaskAssignment>;
    progress: Map<AgentRole, number>;
    communication: ReturnType<CommunicationManager['getStatistics']>;
  } {
    return {
      agents: this.multiClaudeManager.getAgentStatuses(),
      tasks: this.currentTasks,
      progress: this.agentProgress,
      communication: this.communicationManager.getStatistics()
    };
  }

  /**
   * 停止系統
   */
  async stop(): Promise<void> {
    console.log('\n🛑 正在停止 PDCA 系統...');
    
    // 發送停止訊息
    const shutdownMessage = MessageFactory.createSystemMessage(
      MessageType.SYSTEM_SHUTDOWN,
      { reason: 'User requested shutdown' }
    );
    
    await this.communicationManager.broadcastMessage(shutdownMessage);
    
    // 停止監聽
    this.communicationManager.stopListening();
    
    // 停止所有代理
    await this.multiClaudeManager.stopAllAgents();
    
    console.log('✅ 系統已停止');
  }
}

export default PDCAOrchestratorV3;