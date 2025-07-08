/**
 * 協調者介面
 * 在主 Claude CLI 中運行，負責與用戶互動和協調代理
 */

import { PDCAOrchestratorV3 } from '../modes/shokunin/orchestrator-v3.js';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export class CoordinatorInterface extends EventEmitter {
  private orchestrator: PDCAOrchestratorV3;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.orchestrator = new PDCAOrchestratorV3();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // 系統事件
    this.orchestrator.on('system-started', () => {
      this.isRunning = true;
      this.displayWelcome();
    });

    this.orchestrator.on('system-stopped', () => {
      this.isRunning = false;
      console.log(chalk.yellow('\n🛑 PDCA 系統已停止'));
    });

    // 進度更新
    this.orchestrator.on('progress-updated', (data) => {
      this.displayProgress(data);
    });

    // 訊息處理
    this.orchestrator.on('message-processed', (message) => {
      this.displayMessageLog(message);
    });

    // 結果接收
    this.orchestrator.on('result-received', (report) => {
      this.displayResult(report);
    });

    // 錯誤報告
    this.orchestrator.on('error-reported', (error) => {
      this.displayError(error);
    });
  }

  async start(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 正在啟動 PDCA 多代理系統...'));
    console.log(chalk.gray('這將啟動 5 個獨立的 Claude CLI 實例進行並行工作'));
    
    try {
      await this.orchestrator.start();
    } catch (error) {
      console.error(chalk.red(`\n❌ 啟動失敗: ${error}`));
      throw error;
    }
  }

  private displayWelcome(): void {
    console.log(chalk.green.bold('\n✨ PDCA 多代理系統已啟動！'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.yellow('\n📋 系統資訊:'));
    console.log(`  • ${chalk.green('5 個 Claude CLI 代理')} 正在並行運行`);
    console.log(`  • ${chalk.green('檔案系統 IPC')} 用於代理間通訊`);
    console.log(`  • ${chalk.green('即時監控')} 可追蹤所有代理狀態`);
    
    console.log(chalk.yellow('\n🎮 可用操作:'));
    console.log(`  • 直接告訴我您的任務，我會協調代理完成`);
    console.log(`  • 使用 ${chalk.cyan('/pdca:status')} 查看系統狀態`);
    console.log(`  • 使用 ${chalk.cyan('/pdca:monitor')} 開啟監控介面`);
    console.log(`  • 使用 ${chalk.cyan('/pdca:stop')} 停止系統`);
    
    console.log(chalk.yellow('\n💡 切換到代理視窗:'));
    console.log(`  • ${chalk.cyan('tmux attach -t pdca')} 然後使用 Ctrl+B 0-5`);
    
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.green.bold('\n🎯 請告訴我您的任務，我將協調團隊為您工作！\n'));
  }

  async assignTask(task: string): Promise<void> {
    if (!this.isRunning) {
      console.log(chalk.yellow('⚠️ 系統尚未啟動，請先使用 /pdca:start'));
      return;
    }

    console.log(chalk.blue(`\n📝 收到任務: "${task}"`));
    console.log(chalk.gray('正在分析並分配給各代理...'));
    
    await this.orchestrator.assignTask(task);
  }

  private displayProgress(data: {
    agent: string;
    progress: number;
    overall: number;
  }): void {
    const progressBar = this.createProgressBar(data.progress);
    console.log(chalk.cyan(`\n📊 [${data.agent}] ${progressBar} ${data.progress}%`));
    
    if (data.overall > 0) {
      const overallBar = this.createProgressBar(data.overall);
      console.log(chalk.green(`   [整體進度] ${overallBar} ${data.overall}%`));
    }
  }

  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  private displayMessageLog(message: any): void {
    const time = new Date().toLocaleTimeString();
    console.log(chalk.gray(`\n[${time}] 📨 ${message.from} → ${message.to}: ${message.type}`));
  }

  private displayResult(report: any): void {
    console.log(chalk.green.bold(`\n✅ ${report.from} 完成報告:`));
    console.log(chalk.white(`   ${report.content.summary}`));
    
    if (report.content.artifacts?.length > 0) {
      console.log(chalk.yellow('   📁 產出檔案:'));
      report.content.artifacts.forEach((file: string) => {
        console.log(chalk.gray(`      • ${file}`));
      });
    }
  }

  private displayError(error: any): void {
    console.log(chalk.red.bold(`\n❌ 錯誤報告 (${error.from}):`));
    console.log(chalk.red(`   ${error.content}`));
  }

  getStatus(): any {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }
    
    return this.orchestrator.getSystemStatus();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log(chalk.yellow('⚠️ 系統未在運行中'));
      return;
    }

    console.log(chalk.yellow('\n🛑 正在停止 PDCA 系統...'));
    await this.orchestrator.stop();
  }

  displayHelp(): void {
    console.log(chalk.blue.bold('\n📚 PDCA 多代理系統使用指南'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.yellow('\n基本概念:'));
    console.log('  • 系統運行 5 個獨立的 Claude CLI 實例');
    console.log('  • 每個代理有專門的角色和職責');
    console.log('  • 我（主 CLI）負責協調和任務分配');
    
    console.log(chalk.yellow('\n代理角色:'));
    console.log(`  • ${chalk.cyan('Plan')} - 需求分析和策略規劃`);
    console.log(`  • ${chalk.cyan('Do')} - 程式碼實作和開發`);
    console.log(`  • ${chalk.cyan('Check')} - 品質檢查和測試`);
    console.log(`  • ${chalk.cyan('Act')} - 優化改進和部署`);
    console.log(`  • ${chalk.cyan('Knowledge')} - 知識管理和文檔`);
    
    console.log(chalk.yellow('\n工作流程:'));
    console.log('  1. 您告訴我任務需求');
    console.log('  2. 我分析並分配給相應代理');
    console.log('  3. 代理們並行工作，通過檔案系統通訊');
    console.log('  4. 我整合結果並向您報告');
    
    console.log(chalk.yellow('\n範例任務:'));
    console.log(`  • "幫我實作使用者登入功能"`);
    console.log(`  • "分析這個專案的架構並提出優化建議"`);
    console.log(`  • "為現有程式碼添加單元測試"`);
    
    console.log(chalk.gray('═'.repeat(50)));
  }
}

// 匯出單例實例
export const coordinatorInterface = new CoordinatorInterface();

export default CoordinatorInterface;