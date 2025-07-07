/**
 * 基礎代理類別
 * 所有 PDCA 代理的基類
 */
import { EventEmitter } from 'events';
import { ClaudeCliManager } from '../../../core/claude-cli.js';
export class BaseAgent extends EventEmitter {
    name;
    role;
    icon;
    description;
    workspacePath;
    _status = 'idle';
    tmuxTarget;
    config;
    constructor(config) {
        super();
        if (config) {
            this.config = config;
            this.name = config.name;
            this.role = config.role;
            this.icon = config.icon;
            this.description = config.description;
        }
        else {
            // 允許子類別自行設置這些屬性
            this.name = '';
            this.role = '';
            this.icon = '';
            this.description = '';
        }
    }
    get status() {
        return this._status;
    }
    /**
     * 啟動代理
     */
    async start(task) {
        if (this._status !== 'idle') {
            throw new Error(`代理 ${this.name} 已經在運行中`);
        }
        try {
            this.setStatus('starting');
            this.emit('starting', { agent: this.name });
            // 子類別實現具體啟動邏輯
            await this.onStart(task);
            this.setStatus('running');
            this.emit('started', { agent: this.name });
        }
        catch (error) {
            this.setStatus('error');
            this.emit('error', { agent: this.name, error });
            throw error;
        }
    }
    /**
     * 停止代理
     */
    async stop() {
        try {
            await this.onStop();
            if (this.tmuxTarget) {
                await ClaudeCliManager.stopInTmux(this.tmuxTarget);
            }
            this.setStatus('idle');
            this.emit('stopped', { agent: this.name });
        }
        catch (error) {
            this.setStatus('error');
            this.emit('error', { agent: this.name, error });
            throw error;
        }
    }
    /**
     * 獲取代理狀態
     */
    getStatus() {
        return this._status;
    }
    /**
     * 發送消息給代理
     */
    async sendMessage(message) {
        if (!this.tmuxTarget) {
            throw new Error(`代理 ${this.name} 尚未啟動`);
        }
        await ClaudeCliManager.sendMessageToTmux(this.tmuxTarget, message);
        this.emit('message-sent', { agent: this.name, message });
    }
    /**
     * 設置 tmux 目標
     */
    setTmuxTarget(target) {
        this.tmuxTarget = target;
    }
    /**
     * 設置工作空間路徑
     */
    setWorkspacePath(path) {
        this.workspacePath = path;
    }
    /**
     * 檢查代理是否還在運行
     */
    async isRunning() {
        if (!this.tmuxTarget) {
            return false;
        }
        return await ClaudeCliManager.isRunningInTmux(this.tmuxTarget);
    }
    /**
     * 設置狀態並發送事件
     */
    setStatus(status) {
        const oldStatus = this._status;
        this._status = status;
        if (oldStatus !== status) {
            this.emit('status-changed', {
                agent: this.name,
                oldStatus,
                newStatus: status
            });
        }
    }
    /**
     * 在 tmux 中啟動 Claude CLI
     */
    async startClaudeInTmux(task) {
        if (!this.tmuxTarget) {
            throw new Error('Tmux target 尚未設置');
        }
        if (!this.config) {
            throw new Error('代理配置尚未設置');
        }
        // 使用 getInitialPrompt 獲取提示詞，然後調用 startWithCommand
        const prompt = this.getInitialPrompt(task);
        await this.startWithCommand(prompt);
    }
    /**
     * 使用自定義命令啟動代理
     * 供 StyledAgent 使用
     */
    async startWithCommand(command) {
        if (!this.tmuxTarget) {
            throw new Error('Tmux target 尚未設置');
        }
        try {
            this.setStatus('starting');
            this.emit('starting', { agent: this.name });
            // 在 tmux 中啟動 Claude CLI
            await ClaudeCliManager.startInTmuxWithCommand(this.tmuxTarget, command);
            // 等待啟動
            await this.sleep(1000);
            this.setStatus('running');
            this.emit('started', { agent: this.name });
        }
        catch (error) {
            this.setStatus('error');
            this.emit('error', { agent: this.name, error });
            throw error;
        }
    }
    /**
     * 休眠工具函數
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=base-agent.js.map