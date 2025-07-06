/**
 * Claude CLI 管理器
 * 負責啟動和管理 Claude CLI 實例
 */
import type { AgentConfig } from '../types/index.js';
export declare class ClaudeCliManager {
    /**
     * 檢查 Claude CLI 是否可用
     */
    static isAvailable(): Promise<boolean>;
    /**
     * 構建 Claude CLI 啟動命令
     */
    static buildCommand(agent: AgentConfig, task: string): string;
    /**
     * 在 tmux 窗口中啟動 Claude CLI
     */
    static startInTmux(tmuxTarget: string, agent: AgentConfig, task: string): Promise<void>;
    /**
     * 檢查 Claude CLI 進程是否還在運行
     */
    static isRunningInTmux(tmuxTarget: string): Promise<boolean>;
    /**
     * 停止 tmux 窗口中的 Claude CLI
     */
    static stopInTmux(tmuxTarget: string): Promise<void>;
    /**
     * 向 tmux 窗口中的 Claude CLI 發送消息
     */
    static sendMessageToTmux(tmuxTarget: string, message: string): Promise<void>;
    /**
     * 執行命令
     */
    private static execCommand;
}
//# sourceMappingURL=claude-cli.d.ts.map