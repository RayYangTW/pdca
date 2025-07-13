/**
 * 配置相關的類型定義
 */

export type ThinkingDepth = 'think' | 'think hard' | 'think harder' | 'superthink' | 'ultrathink';
export type CommunicationStyle = 'precise' | 'casual' | 'formal' | 'technical';
export type ApproachType = 'top-down' | 'bottom-up' | 'iterative' | 'user-story' | 'systematic' | 'evolutionary' | 'observational';

/**
 * 代理人格配置
 */
export interface AgentPersonality {
  name: string;
  traits: string[];
  thinking: ThinkingDepth;
  approach: ApproachType;
}

/**
 * 代理提示詞配置
 */
export interface AgentPrompts {
  initial: string;
  mission: string;
  [key: string]: string; // 允許自定義提示詞
}

/**
 * 單個代理配置
 */
export interface AgentConfig {
  name: string;
  role: string;
  icon: string;
  personality: AgentPersonality;
  prompts: AgentPrompts;
  count?: number; // 允許多個相同類型的代理
  tools?: string[]; // 需要的工具列表
}

/**
 * 全域配置
 */
export interface GlobalConfig {
  language: string;
  thinking_depth: ThinkingDepth;
  communication_style: CommunicationStyle;
  quality_standard?: string;
  iteration_style?: string;
  [key: string]: any; // 允許自定義全域設定
}

/**
 * 通訊配置
 */
export interface CommunicationConfig {
  method: 'file-based' | 'websocket' | 'grpc';
  directory?: string;
  sync_interval: number;
  message_format?: 'structured' | 'simple' | 'json';
  protocols: string[];
}

/**
 * 循環控制配置
 */
export interface LoopControlConfig {
  max_iterations: number | null;         // 最大迭代次數，null = 無限制
  quality_target: number;                // 品質目標 (0.0-1.0)
  marginal_threshold: number;            // 邊際改進閾值 (0.0-1.0)
  token_budget: number | null;           // Token 預算，null = 無限制
  time_budget_minutes: number | null;    // 時間預算（分鐘），null = 無限制
  auto_continue: boolean;                // 是否自動繼續下一輪
  require_confirmation: boolean;         // 每輪是否需要用戶確認
}

/**
 * 成本控制配置
 */
export interface CostControlConfig {
  show_realtime: boolean;                // 是否即時顯示成本
  warn_at_percent: number | null;        // 在多少百分比時警告，null = 不警告
  hard_stop_at_tokens: number | null;    // 硬停止 token 數，null = 無限制
  track_by_agent: boolean;               // 是否按代理追蹤成本
  currency: 'USD' | 'TWD' | 'CNY';       // 顯示貨幣
  pricing_model?: Record<string, number>; // 各引擎定價
}

/**
 * 執行配置
 */
export interface ExecutionConfig {
  parallel: boolean;
  max_agents: number;
  startup_delay: number;
  health_check_interval: number;
  error_recovery: 'automatic' | 'manual' | 'fail-fast';
  
  // 新增循環和成本控制
  loop_control: LoopControlConfig;
  cost_control: CostControlConfig;
}

/**
 * 監控配置
 */
export interface MonitoringConfig {
  enabled: boolean;
  ui: 'blessed' | 'web' | 'cli';
  refresh_rate: number;
  show_metrics: boolean;
  log_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  dashboard_layout?: string;
}

/**
 * 品質標準配置
 */
export interface QualityConfig {
  code_coverage?: number;
  performance_threshold?: number;
  error_tolerance?: number;
  documentation_required?: boolean;
}

/**
 * 敏捷指標配置
 */
export interface MetricsConfig {
  velocity_tracking?: boolean;
  burndown_chart?: boolean;
  cycle_time_target?: number;
  deployment_frequency?: string;
}

/**
 * 完整的代理配置檔案
 */
export interface AgentProfile {
  name: string;
  version: string;
  description: string;
  author?: string;
  base?: string; // 基礎配置名稱（用於繼承）
  
  globals: GlobalConfig;
  agents: Record<string, AgentConfig>;
  
  communication: CommunicationConfig;
  execution: ExecutionConfig;
  monitoring?: MonitoringConfig;
  quality?: QualityConfig;
  metrics?: MetricsConfig;
  
  [key: string]: any; // 允許自定義配置區塊
}

/**
 * 運行時配置（合併所有來源後的最終配置）
 */
export interface RuntimeConfig extends AgentProfile {
  // 運行時額外資訊
  sessionId: string;
  startTime: Date;
  workingDirectory: string;
  commandLineOverrides?: Record<string, any>;
  environmentOverrides?: Record<string, any>;
}

/**
 * 配置模式定義
 */
export interface ConfigProfile {
  name: string;
  description: string;
  execution: Partial<ExecutionConfig>;
  [key: string]: any; // 允許覆蓋其他配置
}

/**
 * 配置載入選項
 */
export interface ConfigLoadOptions {
  profile?: string;
  configFile?: string;
  overrides?: Partial<AgentProfile>;
  validateOnly?: boolean;
  cliOverrides?: Record<string, any>;    // CLI 參數覆蓋
  envOverrides?: Record<string, any>;    // 環境變數覆蓋
}

/**
 * 配置驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 代理實例配置（用於創建代理時）
 */
export interface AgentInstanceConfig extends AgentConfig {
  instanceId: string;
  tmuxWindow?: number;
  workingDirectory?: string;
  environmentVariables?: Record<string, string>;
}