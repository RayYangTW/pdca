/**
 * Tmux 管理器
 * 負責創建和管理 tmux sessions、windows
 */
import type { TmuxSession, TmuxWindow } from '../types/index.js';
export declare class TmuxManager {
    private sessionName;
    constructor(sessionName?: string);
    /**
     * 檢查 tmux session 是否存在
     */
    hasSession(): Promise<boolean>;
    /**
     * 創建新的 tmux session
     */
    createSession(): Promise<void>;
    /**
     * 創建新窗口
     */
    createWindow(name: string, index?: number, workingDir?: string): Promise<void>;
    /**
     * 在指定窗口中發送命令
     */
    sendCommand(target: string, command: string): Promise<void>;
    /**
     * 列出所有窗口
     */
    listWindows(): Promise<TmuxWindow[]>;
    /**
     * 獲取 session 資訊
     */
    getSession(): Promise<TmuxSession | null>;
    /**
     * 殺掉 session
     */
    killSession(): Promise<void>;
    /**
     * 連接到 session（在新的終端視窗中）
     */
    attachSession(): Promise<void>;
    /**
     * 選擇特定窗口
     */
    selectWindow(target: string | number): Promise<void>;
    /**
     * 檢查特定窗口是否存在
     */
    hasWindow(name: string): Promise<boolean>;
    /**
     * 等待窗口創建完成
     */
    waitForWindow(name: string, timeoutMs?: number): Promise<boolean>;
    /**
     * 執行 tmux 命令
     */
    private execTmux;
    /**
     * 休眠工具函數
     */
    private sleep;
}
//# sourceMappingURL=tmux-manager.d.ts.map