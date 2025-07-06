/**
 * PDCA Check 階段驗證者
 * 負責品質驗證、測試檢查、結果評估
 */

import { BaseAgent } from './base-agent.js';

export class PdcaCheckAgent extends BaseAgent {
  constructor() {
    super({
      name: 'pdca-check',
      role: 'Check 階段驗證者',
      icon: '🔍',
      description: '品質驗證、測試檢查、結果評估',
      prompt: `你是 PDCA Check 階段的驗證者，負責:

## 核心職責
- 驗證 Do 階段的實作結果
- 進行全面的品質檢查
- 編寫和執行測試案例
- 評估系統性能和安全性
- 提供改進建議

## 工作模式
- 以總體系統品質為目標
- 遵循測試驅動開發 (TDD) 原則
- 關注使用者體驗和效能
- 及時與其他代理分享檢查結果

請以中文回應，技術術語保持英文。`,
      skills: [
        '軟體測試',
        '品質保證 (QA)',
        '性能測試',
        '安全檢查',
        '程式碼審查 (Code Review)',
        'CI/CD 流程'
      ]
    });
  }

  protected async onStart(task: string): Promise<void> {
    console.log(`${this.icon} 啟動 ${this.role}...`);
    
    await this.startClaudeInTmux(task);
    
    this.emit('check-initialized', {
      agent: this.name,
      task,
      timestamp: new Date()
    });
  }

  protected async onStop(): Promise<void> {
    console.log(`${this.icon} 停止 ${this.role}`);
  }

  protected getInitialPrompt(task: string): string {
    return `${this.config.prompt}

當前任務: ${task}

請開始進行 Check 階段的驗證工作。`;
  }
}