/**
 * Raiy-PDCA 監控介面
 * 使用 blessed 提供即時的系統狀態監控
 */

import blessed from 'blessed';
import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Agent, Task, AgentStatus } from '../types/index.js';

interface MonitorConfig {
  sessionName: string;
  workingDir: string;
  updateInterval?: number;
}

interface AgentStatusInfo {
  name: string;
  role: string;
  icon: string;
  status: AgentStatus;
  lastUpdate: Date;
  message?: string;
  progress?: number;
}

export class Monitor extends EventEmitter {
  private screen: blessed.Widgets.Screen;
  private agentsBox: blessed.Widgets.BoxElement;
  private taskBox: blessed.Widgets.BoxElement;
  private logsBox: blessed.Widgets.BoxElement;
  private statusBar: blessed.Widgets.BoxElement;
  private config: MonitorConfig;
  private updateTimer?: NodeJS.Timeout;
  private agents: Map<string, AgentStatusInfo> = new Map();
  private currentTask?: Task;

  constructor(config: MonitorConfig) {
    super();
    this.config = config;
    this.screen = this.createScreen();
    this.agentsBox = this.createAgentsBox();
    this.taskBox = this.createTaskBox();
    this.logsBox = this.createLogsBox();
    this.statusBar = this.createStatusBar();
    
    this.setupEventHandlers();
    this.screen.render();
  }

  /**
   * 創建主螢幕
   */
  private createScreen(): blessed.Widgets.Screen {
    const screen = blessed.screen({
      smartCSR: true,
      title: `Raiy-PDCA Monitor - ${this.config.sessionName}`,
      fullUnicode: true
    });

    // 添加標題
    const titleBox = blessed.box({
      parent: screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: `{center}🎯 Raiy-PDCA 監控中心 - ${this.config.sessionName}{/center}`,
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      }
    });

    return screen;
  }

  /**
   * 創建代理狀態框
   */
  private createAgentsBox(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      label: ' 代理狀態 ',
      top: 3,
      left: 0,
      width: '50%',
      height: '40%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      tags: true
    });
  }

  /**
   * 創建任務資訊框
   */
  private createTaskBox(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      label: ' 任務資訊 ',
      top: 3,
      left: '50%',
      width: '50%',
      height: '40%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'green'
        }
      },
      tags: true,
      scrollable: true
    });
  }

  /**
   * 創建日誌框
   */
  private createLogsBox(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      label: ' 系統日誌 ',
      bottom: 3,
      left: 0,
      width: '100%',
      height: '50%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'yellow'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      tags: true
    });
  }

  /**
   * 創建狀態列
   */
  private createStatusBar(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '',
      tags: true,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });
  }

  /**
   * 設置事件處理
   */
  private setupEventHandlers(): void {
    // 鍵盤事件
    this.screen.key(['q', 'C-c'], () => {
      this.stop();
      process.exit(0);
    });

    this.screen.key(['r'], () => {
      this.refresh();
    });

    this.screen.key(['l'], () => {
      this.logsBox.focus();
    });

    this.screen.key(['a'], () => {
      this.agentsBox.focus();
    });

    this.screen.key(['t'], () => {
      this.taskBox.focus();
    });

    // 滑鼠支援
    this.agentsBox.on('click', () => this.agentsBox.focus());
    this.taskBox.on('click', () => this.taskBox.focus());
    this.logsBox.on('click', () => this.logsBox.focus());

    // 定期更新
    if (this.config.updateInterval) {
      this.updateTimer = setInterval(() => {
        this.refresh();
      }, this.config.updateInterval);
    }
  }

  /**
   * 啟動監控
   */
  start(): void {
    this.updateStatusBar('監控啟動中...');
    this.refresh();
    this.log('info', '監控系統已啟動');
  }

  /**
   * 停止監控
   */
  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.screen.destroy();
    this.emit('stop');
  }

  /**
   * 刷新顯示
   */
  refresh(): void {
    this.updateAgentStatus();
    this.updateTaskInfo();
    this.updateStatusBar(`最後更新: ${new Date().toLocaleTimeString()} | 按 q 退出 | r 刷新 | a/t/l 切換焦點`);
    this.screen.render();
  }

  /**
   * 更新代理狀態
   */
  private updateAgentStatus(): void {
    // 從通訊目錄讀取狀態
    const statusDir = join(this.config.workingDir, '.raiy-pdca', 'communication', 'status');
    
    let content = '{bold}代理狀態監控{/bold}\n\n';
    
    this.agents.forEach((agent, name) => {
      const statusFile = join(statusDir, `${name}.json`);
      
      if (existsSync(statusFile)) {
        try {
          const status = JSON.parse(readFileSync(statusFile, 'utf-8'));
          agent.status = status.status || 'unknown';
          agent.lastUpdate = new Date(status.timestamp || Date.now());
          agent.message = status.message;
          agent.progress = status.progress;
        } catch (error) {
          // 忽略解析錯誤
        }
      }
      
      const statusColor = this.getStatusColor(agent.status);
      const progressBar = agent.progress ? this.createProgressBar(agent.progress) : '';
      
      content += `${agent.icon} {bold}${agent.role}{/bold}\n`;
      content += `  狀態: {${statusColor}-fg}${agent.status}{/${statusColor}-fg}\n`;
      if (agent.message) {
        content += `  訊息: ${agent.message}\n`;
      }
      if (progressBar) {
        content += `  進度: ${progressBar}\n`;
      }
      content += '\n';
    });
    
    this.agentsBox.setContent(content);
  }

  /**
   * 更新任務資訊
   */
  private updateTaskInfo(): void {
    let content = '{bold}任務追蹤{/bold}\n\n';
    
    if (this.currentTask) {
      content += `任務 ID: ${this.currentTask.id}\n`;
      content += `描述: ${this.currentTask.description}\n`;
      content += `狀態: {${this.getTaskStatusColor(this.currentTask.status)}-fg}${this.currentTask.status}{/}\n`;
      content += `開始時間: ${this.currentTask.createdAt.toLocaleString()}\n\n`;
      
      content += '{bold}代理進度:{/bold}\n';
      for (const [agentName, progress] of Object.entries(this.currentTask.agents)) {
        const agent = this.agents.get(agentName);
        if (agent) {
          content += `${agent.icon} ${agent.role}: ${this.createProgressBar(progress.progress || 0)}\n`;
        }
      }
    } else {
      content += '{gray-fg}暫無活動任務{/gray-fg}';
    }
    
    this.taskBox.setContent(content);
  }

  /**
   * 更新狀態列
   */
  private updateStatusBar(message: string): void {
    this.statusBar.setContent(`{center}${message}{/center}`);
  }

  /**
   * 添加日誌
   */
  log(level: 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const levelColor = {
      info: 'cyan',
      warn: 'yellow',
      error: 'red'
    }[level];
    
    // 獲取現有內容並添加新日誌
    const currentContent = this.logsBox.getContent() as string;
    const newLog = `[${timestamp}] {${levelColor}-fg}${level.toUpperCase()}{/${levelColor}-fg} ${message}`;
    const lines = currentContent.split('\n');
    lines.push(newLog);
    
    // 保留最後 100 行
    if (lines.length > 100) {
      lines.splice(0, lines.length - 100);
    }
    
    this.logsBox.setContent(lines.join('\n'));
    this.screen.render();
  }

  /**
   * 設置代理列表
   */
  setAgents(agents: Agent[]): void {
    this.agents.clear();
    agents.forEach(agent => {
      this.agents.set(agent.name, {
        name: agent.name,
        role: agent.role,
        icon: agent.icon,
        status: agent.status,
        lastUpdate: new Date()
      });
    });
    this.refresh();
  }

  /**
   * 設置當前任務
   */
  setTask(task: Task): void {
    this.currentTask = task;
    this.refresh();
  }

  /**
   * 更新代理狀態
   */
  updateAgent(name: string, status: Partial<AgentStatusInfo>): void {
    const agent = this.agents.get(name);
    if (agent) {
      Object.assign(agent, status);
      agent.lastUpdate = new Date();
    }
  }

  /**
   * 獲取狀態顏色
   */
  private getStatusColor(status: AgentStatus): string {
    const colors: Record<AgentStatus, string> = {
      idle: 'gray',
      starting: 'yellow',
      running: 'green',
      completed: 'blue',
      error: 'red'
    };
    return colors[status] || 'white';
  }

  /**
   * 獲取任務狀態顏色
   */
  private getTaskStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'yellow',
      running: 'green',
      completed: 'blue',
      failed: 'red'
    };
    return colors[status] || 'white';
  }

  /**
   * 創建進度條
   */
  private createProgressBar(progress: number): string {
    const width = 20;
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${progress}%`;
  }
}

/**
 * 快速啟動監控介面
 */
export function startMonitor(config: MonitorConfig): Monitor {
  const monitor = new Monitor(config);
  monitor.start();
  return monitor;
}