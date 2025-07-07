#!/usr/bin/env node
/**
 * PDCA CLI 入口
 * 支援 pdca -s "mission" 指令格式
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PDCAOrchestrator } from '../modes/shokunin/orchestrator-v2.js';
const program = new Command();
// 版本和基本資訊
program
    .name('pdca')
    .description('🎯 PDCA 靈活的多代理協調系統')
    .version('3.0.0');
// 主要指令：pdca -s "mission"
program
    .option('-s, --shokunin <mission>', '啟動任務處理（預設職人模式）')
    .option('-p, --profile <name>', '指定風格配置（shokunin/agile/enterprise等）')
    .option('-c, --config <path>', '使用自定義配置檔案')
    .option('-d, --detach', '背景執行，不阻塞終端')
    .option('-m, --monitor', '啟動後直接進入監控模式')
    .option('-a, --agents <number>', '自定義代理數量（預設 5）', '5')
    .option('--mode <type>', '工作模式', 'pdca')
    .option('-v, --verbose', '顯示詳細日誌')
    .action(async (options) => {
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
    .description('初始化當前專案的 PDCA 配置')
    .option('-f, --force', '強制覆蓋現有配置')
    .action(async (options) => {
    await handleShokuninCommand('init', options);
});
program
    .command('status')
    .description('查看 PDCA 運行狀態')
    .action(async () => {
    await handleShokuninCommand('status', {});
});
program
    .command('stop')
    .description('停止 PDCA 系統')
    .action(async () => {
    await handleShokuninCommand('stop', {});
});
// 斜線指令管理
program
    .command('setup-commands')
    .description('安裝斜線指令到當前專案或全域')
    .option('-f, --force', '強制覆蓋現有指令')
    .option('-g, --global', '安裝到全域 (~/.claude/commands/)')
    .action(async (options) => {
    await handleSetupCommands(options.force, options.global);
});
program
    .command('remove-commands')
    .description('移除斜線指令')
    .option('-g, --global', '從全域移除')
    .action(async (options) => {
    await handleRemoveCommands(options.global);
});
program
    .command('verify-setup')
    .description('驗證系統和斜線指令安裝狀態')
    .action(async () => {
    await handleVerifySetup();
});
program
    .command('monitor')
    .description('啟動監控介面查看運行中的系統')
    .option('-s, --session <name>', 'tmux session 名稱', 'raiy-pdca')
    .action(async (options) => {
    await handleMonitor(options);
});
program
    .command('list-styles')
    .description('列出所有可用的風格配置')
    .action(async () => {
    await handleListStyles();
});
/**
 * 處理 Shokunin 模式指令
 */
async function handleShokuninCommand(mission, options) {
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
        console.log(chalk.blue.bold('🎯 PDCA Multi-Agent System'));
        console.log(chalk.gray('═'.repeat(50)));
        console.log(chalk.yellow(`📋 任務: ${mission}`));
        console.log();
        spinner.start('檢查系統需求...');
        // 檢查系統需求
        await checkSystemRequirements();
        spinner.succeed('系統需求檢查完成');
        // 初始化協調器
        const orchestrator = new PDCAOrchestrator();
        // 啟動系統
        spinner.start('啟動 PDCA 系統...');
        await orchestrator.start(mission, {
            ...options,
            profile: options.profile,
            configFile: options.config
        });
        if (!options.detach) {
            spinner.succeed('系統啟動完成');
            console.log();
            console.log(chalk.green('✨ PDCA 系統運行中...'));
            console.log(chalk.blue('📊 查看狀態: tmux attach -t raiy-pdca'));
            console.log(chalk.gray('💡 按 Ctrl+B 然後按數字鍵切換代理窗口'));
            console.log(chalk.gray('💡 按 Ctrl+B 然後按 d 分離 session'));
        }
    }
    catch (error) {
        spinner.fail('啟動失敗');
        if (error instanceof Error) {
            console.error(chalk.red(`❌ ${error.message}`));
            if (options.verbose) {
                console.error(chalk.gray(error.stack));
            }
        }
        else {
            console.error(chalk.red('❌ 未知錯誤'));
        }
        process.exit(1);
    }
}
/**
 * 檢查系統需求
 */
async function checkSystemRequirements() {
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const execFile = promisify(spawn);
    // 檢查 Python
    try {
        // TODO: 暫時保留 Python 檢查，後續可能移除
    }
    catch (error) {
        throw new Error('Python 3.8+ 未安裝');
    }
    // 檢查 tmux
    try {
        const tmux = spawn('tmux', ['-V'], { stdio: 'pipe' });
        await new Promise((resolve, reject) => {
            tmux.on('close', (code) => {
                if (code === 0)
                    resolve(void 0);
                else
                    reject(new Error('tmux 檢查失敗'));
            });
            tmux.on('error', () => reject(new Error('tmux 未安裝')));
        });
    }
    catch (error) {
        throw new Error('tmux 未安裝，請執行：brew install tmux (macOS) 或 sudo apt install tmux (Ubuntu)');
    }
    // 檢查 Claude CLI
    try {
        const claude = spawn('claude', ['--version'], { stdio: 'pipe' });
        await new Promise((resolve, reject) => {
            claude.on('close', (code) => {
                if (code === 0)
                    resolve(void 0);
                else
                    reject(new Error('Claude CLI 檢查失敗'));
            });
            claude.on('error', () => reject(new Error('Claude CLI 未安裝')));
        });
    }
    catch (error) {
        throw new Error('Claude CLI 未安裝，請參考：https://docs.anthropic.com/claude/docs/claude-code');
    }
}
/**
 * 處理初始化
 */
async function handleInit(options) {
    console.log(chalk.blue('🎯 初始化 PDCA...'));
    // TODO: 實現初始化邏輯
    console.log(chalk.green('✅ 初始化完成'));
}
/**
 * 處理狀態查詢
 */
async function handleStatus() {
    const { spawn } = await import('child_process');
    const tmux = spawn('tmux', ['has-session', '-t', 'raiy-pdca'], { stdio: 'pipe' });
    tmux.on('close', (code) => {
        if (code === 0) {
            console.log(chalk.green('✓ PDCA 正在運行'));
            // 列出窗口
            const listWindows = spawn('tmux', ['list-windows', '-t', 'raiy-pdca'], { stdio: 'inherit' });
        }
        else {
            console.log(chalk.yellow('⚠ PDCA 未運行'));
        }
    });
}
/**
 * 處理停止
 */
async function handleStop() {
    const { spawn } = await import('child_process');
    const spinner = ora('停止 PDCA...').start();
    const kill = spawn('tmux', ['kill-session', '-t', 'raiy-pdca'], { stdio: 'pipe' });
    kill.on('close', (code) => {
        if (code === 0) {
            spinner.succeed('系統已停止');
        }
        else {
            spinner.fail('停止失敗（可能系統未運行）');
        }
    });
}
/**
 * 處理斜線指令安裝
 */
async function handleSetupCommands(force = false, global = false) {
    try {
        const { spawn } = await import('child_process');
        const { resolve } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = resolve(__filename, '..');
        const scriptPath = resolve(__dirname, '../../scripts/setup-commands.js');
        const args = ['install'];
        if (force)
            args.push('--force');
        if (global)
            args.push('--global');
        const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`安裝失敗，退出碼: ${code}`));
                }
            });
            child.on('error', reject);
        });
    }
    catch (error) {
        console.error(chalk.red(`❌ 安裝失敗: ${error instanceof Error ? error.message : '未知錯誤'}`));
        process.exit(1);
    }
}
/**
 * 處理斜線指令移除
 */
async function handleRemoveCommands(global = false) {
    try {
        const { spawn } = await import('child_process');
        const { resolve } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = resolve(__filename, '..');
        const scriptPath = resolve(__dirname, '../../scripts/setup-commands.js');
        const args = ['remove'];
        if (global)
            args.push('--global');
        const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`移除失敗，退出碼: ${code}`));
                }
            });
            child.on('error', reject);
        });
    }
    catch (error) {
        console.error(chalk.red(`❌ 移除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`));
        process.exit(1);
    }
}
/**
 * 處理設置驗證
 */
async function handleVerifySetup() {
    try {
        const { spawn } = await import('child_process');
        const { resolve } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = resolve(__filename, '..');
        const scriptPath = resolve(__dirname, '../../scripts/setup-commands.js');
        const child = spawn('node', [scriptPath, 'verify'], { stdio: 'inherit' });
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`驗證失敗，退出碼: ${code}`));
                }
            });
            child.on('error', reject);
        });
    }
    catch (error) {
        console.error(chalk.red(`❌ 驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`));
        process.exit(1);
    }
}
/**
 * 處理監控命令
 */
async function handleMonitor(options) {
    const { spawn } = await import('child_process');
    // 檢查 session 是否存在
    const sessionName = options.session || 'pdca';
    const checkSession = spawn('tmux', ['has-session', '-t', sessionName], { stdio: 'pipe' });
    const sessionExists = await new Promise((resolve) => {
        checkSession.on('close', (code) => {
            resolve(code === 0);
        });
    });
    if (!sessionExists) {
        console.error(chalk.red(`❌ Session "${sessionName}" 不存在`));
        console.log(chalk.yellow('請先啟動 PDCA 系統：'));
        console.log(chalk.blue('  pdca -s "你的任務"'));
        process.exit(1);
    }
    console.log(chalk.blue(`📊 正在啟動監控介面...`));
    console.log(chalk.gray('提示：按 q 退出監控'));
    try {
        // 動態導入監控模組
        const { startMonitor } = await import('../core/monitor.js');
        const monitor = startMonitor({
            sessionName,
            workingDir: process.cwd(),
            updateInterval: 1000 // 每秒更新
        });
        // 從檔案系統載入代理資訊
        // TODO: 實現從通訊目錄讀取代理狀態
        monitor.log('info', `已連接到 session: ${sessionName}`);
        monitor.log('info', '監控系統啟動完成');
        // 保持進程運行
        process.on('SIGINT', () => {
            monitor.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error(chalk.red('❌ 無法啟動監控介面'));
        if (error instanceof Error) {
            console.error(chalk.gray(error.message));
        }
        process.exit(1);
    }
}
/**
 * 處理列出風格
 */
async function handleListStyles() {
    const spinner = ora('載入風格配置...').start();
    try {
        const orchestrator = new PDCAOrchestrator();
        const styles = await orchestrator.getAvailableStyles();
        spinner.succeed('已載入可用風格');
        console.log();
        console.log(chalk.blue.bold('🎨 可用的風格配置：'));
        console.log(chalk.gray('═'.repeat(50)));
        for (const style of styles) {
            console.log(`  • ${chalk.green(style)}`);
            // 嘗試載入風格以顯示描述
            try {
                const { readFileSync } = await import('fs');
                const { join } = await import('path');
                const { parse } = await import('yaml');
                const configPath = join(process.cwd(), 'agents', 'profiles', `${style}.yaml`);
                const content = readFileSync(configPath, 'utf-8');
                const config = parse(content);
                if (config.description) {
                    console.log(`    ${chalk.gray(config.description)}`);
                }
            }
            catch {
                // 忽略載入錯誤
            }
        }
        console.log();
        console.log(chalk.yellow('💡 使用方式：'));
        console.log(chalk.gray('  pdca -s "任務" --profile <風格名稱>'));
        console.log(chalk.gray('  例如：pdca -s "建立登入系統" --profile agile'));
    }
    catch (error) {
        spinner.fail('載入風格失敗');
        console.error(chalk.red(`❌ ${error instanceof Error ? error.message : '未知錯誤'}`));
        process.exit(1);
    }
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
//# sourceMappingURL=pdca.js.map