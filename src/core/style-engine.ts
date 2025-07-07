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
   * 實現抽象方法：獲取初始提示詞
   */
  protected getInitialPrompt(task: string): string {
    // 使用配置中的提示詞模板
    const prompt = this.formatPrompt(this.agentConfig.prompts.mission, { mission: task });
    
    // 設置思考深度
    const thinkingCommand = this.getThinkingCommand();
    
    // 構建完整指令
    return `${this.basePrompt}\n\n${thinkingCommand}\n\n${prompt}`;
  }

  /**
   * 構建基礎提示詞
   */
  private buildBasePrompt(): string {
    const { personality, prompts } = this.agentConfig;
    
    let basePrompt = prompts.initial || '';
    
    // 添加人格特質
    if (personality.traits && personality.traits.length > 0) {
      basePrompt += `\n\n你的特質：\n${personality.traits.map(t => `- ${t}`).join('\n')}`;
    }
    
    // 添加工作方法
    if (personality.approach) {
      basePrompt += `\n\n工作方法：${personality.approach}`;
    }
    
    return basePrompt;
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