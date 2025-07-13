/**
 * 風格引擎
 * 負責根據配置創建具有特定風格的代理
 */

import { EventEmitter } from 'events';
import { ConfigLoader } from './config-loader.js';
import { BaseAgent } from '../modes/shokunin/agents/base-agent.js';
import type { 
  AgentProfile, 
  AgentConfig, 
  AgentInstanceConfig,
  RuntimeConfig,
  ConfigLoadOptions 
} from '../types/config.js';
import type { Agent } from '../types/index.js';

/**
 * 風格化代理
 * 包裝基礎代理，注入風格特定的行為
 */
class StyledAgent extends BaseAgent {
  private agentConfig: AgentInstanceConfig;
  private basePrompt: string;

  constructor(config: AgentInstanceConfig) {
    super();
    this.agentConfig = config;
    this.name = config.name;
    this.role = config.role;
    this.icon = config.icon;
    this.description = `${config.personality.name} - ${config.role}`;
    
    // 構建基礎提示詞
    this.basePrompt = this.buildBasePrompt();
  }

  /**
   * 實現抽象方法：啟動邏輯
   */
  protected async onStart(task: string): Promise<void> {
    const prompt = this.getInitialPrompt(task);
    await this.startWithCommand(prompt);
  }

  /**
   * 實現抽象方法：停止邏輯
   */
  protected async onStop(): Promise<void> {
    // 基本停止邏輯，可根據需要擴展
    console.log(`停止代理 ${this.name}`);
  }

  /**
   * 實現抽象方法：獲取初始提示詞（優化版）
   */
  protected getInitialPrompt(task: string): string {
    // 使用配置中的提示詞模板並優化
    const missionTemplate = this.agentConfig.prompts.mission;
    const optimizedPrompt = this.optimizeMissionPrompt(missionTemplate, task);
    
    // 設置思考深度
    const thinkingCommand = this.getThinkingCommand();
    
    // 構建完整指令（更簡潔的格式）
    return `${this.basePrompt}\n${thinkingCommand}\n任務: ${task}\n${optimizedPrompt}`;
  }

  /**
   * 優化任務 prompt，壓縮執行步驟
   */
  private optimizeMissionPrompt(template: string, task: string): string {
    // 檢查是否有詳細的執行步驟列表
    const stepsMatch = template.match(/請執行以下步驟：\s*((?:\d+\. .+\n?)+)/);
    if (stepsMatch) {
      const steps = stepsMatch[1]
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => {
          // 提取步驟的關鍵詞（前2-3個字）
          const content = line.replace(/^\d+\.\s*/, '');
          const keywords = content.split('').slice(0, 4).join('');
          return keywords;
        })
        .join('→');
      
      return `執行: ${steps}`;
    }
    
    // 如果沒有步驟列表，移除冗餘內容
    const cleanTemplate = template
      .replace(/任務：{{mission}}\s*/, '')
      .replace(/請執行以下步驟：.*$/s, '')
      .trim();
    
    return cleanTemplate || `執行: 分析→計畫→實施`;
  }

  /**
   * 構建基礎提示詞（優化版）
   */
  private buildBasePrompt(): string {
    const { personality, prompts } = this.agentConfig;
    
    // 使用壓縮格式的角色定位
    const roleIntro = `${this.role} (${personality.name}) - ${personality.approach}思維`;
    
    // 簡化特質描述（用符號分隔）
    const traits = personality.traits && personality.traits.length > 0 
      ? `特質: ${personality.traits.join('|')}` 
      : '';
    
    // 提取核心原則（如果有的話）
    const corePrompt = prompts.initial || '';
    
    // 構建簡潔的基礎 prompt
    if (corePrompt.includes('核心原則')) {
      // 如果有核心原則，提取並簡化
      const principlesMatch = corePrompt.match(/核心原則：\s*((?:- .+\n?)+)/);
      if (principlesMatch) {
        const principles = principlesMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^- /, '').split('').slice(0, 4).join('')) // 取前4個字
          .join('|');
        return `${roleIntro}\n原則: ${principles}${traits ? '\n' + traits : ''}`;
      }
    }
    
    // 回退到原始 prompt，但移除重複的系統介紹
    const cleanPrompt = corePrompt
      .replace(/你是 PDCA 循環中的.+?代理，採用職人精神.+?\n/, '')
      .replace(/請保持簡潔、精確、高品質的輸出。\s*/, '')
      .trim();
    
    return `${roleIntro}${traits ? '\n' + traits : ''}${cleanPrompt ? '\n' + cleanPrompt : ''}`;
  }

  /**
   * 格式化提示詞
   */
  private formatPrompt(template: string, variables: Record<string, any>): string {
    let formatted = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      formatted = formatted.replace(regex, String(value));
    }
    
    return formatted;
  }

  /**
   * 取得思考深度指令
   */
  private getThinkingCommand(): string {
    const thinkingMap: Record<string, string> = {
      'think': '/think',
      'think hard': '/think hard',
      'think harder': '/think harder',
      'superthink': '/superthink',
      'ultrathink': '/ultrathink',
    };
    
    return thinkingMap[this.agentConfig.personality.thinking] || '/think';
  }
}

/**
 * 風格引擎主類
 */
export class StyleEngine extends EventEmitter {
  private configLoader: ConfigLoader;
  private currentProfile?: AgentProfile;
  private runtimeConfig?: RuntimeConfig;

  constructor() {
    super();
    this.configLoader = new ConfigLoader();
  }

  /**
   * 載入風格配置
   */
  async loadStyle(options: ConfigLoadOptions): Promise<RuntimeConfig> {
    let profile: AgentProfile;

    // 載入配置檔案
    if (options.configFile) {
      profile = await this.configLoader.loadCustomConfig(options.configFile);
    } else {
      const profileName = options.profile || this.configLoader.getDefaultProfile();
      profile = await this.configLoader.loadProfile(profileName);
    }

    // 應用覆蓋設定
    if (options.overrides) {
      profile = this.applyOverrides(profile, options.overrides);
    }

    // 創建運行時配置
    this.runtimeConfig = this.createRuntimeConfig(profile);
    this.currentProfile = profile;

    this.emit('style-loaded', {
      name: profile.name,
      description: profile.description,
    });

    return this.runtimeConfig;
  }

  /**
   * 創建代理實例
   */
  createAgents(): Map<string, Agent> {
    if (!this.currentProfile) {
      throw new Error('必須先載入風格配置');
    }

    const agents = new Map<string, Agent>();

    for (const [key, config] of Object.entries(this.currentProfile.agents)) {
      // 支援多個相同類型的代理
      const count = config.count || 1;
      
      for (let i = 0; i < count; i++) {
        const instanceId = count > 1 ? `${key}-${i + 1}` : key;
        const instanceConfig: AgentInstanceConfig = {
          ...config,
          instanceId,
          name: count > 1 ? `${config.name}-${i + 1}` : config.name,
        };

        const agent = this.createStyledAgent(instanceConfig);
        agents.set(instanceId, agent);
      }
    }

    this.emit('agents-created', { 
      count: agents.size,
      profile: this.currentProfile.name 
    });

    return agents;
  }

  /**
   * 創建風格化代理
   */
  private createStyledAgent(config: AgentInstanceConfig): Agent {
    // 使用 StyledAgent 來包裝配置
    const agent = new StyledAgent(config);
    
    // 設置額外的配置
    if (config.workingDirectory) {
      agent.setWorkspacePath(config.workingDirectory);
    }

    return agent;
  }

  /**
   * 應用配置覆蓋
   */
  private applyOverrides(profile: AgentProfile, overrides: Partial<AgentProfile>): AgentProfile {
    // 深度合併配置
    const merged = JSON.parse(JSON.stringify(profile));
    
    // 合併各個部分
    Object.assign(merged, overrides);
    
    return merged;
  }

  /**
   * 創建運行時配置
   */
  private createRuntimeConfig(profile: AgentProfile): RuntimeConfig {
    return {
      ...profile,
      sessionId: `pdca_${Date.now()}`,
      startTime: new Date(),
      workingDirectory: process.cwd(),
      commandLineOverrides: {},
      environmentOverrides: {},
    };
  }

  /**
   * 取得可用的風格列表
   */
  async getAvailableStyles(): Promise<string[]> {
    return this.configLoader.getAvailableProfiles();
  }

  /**
   * 取得當前風格資訊
   */
  getCurrentStyle(): AgentProfile | undefined {
    return this.currentProfile;
  }

  /**
   * 取得運行時配置
   */
  getRuntimeConfig(): RuntimeConfig | undefined {
    return this.runtimeConfig;
  }

  /**
   * 驗證風格配置
   */
  async validateStyle(options: ConfigLoadOptions): Promise<boolean> {
    try {
      await this.loadStyle({ ...options, validateOnly: true });
      return true;
    } catch (error) {
      this.emit('validation-error', { error });
      return false;
    }
  }

  /**
   * 重新載入配置
   */
  async reloadStyle(): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('沒有載入的配置可以重新載入');
    }

    const profileName = this.currentProfile.name;
    this.configLoader.clearCache();
    
    await this.loadStyle({ profile: profileName });
    
    this.emit('style-reloaded', { name: profileName });
  }
}