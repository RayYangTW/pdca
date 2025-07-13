/**
 * 高級配置載入器
 * 支援多層配置合併、預設配置集、環境變數和 CLI 參數覆蓋
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parse } from 'yaml';
import { homedir } from 'os';
import type { 
  AgentProfile, 
  ConfigProfile, 
  ConfigLoadOptions, 
  LoopControlConfig, 
  CostControlConfig,
  ExecutionConfig,
  RuntimeConfig 
} from '../types/config.js';
import { ConfigLoader } from './config-loader.js';

/**
 * 內建配置集
 */
const BUILTIN_PROFILES: Record<string, ConfigProfile> = {
  economic: {
    name: 'Economic',
    description: '經濟實惠型：最小成本，基本品質',
    execution: {
      max_agents: 2,
      loop_control: {
        max_iterations: 1,
        quality_target: 0.75,
        marginal_threshold: 0.20,
        token_budget: 5000,
        time_budget_minutes: 10,
        auto_continue: false,
        require_confirmation: false
      },
      cost_control: {
        show_realtime: true,
        warn_at_percent: 80,
        hard_stop_at_tokens: 8000,
        track_by_agent: true,
        currency: 'USD'
      }
    }
  },

  balanced: {
    name: 'Balanced',
    description: '平衡型：合理成本，良好品質（預設）',
    execution: {
      max_agents: 4,
      loop_control: {
        max_iterations: 3,
        quality_target: 0.85,
        marginal_threshold: 0.10,
        token_budget: 10000,
        time_budget_minutes: 20,
        auto_continue: false,
        require_confirmation: true
      },
      cost_control: {
        show_realtime: true,
        warn_at_percent: 80,
        hard_stop_at_tokens: 15000,
        track_by_agent: true,
        currency: 'USD'
      }
    }
  },

  premium: {
    name: 'Premium',
    description: '品質優先型：較高成本，優秀品質',
    execution: {
      max_agents: 5,
      loop_control: {
        max_iterations: 5,
        quality_target: 0.95,
        marginal_threshold: 0.05,
        token_budget: 50000,
        time_budget_minutes: 60,
        auto_continue: false,
        require_confirmation: true
      },
      cost_control: {
        show_realtime: true,
        warn_at_percent: 90,
        hard_stop_at_tokens: 80000,
        track_by_agent: true,
        currency: 'USD'
      }
    }
  },

  unlimited: {
    name: 'Unlimited',
    description: '無限制型：追求極致，不考慮成本',
    execution: {
      max_agents: 5,
      loop_control: {
        max_iterations: null,
        quality_target: 0.99,
        marginal_threshold: 0.01,
        token_budget: null,
        time_budget_minutes: null,
        auto_continue: true,
        require_confirmation: false
      },
      cost_control: {
        show_realtime: false,
        warn_at_percent: null,
        hard_stop_at_tokens: null,
        track_by_agent: false,
        currency: 'USD'
      }
    }
  }
};

/**
 * 預設執行配置
 */
const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  parallel: true,
  max_agents: 4,
  startup_delay: 1000,
  health_check_interval: 5000,
  error_recovery: 'automatic',
  
  loop_control: {
    max_iterations: 3,
    quality_target: 0.85,
    marginal_threshold: 0.10,
    token_budget: 10000,
    time_budget_minutes: 20,
    auto_continue: false,
    require_confirmation: true
  },
  
  cost_control: {
    show_realtime: true,
    warn_at_percent: 80,
    hard_stop_at_tokens: 15000,
    track_by_agent: true,
    currency: 'USD'
  }
};

export class AdvancedConfigLoader extends ConfigLoader {
  private globalConfigPath: string;
  private projectConfigPath: string;

  constructor(baseDir?: string) {
    super(baseDir);
    
    // 全域配置路徑
    this.globalConfigPath = join(homedir(), '.pdca', 'config.yaml');
    
    // 專案配置路徑
    const base = baseDir || process.cwd();
    this.projectConfigPath = join(base, '.pdca', 'project.yaml');
  }

  /**
   * 載入完整的運行時配置
   */
  async loadRuntimeConfig(options: ConfigLoadOptions = {}): Promise<RuntimeConfig> {
    console.log('🔧 載入配置中...');
    
    // 1. 載入基礎配置（agent profiles）
    const profileName = options.profile || this.getDefaultProfile();
    const baseConfig = await this.loadProfile(profileName);
    
    // 2. 載入層次配置
    const layeredConfig = await this.loadLayeredConfig(options);
    
    // 3. 合併所有配置
    const mergedConfig = this.mergeAllConfigs(baseConfig, layeredConfig, options);
    
    // 4. 創建運行時配置
    const runtimeConfig: RuntimeConfig = {
      ...mergedConfig,
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      workingDirectory: process.cwd(),
      commandLineOverrides: options.cliOverrides,
      environmentOverrides: options.envOverrides
    };
    
    // 5. 驗證最終配置
    this.validateRuntimeConfig(runtimeConfig);
    
    console.log(`✅ 配置載入完成 (模式: ${this.getEffectiveProfile(options)})`);
    return runtimeConfig;
  }

  /**
   * 載入層次配置
   */
  private async loadLayeredConfig(options: ConfigLoadOptions): Promise<Partial<AgentProfile>> {
    const configs: Partial<AgentProfile>[] = [];

    // 1. 內建預設值
    configs.push(this.getDefaultConfig());

    // 2. 全域配置
    if (existsSync(this.globalConfigPath)) {
      console.log('📂 載入全域配置');
      configs.push(this.loadYamlConfig(this.globalConfigPath));
    }

    // 3. 專案配置
    if (existsSync(this.projectConfigPath)) {
      console.log('📂 載入專案配置');
      configs.push(this.loadYamlConfig(this.projectConfigPath));
    }

    // 4. 自定義配置檔
    if (options.configFile) {
      console.log(`📂 載入自定義配置: ${options.configFile}`);
      configs.push(this.loadYamlConfig(resolve(options.configFile)));
    }

    // 5. 配置集覆蓋
    const profileOverride = this.getProfileOverride(options);
    if (profileOverride) {
      console.log(`🎯 應用配置集: ${this.getEffectiveProfile(options)}`);
      configs.push(profileOverride);
    }

    // 6. 環境變數覆蓋
    const envOverride = this.loadEnvironmentOverrides();
    if (Object.keys(envOverride).length > 0) {
      console.log('🌍 應用環境變數覆蓋');
      configs.push(envOverride);
    }

    // 7. CLI 參數覆蓋
    if (options.cliOverrides && Object.keys(options.cliOverrides).length > 0) {
      console.log('⚡ 應用 CLI 參數覆蓋');
      configs.push(this.buildConfigFromCliOverrides(options.cliOverrides));
    }

    // 8. 手動覆蓋
    if (options.overrides) {
      configs.push(options.overrides);
    }

    return this.deepMergeConfigs(configs);
  }

  /**
   * 獲取預設配置
   */
  private getDefaultConfig(): Partial<AgentProfile> {
    return {
      execution: DEFAULT_EXECUTION_CONFIG
    };
  }

  /**
   * 獲取配置集覆蓋
   */
  private getProfileOverride(options: ConfigLoadOptions): Partial<AgentProfile> | null {
    const profileName = this.getEffectiveProfile(options);
    const profile = BUILTIN_PROFILES[profileName];
    
    if (!profile) {
      return null;
    }

    return {
      execution: profile.execution as ExecutionConfig
    };
  }

  /**
   * 獲取有效的配置集名稱
   */
  private getEffectiveProfile(options: ConfigLoadOptions): string {
    return options.profile || 'balanced';
  }

  /**
   * 載入環境變數覆蓋
   */
  private loadEnvironmentOverrides(): Partial<AgentProfile> {
    const env = process.env;
    const override: any = {};

    // 循環控制
    if (env.PDCA_MAX_ITERATIONS) {
      const value = env.PDCA_MAX_ITERATIONS === 'null' ? null : parseInt(env.PDCA_MAX_ITERATIONS);
      this.setNestedValue(override, 'execution.loop_control.max_iterations', value);
    }
    
    if (env.PDCA_QUALITY_TARGET) {
      this.setNestedValue(override, 'execution.loop_control.quality_target', parseFloat(env.PDCA_QUALITY_TARGET));
    }
    
    if (env.PDCA_TOKEN_BUDGET) {
      const value = env.PDCA_TOKEN_BUDGET === 'null' ? null : parseInt(env.PDCA_TOKEN_BUDGET);
      this.setNestedValue(override, 'execution.loop_control.token_budget', value);
    }

    if (env.PDCA_AUTO_CONTINUE) {
      this.setNestedValue(override, 'execution.loop_control.auto_continue', env.PDCA_AUTO_CONTINUE === 'true');
    }

    // 成本控制
    if (env.PDCA_SHOW_COST) {
      this.setNestedValue(override, 'execution.cost_control.show_realtime', env.PDCA_SHOW_COST === 'true');
    }

    if (env.PDCA_CURRENCY) {
      this.setNestedValue(override, 'execution.cost_control.currency', env.PDCA_CURRENCY);
    }

    return override;
  }

  /**
   * 從 CLI 覆蓋參數建構配置
   */
  private buildConfigFromCliOverrides(overrides: Record<string, any>): Partial<AgentProfile> {
    const config: any = {};

    // 映射 CLI 參數到配置路徑
    const mapping: Record<string, string> = {
      'max-iterations': 'execution.loop_control.max_iterations',
      'quality-target': 'execution.loop_control.quality_target',
      'token-budget': 'execution.loop_control.token_budget',
      'time-budget': 'execution.loop_control.time_budget_minutes',
      'auto-continue': 'execution.loop_control.auto_continue',
      'require-confirmation': 'execution.loop_control.require_confirmation',
      'show-cost': 'execution.cost_control.show_realtime',
      'currency': 'execution.cost_control.currency',
      'max-agents': 'execution.max_agents'
    };

    for (const [cliKey, configPath] of Object.entries(mapping)) {
      if (overrides[cliKey] !== undefined) {
        this.setNestedValue(config, configPath, overrides[cliKey]);
      }
    }

    return config;
  }

  /**
   * 載入 YAML 配置檔
   */
  private loadYamlConfig(path: string): Partial<AgentProfile> {
    try {
      const content = readFileSync(path, 'utf-8');
      return parse(content) as Partial<AgentProfile>;
    } catch (error) {
      console.warn(`⚠️  無法載入配置檔: ${path}`, error);
      return {};
    }
  }

  /**
   * 深度合併多個配置
   */
  private deepMergeConfigs(configs: Partial<AgentProfile>[]): Partial<AgentProfile> {
    const result: any = {};

    for (const config of configs) {
      this.deepMerge(result, config);
    }

    return result;
  }

  /**
   * 合併所有配置
   */
  private mergeAllConfigs(
    baseConfig: AgentProfile, 
    layeredConfig: Partial<AgentProfile>, 
    options: ConfigLoadOptions
  ): AgentProfile {
    const merged = { ...baseConfig };
    
    // 合併 execution 配置
    if (layeredConfig.execution) {
      merged.execution = this.deepMerge(
        merged.execution || {},
        layeredConfig.execution
      );
    }

    // 合併其他配置
    Object.keys(layeredConfig).forEach(key => {
      if (key !== 'execution' && layeredConfig[key as keyof AgentProfile]) {
        (merged as any)[key] = this.deepMerge(
          (merged as any)[key] || {},
          layeredConfig[key as keyof AgentProfile]
        );
      }
    });

    return merged;
  }

  /**
   * 深度合併物件
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) {
      return target;
    }

    if (Array.isArray(source)) {
      return [...source];
    }

    if (typeof source === 'object') {
      const result = { ...target };
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            result[key] = this.deepMerge(result[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        }
      }
      return result;
    }

    return source;
  }

  /**
   * 設定嵌套值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * 驗證運行時配置
   */
  private validateRuntimeConfig(config: RuntimeConfig): void {
    if (!config.execution) {
      throw new Error('執行配置不能為空');
    }

    const { loop_control, cost_control } = config.execution;

    // 驗證循環控制
    if (loop_control.quality_target < 0 || loop_control.quality_target > 1) {
      throw new Error('品質目標必須在 0-1 之間');
    }

    if (loop_control.marginal_threshold < 0 || loop_control.marginal_threshold > 1) {
      throw new Error('邊際改進閾值必須在 0-1 之間');
    }

    if (loop_control.max_iterations !== null && loop_control.max_iterations < 1) {
      throw new Error('最大迭代次數必須大於 0');
    }

    if (loop_control.token_budget !== null && loop_control.token_budget < 1) {
      throw new Error('Token 預算必須大於 0');
    }

    // 驗證成本控制
    if (cost_control.warn_at_percent !== null && 
        (cost_control.warn_at_percent < 0 || cost_control.warn_at_percent > 100)) {
      throw new Error('成本警告百分比必須在 0-100 之間');
    }
  }

  /**
   * 生成 session ID
   */
  private generateSessionId(): string {
    return `pdca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取可用的配置集
   */
  async getAvailableProfiles(): Promise<string[]> {
    // 先獲取內建配置集
    const builtinProfiles = Object.keys(BUILTIN_PROFILES);
    
    // 再獲取檔案系統中的配置集
    const fileProfiles = await super.getAvailableProfiles();
    
    // 合併並去重
    const allProfiles = [...new Set([...builtinProfiles, ...fileProfiles])];
    return allProfiles.sort();
  }

  /**
   * 獲取配置集描述
   */
  getProfileDescription(profileName: string): string | null {
    const profile = BUILTIN_PROFILES[profileName];
    return profile ? profile.description : null;
  }

  /**
   * 顯示當前配置摘要
   */
  displayConfigSummary(config: RuntimeConfig): void {
    const { loop_control, cost_control } = config.execution;
    
    console.log('\n📋 配置摘要');
    console.log('─'.repeat(50));
    console.log(`🎯 最大迭代: ${loop_control.max_iterations ?? '無限制'}`);
    console.log(`📊 品質目標: ${(loop_control.quality_target * 100).toFixed(0)}%`);
    console.log(`💰 Token 預算: ${loop_control.token_budget?.toLocaleString() ?? '無限制'}`);
    console.log(`⏱️  時間預算: ${loop_control.time_budget_minutes ?? '無限制'} 分鐘`);
    console.log(`🔄 自動繼續: ${loop_control.auto_continue ? '是' : '否'}`);
    console.log(`✋ 需要確認: ${loop_control.require_confirmation ? '是' : '否'}`);
    console.log(`💸 即時成本: ${cost_control.show_realtime ? '顯示' : '隱藏'}`);
    console.log(`⚠️  成本警告: ${cost_control.warn_at_percent ?? '關閉'}%`);
    console.log('─'.repeat(50));
  }
}