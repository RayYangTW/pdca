/**
 * AI 引擎適配器
 * 統一支援多種 AI CLI (Claude, Gemini, OpenAI 等)
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface AIEngine {
  name: string;
  command: string;
  checkCommand: string;
  promptFlag?: string;
  isAvailable(): Promise<boolean>;
  executePrompt(prompt: string): Promise<string>;
  startInteractive?(): ChildProcess;
}

/**
 * Claude CLI 適配器
 */
export class ClaudeEngine implements AIEngine {
  name = 'Claude CLI';
  command = 'claude';
  checkCommand = 'claude --version';
  
  async isAvailable(): Promise<boolean> {
    try {
      execSync(this.checkCommand, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  async executePrompt(prompt: string): Promise<string> {
    // Claude CLI 不支援直接執行 prompt
    // 需要透過檔案系統或其他方式
    throw new Error('Claude CLI 不支援直接執行 prompt，請使用互動模式');
  }
  
  startInteractive(): ChildProcess {
    return spawn(this.command, [], {
      stdio: 'pipe',
      shell: true
    });
  }
}

/**
 * Gemini CLI 適配器
 */
export class GeminiEngine implements AIEngine {
  name = 'Gemini CLI';
  command = 'gemini';
  checkCommand = 'gemini --version';
  promptFlag = '-p';
  
  async isAvailable(): Promise<boolean> {
    try {
      execSync(this.checkCommand, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  async executePrompt(prompt: string): Promise<string> {
    try {
      // 使用 gemini -p 執行 prompt
      const result = execSync(`gemini -p "${prompt.replace(/"/g, '\\"')}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });
      return result;
    } catch (error: any) {
      throw new Error(`Gemini 執行失敗: ${error.message}`);
    }
  }
  
  startInteractive(): ChildProcess {
    return spawn(this.command, [], {
      stdio: 'pipe',
      shell: true
    });
  }
}

/**
 * OpenAI CLI 適配器
 */
export class OpenAIEngine implements AIEngine {
  name = 'OpenAI CLI';
  command = 'openai';
  checkCommand = 'openai --version';
  
  async isAvailable(): Promise<boolean> {
    try {
      execSync(this.checkCommand, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  async executePrompt(prompt: string): Promise<string> {
    try {
      const result = execSync(`openai complete --prompt "${prompt.replace(/"/g, '\\"')}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      return result;
    } catch (error: any) {
      throw new Error(`OpenAI 執行失敗: ${error.message}`);
    }
  }
}

/**
 * AI 引擎管理器
 */
export class AIEngineManager extends EventEmitter {
  private engines: AIEngine[] = [
    new ClaudeEngine(),
    new GeminiEngine(),
    new OpenAIEngine()
  ];
  
  private selectedEngine?: AIEngine;
  
  /**
   * 檢測所有可用的 AI 引擎
   */
  async detectAvailableEngines(): Promise<AIEngine[]> {
    const available: AIEngine[] = [];
    
    console.log('🔍 檢測可用的 AI CLI...');
    
    for (const engine of this.engines) {
      if (await engine.isAvailable()) {
        available.push(engine);
        console.log(`✅ 檢測到 ${engine.name}`);
        this.emit('engine-detected', engine);
      } else {
        console.log(`❌ 未找到 ${engine.name}`);
      }
    }
    
    if (available.length === 0) {
      console.log('\n⚠️  未檢測到任何 AI CLI');
      console.log('請安裝至少一個 AI CLI：');
      console.log('- Gemini CLI (免費): npm install -g @google/gemini-cli');
      console.log('- Claude CLI: https://claude.ai/cli');
    }
    
    return available;
  }
  
  /**
   * 自動選擇最佳引擎
   */
  async selectBestEngine(): Promise<AIEngine> {
    const available = await this.detectAvailableEngines();
    
    if (available.length === 0) {
      throw new Error('未檢測到任何 AI CLI，請至少安裝一個');
    }
    
    // 優先順序：Claude > Gemini > 其他
    const priorityOrder = ['claude', 'gemini', 'openai'];
    
    for (const cmd of priorityOrder) {
      const engine = available.find(e => e.command === cmd);
      if (engine) {
        this.selectedEngine = engine;
        console.log(`\n🚀 使用 ${engine.name} 作為 AI 引擎`);
        this.emit('engine-selected', engine);
        return engine;
      }
    }
    
    // 使用第一個可用的
    this.selectedEngine = available[0];
    console.log(`\n🚀 使用 ${this.selectedEngine.name} 作為 AI 引擎`);
    this.emit('engine-selected', this.selectedEngine);
    return this.selectedEngine;
  }
  
  /**
   * 根據名稱選擇引擎
   */
  async selectEngineByName(name: string): Promise<AIEngine> {
    const engine = this.engines.find(e => 
      e.command === name || 
      e.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (!engine) {
      throw new Error(`未知的 AI 引擎: ${name}`);
    }
    
    if (!await engine.isAvailable()) {
      throw new Error(`${engine.name} 未安裝或不可用`);
    }
    
    this.selectedEngine = engine;
    console.log(`🚀 使用 ${engine.name} 作為 AI 引擎`);
    this.emit('engine-selected', engine);
    return engine;
  }
  
  /**
   * 獲取當前選擇的引擎
   */
  getSelectedEngine(): AIEngine | undefined {
    return this.selectedEngine;
  }
  
  /**
   * 添加自定義引擎
   */
  addEngine(engine: AIEngine): void {
    this.engines.push(engine);
  }
}

export default AIEngineManager;