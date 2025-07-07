/**
 * 基礎代理類別
 * 所有 PDCA 代理的基類
 */
import { EventEmitter } from 'events';
import type { Agent, AgentStatus, LegacyAgentConfig } from '../../../types/index.js';
export declare abstract class BaseAgent extends EventEmitter implements Agent {
    name: string;
    role: string;
    icon: string;
    description: string;
    workspacePath?: string;
    protected _status: AgentStatus;
    protected tmuxTarget?: string;
    protected config?: LegacyAgentConfig;
    constructor(config?: LegacyAgentConfig);
    get status(): AgentStatus;
    /**
     * 啟動代理
     */
    start(task: string): Promise<void>;
    /**
     * 停止代理
     */
    stop(): Promise<void>;
    /**
     * 獲取代理狀態
     */
    getStatus(): AgentStatus;
    /**
     * 發送消息給代理
     */
    sendMessage(message: string): Promise<void>;
    /**
     * 設置 tmux 目標
     */
    setTmuxTarget(target: string): void;
    /**
     * 設置工作空間路徑
     */
    setWorkspacePath(path: string): void;
    /**
     * 檢查代理是否還在運行
     */
    isRunning(): Promise<boolean>;
    /**
     * 設置狀態並發送事件
     */
    protected setStatus(status: AgentStatus): void;
    /**
     * 子類別實現的啟動邏輯
     */
    protected abstract onStart(task: string): Promise<void>;
    /**
     * 子類別實現的停止邏輯
     */
    protected abstract onStop(): Promise<void>;
    /**
     * 獲取代理特定的初始 prompt
     */
    protected abstract getInitialPrompt(task: string): string;
    /**
     * 在 tmux 中啟動 Claude CLI
     */
    protected startClaudeInTmux(task: string): Promise<void>;
    /**
     * 使用自定義命令啟動代理
     * 供 StyledAgent 使用
     */
    protected startWithCommand(command: string): Promise<void>;
    /**
     * 休眠工具函數
     */
    protected sleep(ms: number): Promise<void>;
}
//# sourceMappingURL=base-agent.d.ts.map