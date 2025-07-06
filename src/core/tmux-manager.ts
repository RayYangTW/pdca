/**
 * Tmux 管理器
 * 負責創建和管理 tmux sessions、windows
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import type { TmuxSession, TmuxWindow } from '../types/index.js';

export class TmuxManager {
  private sessionName: string;

  constructor(sessionName: string = 'pdca-shokunin') {
    this.sessionName = sessionName;
  }

  /**
   * 檢查 tmux session 是否存在
   */
  async hasSession(): Promise<boolean> {
    try {
      const result = await this.execTmux(['has-session', '-t', this.sessionName]);
      return result.code === 0;
    } catch {
      return false;
    }
  }

  /**
   * 創建新的 tmux session
   */
  async createSession(): Promise<void> {
    // 如果 session 已存在，先殺掉
    if (await this.hasSession()) {
      await this.killSession();
    }

    // 創建新 session，第一個窗口為 pdca-plan
    await this.execTmux([
      'new-session', '-d', '-s', this.sessionName,
      '-n', 'pdca-plan', '-c', process.cwd()
    ]);
  }

  /**
   * 創建新窗口
   */
  async createWindow(name: string, index?: number, workingDir?: string): Promise<void> {
    const cmd = ['new-window', '-t', this.sessionName];
    
    if (index !== undefined) {
      cmd.push('-t', `${this.sessionName}:${index}`);
    }
    
    cmd.push('-n', name);
    
    if (workingDir) {
      cmd.push('-c', workingDir);
    } else {
      cmd.push('-c', process.cwd());
    }

    await this.execTmux(cmd);
  }

  /**
   * 在指定窗口中發送命令
   */
  async sendCommand(target: string, command: string): Promise<void> {
    await this.execTmux([
      'send-keys', '-t', `${this.sessionName}:${target}`,
      command, 'Enter'
    ]);
  }

  /**
   * 列出所有窗口
   */
  async listWindows(): Promise<TmuxWindow[]> {
    try {
      const result = await this.execTmux([
        'list-windows', '-t', this.sessionName, '-F',
        '#{window_index}:#{window_name}:#{window_active}'
      ]);

      if (result.code !== 0) {
        return [];
      }

      return result.stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [index, name, active] = line.split(':');
          return {
            index: parseInt(index, 10),
            name,
            active: active === '1'
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * 獲取 session 資訊
   */
  async getSession(): Promise<TmuxSession | null> {
    if (!(await this.hasSession())) {
      return null;
    }

    const windows = await this.listWindows();
    
    return {
      name: this.sessionName,
      windows
    };
  }

  /**
   * 殺掉 session
   */
  async killSession(): Promise<void> {
    try {
      await this.execTmux(['kill-session', '-t', this.sessionName]);
    } catch {
      // 忽略錯誤，可能 session 不存在
    }
  }

  /**
   * 連接到 session（在新的終端視窗中）
   */
  async attachSession(): Promise<void> {
    // 這會在當前進程中執行，不適合在 CLI 中使用
    // 主要是給監控使用
    await this.execTmux(['attach-session', '-t', this.sessionName]);
  }

  /**
   * 選擇特定窗口
   */
  async selectWindow(target: string | number): Promise<void> {
    await this.execTmux([
      'select-window', '-t', `${this.sessionName}:${target}`
    ]);
  }

  /**
   * 檢查特定窗口是否存在
   */
  async hasWindow(name: string): Promise<boolean> {
    try {
      const windows = await this.listWindows();
      return windows.some(w => w.name === name);
    } catch {
      return false;
    }
  }

  /**
   * 等待窗口創建完成
   */
  async waitForWindow(name: string, timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await this.hasWindow(name)) {
        return true;
      }
      await this.sleep(100);
    }
    
    return false;
  }

  /**
   * 執行 tmux 命令
   */
  private async execTmux(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn('tmux', args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      child.on('close', (code) => {
        resolve({
          code: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      child.on('error', (error) => {
        resolve({
          code: 1,
          stdout: '',
          stderr: error.message
        });
      });
    });
  }

  /**
   * 休眠工具函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}