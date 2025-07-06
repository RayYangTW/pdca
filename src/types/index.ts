/**
 * PDCA-Shokunin TypeScript 型別定義
 */

// 代理狀態
export type AgentStatus = 'idle' | 'starting' | 'running' | 'completed' | 'error';

// 代理基礎介面
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

// 任務介面
export interface Task {
  id: string;
  description: string;
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agents: Record<string, AgentProgress>;
}

// 代理進度
export interface AgentProgress {
  status: AgentStatus;
  progress: number;
  lastUpdate?: Date;
  message?: string;
}

// 配置介面
export interface ShokuninConfig {
  sessionName: string;
  language: 'zh-TW' | 'en';
  agents: AgentConfig[];
  communication: CommunicationConfig;
  monitoring: MonitoringConfig;
}

// 代理配置
export interface AgentConfig {
  name: string;
  role: string;
  icon: string;
  description: string;
  prompt: string;
  skills: string[];
}

// 通訊配置
export interface CommunicationConfig {
  method: 'file-based' | 'socket';
  directory: string;
  syncInterval: number;
}

// 監控配置
export interface MonitoringConfig {
  refreshRate: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  showTimestamps: boolean;
}

// CLI 選項
export interface CLIOptions {
  detach?: boolean;
  monitor?: boolean;
  agents?: number;
  mode?: 'pdca' | 'sparc';
  verbose?: boolean;
}

// Tmux 相關
export interface TmuxSession {
  name: string;
  windows: TmuxWindow[];
}

export interface TmuxWindow {
  index: number;
  name: string;
  active: boolean;
}

// 訊息類型
export interface AgentMessage {
  from: string;
  to?: string;
  content: string;
  timestamp: Date;
  type: 'task' | 'status' | 'result' | 'communication';
}

// 錯誤類型
export class ShokuninError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ShokuninError';
  }
}

// 事件類型
export interface ShokuninEvents {
  'agent:started': { agent: string };
  'agent:completed': { agent: string; result?: any };
  'agent:error': { agent: string; error: Error };
  'task:created': { task: Task };
  'task:completed': { task: Task };
  'system:ready': { sessionName: string };
}