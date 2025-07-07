/**
 * Raiy-PDCA 協調器
 * 管理 5 個代理的並行執行
 */
import { EventEmitter } from 'events';
import type { ShokuninConfig, CLIOptions, Task } from '../../types/index.js';
export declare class ShokuninOrchestrator extends EventEmitter {
    private config;
    private tmuxManager;
    private agents;
    private currentTask?;
    constructor(config: ShokuninConfig);
    /**
     * 啟動 Raiy-PDCA 系統
     */
    start(mission: string, options?: CLIOptions): Promise<void>;
    /**
     * 停止系統
     */
    stop(): Promise<void>;
    /**
     * 獲取系統狀態
     */
    getStatus(): {
        isRunning: boolean;
        task?: Task;
        agents: Array<{
            name: string;
            status: string;
        }>;
    };
    /**
     * 初始化代理
     */
    private initializeAgents;
    /**
     * 設置 tmux 環境
     */
    private setupTmuxEnvironment;
    /**
     * 啟動所有代理
     */
    private startAllAgents;
    /**
     * 停止所有代理
     */
    private stopAllAgents;
    /**
     * 啟動監控
     */
    private startMonitoring;
    /**
     * 創建任務
     */
    private createTask;
    /**
     * 休眠工具函數
     */
    private sleep;
}
//# sourceMappingURL=orchestrator.d.ts.map