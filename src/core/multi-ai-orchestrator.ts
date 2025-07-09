/**
 * 多 AI 引擎協調器
 * 支援 Claude、Gemini、OpenAI 等多種 AI CLI
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AIEngineManager, AIEngine } from './ai-engine-adapter.js';
import { CommunicationManager } from './communication-manager.js';
import { MessageFactory, AgentRole, PDCAMessage } from './message-protocol.js';

export interface MultiAIOptions {
  sessionName?: string;
  communicationDir?: string;
  engine?: string; // 指定使用的引擎
}

interface AgentConfig {
  name: string;
  role: AgentRole;
  windowIndex: number;
  systemPrompt: string;
}

export class MultiAIOrchestrator extends EventEmitter {
  private engineManager: AIEngineManager;
  private selectedEngine?: AIEngine;
  private communicationManager: CommunicationManager;
  private sessionName: string;
  private agents: Map<string, AgentConfig> = new Map();
  private communicationDir: string;
  
  constructor(options: MultiAIOptions = {}) {
    super();
    this.engineManager = new AIEngineManager();
    this.sessionName = options.sessionName || 'pdca';
    this.communicationDir = options.communicationDir || '.raiy-pdca/communication';
    
    this.communicationManager = new CommunicationManager({
      baseDir: this.communicationDir
    });
    
    this.initializeAgents();
    this.setupDirectories();
  }
  
  /**
   * 初始化代理配置
   */
  private initializeAgents(): void {
    const agentConfigs: AgentConfig[] = [
      {
        name: 'plan',
        role: AgentRole.PLAN,
        windowIndex: 0,
        systemPrompt: '你是 PDCA 系統的規劃師，負責分析需求、制定策略和協調任務。'
      },
      {
        name: 'do',
        role: AgentRole.DO,
        windowIndex: 1,
        systemPrompt: '你是 PDCA 系統的執行者，負責實作功能、編寫高品質程式碼。'
      },
      {
        name: 'check',
        role: AgentRole.CHECK,
        windowIndex: 2,
        systemPrompt: '你是 PDCA 系統的檢查員，負責品質驗證、測試和代碼審查。'
      },
      {
        name: 'act',
        role: AgentRole.ACT,
        windowIndex: 3,
        systemPrompt: '你是 PDCA 系統的改善者，負責優化效能、重構程式碼。'
      },
      {
        name: 'knowledge',
        role: AgentRole.KNOWLEDGE,
        windowIndex: 4,
        systemPrompt: '你是 PDCA 系統的知識管理者，負責記錄決策、整理經驗。'
      }
    ];
    
    agentConfigs.forEach(config => {
      this.agents.set(config.name, config);
    });
  }
  
  /**
   * 設置必要目錄
   */
  private setupDirectories(): void {
    const dirs = [
      '.raiy-pdca',
      '.raiy-pdca/communication',
      '.raiy-pdca/scripts',
      '.raiy-pdca/logs',
      '.raiy-pdca/agents'
    ];
    
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * 啟動系統
   */
  async start(engineName?: string): Promise<void> {
    console.log('🚀 啟動 PDCA 多 AI 代理系統...\n');
    
    // 選擇 AI 引擎
    if (engineName) {
      this.selectedEngine = await this.engineManager.selectEngineByName(engineName);
    } else {
      this.selectedEngine = await this.engineManager.selectBestEngine();
    }
    
    // 根據引擎類型決定啟動方式
    if (this.selectedEngine.promptFlag) {
      // 支援直接執行的引擎（如 Gemini）
      await this.startWithDirectExecution();
    } else {
      // 只支援互動模式的引擎（如 Claude）
      await this.startWithInteractiveMode();
    }
    
    // 開始監聽協調器訊息
    this.communicationManager.startListening('coordinator');
    
    console.log('\n✅ 系統啟動完成！');
    console.log(`📊 使用 tmux attach -t ${this.sessionName} 查看各代理`);
    
    this.emit('system-started', this.selectedEngine);
  }
  
  /**
   * 使用直接執行模式啟動（Gemini 等）
   */
  private async startWithDirectExecution(): Promise<void> {
    console.log('📋 使用直接執行模式（支援 -p 參數）\n');
    
    // 創建 tmux session
    await this.createTmuxSession();
    
    // 為每個代理創建啟動腳本
    for (const [name, config] of this.agents) {
      const script = this.createDirectExecutionScript(name, config);
      const scriptPath = join('.raiy-pdca/scripts', `agent-${name}.sh`);
      writeFileSync(scriptPath, script, { mode: 0o755 });
      
      // 在 tmux 中啟動
      await this.startAgentInTmux(name, config.windowIndex, scriptPath);
    }
    
    // 啟動監控
    await this.startMonitor();
  }
  
  /**
   * 使用互動模式啟動（Claude 等）
   */
  private async startWithInteractiveMode(): Promise<void> {
    console.log('📋 使用互動模式（不支援直接執行）');
    console.log('⚠️  Claude CLI 需要手動互動，建議使用斜線指令 /pdca\n');
    
    // 提示用戶使用斜線指令
    console.log('請執行以下步驟：');
    console.log('1. 開啟 Claude CLI: claude');
    console.log('2. 使用斜線指令: /pdca:start');
    console.log('3. 系統將自動配置多代理環境');
    
    // 仍然創建必要的腳本和目錄
    await this.createTmuxSession();
    
    for (const [name, config] of this.agents) {
      const script = this.createInteractiveScript(name, config);
      const scriptPath = join('.raiy-pdca/scripts', `agent-${name}.sh`);
      writeFileSync(scriptPath, script, { mode: 0o755 });
    }
  }
  
  /**
   * 創建直接執行腳本（Gemini 模式）
   */
  private createDirectExecutionScript(name: string, config: AgentConfig): string {
    const engine = this.selectedEngine!;
    
    return `#!/bin/bash
# PDCA ${name} 代理 - ${engine.name} 模式

ROLE="${name}"
COMM_DIR="${this.communicationDir}"
ENGINE_CMD="${engine.command}"
PROMPT_FLAG="${engine.promptFlag}"

echo "🚀 啟動 PDCA $ROLE 代理 (${engine.name})"

# 系統提示詞
SYSTEM_PROMPT="${config.systemPrompt}"

# 持續監聽循環
while true; do
  # 檢查是否有新任務
  if [ -f "$COMM_DIR/$ROLE.task" ]; then
    echo "📋 發現新任務"
    
    # 讀取任務
    TASK=$(cat "$COMM_DIR/$ROLE.task")
    
    # 檢查共享上下文
    CONTEXT=""
    if [ -f "$COMM_DIR/shared-context.md" ]; then
      CONTEXT=$(cat "$COMM_DIR/shared-context.md")
    fi
    
    # 構建完整 prompt
    FULL_PROMPT="$SYSTEM_PROMPT

專案上下文：
$CONTEXT

當前任務：
$TASK

請根據你的角色處理這個任務，提供詳細的執行結果。"

    # 執行 AI
    echo "🤖 調用 ${engine.name} 處理任務..."
    RESPONSE=$($ENGINE_CMD $PROMPT_FLAG "$FULL_PROMPT" 2>&1)
    
    # 保存結果
    echo "$RESPONSE" > "$COMM_DIR/$ROLE.output"
    echo "✅ 任務完成，結果已保存"
    
    # 通知下一個代理
    case $ROLE in
      "plan")
        echo "ready" > "$COMM_DIR/do.notify"
        ;;
      "do")
        echo "ready" > "$COMM_DIR/check.notify"
        ;;
      "check")
        echo "ready" > "$COMM_DIR/act.notify"
        ;;
    esac
    
    # 清理任務檔案
    rm "$COMM_DIR/$ROLE.task"
  fi
  
  # 檢查系統命令
  if [ -f "$COMM_DIR/system.cmd" ]; then
    CMD=$(cat "$COMM_DIR/system.cmd")
    if [ "$CMD" = "STOP" ]; then
      echo "🛑 收到停止命令"
      break
    fi
  fi
  
  sleep 2
done
`;
  }
  
  /**
   * 創建互動模式腳本（Claude 模式）
   */
  private createInteractiveScript(name: string, config: AgentConfig): string {
    return `#!/bin/bash
# PDCA ${name} 代理 - 互動模式

ROLE="${name}"
COMM_DIR="${this.communicationDir}"

echo "🚀 ${name} 代理準備就緒（互動模式）"
echo "請在 Claude CLI 中手動處理任務"
echo "監控目錄: $COMM_DIR"

# 顯示系統提示
echo ""
echo "代理角色說明："
echo "${config.systemPrompt}"
echo ""

# 簡單的監控循環
while true; do
  if [ -f "$COMM_DIR/$ROLE.task" ]; then
    echo "📋 新任務可用，請手動處理"
    cat "$COMM_DIR/$ROLE.task"
  fi
  sleep 5
done
`;
  }
  
  /**
   * 創建 tmux session
   */
  private async createTmuxSession(): Promise<void> {
    // 先停止現有 session
    try {
      await this.executeBash(`tmux kill-session -t ${this.sessionName}`);
    } catch {
      // 忽略錯誤（session 可能不存在）
    }
    
    // 創建新 session
    await this.executeBash(`tmux new-session -d -s ${this.sessionName} -n plan`);
  }
  
  /**
   * 在 tmux 中啟動代理
   */
  private async startAgentInTmux(name: string, windowIndex: number, scriptPath: string): Promise<void> {
    if (windowIndex === 0) {
      // 第一個窗口已存在
      await this.executeBash(
        `tmux send-keys -t ${this.sessionName}:0 "bash ${scriptPath}" C-m`
      );
    } else {
      // 創建新窗口
      await this.executeBash(
        `tmux new-window -t ${this.sessionName}:${windowIndex} -n ${name}`
      );
      await this.executeBash(
        `tmux send-keys -t ${this.sessionName}:${windowIndex} "bash ${scriptPath}" C-m`
      );
    }
  }
  
  /**
   * 啟動監控介面
   */
  private async startMonitor(): Promise<void> {
    await this.executeBash(
      `tmux new-window -t ${this.sessionName}:5 -n monitor`
    );
    await this.executeBash(
      `tmux send-keys -t ${this.sessionName}:5 "node dist/core/monitor.js" C-m`
    );
  }
  
  /**
   * 分配任務
   */
  async assignTask(taskDescription: string): Promise<void> {
    console.log(`\n📋 分配任務: ${taskDescription}`);
    
    // 將任務寫入 plan 代理
    const taskFile = join(this.communicationDir, 'plan.task');
    writeFileSync(taskFile, taskDescription);
    
    console.log('✅ 任務已分配給 Plan 代理');
    
    this.emit('task-assigned', taskDescription);
  }
  
  /**
   * 獲取系統狀態
   */
  getStatus(): {
    engine: string;
    session: string;
    agents: string[];
  } {
    return {
      engine: this.selectedEngine?.name || '未選擇',
      session: this.sessionName,
      agents: Array.from(this.agents.keys())
    };
  }
  
  /**
   * 停止系統
   */
  async stop(): Promise<void> {
    console.log('\n🛑 停止 PDCA 系統...');
    
    // 發送停止命令
    const cmdFile = join(this.communicationDir, 'system.cmd');
    writeFileSync(cmdFile, 'STOP');
    
    // 等待代理響應
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 停止 tmux session
    try {
      await this.executeBash(`tmux kill-session -t ${this.sessionName}`);
    } catch {
      // 忽略錯誤
    }
    
    console.log('✅ 系統已停止');
    this.emit('system-stopped');
  }
  
  /**
   * 執行 bash 命令
   */
  private executeBash(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('bash', ['-c', command]);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed: ${command}`));
        }
      });
    });
  }
}

export default MultiAIOrchestrator;