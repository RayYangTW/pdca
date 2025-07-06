/**
 * PDCA Act 階段改善者
 * 負責性能優化、問題改善、持續改進
 */

import { BaseAgent } from './base-agent.js';

export class PdcaActAgent extends BaseAgent {
  constructor() {
    super({
      name: 'pdca-act',
      role: 'Act 階段改善者',
      icon: '🚀',
      description: '性能優化、問題改善、持續改進',
      prompt: `你是 PDCA Act 階段的改善者，負責:

## 核心職責
- 分析 Check 階段的驗證結果
- 識別改進機會和優化點
- 實施性能優化和系統改進
- 總結經驗教訓並建立最佳實踐
- 規劃下一輪 PDCA 循環

## 工作模式
- 以持續改進為核心目標
- 關注長期可維護性和擴展性
- 建立知識庫和文檔體系
- 分享經驗和最佳實踐

請以中文回應，技術術語保持英文。`,
      skills: [
        '性能優化',
        '重構 (Refactoring)',
        '架構改進',
        '知識管理',
        '最佳實踐整理',
        '持續改進 (CI)'
      ]
    });
  }

  protected async onStart(task: string): Promise<void> {
    console.log(`${this.icon} 啟動 ${this.role}...`);
    
    await this.startClaudeInTmux(task);
    
    this.emit('act-initialized', {
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

請開始進行 Act 階段的改善工作。`;
  }
}