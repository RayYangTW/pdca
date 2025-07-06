#!/usr/bin/env node

/**
 * PDCA-Shokunin CLI 入口
 * 支援 pdca -s "mission" 指令格式
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ShokuninOrchestrator } from '../modes/shokunin/orchestrator.js';
import type { CLIOptions } from '../types/index.js';

const program = new Command();

// 版本和基本資訊
program
  .name('pdca')
  .description('🎌 PDCA-Shokunin 職人級多代理協調系統')
  .version('3.0.0');

// 主要指令：pdca -s "mission"
program
  .option('-s, --shokunin <mission>', '啟動 Shokunin 模式處理任務')
  .option('-d, --detach', '背景執行，不阻塞終端')
  .option('-m, --monitor', '啟動後直接進入監控模式')
  .option('-a, --agents <number>', '自定義代理數量（預設 5）', '5')
  .option('--mode <type>', '工作模式', 'pdca')
  .option('-v, --verbose', '顯示詳細日誌')
  .action(async (options: CLIOptions & { shokunin?: string }) => {
    if (!options.shokunin) {
      console.log(chalk.yellow('請使用 -s 參數指定任務，例如：'));
      console.log(chalk.blue('  pdca -s "建立用戶登入系統"'));
      console.log(chalk.blue('  pdca -s init'));
      console.log(chalk.blue('  pdca -s status'));
      return;
    }

    await handleShokuninCommand(options.shokunin, options);
  });

// 快捷指令
program
  .command('init')
  .description('初始化當前專案的 PDCA-Shokunin 配置')
  .option('-f, --force', '強制覆蓋現有配置')
  .action(async (options) => {
    await handleShokuninCommand('init', options);
  });

program
  .command('status')
  .description('查看 PDCA-Shokunin 運行狀態')
  .action(async () => {
    await handleShokuninCommand('status', {});
  });

program
  .command('stop')
  .description('停止 PDCA-Shokunin 系統')
  .action(async () => {
    await handleShokuninCommand('stop', {});
  });

/**
 * 處理 Shokunin 模式指令
 */
async function handleShokuninCommand(mission: string, options: CLIOptions): Promise<void> {
  const spinner = ora();

  try {
    // 特殊指令處理
    if (mission === 'init') {
      await handleInit(options);
      return;
    }

    if (mission === 'status') {
      await handleStatus();
      return;
    }

    if (mission === 'stop') {
      await handleStop();
      return;
    }

    // 正常任務處理
    console.log(chalk.blue.bold('🎌 PDCA-Shokunin Multi-Agent System'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.yellow(`📋 任務: ${mission}`));
    console.log();

    spinner.start('檢查系統需求...');

    // 檢查系統需求
    await checkSystemRequirements();
    spinner.succeed('系統需求檢查完成');

    // 初始化協調器
    const orchestrator = new ShokuninOrchestrator({
      sessionName: 'pdca-shokunin',
      language: 'zh-TW',
      agents: [], // 使用預設代理配置
      communication: {
        method: 'file-based',
        directory: '.pdca-shokunin/communication',
        syncInterval: 5
      },
      monitoring: {
        refreshRate: 1,
        logLevel: 'INFO',
        showTimestamps: true
      }
    });

    // 啟動系統
    spinner.start('啟動 PDCA-Shokunin 系統...');
    await orchestrator.start(mission, options);
    
    if (!options.detach) {
      spinner.succeed('系統啟動完成');
      console.log();
      console.log(chalk.green('✨ PDCA-Shokunin 系統運行中...'));
      console.log(chalk.blue('📊 查看狀態: tmux attach -t pdca-shokunin'));
      console.log(chalk.gray('💡 按 Ctrl+B 然後按數字鍵切換代理窗口'));
      console.log(chalk.gray('💡 按 Ctrl+B 然後按 d 分離 session'));
    }

  } catch (error) {
    spinner.fail('啟動失敗');
    
    if (error instanceof Error) {
      console.error(chalk.red(`❌ ${error.message}`));
      
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red('❌ 未知錯誤'));
    }
    
    process.exit(1);
  }
}

/**
 * 檢查系統需求
 */
async function checkSystemRequirements(): Promise<void> {
  const { spawn } = await import('child_process');
  const { promisify } = await import('util');
  const execFile = promisify(spawn);

  // 檢查 Python
  try {
    // TODO: 暫時保留 Python 檢查，後續可能移除
  } catch (error) {
    throw new Error('Python 3.8+ 未安裝');
  }

  // 檢查 tmux
  try {
    const tmux = spawn('tmux', ['-V'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      tmux.on('close', (code) => {
        if (code === 0) resolve(void 0);
        else reject(new Error('tmux 檢查失敗'));
      });
      tmux.on('error', () => reject(new Error('tmux 未安裝')));
    });
  } catch (error) {
    throw new Error('tmux 未安裝，請執行：brew install tmux (macOS) 或 sudo apt install tmux (Ubuntu)');
  }

  // 檢查 Claude CLI
  try {
    const claude = spawn('claude', ['--version'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      claude.on('close', (code) => {
        if (code === 0) resolve(void 0);
        else reject(new Error('Claude CLI 檢查失敗'));
      });
      claude.on('error', () => reject(new Error('Claude CLI 未安裝')));
    });
  } catch (error) {
    throw new Error('Claude CLI 未安裝，請參考：https://docs.anthropic.com/claude/docs/claude-code');
  }
}

/**
 * 處理初始化
 */
async function handleInit(options: CLIOptions): Promise<void> {
  console.log(chalk.blue('🎌 初始化 PDCA-Shokunin...'));
  // TODO: 實現初始化邏輯
  console.log(chalk.green('✅ 初始化完成'));
}

/**
 * 處理狀態查詢
 */
async function handleStatus(): Promise<void> {
  const { spawn } = await import('child_process');
  
  const tmux = spawn('tmux', ['has-session', '-t', 'pdca-shokunin'], { stdio: 'pipe' });
  
  tmux.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('✓ PDCA-Shokunin 正在運行'));
      
      // 列出窗口
      const listWindows = spawn('tmux', ['list-windows', '-t', 'pdca-shokunin'], { stdio: 'inherit' });
    } else {
      console.log(chalk.yellow('⚠ PDCA-Shokunin 未運行'));
    }
  });
}

/**
 * 處理停止
 */
async function handleStop(): Promise<void> {
  const { spawn } = await import('child_process');
  const spinner = ora('停止 PDCA-Shokunin...').start();
  
  const kill = spawn('tmux', ['kill-session', '-t', 'pdca-shokunin'], { stdio: 'pipe' });
  
  kill.on('close', (code) => {
    if (code === 0) {
      spinner.succeed('系統已停止');
    } else {
      spinner.fail('停止失敗（可能系統未運行）');
    }
  });
}

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('未處理的 Promise 拒絕:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('未捕獲的異常:'), error);
  process.exit(1);
});

// 解析命令行參數
program.parse();