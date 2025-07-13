/**
 * Token 追蹤系統 - 真實 Token 計算與成本管理
 */

import { estimateTokenCount } from 'tokenx';
import { EventEmitter } from 'events';

/**
 * AI 模型類型
 */
export enum AIModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GEMINI_PRO = 'gemini-pro',
  GEMINI_FLASH = 'gemini-1.5-flash'
}

/**
 * Token 使用記錄
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: Date;
  model: AIModel;
  agentId?: string;
  operation?: string;
}

/**
 * 成本計算配置
 */
export interface PricingModel {
  inputCostPer1K: number;  // 每 1K input tokens 的成本 (USD)
  outputCostPer1K: number; // 每 1K output tokens 的成本 (USD)
}

/**
 * 累積統計
 */
export interface TokenStatistics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  operationCount: number;
  averageTokensPerOperation: number;
  costByAgent: Record<string, number>;
  tokensByAgent: Record<string, number>;
  startTime: Date;
  lastUpdate: Date;
}

/**
 * 真實 Token 追蹤器
 */
export class RealTokenTracker extends EventEmitter {
  private usageHistory: TokenUsage[] = [];
  private pricingModels: Record<AIModel, PricingModel>;
  private startTime: Date;
  private currentBudget?: number;
  private warningThreshold: number = 0.8; // 80% 預算時警告

  constructor(budget?: number) {
    super();
    this.currentBudget = budget;
    this.startTime = new Date();
    
    // 初始化各模型的定價（2025年7月的估算值，需定期更新）
    this.pricingModels = {
      [AIModel.CLAUDE_3_5_SONNET]: { inputCostPer1K: 0.003, outputCostPer1K: 0.015 },
      [AIModel.CLAUDE_3_HAIKU]: { inputCostPer1K: 0.00025, outputCostPer1K: 0.00125 },
      [AIModel.GPT_4]: { inputCostPer1K: 0.03, outputCostPer1K: 0.06 },
      [AIModel.GPT_3_5_TURBO]: { inputCostPer1K: 0.0015, outputCostPer1K: 0.002 },
      [AIModel.GEMINI_PRO]: { inputCostPer1K: 0.000125, outputCostPer1K: 0.000375 },
      [AIModel.GEMINI_FLASH]: { inputCostPer1K: 0.000075, outputCostPer1K: 0.0003 }
    };
  }

  /**
   * 估算文本的 token 數量
   */
  estimateTokens(text: string, model: AIModel = AIModel.CLAUDE_3_5_SONNET): number {
    // tokenx 庫提供通用的 token 估算
    try {
      return estimateTokenCount(text);
    } catch (error) {
      console.warn('Token 估算失敗，使用近似值', error);
      // 回退到簡單的字符數估算（通常 1 token ≈ 3-4 字符）
      return Math.ceil(text.length / 3.5);
    }
  }

  /**
   * 記錄 AI 調用的 token 使用
   */
  trackUsage(
    input: string,
    output: string,
    model: AIModel,
    agentId?: string,
    operation?: string
  ): TokenUsage {
    const inputTokens = this.estimateTokens(input, model);
    const outputTokens = this.estimateTokens(output, model);
    const totalTokens = inputTokens + outputTokens;
    
    const pricing = this.pricingModels[model];
    const estimatedCost = (inputTokens / 1000) * pricing.inputCostPer1K + 
                         (outputTokens / 1000) * pricing.outputCostPer1K;

    const usage: TokenUsage = {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      timestamp: new Date(),
      model,
      agentId,
      operation
    };

    this.usageHistory.push(usage);
    
    // 發出事件
    this.emit('usage-recorded', usage);
    
    // 檢查預算警告
    this.checkBudgetWarnings();
    
    return usage;
  }

  /**
   * 只估算不記錄（用於預測成本）
   */
  estimateUsage(input: string, expectedOutput: string, model: AIModel): TokenUsage {
    const inputTokens = this.estimateTokens(input, model);
    const outputTokens = this.estimateTokens(expectedOutput, model);
    const totalTokens = inputTokens + outputTokens;
    
    const pricing = this.pricingModels[model];
    const estimatedCost = (inputTokens / 1000) * pricing.inputCostPer1K + 
                         (outputTokens / 1000) * pricing.outputCostPer1K;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      timestamp: new Date(),
      model
    };
  }

  /**
   * 獲取累積統計
   */
  getStatistics(): TokenStatistics {
    const totalInputTokens = this.usageHistory.reduce((sum, usage) => sum + usage.inputTokens, 0);
    const totalOutputTokens = this.usageHistory.reduce((sum, usage) => sum + usage.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    const totalCost = this.usageHistory.reduce((sum, usage) => sum + usage.estimatedCost, 0);
    
    // 按代理分組統計
    const costByAgent: Record<string, number> = {};
    const tokensByAgent: Record<string, number> = {};
    
    this.usageHistory.forEach(usage => {
      if (usage.agentId) {
        costByAgent[usage.agentId] = (costByAgent[usage.agentId] || 0) + usage.estimatedCost;
        tokensByAgent[usage.agentId] = (tokensByAgent[usage.agentId] || 0) + usage.totalTokens;
      }
    });

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalCost,
      operationCount: this.usageHistory.length,
      averageTokensPerOperation: this.usageHistory.length > 0 ? totalTokens / this.usageHistory.length : 0,
      costByAgent,
      tokensByAgent,
      startTime: this.startTime,
      lastUpdate: this.usageHistory.length > 0 ? this.usageHistory[this.usageHistory.length - 1].timestamp : this.startTime
    };
  }

  /**
   * 獲取預算使用狀況
   */
  getBudgetStatus(): {
    totalCost: number;
    budget?: number;
    remainingBudget?: number;
    usagePercentage?: number;
    isOverBudget: boolean;
    willExceedBudget: (estimatedCost: number) => boolean;
  } {
    const stats = this.getStatistics();
    const isOverBudget = this.currentBudget ? stats.totalCost > this.currentBudget : false;
    const usagePercentage = this.currentBudget ? (stats.totalCost / this.currentBudget) * 100 : undefined;
    const remainingBudget = this.currentBudget ? this.currentBudget - stats.totalCost : undefined;

    return {
      totalCost: stats.totalCost,
      budget: this.currentBudget,
      remainingBudget,
      usagePercentage,
      isOverBudget,
      willExceedBudget: (estimatedCost: number): boolean => {
        if (!this.currentBudget) return false;
        return (stats.totalCost + estimatedCost) > this.currentBudget;
      }
    };
  }

  /**
   * 設定預算和警告閾值
   */
  setBudget(budget: number, warningThreshold: number = 0.8): void {
    this.currentBudget = budget;
    this.warningThreshold = warningThreshold;
    this.checkBudgetWarnings();
  }

  /**
   * 檢查預算警告
   */
  private checkBudgetWarnings(): void {
    if (!this.currentBudget) return;
    
    const budgetStatus = this.getBudgetStatus();
    
    if (budgetStatus.isOverBudget) {
      this.emit('budget-exceeded', budgetStatus);
    } else if (budgetStatus.usagePercentage && budgetStatus.usagePercentage >= this.warningThreshold * 100) {
      this.emit('budget-warning', budgetStatus);
    }
  }

  /**
   * 重置統計（保留配置）
   */
  reset(): void {
    this.usageHistory = [];
    this.startTime = new Date();
    this.emit('stats-reset');
  }

  /**
   * 匯出詳細報告
   */
  exportReport(): {
    summary: TokenStatistics;
    budgetStatus: any;
    usageHistory: TokenUsage[];
    recommendations: string[];
  } {
    const summary = this.getStatistics();
    const budgetStatus = this.getBudgetStatus();
    const recommendations: string[] = [];

    // 產生建議
    if (budgetStatus.isOverBudget) {
      recommendations.push('⚠️ 已超出預算，建議調整策略或增加預算');
    }
    
    if (summary.averageTokensPerOperation > 5000) {
      recommendations.push('💡 平均 token 使用量較高，考慮優化 prompt 或使用更經濟的模型');
    }

    const topAgent = Object.entries(summary.costByAgent)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topAgent && topAgent[1] > summary.totalCost * 0.5) {
      recommendations.push(`🎯 代理 "${topAgent[0]}" 消耗了 ${(topAgent[1]/summary.totalCost*100).toFixed(1)}% 的預算，檢查是否有優化空間`);
    }

    return {
      summary,
      budgetStatus,
      usageHistory: this.usageHistory.slice(), // 深拷貝
      recommendations
    };
  }
}

/**
 * 全域 Token 追蹤器實例
 */
export let globalTokenTracker: RealTokenTracker | null = null;

/**
 * 初始化全域追蹤器
 */
export function initializeTokenTracker(budget?: number): RealTokenTracker {
  globalTokenTracker = new RealTokenTracker(budget);
  return globalTokenTracker;
}

/**
 * 獲取全域追蹤器
 */
export function getTokenTracker(): RealTokenTracker {
  if (!globalTokenTracker) {
    throw new Error('Token 追蹤器尚未初始化，請先調用 initializeTokenTracker()');
  }
  return globalTokenTracker;
}