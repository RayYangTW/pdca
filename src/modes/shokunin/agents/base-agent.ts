/**
 * 基礎代理類別
 * 所有 PDCA 代理的基類
 */

import { EventEmitter } from 'events';
import { ClaudeCliManager } from '../../../core/claude-cli.js';
import type { Agent, AgentStatus, LegacyAgentConfig } from '../../../types/index.js';

export abstract class BaseAgent extends EventEmitter implements Agent {
  public name: string;
  public role: string;
  public icon: string;
  public description: string;
  public workspacePath?: string;
  
  protected _status: AgentStatus = 'idle';
  protected tmuxTarget?: string;
  protected config?: LegacyAgentConfig;

  constructor(config?: LegacyAgentConfig) {
    super();
    if (config) {
      this.config = config;
      this.name = config.name;
      this.role = config.role;
      this.icon = config.icon;
      this.description = config.description;
    } else {
      // 允許子類別自行設置這些屬性
      this.name = '';
      this.role = '';
      this.icon = '';
      this.description = '';
    }
  }

  get status(): AgentStatus {
    return this._status;
  }

  /**
   * 啟動代理
   */
  async start(task: string): Promise<void> {
    if (this._status !== 'idle') {
      throw new Error(`代理 ${this.name} 已經在運行中`);
    }

    try {
      this.setStatus('starting');
      this.emit('starting', { agent: this.name });

      // 子類別實現具體啟動邏輯
      await this.onStart(task);

      this.setStatus('running');
      this.emit('started', { agent: this.name });
    } catch (error) {
      this.setStatus('error');
      this.emit('error', { agent: this.name, error });
      throw error;
    }
  }

  /**
   * 停止代理
   */
  async stop(): Promise<void> {
    try {
      await this.onStop();
      
      if (this.tmuxTarget) {
        await ClaudeCliManager.stopInTmux(this.tmuxTarget);
      }
      
      this.setStatus('idle');
      this.emit('stopped', { agent: this.name });
    } catch (error) {
      this.setStatus('error');
      this.emit('error', { agent: this.name, error });
      throw error;
    }
  }

  /**
   * 獲取代理狀態
   */
  getStatus(): AgentStatus {
    return this._status;
  }

  /**
   * 發送消息給代理
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.tmuxTarget) {
      throw new Error(`代理 ${this.name} 尚未啟動`);
    }

    await ClaudeCliManager.sendMessageToTmux(this.tmuxTarget, message);
    this.emit('message-sent', { agent: this.name, message });
  }

  /**
   * 設置 tmux 目標
   */
  setTmuxTarget(target: string): void {
    this.tmuxTarget = target;
  }

  /**
   * 設置工作空間路徑
   */
  setWorkspacePath(path: string): void {
    this.workspacePath = path;
  }

  /**
   * 檢查代理是否還在運行
   */
  async isRunning(): Promise<boolean> {
    if (!this.tmuxTarget) {
      return false;
    }

    return await ClaudeCliManager.isRunningInTmux(this.tmuxTarget);
  }

  /**
   * 設置狀態並發送事件
   */
  protected setStatus(status: AgentStatus): void {
    const oldStatus = this._status;
    this._status = status;
    
    if (oldStatus !== status) {
      this.emit('status-changed', {
        agent: this.name,
        oldStatus,
        newStatus: status
      });
    }
  }

  /**
   * 子類別實現的啟動邏輯
   */
  protected abstract onStart(task: string): Promise<void>;

  /**
   * 子類別實現的停止邏輯
   */
  protected abstract onStop(): Promise<void>;

  /**
   * 獲取代理特定的初始 prompt
   */
  protected abstract getInitialPrompt(task: string): string;

  /**
   * 在 tmux 中啟動 Claude CLI
   */
  protected async startClaudeInTmux(task: string): Promise<void> {
    if (!this.tmuxTarget) {
      throw new Error('Tmux target 尚未設置');
    }

    if (!this.config) {
      throw new Error('代理配置尚未設置');
    }

    await ClaudeCliManager.startInTmux(this.tmuxTarget, this.config, task);
    
    // 等待一下讓 Claude 啟動
    await this.sleep(1000);
  }

  /**
   * 使用自定義命令啟動代理
   * 供 StyledAgent 使用
   */
  protected async startWithCommand(command: string): Promise<void> {
    if (!this.tmuxTarget) {
      throw new Error('Tmux target 尚未設置');
    }

    try {
      this.setStatus('starting');
      this.emit('starting', { agent: this.name });

      // 在 tmux 中啟動 Claude CLI
      await ClaudeCliManager.startInTmuxWithCommand(this.tmuxTarget, command);
      
      // 等待啟動
      await this.sleep(1000);

      this.setStatus('running');
      this.emit('started', { agent: this.name });
    } catch (error) {
      this.setStatus('error');
      this.emit('error', { agent: this.name, error });
      throw error;
    }
  }

  /**
   * 休眠工具函數
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}