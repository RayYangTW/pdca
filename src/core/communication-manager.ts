/**
 * 通訊管理器
 * 負責代理間的訊息傳遞和檔案系統 IPC
 */

import { EventEmitter } from 'events';
import { 
  readFileSync, 
  writeFileSync, 
  existsSync, 
  mkdirSync, 
  readdirSync,
  unlinkSync,
  watchFile,
  unwatchFile,
  statSync
} from 'fs';
import { join } from 'path';
import { 
  PDCAMessage, 
  MessageType, 
  AgentRole,
  MessageStatus,
  MessageSerializer,
  MessageValidator 
} from './message-protocol.js';

export interface CommunicationConfig {
  baseDir: string;
  pollingInterval: number;
  messageRetention: number; // 訊息保留時間（毫秒）
}

export class CommunicationManager extends EventEmitter {
  private config: CommunicationConfig;
  private watchedFiles: Set<string> = new Set();
  private processedMessages: Set<string> = new Set();
  private messageQueue: Map<string, PDCAMessage[]> = new Map();

  constructor(config: Partial<CommunicationConfig> = {}) {
    super();
    this.config = {
      baseDir: config.baseDir || '.raiy-pdca/communication',
      pollingInterval: config.pollingInterval || 1000,
      messageRetention: config.messageRetention || 3600000 // 1 小時
    };
    this.initializeDirectories();
  }

  private initializeDirectories(): void {
    const dirs = [
      this.config.baseDir,
      join(this.config.baseDir, 'inbox'),
      join(this.config.baseDir, 'outbox'),
      join(this.config.baseDir, 'processed'),
      join(this.config.baseDir, 'broadcasts')
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 發送訊息
   */
  async sendMessage(message: PDCAMessage): Promise<void> {
    // 設定狀態為待處理
    message.status = MessageStatus.PENDING;

    // 序列化訊息
    const serialized = MessageSerializer.serialize(message);

    // 決定儲存位置
    if (message.to === 'all') {
      // 廣播訊息
      const broadcastPath = join(this.config.baseDir, 'broadcasts', `${message.id}.json`);
      writeFileSync(broadcastPath, serialized);
    } else {
      // 點對點訊息
      const inboxPath = join(this.config.baseDir, 'inbox', message.to);
      if (!existsSync(inboxPath)) {
        mkdirSync(inboxPath);
      }
      const messagePath = join(inboxPath, `${message.id}.json`);
      writeFileSync(messagePath, serialized);
    }

    // 發送事件
    this.emit('message-sent', message);
  }

  /**
   * 開始監聽訊息
   */
  startListening(agentRole: AgentRole | 'coordinator'): void {
    // 監聽個人收件匣
    const inboxPath = join(this.config.baseDir, 'inbox', agentRole);
    if (!existsSync(inboxPath)) {
      mkdirSync(inboxPath);
    }
    this.watchDirectory(inboxPath, agentRole);

    // 監聽廣播
    const broadcastPath = join(this.config.baseDir, 'broadcasts');
    this.watchDirectory(broadcastPath, agentRole);

    // 定期清理過期訊息
    setInterval(() => this.cleanupOldMessages(), 60000); // 每分鐘清理一次
  }

  /**
   * 停止監聽
   */
  stopListening(): void {
    this.watchedFiles.forEach(file => {
      unwatchFile(file);
    });
    this.watchedFiles.clear();
  }

  /**
   * 監聽目錄變化
   */
  private watchDirectory(dirPath: string, agentRole: string): void {
    // 初始掃描
    this.scanDirectory(dirPath, agentRole);

    // 定期掃描新檔案
    setInterval(() => {
      this.scanDirectory(dirPath, agentRole);
    }, this.config.pollingInterval);
  }

  /**
   * 掃描目錄中的訊息
   */
  private scanDirectory(dirPath: string, agentRole: string): void {
    if (!existsSync(dirPath)) return;

    const files = readdirSync(dirPath).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = join(dirPath, file);
      const messageId = file.replace('.json', '');

      // 跳過已處理的訊息
      if (this.processedMessages.has(messageId)) return;

      try {
        const content = readFileSync(filePath, 'utf-8');
        const message = MessageSerializer.deserialize(content);

        if (MessageValidator.validate(message)) {
          // 標記為已處理
          this.processedMessages.add(messageId);

          // 更新狀態為已接收
          message.status = MessageStatus.RECEIVED;

          // 發送事件
          this.emit('message-received', message, agentRole);

          // 移動到已處理目錄
          this.moveToProcessed(filePath, message);
        }
      } catch (error) {
        console.error(`處理訊息失敗: ${file}`, error);
      }
    });
  }

  /**
   * 移動訊息到已處理目錄
   */
  private moveToProcessed(filePath: string, message: PDCAMessage): void {
    const processedDir = join(this.config.baseDir, 'processed', message.to);
    if (!existsSync(processedDir)) {
      mkdirSync(processedDir, { recursive: true });
    }

    const processedPath = join(processedDir, `${message.id}.json`);
    const processedMessage = {
      ...message,
      status: MessageStatus.COMPLETED
    };
    const content = MessageSerializer.serialize(processedMessage);

    writeFileSync(processedPath, content);
    unlinkSync(filePath);
  }

  /**
   * 清理過期訊息
   */
  private cleanupOldMessages(): void {
    const processedDir = join(this.config.baseDir, 'processed');
    if (!existsSync(processedDir)) return;

    const now = Date.now();
    this.cleanupDirectory(processedDir, now);
  }

  private cleanupDirectory(dirPath: string, now: number): void {
    const items = readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);

      if (stat.isDirectory()) {
        this.cleanupDirectory(itemPath, now);
      } else if (stat.isFile() && item.endsWith('.json')) {
        if (now - stat.mtimeMs > this.config.messageRetention) {
          unlinkSync(itemPath);
        }
      }
    });
  }

  /**
   * 取得代理的未讀訊息
   */
  getUnreadMessages(agentRole: AgentRole | 'coordinator'): PDCAMessage[] {
    const messages: PDCAMessage[] = [];
    
    // 檢查個人收件匣
    const inboxPath = join(this.config.baseDir, 'inbox', agentRole);
    if (existsSync(inboxPath)) {
      const files = readdirSync(inboxPath).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        try {
          const content = readFileSync(join(inboxPath, file), 'utf-8');
          const message = MessageSerializer.deserialize(content);
          if (MessageValidator.validate(message)) {
            messages.push(message);
          }
        } catch (error) {
          console.error(`讀取訊息失敗: ${file}`, error);
        }
      });
    }

    // 檢查廣播
    const broadcastPath = join(this.config.baseDir, 'broadcasts');
    if (existsSync(broadcastPath)) {
      const files = readdirSync(broadcastPath).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const messageId = file.replace('.json', '');
        if (!this.processedMessages.has(messageId)) {
          try {
            const content = readFileSync(join(broadcastPath, file), 'utf-8');
            const message = MessageSerializer.deserialize(content);
            if (MessageValidator.validate(message)) {
              messages.push(message);
            }
          } catch (error) {
            console.error(`讀取廣播失敗: ${file}`, error);
          }
        }
      });
    }

    return messages;
  }

  /**
   * 回覆訊息
   */
  async replyToMessage(originalMessage: PDCAMessage, reply: Omit<PDCAMessage, 'id' | 'timestamp' | 'replyTo'>): Promise<void> {
    const replyMessage: PDCAMessage = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      replyTo: originalMessage.id,
      to: originalMessage.from as AgentRole
    };

    await this.sendMessage(replyMessage);
  }

  /**
   * 廣播訊息給所有代理
   */
  async broadcastMessage(message: Omit<PDCAMessage, 'to'>): Promise<void> {
    const broadcastMessage: PDCAMessage = {
      ...message,
      to: 'all'
    };

    await this.sendMessage(broadcastMessage);
  }

  /**
   * 取得通訊統計
   */
  getStatistics(): {
    totalSent: number;
    totalReceived: number;
    pendingMessages: number;
    processedMessages: number;
  } {
    let totalSent = 0;
    let totalReceived = this.processedMessages.size;
    let pendingMessages = 0;

    // 計算待處理訊息
    const inboxDir = join(this.config.baseDir, 'inbox');
    if (existsSync(inboxDir)) {
      const agents = readdirSync(inboxDir);
      agents.forEach(agent => {
        const agentInbox = join(inboxDir, agent);
        if (statSync(agentInbox).isDirectory()) {
          pendingMessages += readdirSync(agentInbox).filter(f => f.endsWith('.json')).length;
        }
      });
    }

    // 計算已發送訊息
    const outboxDir = join(this.config.baseDir, 'outbox');
    if (existsSync(outboxDir)) {
      totalSent = readdirSync(outboxDir).filter(f => f.endsWith('.json')).length;
    }

    return {
      totalSent,
      totalReceived,
      pendingMessages,
      processedMessages: this.processedMessages.size
    };
  }
}

export default CommunicationManager;