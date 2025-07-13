#!/usr/bin/env node

/**
 * 增強型 PDCA CLI
 * 支援配置系統、循環控制和成本管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { EnhancedOrchestrator } from '../core/enhanced-orchestrator.js';
import { AdvancedConfigLoader } from '../core/advanced-config-loader.js';
import type { ConfigLoadOptions } from '../types/config.js';

const program = new Command();

// 版本和基本資訊
program
  .name('pdca')
  .description('🎯 PDCA 增強型多代理協調系統 - 智能循環控制 + 成本管理')
  .version('3.1.0')
  .usage('[任務描述] [選項]')
  .addHelpText('after', `
${chalk.yellow('🌟 新功能：智能循環控制 + 成本管理')}

${chalk.cyan('基本用法：')}
  $ pdca "建立用戶登入系統"                    # 使用預設配置
  $ pdca "優化資料庫查詢" --profile premium    # 使用品質優先模式
  $ pdca "快速原型開發" --profile economic    # 使用經濟模式

${chalk.cyan('配置控制：')}
  $ pdca "任務" --max-iterations 5             # 限制最多 5 輪迭代
  $ pdca "任務" --token-budget 50000           # 設定 token 預算
  $ pdca "任務" --quality-target 0.9           # 品質目標 90%
  $ pdca "任務" --auto-continue                # 自動繼續（不詢問）
  $ pdca "任務" --no-cost-display              # 隱藏成本顯示

${chalk.cyan('配置集：')}
  • economic    - 經濟型：1輪迭代，5K tokens，75%品質
  • balanced    - 平衡型：3輪迭代，10K tokens，85%品質 (預設)
  • premium     - 品質型：5輪迭代，50K tokens，95%品質
  • unlimited   - 土豪型：無限迭代，無限 tokens，99%品質

${chalk.cyan('管理指令：')}
  $ pdca config list                           # 列出可用配置集
  $ pdca config show [profile]                # 顯示配置詳情
  $ pdca doctor                               # 系統診斷
  $ pdca status                               # 查看運行狀態
`);

// 主要指令：執行任務
program
  .argument('[mission]', '任務描述')
  .option('--profile <name>', '配置集 (economic/balanced/premium/unlimited)', 'balanced')
  .option('--config <path>', '自定義配置檔案路徑')
  .option('--engine <name>', 'AI 引擎 (claude/gemini/openai)')
  
  // 循環控制參數
  .option('--max-iterations <num>', '最大迭代次數 (null=無限制)', (val) => 
    val === 'null' ? null : parseInt(val))
  .option('--quality-target <num>', '品質目標 (0.0-1.0)', parseFloat)
  .option('--token-budget <num>', 'Token 預算 (null=無限制)', (val) => 
    val === 'null' ? null : parseInt(val))
  .option('--time-budget <num>', '時間預算(分鐘, null=無限制)', (val) => 
    val === 'null' ? null : parseInt(val))
  .option('--auto-continue', '自動繼續下一輪（不詢問用戶）')
  .option('--require-confirmation', '每輪都需要用戶確認')
  
  // 成本控制參數
  .option('--show-cost', '顯示即時成本')
  .option('--no-cost-display', '隱藏成本顯示')
  .option('--currency <type>', '貨幣單位 (USD/TWD/CNY)', 'USD')
  .option('--warn-at <percent>', '成本警告百分比 (0-100)', parseFloat)
  
  // 其他參數
  .option('--max-agents <num>', '最大代理數量', parseInt)
  .option('-v, --verbose', '詳細輸出')
  .option('--dry-run', '模擬執行（不實際調用 AI）')
  
  .action(async (mission: string | undefined, options: any) => {
    if (!mission) {
      console.error(chalk.red('❌ 請提供任務描述'));
      console.log('範例: pdca "建立用戶登入系統"');
      process.exit(1);
    }

    const spinner = ora('🚀 啟動 PDCA 系統...').start();
    
    try {
      // 建構配置選項
      const configOptions: ConfigLoadOptions = {
        profile: options.profile,
        configFile: options.config,
        cliOverrides: buildCliOverrides(options),
        envOverrides: loadEnvironmentOverrides()
      };

      // 初始化協調器
      const orchestrator = new EnhancedOrchestrator({
        sessionName: `pdca_${Date.now()}`,
        configOptions
      });

      spinner.succeed('✅ 系統啟動完成');

      // 初始化系統
      await orchestrator.initialize(configOptions);

      // 執行任務
      await orchestrator.executeTask(mission);

      // 正常結束
      await orchestrator.stop();
      console.log(chalk.green('\n🎉 任務執行完成！'));

    } catch (error) {
      spinner.fail('❌ 系統執行失敗');
      console.error(chalk.red(`錯誤: ${error instanceof Error ? error.message : error}`));
      
      if (options.verbose) {
        console.error(error);
      }
      
      process.exit(1);
    }
  });

// 子命令：配置管理
const configCmd = program.command('config').description('配置管理');

configCmd
  .command('list')
  .description('列出可用的配置集')
  .action(async () => {
    const loader = new AdvancedConfigLoader();
    const profiles = await loader.getAvailableProfiles();
    
    console.log(chalk.cyan('\n🎨 可用配置集:'));
    profiles.forEach(profile => {
      const description = loader.getProfileDescription(profile);
      console.log(`  ${chalk.yellow(profile.padEnd(12))} ${description || ''}`);
    });
  });

configCmd
  .command('show [profile]')
  .description('顯示配置詳情')
  .action(async (profile: string = 'balanced') => {
    try {
      const loader = new AdvancedConfigLoader();
      const config = await loader.loadRuntimeConfig({ profile });
      
      console.log(chalk.cyan(`\n📋 配置集: ${profile}`));
      loader.displayConfigSummary(config);
      
    } catch (error) {
      console.error(chalk.red(`❌ 無法載入配置: ${error}`));
      process.exit(1);
    }
  });

// 子命令：系統診斷
program
  .command('doctor')
  .description('系統環境診斷')
  .action(async () => {
    console.log(chalk.cyan('🔍 系統診斷中...\n'));
    
    // 檢查 Node.js 版本
    const nodeVersion = process.version;
    const nodeOk = parseInt(nodeVersion.slice(1)) >= 18;
    console.log(`${nodeOk ? '✅' : '❌'} Node.js: ${nodeVersion} ${nodeOk ? '' : '(需要 >= 18.0.0)'}`);
    
    // 檢查 AI CLI
    const { AIEngineManager } = await import('../core/ai-engine-adapter.js');
    const engineManager = new AIEngineManager();
    const engines = await engineManager.detectAvailableEngines();
    
    if (engines.length > 0) {
      console.log('✅ AI 引擎:');
      engines.forEach(engine => console.log(`   • ${engine.name}`));
    } else {
      console.log('❌ 未找到可用的 AI CLI');
      console.log('   請安裝至少一個 AI CLI:');
      console.log('   • Gemini CLI (免費): npm install -g @google/gemini-cli');
      console.log('   • Claude CLI: https://claude.ai/cli');
    }
    
    // 檢查 tmux
    try {
      const { execSync } = await import('child_process');
      execSync('tmux -V', { stdio: 'ignore' });
      console.log('✅ tmux: 已安裝');
    } catch {
      console.log('❌ tmux: 未安裝（Linux/macOS 需要）');
    }
    
    // 檢查配置
    const loader = new AdvancedConfigLoader();
    const profiles = await loader.getAvailableProfiles();
    console.log(`✅ 配置集: ${profiles.length} 個可用`);
    
    console.log(chalk.green('\n🎯 診斷完成'));
  });

// 子命令：狀態查詢
program
  .command('status')
  .description('查看系統運行狀態')
  .action(() => {
    // TODO: 實作狀態查詢
    console.log('🔍 查看系統狀態...');
    console.log('（功能開發中）');
  });

/**
 * 建構 CLI 覆蓋選項
 */
function buildCliOverrides(options: any): Record<string, any> {
  const overrides: Record<string, any> = {};
  
  // 循環控制參數
  if (options.maxIterations !== undefined) overrides['max-iterations'] = options.maxIterations;
  if (options.qualityTarget !== undefined) overrides['quality-target'] = options.qualityTarget;
  if (options.tokenBudget !== undefined) overrides['token-budget'] = options.tokenBudget;
  if (options.timeBudget !== undefined) overrides['time-budget'] = options.timeBudget;
  if (options.autoContinue !== undefined) overrides['auto-continue'] = options.autoContinue;
  if (options.requireConfirmation !== undefined) overrides['require-confirmation'] = options.requireConfirmation;
  
  // 成本控制參數
  if (options.showCost !== undefined) overrides['show-cost'] = options.showCost;
  if (options.noCostDisplay !== undefined) overrides['show-cost'] = !options.noCostDisplay;
  if (options.currency !== undefined) overrides['currency'] = options.currency;
  if (options.warnAt !== undefined) overrides['warn-at-percent'] = options.warnAt;
  
  // 其他參數
  if (options.maxAgents !== undefined) overrides['max-agents'] = options.maxAgents;
  if (options.engine !== undefined) overrides['engine'] = options.engine;
  
  return overrides;
}

/**
 * 載入環境變數覆蓋
 */
function loadEnvironmentOverrides(): Record<string, any> {
  const env = process.env;
  const overrides: Record<string, any> = {};
  
  // 映射環境變數
  const envMappings: Record<string, string> = {
    'PDCA_MAX_ITERATIONS': 'max-iterations',
    'PDCA_QUALITY_TARGET': 'quality-target',
    'PDCA_TOKEN_BUDGET': 'token-budget',
    'PDCA_AUTO_CONTINUE': 'auto-continue',
    'PDCA_SHOW_COST': 'show-cost',
    'PDCA_CURRENCY': 'currency',
    'PDCA_ENGINE': 'engine'
  };
  
  for (const [envKey, cliKey] of Object.entries(envMappings)) {
    if (env[envKey] !== undefined) {
      let value: any = env[envKey];
      
      // 型別轉換
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null') value = null;
      else if (!isNaN(Number(value))) value = Number(value);
      
      overrides[cliKey] = value;
    }
  }
  
  return overrides;
}

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 未預期錯誤:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n💥 未處理的 Promise 拒絕:'), reason);
  process.exit(1);
});

// 處理中斷信號
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 收到中斷信號，正在停止系統...'));
  process.exit(0);
});

// 解析命令行參數
program.parse();