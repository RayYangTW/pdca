/**
 * PDCA 循環控制器
 * 解決無限循環問題，提供智能停止機制
 */

import { EventEmitter } from 'events';
import type { LoopControlConfig, CostControlConfig } from '../types/config.js';

export interface IterationMetrics {
  iterationNumber: number;
  qualityScore: number;
  tokensUsed: number;
  timeElapsed: number;
  improvement: number;
  agentResults: Record<string, any>;
}

export interface ContinueDecision {
  continue: boolean;
  reason: string;
  confidence: number;
  suggestion?: string;
  metrics?: IterationMetrics;
}

export interface CostTracker {
  totalTokens: number;
  totalCost: number;
  tokensByAgent: Record<string, number>;
  costByAgent: Record<string, number>;
  currency: string;
}

export class LoopController extends EventEmitter {
  private loopConfig: LoopControlConfig;
  private costConfig: CostControlConfig;
  private iterations: IterationMetrics[] = [];
  private costTracker: CostTracker;
  private startTime: Date;
  private currentIteration: number = 0;

  constructor(
    loopConfig: LoopControlConfig,
    costConfig: CostControlConfig,
    pricingModel?: Record<string, number>
  ) {
    super();
    this.loopConfig = loopConfig;
    this.costConfig = costConfig;
    this.startTime = new Date();
    
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      tokensByAgent: {},
      costByAgent: {},
      currency: costConfig.currency
    };

    // 設定定價模型
    if (pricingModel && costConfig.show_realtime) {
      this.setupPricingModel(pricingModel);
    }
  }

  /**
   * 檢查是否應該繼續下一輪迭代
   */
  async shouldContinue(metrics: IterationMetrics): Promise<ContinueDecision> {
    this.iterations.push(metrics);
    this.currentIteration = metrics.iterationNumber;

    // 更新成本追蹤
    this.updateCostTracking(metrics);

    // 顯示即時狀態
    if (this.costConfig.show_realtime) {
      this.displayRealTimeStatus(metrics);
    }

    // 1. 強制停止檢查
    const forceStop = this.checkForceStop(metrics);
    if (forceStop.continue === false) {
      return forceStop;
    }

    // 2. 品質達標檢查
    const qualityCheck = this.checkQualityTarget(metrics);
    if (qualityCheck.continue === false) {
      return qualityCheck;
    }

    // 3. 邊際效益檢查
    const marginalCheck = this.checkMarginalImprovement(metrics);
    if (marginalCheck.continue === false) {
      return marginalCheck;
    }

    // 4. 自動繼續檢查
    if (this.loopConfig.auto_continue) {
      return {
        continue: true,
        reason: 'auto_continue_enabled',
        confidence: 0.8,
        suggestion: '自動繼續下一輪迭代'
      };
    }

    // 5. 用戶決策
    if (this.loopConfig.require_confirmation) {
      return await this.askUserDecision(metrics);
    }

    // 預設繼續
    return {
      continue: true,
      reason: 'default_continue',
      confidence: 0.6,
      suggestion: '條件允許，建議繼續'
    };
  }

  /**
   * 強制停止檢查
   */
  private checkForceStop(metrics: IterationMetrics): ContinueDecision {
    // 檢查最大迭代次數
    if (this.loopConfig.max_iterations !== null && 
        metrics.iterationNumber >= this.loopConfig.max_iterations) {
      return {
        continue: false,
        reason: 'max_iterations_reached',
        confidence: 1.0,
        suggestion: `已達最大迭代次數 ${this.loopConfig.max_iterations}`
      };
    }

    // 檢查 Token 預算
    if (this.loopConfig.token_budget !== null && 
        this.costTracker.totalTokens >= this.loopConfig.token_budget) {
      return {
        continue: false,
        reason: 'token_budget_exceeded',
        confidence: 1.0,
        suggestion: `已超過 Token 預算 ${this.loopConfig.token_budget.toLocaleString()}`
      };
    }

    // 檢查硬停止限制
    if (this.costConfig.hard_stop_at_tokens !== null && 
        this.costTracker.totalTokens >= this.costConfig.hard_stop_at_tokens) {
      return {
        continue: false,
        reason: 'hard_stop_reached',
        confidence: 1.0,
        suggestion: `已達硬停止限制 ${this.costConfig.hard_stop_at_tokens.toLocaleString()} tokens`
      };
    }

    // 檢查時間預算
    if (this.loopConfig.time_budget_minutes !== null) {
      const elapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60);
      if (elapsed >= this.loopConfig.time_budget_minutes) {
        return {
          continue: false,
          reason: 'time_budget_exceeded',
          confidence: 1.0,
          suggestion: `已超過時間預算 ${this.loopConfig.time_budget_minutes} 分鐘`
        };
      }
    }

    return { continue: true, reason: 'no_force_stop', confidence: 1.0 };
  }

  /**
   * 品質達標檢查
   */
  private checkQualityTarget(metrics: IterationMetrics): ContinueDecision {
    if (metrics.qualityScore >= this.loopConfig.quality_target) {
      return {
        continue: false,
        reason: 'quality_target_achieved',
        confidence: 0.9,
        suggestion: `品質已達標 ${(metrics.qualityScore * 100).toFixed(1)}% >= ${(this.loopConfig.quality_target * 100).toFixed(0)}%`
      };
    }

    return { continue: true, reason: 'quality_below_target', confidence: 0.8 };
  }

  /**
   * 邊際效益檢查
   */
  private checkMarginalImprovement(metrics: IterationMetrics): ContinueDecision {
    if (this.iterations.length < 2) {
      return { continue: true, reason: 'insufficient_data', confidence: 0.7 };
    }

    const previousMetrics = this.iterations[this.iterations.length - 2];
    const improvement = metrics.qualityScore - previousMetrics.qualityScore;

    if (improvement < this.loopConfig.marginal_threshold) {
      const improvementPercent = (improvement * 100).toFixed(1);
      const thresholdPercent = (this.loopConfig.marginal_threshold * 100).toFixed(1);
      
      return {
        continue: false,
        reason: 'diminishing_returns',
        confidence: 0.85,
        suggestion: `改進幅度過小 ${improvementPercent}% < ${thresholdPercent}%，邊際效益遞減`
      };
    }

    return { continue: true, reason: 'significant_improvement', confidence: 0.8 };
  }

  /**
   * 詢問用戶決策
   */
  private async askUserDecision(metrics: IterationMetrics): Promise<ContinueDecision> {
    // 顯示當前狀態摘要
    this.displayIterationSummary(metrics);

    // 生成建議
    const recommendation = this.generateRecommendation(metrics);

    // 發出事件讓 CLI 處理用戶輸入
    return new Promise((resolve) => {
      this.emit('user-decision-required', {
        metrics,
        recommendation,
        resolve
      });
    });
  }

  /**
   * 生成建議
   */
  private generateRecommendation(metrics: IterationMetrics): string {
    const suggestions: string[] = [];

    // 品質分析
    const qualityGap = this.loopConfig.quality_target - metrics.qualityScore;
    if (qualityGap > 0.1) {
      suggestions.push(`品質還有 ${(qualityGap * 100).toFixed(1)}% 改進空間`);
    } else if (qualityGap > 0) {
      suggestions.push(`品質接近目標，還需 ${(qualityGap * 100).toFixed(1)}% 提升`);
    }

    // 成本分析
    if (this.loopConfig.token_budget) {
      const remaining = this.loopConfig.token_budget - this.costTracker.totalTokens;
      const remainingPercent = (remaining / this.loopConfig.token_budget) * 100;
      if (remainingPercent < 20) {
        suggestions.push(`預算剩餘 ${remainingPercent.toFixed(0)}%，建議謹慎繼續`);
      }
    }

    // 改進趨勢分析
    if (this.iterations.length >= 2) {
      const recentImprovement = this.calculateRecentImprovement();
      if (recentImprovement > this.loopConfig.marginal_threshold * 2) {
        suggestions.push('改進趨勢良好，建議繼續');
      } else {
        suggestions.push('改進趨勢放緩，考慮結束');
      }
    }

    return suggestions.length > 0 ? suggestions.join('；') : '建議根據實際需求決定';
  }

  /**
   * 更新成本追蹤
   */
  private updateCostTracking(metrics: IterationMetrics): void {
    this.costTracker.totalTokens += metrics.tokensUsed;

    // 按代理追蹤
    if (this.costConfig.track_by_agent && metrics.agentResults) {
      for (const [agent, result] of Object.entries(metrics.agentResults)) {
        const tokens = result.tokensUsed || 0;
        this.costTracker.tokensByAgent[agent] = 
          (this.costTracker.tokensByAgent[agent] || 0) + tokens;
      }
    }

    // 計算總成本
    this.costTracker.totalCost = this.calculateTotalCost();

    // 檢查警告閾值
    this.checkCostWarnings();
  }

  /**
   * 檢查成本警告
   */
  private checkCostWarnings(): void {
    if (this.costConfig.warn_at_percent && this.loopConfig.token_budget) {
      const usedPercent = (this.costTracker.totalTokens / this.loopConfig.token_budget) * 100;
      
      if (usedPercent >= this.costConfig.warn_at_percent) {
        this.emit('cost-warning', {
          usedPercent,
          tokensUsed: this.costTracker.totalTokens,
          budget: this.loopConfig.token_budget,
          estimatedCost: this.costTracker.totalCost
        });
      }
    }
  }

  /**
   * 顯示即時狀態
   */
  private displayRealTimeStatus(metrics: IterationMetrics): void {
    console.log('\n' + '═'.repeat(60));
    console.log(`🔄 第 ${metrics.iterationNumber} 輪迭代完成`);
    console.log('─'.repeat(60));
    console.log(`📊 品質分數: ${(metrics.qualityScore * 100).toFixed(1)}% / ${(this.loopConfig.quality_target * 100).toFixed(0)}%`);
    console.log(`💰 Token 使用: ${this.costTracker.totalTokens.toLocaleString()} / ${this.loopConfig.token_budget?.toLocaleString() || '無限制'}`);
    
    if (this.costTracker.totalCost > 0) {
      console.log(`💸 預估成本: ${this.costTracker.totalCost.toFixed(4)} ${this.costConfig.currency}`);
    }

    const elapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60);
    console.log(`⏱️  已用時間: ${elapsed.toFixed(1)} 分鐘`);

    if (this.iterations.length >= 2) {
      const improvement = this.calculateRecentImprovement();
      const trend = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
      console.log(`${trend} 改進幅度: ${(improvement * 100).toFixed(1)}%`);
    }

    console.log('═'.repeat(60));
  }

  /**
   * 顯示迭代摘要
   */
  private displayIterationSummary(metrics: IterationMetrics): void {
    console.log('\n🎯 迭代摘要');
    console.log('─'.repeat(50));
    
    // 品質進展
    if (this.iterations.length >= 2) {
      const prev = this.iterations[this.iterations.length - 2];
      const improvement = metrics.qualityScore - prev.qualityScore;
      const trend = improvement > 0 ? '↗️' : improvement < 0 ? '↘️' : '→';
      console.log(`${trend} 品質變化: ${(improvement * 100).toFixed(1)}%`);
    }

    // 成本效益
    const costPerQuality = this.costTracker.totalTokens / metrics.qualityScore;
    console.log(`💡 成本效益: ${costPerQuality.toFixed(0)} tokens/品質點`);

    // 預計完成情況
    if (this.loopConfig.quality_target > metrics.qualityScore) {
      const remaining = this.loopConfig.quality_target - metrics.qualityScore;
      const avgImprovement = this.calculateAverageImprovement();
      if (avgImprovement > 0) {
        const estimatedIterations = Math.ceil(remaining / avgImprovement);
        console.log(`📈 預計還需 ${estimatedIterations} 輪達到目標`);
      }
    }

    console.log('─'.repeat(50));
  }

  /**
   * 計算最近改進幅度
   */
  private calculateRecentImprovement(): number {
    if (this.iterations.length < 2) return 0;
    
    const current = this.iterations[this.iterations.length - 1];
    const previous = this.iterations[this.iterations.length - 2];
    return current.qualityScore - previous.qualityScore;
  }

  /**
   * 計算平均改進幅度
   */
  private calculateAverageImprovement(): number {
    if (this.iterations.length < 2) return 0;

    let totalImprovement = 0;
    for (let i = 1; i < this.iterations.length; i++) {
      totalImprovement += this.iterations[i].qualityScore - this.iterations[i-1].qualityScore;
    }

    return totalImprovement / (this.iterations.length - 1);
  }

  /**
   * 計算總成本
   */
  private calculateTotalCost(): number {
    // 這裡需要實際的定價模型
    return this.costTracker.totalTokens * 0.00003; // 預設每 token $0.00003
  }

  /**
   * 設定定價模型
   */
  private setupPricingModel(pricingModel: Record<string, number>): void {
    // 儲存定價模型供後續使用
    this.emit('pricing-model-updated', pricingModel);
  }

  /**
   * 重置控制器
   */
  reset(): void {
    this.iterations = [];
    this.currentIteration = 0;
    this.startTime = new Date();
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      tokensByAgent: {},
      costByAgent: {},
      currency: this.costConfig.currency
    };
  }

  /**
   * 獲取統計信息
   */
  getStatistics() {
    return {
      totalIterations: this.iterations.length,
      totalTokens: this.costTracker.totalTokens,
      totalCost: this.costTracker.totalCost,
      averageQuality: this.iterations.length > 0 
        ? this.iterations.reduce((sum, iter) => sum + iter.qualityScore, 0) / this.iterations.length 
        : 0,
      totalTime: Date.now() - this.startTime.getTime(),
      efficiency: this.costTracker.totalTokens > 0 
        ? (this.iterations[this.iterations.length - 1]?.qualityScore || 0) / this.costTracker.totalTokens 
        : 0
    };
  }
}