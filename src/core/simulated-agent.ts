/**
 * 模擬代理
 * 在無法真正啟動多個 Claude CLI 時用於測試和演示
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';
import { AgentRole } from './message-protocol.js';

export class SimulatedAgent extends EventEmitter {
  private role: AgentRole;
  private name: string;
  private watching: boolean = false;
  private watchInterval?: NodeJS.Timeout;
  private communicationDir: string;

  constructor(role: AgentRole, name: string) {
    super();
    this.role = role;
    this.name = name;
    this.communicationDir = '.raiy-pdca/communication';
  }

  start(): void {
    console.log(`🤖 模擬 ${this.name} 代理啟動 (${this.role})`);
    this.watching = true;
    
    // 模擬監控任務
    this.watchInterval = setInterval(() => {
      this.checkForTasks();
    }, 2000);

    // 模擬初始化完成
    setTimeout(() => {
      this.emit('initialized');
      this.simulateProgress(0);
    }, 1000);
  }

  stop(): void {
    this.watching = false;
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
    console.log(`🛑 模擬 ${this.name} 代理停止`);
  }

  private checkForTasks(): void {
    const taskFile = join(this.communicationDir, 'current.task');
    const notifyFile = join(this.communicationDir, `${this.role}.notify`);
    
    if (existsSync(taskFile) || existsSync(notifyFile)) {
      this.handleTask();
    }
  }

  private handleTask(): void {
    console.log(`📋 ${this.name} 收到任務`);
    
    // 模擬處理任務
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      this.simulateProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        this.simulateCompletion();
      }
    }, 3000);
  }

  private simulateProgress(progress: number): void {
    console.log(`📊 ${this.name} 進度: ${progress}%`);
    this.emit('progress', {
      agent: this.role,
      progress: progress,
      message: this.getProgressMessage(progress)
    });
  }

  private getProgressMessage(progress: number): string {
    const messages: Record<AgentRole, string[]> = {
      [AgentRole.PLAN]: [
        '分析需求中...',
        '制定執行策略...',
        '定義成功標準...',
        '識別潛在風險...',
        '完成規劃'
      ],
      [AgentRole.DO]: [
        '準備開發環境...',
        '建立專案結構...',
        '實作核心功能...',
        '編寫測試程式碼...',
        '完成實作'
      ],
      [AgentRole.CHECK]: [
        '執行單元測試...',
        '檢查程式碼品質...',
        '驗證功能完整性...',
        '審查安全性...',
        '完成檢查'
      ],
      [AgentRole.ACT]: [
        '分析改進機會...',
        '優化效能...',
        '重構程式碼...',
        '更新文檔...',
        '完成優化'
      ],
      [AgentRole.KNOWLEDGE]: [
        '收集重要資訊...',
        '整理決策記錄...',
        '歸納最佳實踐...',
        '更新知識庫...',
        '完成記錄'
      ]
    };

    const roleMessages = messages[this.role] || ['處理中...'];
    const index = Math.min(Math.floor(progress / 20), roleMessages.length - 1);
    return roleMessages[index];
  }

  private simulateCompletion(): void {
    console.log(`✅ ${this.name} 完成任務`);
    this.emit('completed', {
      agent: this.role,
      success: true,
      summary: `${this.name} 成功完成分配的任務`,
      artifacts: this.getSimulatedArtifacts()
    });
  }

  private getSimulatedArtifacts(): string[] {
    const artifacts: Record<AgentRole, string[]> = {
      [AgentRole.PLAN]: ['docs/requirements.md', 'docs/architecture.md'],
      [AgentRole.DO]: ['src/index.js', 'src/components/', 'tests/'],
      [AgentRole.CHECK]: ['reports/test-results.html', 'reports/coverage.html'],
      [AgentRole.ACT]: ['docs/optimization.md', 'CHANGELOG.md'],
      [AgentRole.KNOWLEDGE]: ['memories/decisions/', 'memories/patterns/']
    };

    return artifacts[this.role] || [];
  }
}

export default SimulatedAgent;