/**
 * PDCA Plan 階段代理
 * 負責需求分析、策略制定、任務協調
 */

import { BaseAgent } from './base-agent.js';
import type { AgentConfig } from '../../../types/index.js';

export class PdcaPlanAgent extends BaseAgent {
  
  constructor() {
    super({
      name: 'pdca-plan',
      role: 'Plan 階段協調者',
      icon: '🎯',
      description: '需求分析、策略制定、任務協調',
      prompt: '',
      skills: ['需求分析', '策略規劃', '任務分解', '資源協調']
    });
  }

  protected async onStart(task: string): Promise<void> {
    console.log(`${this.icon} 啟動 ${this.role}...`);
    
    // 在 tmux 中啟動 Claude CLI
    await this.startClaudeInTmux(task);
    
    // 可以添加特定於 Plan 階段的初始化邏輯
    await this.initializePlanningPhase(task);
  }

  protected async onStop(): Promise<void> {
    console.log(`${this.icon} 停止 ${this.role}`);
    // Plan 階段特定的清理邏輯
  }

  protected getInitialPrompt(task: string): string {
    return `你是 PDCA 方法論中的 Plan 階段協調者。

你的核心職責：
1. **需求分析**：深入理解任務「${task}」的真正需求
2. **策略制定**：設計解決方案的整體策略
3. **任務分解**：將複雜任務分解為可執行的步驟
4. **資源協調**：協調其他代理的工作分配

工作原則：
- 使用中文進行所有回應
- 重視需求的深度分析，而不只是表面理解
- 制定可測量、可驗證的目標
- 考慮風險和約束條件
- 為後續 Do 階段提供清晰的執行指導

現在請開始分析任務「${task}」並制定執行計劃。`;
  }

  /**
   * 初始化規劃階段的特定邏輯
   */
  private async initializePlanningPhase(task: string): Promise<void> {
    // 可以在這裡添加：
    // - 創建規劃工作目錄
    // - 初始化任務追蹤文件
    // - 設置與其他代理的通訊機制
    
    this.emit('planning-initialized', {
      agent: this.name,
      task,
      timestamp: new Date()
    });
  }

  /**
   * 向其他代理發送任務分配
   */
  async assignTask(targetAgent: string, subtask: string): Promise<void> {
    const message = `任務分配給 ${targetAgent}：${subtask}`;
    await this.sendMessage(message);
    
    this.emit('task-assigned', {
      from: this.name,
      to: targetAgent,
      subtask,
      timestamp: new Date()
    });
  }

  /**
   * 更新計劃狀態
   */
  async updatePlan(planUpdate: string): Promise<void> {
    const message = `計劃更新：${planUpdate}`;
    await this.sendMessage(message);
    
    this.emit('plan-updated', {
      agent: this.name,
      update: planUpdate,
      timestamp: new Date()
    });
  }
}