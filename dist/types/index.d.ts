/**
 * PDCA-Shokunin TypeScript 型別定義
 */
export type AgentStatus = 'idle' | 'starting' | 'running' | 'completed' | 'error';
export interface Agent {
    name: string;
    role: string;
    icon: string;
    description: string;
    status: AgentStatus;
    workspacePath?: string;
    start(task: string): Promise<void>;
    stop(): Promise<void>;
    getStatus(): AgentStatus;
    sendMessage(message: string): Promise<void>;
    setTmuxTarget(target: string): void;
    setWorkspacePath(path: string): void;
    isRunning(): Promise<boolean>;
}
export interface Task {
    id: string;
    description: string;
    createdAt: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agents: Record<string, AgentProgress>;
}
export interface AgentProgress {
    status: AgentStatus;
    progress: number;
    lastUpdate?: Date;
    message?: string;
}
export interface ShokuninConfig {
    sessionName: string;
    language: 'zh-TW' | 'en';
    agents: AgentConfig[];
    communication: CommunicationConfig;
    monitoring: MonitoringConfig;
}
export interface AgentConfig {
    name: string;
    role: string;
    icon: string;
    description: string;
    prompt: string;
    skills: string[];
}
export interface CommunicationConfig {
    method: 'file-based' | 'socket';
    directory: string;
    syncInterval: number;
}
export interface MonitoringConfig {
    refreshRate: number;
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    showTimestamps: boolean;
}
export interface CLIOptions {
    detach?: boolean;
    monitor?: boolean;
    agents?: number;
    mode?: 'pdca' | 'sparc';
    verbose?: boolean;
}
export interface TmuxSession {
    name: string;
    windows: TmuxWindow[];
}
export interface TmuxWindow {
    index: number;
    name: string;
    active: boolean;
}
export interface AgentMessage {
    from: string;
    to?: string;
    content: string;
    timestamp: Date;
    type: 'task' | 'status' | 'result' | 'communication';
}
export declare class ShokuninError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export interface ShokuninEvents {
    'agent:started': {
        agent: string;
    };
    'agent:completed': {
        agent: string;
        result?: any;
    };
    'agent:error': {
        agent: string;
        error: Error;
    };
    'task:created': {
        task: Task;
    };
    'task:completed': {
        task: Task;
    };
    'system:ready': {
        sessionName: string;
    };
}
//# sourceMappingURL=index.d.ts.map