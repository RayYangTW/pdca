/**
 * 配置載入器
 * 負責載入和管理代理配置
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parse } from 'yaml';
import type { AgentProfile, AgentConfig, GlobalConfig } from '../types/config.js';

export class ConfigLoader {
  private configCache = new Map<string, AgentProfile>();
  private profilesDir: string;
  private customDir: string;

  constructor(baseDir?: string) {
    const base = baseDir || process.cwd();
    this.profilesDir = join(base, 'agents', 'profiles');
    this.customDir = join(base, 'agents', 'custom');
  }

  /**
   * 載入配置檔案
   */
  async loadProfile(profileName: string): Promise<AgentProfile> {
    // 檢查快取
    if (this.configCache.has(profileName)) {
      return this.configCache.get(profileName)!;
    }

    // 嘗試載入配置
    const profile = await this.loadFromFile(profileName);
    
    // 驗證配置
    this.validateProfile(profile);
    
    // 快取配置
    this.configCache.set(profileName, profile);
    
    return profile;
  }

  /**
   * 載入自定義配置
   */
  async loadCustomConfig(configPath: string): Promise<AgentProfile> {
    const absolutePath = resolve(configPath);
    
    if (!existsSync(absolutePath)) {
      throw new Error(`配置檔案不存在: ${absolutePath}`);
    }

    const content = readFileSync(absolutePath, 'utf-8');
    const config = parse(content) as AgentProfile;

    // 如果有基礎配置，先載入並合併
    if (config.base) {
      const baseProfile = await this.loadProfile(config.base);
      return this.mergeProfiles(baseProfile, config);
    }

    this.validateProfile(config);
    return config;
  }

  /**
   * 從檔案載入配置
   */
  private async loadFromFile(profileName: string): Promise<AgentProfile> {
    // 可能的檔案路徑
    const possiblePaths = [
      join(this.profilesDir, `${profileName}.yaml`),
      join(this.profilesDir, `${profileName}.yml`),
      join(this.customDir, `${profileName}.yaml`),
      join(this.customDir, `${profileName}.yml`),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        return parse(content) as AgentProfile;
      }
    }

    throw new Error(`找不到配置檔案: ${profileName}`);
  }

  /**
   * 合併配置檔案
   */
  private mergeProfiles(base: AgentProfile, override: Partial<AgentProfile>): AgentProfile {
    const merged: AgentProfile = JSON.parse(JSON.stringify(base));

    // 合併全域設定
    if (override.globals) {
      merged.globals = { ...merged.globals, ...override.globals };
    }

    // 合併代理設定
    if (override.agents) {
      for (const [key, value] of Object.entries(override.agents)) {
        if (merged.agents[key]) {
          merged.agents[key] = this.mergeAgentConfig(merged.agents[key], value);
        } else {
          merged.agents[key] = value;
        }
      }
    }

    // 合併其他設定
    if (override.communication) {
      merged.communication = { ...merged.communication, ...override.communication };
    }
    if (override.execution) {
      merged.execution = { ...merged.execution, ...override.execution };
    }
    if (override.monitoring) {
      merged.monitoring = { ...merged.monitoring, ...override.monitoring };
    }

    // 更新元資料
    merged.name = override.name || `${merged.name} (Modified)`;
    merged.version = override.version || merged.version;
    merged.description = override.description || merged.description;

    return merged;
  }

  /**
   * 合併代理配置
   */
  private mergeAgentConfig(base: AgentConfig, override: Partial<AgentConfig>): AgentConfig {
    const merged = { ...base };

    if (override.personality) {
      merged.personality = {
        ...base.personality,
        ...override.personality,
        traits: override.personality.traits || base.personality.traits,
      };
    }

    if (override.prompts) {
      merged.prompts = {
        ...base.prompts,
        ...override.prompts,
      };
    }

    // 合併其他屬性
    Object.assign(merged, {
      name: override.name || base.name,
      role: override.role || base.role,
      icon: override.icon || base.icon,
    });

    return merged;
  }

  /**
   * 驗證配置檔案
   */
  private validateProfile(profile: AgentProfile): void {
    // 檢查必要欄位
    if (!profile.name) {
      throw new Error('配置缺少名稱');
    }

    if (!profile.agents || Object.keys(profile.agents).length === 0) {
      throw new Error('配置必須包含至少一個代理');
    }

    // 驗證每個代理
    for (const [key, agent] of Object.entries(profile.agents)) {
      this.validateAgentConfig(key, agent);
    }

    // 驗證全域設定
    if (profile.globals) {
      this.validateGlobalConfig(profile.globals);
    }
  }

  /**
   * 驗證代理配置
   */
  private validateAgentConfig(key: string, config: AgentConfig): void {
    const required = ['name', 'role', 'personality', 'prompts'];
    
    for (const field of required) {
      if (!config[field as keyof AgentConfig]) {
        throw new Error(`代理 ${key} 缺少必要欄位: ${field}`);
      }
    }

    // 驗證思考深度
    const validThinkingLevels = ['think', 'think hard', 'think harder', 'superthink', 'ultrathink'];
    if (!validThinkingLevels.includes(config.personality.thinking)) {
      throw new Error(`代理 ${key} 的思考深度無效: ${config.personality.thinking}`);
    }

    // 驗證 prompts
    if (!config.prompts.initial || !config.prompts.mission) {
      throw new Error(`代理 ${key} 的 prompts 必須包含 initial 和 mission`);
    }
  }

  /**
   * 驗證全域配置
   */
  private validateGlobalConfig(config: GlobalConfig): void {
    const validLanguages = ['zh-TW', 'zh-CN', 'en-US'];
    if (config.language && !validLanguages.includes(config.language)) {
      console.warn(`不支援的語言設定: ${config.language}，將使用預設值`);
    }
  }

  /**
   * 取得可用的配置列表
   */
  async getAvailableProfiles(): Promise<string[]> {
    const profiles: string[] = [];

    // 掃描預設配置目錄
    if (existsSync(this.profilesDir)) {
      const files = await import('fs/promises').then(fs => fs.readdir(this.profilesDir));
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          profiles.push(file.replace(/\.(yaml|yml)$/, ''));
        }
      }
    }

    return profiles;
  }

  /**
   * 取得預設配置名稱
   */
  getDefaultProfile(): string {
    return 'shokunin';
  }

  /**
   * 清除配置快取
   */
  clearCache(): void {
    this.configCache.clear();
  }
}