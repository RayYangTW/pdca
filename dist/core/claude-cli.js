/**
 * Claude CLI 管理器
 * 負責啟動和管理 Claude CLI 實例
 */
import { spawn } from 'child_process';
export class ClaudeCliManager {
    /**
     * 檢查 Claude CLI 是否可用
     */
    static async isAvailable() {
        try {
            const result = await ClaudeCliManager.execCommand(['--version']);
            return result.code === 0;
        }
        catch {
            return false;
        }
    }
    /**
     * 構建 Claude CLI 啟動命令
     */
    static buildCommand(agent, task) {
        const baseCmd = 'claude';
        // 根據代理類型構建 prompt
        let prompt = '';
        switch (agent.name) {
            case 'pdca-plan':
                prompt = `你是 PDCA Plan 階段協調者。任務：${task}。請開始需求分析和任務規劃。使用中文回應。`;
                break;
            case 'pdca-do':
                prompt = `你是 PDCA Do 階段執行者。等待 Plan 協調者的任務分配，準備進行架構設計和實作。使用中文回應。`;
                break;
            case 'pdca-check':
                prompt = `你是 PDCA Check 階段驗證者。等待 Do 階段的成果，準備進行品質驗證和測試。使用中文回應。`;
                break;
            case 'pdca-act':
                prompt = `你是 PDCA Act 階段改善者。等待 Check 階段的結果，準備進行優化和改善。使用中文回應。`;
                break;
            case 'knowledge-agent':
                prompt = `你是知識管理代理。請監聽其他代理的工作，智能記錄重要決策和經驗。使用中文記錄。`;
                break;
            default:
                prompt = agent.prompt || `你是 ${agent.role}。任務：${task}`;
        }
        // 返回完整命令字符串
        return `${baseCmd} -p "${prompt}"`;
    }
    /**
     * 在 tmux 窗口中啟動 Claude CLI
     */
    static async startInTmux(tmuxTarget, agent, task) {
        const command = ClaudeCliManager.buildCommand(agent, task);
        // 使用 tmux send-keys 在指定窗口中啟動 Claude
        await ClaudeCliManager.execCommand([
            'send-keys', '-t', tmuxTarget,
            command, 'Enter'
        ], 'tmux');
    }
    /**
     * 檢查 Claude CLI 進程是否還在運行
     */
    static async isRunningInTmux(tmuxTarget) {
        try {
            // 獲取窗口中的進程列表
            const result = await ClaudeCliManager.execCommand([
                'list-panes', '-t', tmuxTarget, '-F', '#{pane_pid}'
            ], 'tmux');
            if (result.code !== 0) {
                return false;
            }
            const panePid = result.stdout.trim();
            if (!panePid) {
                return false;
            }
            // 檢查進程是否存在
            const psResult = await ClaudeCliManager.execCommand([
                'ps', '-p', panePid, '-o', 'comm='
            ], 'ps');
            return psResult.code === 0 && psResult.stdout.includes('node');
        }
        catch {
            return false;
        }
    }
    /**
     * 停止 tmux 窗口中的 Claude CLI
     */
    static async stopInTmux(tmuxTarget) {
        try {
            // 發送 Ctrl+C 中斷信號
            await ClaudeCliManager.execCommand([
                'send-keys', '-t', tmuxTarget, 'C-c'
            ], 'tmux');
            // 等待一下讓進程有時間清理
            await new Promise(resolve => setTimeout(resolve, 1000));
            // 如果還在運行，發送 exit 命令
            if (await ClaudeCliManager.isRunningInTmux(tmuxTarget)) {
                await ClaudeCliManager.execCommand([
                    'send-keys', '-t', tmuxTarget, 'exit', 'Enter'
                ], 'tmux');
            }
        }
        catch (error) {
            console.warn(`停止 Claude CLI 時發生錯誤: ${error}`);
        }
    }
    /**
     * 向 tmux 窗口中的 Claude CLI 發送消息
     */
    static async sendMessageToTmux(tmuxTarget, message) {
        await ClaudeCliManager.execCommand([
            'send-keys', '-t', tmuxTarget,
            message, 'Enter'
        ], 'tmux');
    }
    /**
     * 執行命令
     */
    static async execCommand(args, command = 'claude') {
        return new Promise((resolve) => {
            const child = spawn(command, args, { stdio: 'pipe' });
            let stdout = '';
            let stderr = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            child.on('close', (code) => {
                resolve({
                    code: code || 0,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });
            child.on('error', (error) => {
                resolve({
                    code: 1,
                    stdout: '',
                    stderr: error.message
                });
            });
        });
    }
}
//# sourceMappingURL=claude-cli.js.map