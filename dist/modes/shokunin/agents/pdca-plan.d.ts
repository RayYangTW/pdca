/**
 * PDCA Plan 階段代理
 * 負責需求分析、策略制定、任務協調
 */
import { BaseAgent } from './base-agent.js';
export declare class PdcaPlanAgent extends BaseAgent {
    constructor();
    protected onStart(task: string): Promise<void>;
    protected onStop(): Promise<void>;
    protected getInitialPrompt(task: string): string;
    /**
     * 初始化規劃階段的特定邏輯
     */
    private initializePlanningPhase;
    /**
     * 向其他代理發送任務分配
     */
    assignTask(targetAgent: string, subtask: string): Promise<void>;
    /**
     * 更新計劃狀態
     */
    updatePlan(planUpdate: string): Promise<void>;
}
//# sourceMappingURL=pdca-plan.d.ts.map