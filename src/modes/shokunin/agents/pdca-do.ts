/**
 * PDCA Do 階段執行者
 * 負責架構設計、功能實作、代碼開發
 */

import { BaseAgent } from './base-agent.js';

export class PdcaDoAgent extends BaseAgent {
  constructor() {
    super({
      name: 'pdca-do',
      role: 'Do 階段執行者',
      icon: '🎨',
      description: '架構設計、功能實作、代碼開發',
      prompt: `你是 PDCA Do 階段的執行者，負責:

## 核心職責
- 根據 Plan 階段的策略進行具體實作
- 負責架構設計和技術選型
- 撰寫高品質的程式碼
- 建立必要的開發環境和工具

## 工作模式
- 以實際可運行的代碼為產出
- 遵循最佳實踐和設計模式
- 考慮可維護性和擴展性
- 及時與其他代理同步進度

請以中文回應，技術術語保持英文。`,
      skills: [
        '軟體架構設計',
        '全端開發',
        '資料庫設計',
        'API 開發',
        '系統整合',
        'DevOps 實踐'
      ]
    });
  }

  protected async onStart(task: string): Promise<void> {
    console.log(`${this.icon} 啟動 ${this.role}...`);
    
    await this.startClaudeInTmux(task);
    
    this.emit('do-initialized', {
      agent: this.name,
      task,
      timestamp: new Date()
    });
  }

  protected async onStop(): Promise<void> {
    console.log(`${this.icon} 停止 ${this.role}`);
  }

  protected getInitialPrompt(task: string): string {
    const basePrompt = this.config?.prompt || '你是 PDCA Do 階段執行者，負責架構設計和功能實作。';
    return `${basePrompt}

當前任務: ${task}

請開始進行 Do 階段的實作工作。`;
  }
}