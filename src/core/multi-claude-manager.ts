/**
 * Multi-Claude CLI Manager
 * 管理多個獨立的 Claude CLI 實例
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface ClaudeAgent {
  name: string;
  role: string;
  process?: ChildProcess;
  windowIndex: number;
  status: 'stopped' | 'starting' | 'running' | 'error';
  prompt: string;
}

export class MultiClaudeManager extends EventEmitter {
  private agents: Map<string, ClaudeAgent> = new Map();
  private communicationDir: string;
  private sessionName: string;

  constructor(sessionName: string = 'pdca') {
    super();
    this.sessionName = sessionName;
    this.communicationDir = '.raiy-pdca/communication';
    this.initializeCommunicationDir();
  }

  private initializeCommunicationDir(): void {
    const dirs = [
      '.raiy-pdca',
      '.raiy-pdca/communication',
      '.raiy-pdca/agents',
      '.raiy-pdca/logs',
      '.pdca'
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 初始化代理配置
   */
  initializeAgents(): void {
    const agentConfigs: Omit<ClaudeAgent, 'process' | 'status'>[] = [
      {
        name: 'plan',
        role: '規劃師',
        windowIndex: 0,
        prompt: `你是 PDCA 系統中的 Plan 代理。你的職責是：
1. 分析用戶需求，制定詳細計畫
2. 將任務分解為可執行的步驟
3. 與其他代理協調工作
4. 監控 .raiy-pdca/communication/ 目錄接收任務
5. 將計畫寫入 .raiy-pdca/communication/plan.output

請持續監聽新任務並主動規劃。`
      },
      {
        name: 'do',
        role: '執行者',
        windowIndex: 1,
        prompt: `你是 PDCA 系統中的 Do 代理。你的職責是：
1. 根據 Plan 代理的計畫實作功能
2. 編寫高品質的程式碼
3. 監控 .raiy-pdca/communication/ 目錄接收任務
4. 將實作結果寫入 .raiy-pdca/communication/do.output

請持續監聽任務並執行實作。`
      },
      {
        name: 'check',
        role: '檢查員',
        windowIndex: 2,
        prompt: `你是 PDCA 系統中的 Check 代理。你的職責是：
1. 檢查 Do 代理的實作品質
2. 執行測試和驗證
3. 監控 .raiy-pdca/communication/ 目錄
4. 將檢查結果寫入 .raiy-pdca/communication/check.output

請持續監控並提供品質回饋。`
      },
      {
        name: 'act',
        role: '改善者',
        windowIndex: 3,
        prompt: `你是 PDCA 系統中的 Act 代理。你的職責是：
1. 根據 Check 的結果進行優化
2. 實施改進措施
3. 監控 .raiy-pdca/communication/ 目錄
4. 將改進結果寫入 .raiy-pdca/communication/act.output

請持續尋找改進機會。`
      },
      {
        name: 'knowledge',
        role: '知識管理',
        windowIndex: 4,
        prompt: `你是 PDCA 系統中的 Knowledge 代理。你的職責是：
1. 記錄所有代理的重要決策和學習
2. 維護專案知識庫
3. 監控 .raiy-pdca/communication/ 目錄
4. 將知識整理到 memories/ 目錄

請持續收集和整理知識。`
      }
    ];

    agentConfigs.forEach(config => {
      this.agents.set(config.name, {
        ...config,
        status: 'stopped'
      });
    });
  }

  /**
   * 啟動所有代理
   */
  async startAllAgents(): Promise<void> {
    // 先確保沒有現有的 session
    await this.killExistingSession();

    // 創建新的 tmux session
    await this.createTmuxSession();

    // 啟動每個代理
    for (const [name, agent] of this.agents) {
      await this.startAgent(name);
    }

    // 啟動監控窗口
    await this.startMonitor();
  }

  /**
   * 停止現有 session
   */
  private async killExistingSession(): Promise<void> {
    return new Promise((resolve) => {
      const kill = spawn('tmux', ['kill-session', '-t', this.sessionName], {
        stdio: 'pipe'
      });
      kill.on('close', () => resolve());
      kill.on('error', () => resolve());
    });
  }

  /**
   * 創建 tmux session
   */
  private async createTmuxSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      const create = spawn('tmux', [
        'new-session', '-d', '-s', this.sessionName, '-n', 'plan'
      ], { stdio: 'pipe' });

      create.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to create tmux session'));
        }
      });
    });
  }

  /**
   * 啟動單個代理
   */
  private async startAgent(name: string): Promise<void> {
    const agent = this.agents.get(name);
    if (!agent) return;

    agent.status = 'starting';

    // 寫入初始 prompt
    const promptFile = join(this.communicationDir, `${name}.prompt`);
    writeFileSync(promptFile, agent.prompt);

    // 創建啟動腳本
    const startScript = `
#!/bin/bash
echo "🚀 啟動 ${agent.role} (${name})"
echo "正在初始化..."
claude --no-history "${agent.prompt}"
`;

    const scriptFile = join('.raiy-pdca', `start-${name}.sh`);
    writeFileSync(scriptFile, startScript, { mode: 0o755 });

    // 在 tmux 中啟動
    if (agent.windowIndex === 0) {
      // 第一個窗口已存在，直接發送命令
      await this.sendToTmux(this.sessionName, agent.windowIndex, `bash ${scriptFile}`);
    } else {
      // 創建新窗口
      await this.createTmuxWindow(name, agent.windowIndex);
      await this.sendToTmux(this.sessionName, agent.windowIndex, `bash ${scriptFile}`);
    }

    agent.status = 'running';
    this.updateAgentStatus(name, 'running');
  }

  /**
   * 創建 tmux 窗口
   */
  private async createTmuxWindow(name: string, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const create = spawn('tmux', [
        'new-window', '-t', `${this.sessionName}:${index}`, '-n', name
      ], { stdio: 'pipe' });

      create.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create window for ${name}`));
        }
      });
    });
  }

  /**
   * 發送命令到 tmux 窗口
   */
  private async sendToTmux(session: string, window: number, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const send = spawn('tmux', [
        'send-keys', '-t', `${session}:${window}`, command, 'Enter'
      ], { stdio: 'pipe' });

      send.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to send command to tmux'));
        }
      });
    });
  }

  /**
   * 啟動監控
   */
  private async startMonitor(): Promise<void> {
    await this.createTmuxWindow('monitor', 5);
    await this.sendToTmux(this.sessionName, 5, 'node dist/core/monitor.js');
  }

  /**
   * 更新代理狀態
   */
  private updateAgentStatus(name: string, status: string): void {
    const statusFile = join('.raiy-pdca/agents', `${name}.status`);
    const agent = this.agents.get(name);
    if (agent) {
      writeFileSync(statusFile, `${agent.role} - ${status}\n時間: ${new Date().toISOString()}`);
    }
  }

  /**
   * 發送任務給所有代理
   */
  async sendTask(task: string): Promise<void> {
    const taskMessage = {
      type: 'TASK',
      content: task,
      timestamp: new Date().toISOString(),
      from: 'coordinator'
    };

    const taskFile = join(this.communicationDir, 'current.task');
    writeFileSync(taskFile, JSON.stringify(taskMessage, null, 2));

    // 通知所有代理
    for (const [name] of this.agents) {
      const notifyFile = join(this.communicationDir, `${name}.notify`);
      writeFileSync(notifyFile, `新任務: ${task}`);
    }

    this.emit('task-sent', task);
  }

  /**
   * 獲取所有代理狀態
   */
  getAgentStatuses(): Map<string, ClaudeAgent> {
    return this.agents;
  }

  /**
   * 停止所有代理
   */
  async stopAllAgents(): Promise<void> {
    // 發送停止信號
    const stopFile = join(this.communicationDir, 'system.cmd');
    writeFileSync(stopFile, 'SYSTEM_SHUTDOWN');

    // 等待代理回應
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 停止 tmux session
    await this.killExistingSession();

    // 更新狀態
    for (const [name] of this.agents) {
      this.updateAgentStatus(name, 'stopped');
    }

    this.emit('system-stopped');
  }
}

export default MultiClaudeManager;