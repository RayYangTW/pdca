/**
 * 增強型 PDCA 協調器
 * 整合配置系統、循環控制器和成本管理
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

import { AIEngineManager, AIEngine } from './ai-engine-adapter.js';
import { CommunicationManager } from './communication-manager.js';
import { AdvancedConfigLoader } from './advanced-config-loader.js';
import { LoopController, IterationMetrics, ContinueDecision } from './loop-controller.js';
import type { 
  RuntimeConfig, 
  ConfigLoadOptions, 
  AgentInstanceConfig,
  AgentConfig
} from '../types/config.js';

export interface EnhancedOrchestratorOptions {
  sessionName?: string;
  communicationDir?: string;
  configOptions?: ConfigLoadOptions;
}

export interface TaskContext {
  taskDescription: string;
  sessionId: string;
  startTime: Date;
  workingDirectory: string;
}

export interface AgentResult {
  agent: string;
  success: boolean;
  output: string;
  tokensUsed: number;
  qualityScore: number;
  executionTime: number;
  errors?: string[];
}

export class EnhancedOrchestrator extends EventEmitter {
  private config!: RuntimeConfig;
  private configLoader: AdvancedConfigLoader;
  private loopController?: LoopController;
  private engineManager: AIEngineManager;
  private selectedEngine?: AIEngine;
  private communicationManager: CommunicationManager;
  private sessionName: string;
  private communicationDir: string;
  private activeAgents: Map<string, ChildProcess> = new Map();
  private rl?: readline.Interface;

  constructor(options: EnhancedOrchestratorOptions = {}) {
    super();
    
    this.sessionName = options.sessionName || 'pdca';
    this.communicationDir = options.communicationDir || '.raiy-pdca/communication';
    
    // 初始化組件
    this.configLoader = new AdvancedConfigLoader();
    this.engineManager = new AIEngineManager();
    this.communicationManager = new CommunicationManager({
      baseDir: this.communicationDir
    });

    // 設定 readline 介面
    this.setupReadlineInterface();
  }

  /**
   * 初始化系統
   */
  async initialize(configOptions: ConfigLoadOptions = {}): Promise<void> {
    console.log('🚀 初始化 PDCA 增強型系統...\n');

    try {
      // 1. 載入配置
      this.config = await this.configLoader.loadRuntimeConfig(configOptions);
      
      // 2. 顯示配置摘要
      this.configLoader.displayConfigSummary(this.config);
      
      // 3. 初始化循環控制器
      this.initializeLoopController();
      
      // 4. 選擇 AI 引擎
      await this.initializeAIEngine(configOptions.cliOverrides?.engine);
      
      // 5. 設置目錄
      this.setupDirectories();
      
      console.log('\n✅ 系統初始化完成！\n');
      
    } catch (error) {
      console.error('❌ 系統初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 執行 PDCA 任務
   */
  async executeTask(taskDescription: string): Promise<void> {
    const taskContext: TaskContext = {
      taskDescription,
      sessionId: this.config.sessionId,
      startTime: new Date(),
      workingDirectory: this.config.workingDirectory
    };

    console.log(`📋 開始執行任務: ${taskDescription}\n`);

    try {
      // 重置循環控制器
      this.loopController?.reset();

      let iterationNumber = 1;
      let continueLoop = true;

      while (continueLoop) {
        console.log(`\n🔄 第 ${iterationNumber} 輪 PDCA 循環`);
        console.log('═'.repeat(60));

        // 執行 PDCA 循環
        const iterationResult = await this.executePDCACycle(
          taskContext, 
          iterationNumber
        );

        // 檢查是否繼續
        const decision = await this.loopController!.shouldContinue(iterationResult);
        
        if (!decision.continue) {
          console.log(`\n🛑 停止迭代: ${decision.suggestion || decision.reason}`);
          break;
        }

        if (decision.suggestion) {
          console.log(`\n💡 ${decision.suggestion}`);
        }

        iterationNumber++;
      }

      // 顯示最終統計
      this.displayFinalStatistics();

    } catch (error) {
      console.error('❌ 任務執行失敗:', error);
      throw error;
    }
  }

  /**
   * 執行單次 PDCA 循環
   */
  private async executePDCACycle(
    context: TaskContext, 
    iterationNumber: number
  ): Promise<IterationMetrics> {
    const startTime = Date.now();
    const agentResults: Record<string, AgentResult> = {};
    let totalTokens = 0;
    let overallQuality = 0;

    // 決定要執行的代理
    const agentsToRun = this.determineAgentsToRun(context, iterationNumber);
    
    console.log(`🎯 執行代理: ${agentsToRun.join(', ')}`);

    // 順序執行代理
    for (const agentName of agentsToRun) {
      console.log(`\n  ⚡ 執行 ${agentName} 代理...`);
      
      const result = await this.executeAgent(agentName, context, agentResults);
      agentResults[agentName] = result;
      totalTokens += result.tokensUsed;
      
      if (result.success) {
        console.log(`  ✅ ${agentName} 完成 (品質: ${(result.qualityScore * 100).toFixed(0)}%, tokens: ${result.tokensUsed})`);
      } else {
        console.log(`  ❌ ${agentName} 失敗: ${result.errors?.join(', ')}`);
      }
    }

    // 計算整體品質
    const successfulAgents = Object.values(agentResults).filter(r => r.success);
    overallQuality = successfulAgents.length > 0
      ? successfulAgents.reduce((sum, r) => sum + r.qualityScore, 0) / successfulAgents.length
      : 0;

    // 計算改進幅度
    const improvement = iterationNumber > 1 ? this.calculateImprovement(overallQuality) : 0;

    const metrics: IterationMetrics = {
      iterationNumber,
      qualityScore: overallQuality,
      tokensUsed: totalTokens,
      timeElapsed: Date.now() - startTime,
      improvement,
      agentResults
    };

    return metrics;
  }

  /**
   * 決定要執行的代理
   */
  private determineAgentsToRun(context: TaskContext, iterationNumber: number): string[] {
    const { execution } = this.config;
    const maxAgents = execution.max_agents;

    // 第一輪通常執行完整流程
    if (iterationNumber === 1) {
      if (maxAgents >= 4) {
        return ['plan', 'do', 'check', 'act'];
      } else if (maxAgents >= 2) {
        return ['do', 'check'];
      } else {
        return ['do'];
      }
    }

    // 後續輪次根據配置和需求決定
    if (maxAgents >= 5) {
      return ['plan', 'do', 'check', 'act', 'knowledge'];
    } else if (maxAgents >= 3) {
      return ['do', 'check', 'act'];
    } else {
      return ['check', 'act'];
    }
  }

  /**
   * 執行單個代理
   */
  private async executeAgent(
    agentName: string,
    context: TaskContext,
    previousResults: Record<string, AgentResult>
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // 獲取代理配置
      const agentConfig = this.getAgentConfig(agentName);
      
      // 建構 prompt
      const prompt = this.buildAgentPrompt(agentName, context, previousResults, agentConfig);
      
      // 執行 AI 引擎
      const output = await this.executeAIEngine(prompt);
      
      // 評估結果品質
      const qualityScore = this.evaluateOutputQuality(output, agentName);
      
      // 估算 token 使用量
      const tokensUsed = this.estimateTokenUsage(prompt, output);

      return {
        agent: agentName,
        success: true,
        output,
        tokensUsed,
        qualityScore,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        agent: agentName,
        success: false,
        output: '',
        tokensUsed: 0,
        qualityScore: 0,
        executionTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 初始化循環控制器
   */
  private initializeLoopController(): void {
    const { loop_control, cost_control } = this.config.execution;
    
    this.loopController = new LoopController(
      loop_control,
      cost_control,
      cost_control.pricing_model
    );

    // 監聽事件
    this.loopController.on('cost-warning', (warning) => {
      console.log(`\n⚠️  成本警告: 已使用 ${warning.usedPercent.toFixed(0)}% 預算`);
      console.log(`   Token: ${warning.tokensUsed.toLocaleString()} / ${warning.budget.toLocaleString()}`);
      if (warning.estimatedCost > 0) {
        console.log(`   預估成本: $${warning.estimatedCost.toFixed(4)}`);
      }
    });

    this.loopController.on('user-decision-required', async (data) => {
      const decision = await this.promptUserDecision(data.metrics, data.recommendation);
      data.resolve(decision);
    });
  }

  /**
   * 初始化 AI 引擎
   */
  private async initializeAIEngine(engineName?: string): Promise<void> {
    if (engineName) {
      this.selectedEngine = await this.engineManager.selectEngineByName(engineName);
    } else {
      this.selectedEngine = await this.engineManager.selectBestEngine();
    }
  }

  /**
   * 獲取代理配置
   */
  private getAgentConfig(agentName: string): AgentConfig {
    const agentConfig = this.config.agents[agentName];
    if (!agentConfig) {
      throw new Error(`找不到代理配置: ${agentName}`);
    }
    return agentConfig;
  }

  /**
   * 建構代理 prompt
   */
  private buildAgentPrompt(
    agentName: string,
    context: TaskContext,
    previousResults: Record<string, AgentResult>,
    agentConfig: AgentConfig
  ): string {
    let prompt = agentConfig.prompts.initial + '\n\n';

    // 添加任務上下文
    prompt += `任務描述: ${context.taskDescription}\n\n`;

    // 添加前面代理的結果
    if (Object.keys(previousResults).length > 0) {
      prompt += '前面代理的執行結果:\n';
      for (const [agent, result] of Object.entries(previousResults)) {
        if (result.success) {
          prompt += `${agent}: ${result.output.substring(0, 500)}...\n`;
        }
      }
      prompt += '\n';
    }

    // 使用任務特定的 prompt
    if (agentConfig.prompts.mission) {
      prompt += agentConfig.prompts.mission.replace('{{mission}}', context.taskDescription);
    }

    return prompt;
  }

  /**
   * 執行 AI 引擎
   */
  private async executeAIEngine(prompt: string): Promise<string> {
    if (!this.selectedEngine) {
      throw new Error('AI 引擎未初始化');
    }

    if (this.selectedEngine.promptFlag) {
      // 支援直接執行的引擎（如 Gemini）
      return await this.selectedEngine.executePrompt(prompt);
    } else {
      // 互動模式引擎（如 Claude）
      throw new Error('互動模式引擎需要特殊處理');
    }
  }

  /**
   * 評估輸出品質
   */
  private evaluateOutputQuality(output: string, agentName: string): number {
    // 簡單的品質評估邏輯
    let score = 0.5; // 基礎分數

    // 長度檢查
    if (output.length > 100) score += 0.1;
    if (output.length > 500) score += 0.1;

    // 結構檢查
    if (output.includes('\n')) score += 0.1; // 有換行
    if (output.match(/\d+\./)) score += 0.1; // 有編號列表
    if (output.includes('```')) score += 0.1; // 有程式碼

    // 代理特定檢查
    switch (agentName) {
      case 'plan':
        if (output.includes('步驟') || output.includes('計畫')) score += 0.1;
        break;
      case 'do':
        if (output.includes('實作') || output.includes('程式碼')) score += 0.1;
        break;
      case 'check':
        if (output.includes('測試') || output.includes('檢查')) score += 0.1;
        break;
      case 'act':
        if (output.includes('優化') || output.includes('改善')) score += 0.1;
        break;
    }

    return Math.min(1.0, score);
  }

  /**
   * 估算 token 使用量
   */
  private estimateTokenUsage(prompt: string, output: string): number {
    // 簡單的 token 估算（大約 4 字元 = 1 token）
    return Math.ceil((prompt.length + output.length) / 4);
  }

  /**
   * 計算改進幅度
   */
  private calculateImprovement(currentQuality: number): number {
    // 這裡需要與上一輪的品質比較
    // 暫時返回隨機值，實際需要從歷史數據計算
    return Math.random() * 0.1; // 0-10% 改進
  }

  /**
   * 詢問用戶決策
   */
  private async promptUserDecision(
    metrics: IterationMetrics,
    recommendation: string
  ): Promise<ContinueDecision> {
    console.log('\n🤔 需要您的決策');
    console.log('─'.repeat(50));
    console.log(`💡 建議: ${recommendation}`);
    console.log('─'.repeat(50));

    const answer = await this.askQuestion(
      '是否繼續下一輪迭代？ [y/N]: ',
      'n'
    );

    const shouldContinue = answer.toLowerCase() === 'y';

    return {
      continue: shouldContinue,
      reason: shouldContinue ? 'user_approved' : 'user_declined',
      confidence: 1.0,
      suggestion: shouldContinue ? '用戶選擇繼續' : '用戶選擇停止'
    };
  }

  /**
   * 詢問用戶問題
   */
  private async askQuestion(question: string, defaultAnswer?: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl!.question(question, (answer) => {
        resolve(answer.trim() || defaultAnswer || '');
      });
    });
  }

  /**
   * 設置 readline 介面
   */
  private setupReadlineInterface(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 設置必要目錄
   */
  private setupDirectories(): void {
    const dirs = [
      '.raiy-pdca',
      '.raiy-pdca/communication',
      '.raiy-pdca/scripts',
      '.raiy-pdca/logs',
      '.raiy-pdca/agents'
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 顯示最終統計
   */
  private displayFinalStatistics(): void {
    if (!this.loopController) return;

    const stats = this.loopController.getStatistics();
    
    console.log('\n📊 最終統計');
    console.log('═'.repeat(60));
    console.log(`🔢 總迭代次數: ${stats.totalIterations}`);
    console.log(`💰 總 Token 使用: ${stats.totalTokens.toLocaleString()}`);
    console.log(`💸 總成本: $${stats.totalCost.toFixed(4)}`);
    console.log(`📈 平均品質: ${(stats.averageQuality * 100).toFixed(1)}%`);
    console.log(`⏱️  總時間: ${(stats.totalTime / 1000 / 60).toFixed(1)} 分鐘`);
    console.log(`⚡ 效率: ${(stats.efficiency * 1000).toFixed(2)} 品質/千tokens`);
    console.log('═'.repeat(60));
  }

  /**
   * 停止系統
   */
  async stop(): Promise<void> {
    console.log('\n🛑 停止系統...');
    
    // 關閉所有活動代理
    for (const [name, process] of this.activeAgents) {
      console.log(`停止代理: ${name}`);
      process.kill();
    }
    this.activeAgents.clear();

    // 關閉 readline
    if (this.rl) {
      this.rl.close();
    }

    console.log('✅ 系統已停止');
  }

  /**
   * 獲取系統狀態
   */
  getStatus() {
    return {
      sessionId: this.config?.sessionId,
      engine: this.selectedEngine?.name || '未選擇',
      session: this.sessionName,
      activeAgents: Array.from(this.activeAgents.keys()),
      statistics: this.loopController?.getStatistics()
    };
  }
}