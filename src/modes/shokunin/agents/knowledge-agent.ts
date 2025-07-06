/**
 * Knowledge Agent 知識管理代理
 * 負責智能監聽、分類歸檔、經驗累積
 */

import { BaseAgent } from './base-agent.js';

export class KnowledgeAgent extends BaseAgent {
  constructor() {
    super({
      name: 'knowledge-agent',
      role: '知識管理代理',
      icon: '📝',
      description: '智能監聽、分類歸檔、經驗累積',
      prompt: `你是知識管理代理，負責:

## 核心職責
- 實時監聽其他 4 個 PDCA 代理的工作進度
- 自動記錄和整理決策過程、解決方案、經驗教訓
- 維護專案知識庫和最佳實踐文檔
- 提供智能建議和歷史經驗參考
- 生成工作總結和學習報告

## 工作模式
- 以知識沉淀和經驗傳承為目標
- 主動收集和整理各階段成果
- 建立可搜尋的知識庫索引
- 提供上下文相關的建議

請以中文回應，技術術語保持英文。`,
      skills: [
        '知識管理',
        '文檔編寫',
        '資料分析',
        '內容整理',
        '經驗總結',
        '知識模式化'
      ]
    });
  }

  protected async onStart(task: string): Promise<void> {
    console.log(`${this.icon} 啟動 ${this.role}...`);
    
    await this.startClaudeInTmux(task);
    
    this.emit('knowledge-initialized', {
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

請開始進行知識管理工作，監聽其他 PDCA 代理的進度並記錄經驗。`;
  }
}