/**
 * PDCA-Shokunin 主要匯出
 */

// 核心類別
export { TmuxManager } from './core/tmux-manager.js';
export { ClaudeCliManager } from './core/claude-cli.js';

// 代理系統
export { BaseAgent } from './modes/shokunin/agents/base-agent.js';
export { PdcaPlanAgent } from './modes/shokunin/agents/pdca-plan.js';

// 協調器
export { ShokuninOrchestrator } from './modes/shokunin/orchestrator.js';

// 型別定義
export type * from './types/index.js';

// 版本資訊
export const VERSION = '3.0.0';