/**
 * PDCA 代理間通訊協議
 * 定義標準化的訊息格式和通訊機制
 */

export interface PDCAMessage {
  id: string;
  type: MessageType;
  from: AgentRole | 'coordinator';
  to: AgentRole | 'all' | 'coordinator';
  content: any;
  timestamp: string;
  priority: MessagePriority;
  status?: MessageStatus;
  replyTo?: string;
}

export enum MessageType {
  // 任務相關
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_COMPLETE = 'TASK_COMPLETE',
  TASK_FAILED = 'TASK_FAILED',
  
  // 協作相關
  REQUEST_HELP = 'REQUEST_HELP',
  PROVIDE_FEEDBACK = 'PROVIDE_FEEDBACK',
  SHARE_KNOWLEDGE = 'SHARE_KNOWLEDGE',
  
  // 系統相關
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  HEARTBEAT = 'HEARTBEAT',
  
  // 結果相關
  RESULT_REPORT = 'RESULT_REPORT',
  ERROR_REPORT = 'ERROR_REPORT',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE'
}

export enum AgentRole {
  PLAN = 'plan',
  DO = 'do',
  CHECK = 'check',
  ACT = 'act',
  KNOWLEDGE = 'knowledge'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 任務分配訊息
 */
export interface TaskAssignment extends PDCAMessage {
  type: MessageType.TASK_ASSIGN;
  content: {
    taskId: string;
    title: string;
    description: string;
    requirements: string[];
    deadline?: string;
    dependencies?: string[];
  };
}

/**
 * 進度更新訊息
 */
export interface ProgressUpdate extends PDCAMessage {
  type: MessageType.PROGRESS_UPDATE;
  content: {
    taskId: string;
    progress: number; // 0-100
    currentStep: string;
    remainingSteps: string[];
    estimatedCompletion?: string;
  };
}

/**
 * 結果報告訊息
 */
export interface ResultReport extends PDCAMessage {
  type: MessageType.RESULT_REPORT;
  content: {
    taskId: string;
    success: boolean;
    summary: string;
    details: any;
    artifacts?: string[]; // 產出檔案路徑
    nextSteps?: string[];
  };
}

/**
 * 訊息工廠類別
 */
export class MessageFactory {
  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createTaskAssignment(
    from: AgentRole | 'coordinator',
    to: AgentRole,
    task: Omit<TaskAssignment['content'], 'taskId'>
  ): TaskAssignment {
    return {
      id: this.generateId(),
      type: MessageType.TASK_ASSIGN,
      from,
      to,
      content: {
        ...task,
        taskId: `task_${Date.now()}`
      },
      timestamp: new Date().toISOString(),
      priority: MessagePriority.NORMAL,
      status: MessageStatus.PENDING
    };
  }

  static createProgressUpdate(
    from: AgentRole,
    taskId: string,
    progress: number,
    currentStep: string,
    remainingSteps: string[] = []
  ): ProgressUpdate {
    return {
      id: this.generateId(),
      type: MessageType.PROGRESS_UPDATE,
      from,
      to: 'coordinator',
      content: {
        taskId,
        progress,
        currentStep,
        remainingSteps
      },
      timestamp: new Date().toISOString(),
      priority: MessagePriority.NORMAL
    };
  }

  static createResultReport(
    from: AgentRole,
    taskId: string,
    success: boolean,
    summary: string,
    details: any
  ): ResultReport {
    return {
      id: this.generateId(),
      type: MessageType.RESULT_REPORT,
      from,
      to: 'coordinator',
      content: {
        taskId,
        success,
        summary,
        details
      },
      timestamp: new Date().toISOString(),
      priority: MessagePriority.HIGH
    };
  }

  static createSystemMessage(
    type: MessageType.SYSTEM_STATUS | MessageType.SYSTEM_SHUTDOWN | MessageType.HEARTBEAT,
    content: any
  ): PDCAMessage {
    return {
      id: this.generateId(),
      type,
      from: 'coordinator',
      to: 'all',
      content,
      timestamp: new Date().toISOString(),
      priority: type === MessageType.SYSTEM_SHUTDOWN ? MessagePriority.URGENT : MessagePriority.NORMAL
    };
  }
}

/**
 * 訊息序列化和反序列化
 */
export class MessageSerializer {
  static serialize(message: PDCAMessage): string {
    return JSON.stringify(message, null, 2);
  }

  static deserialize(data: string): PDCAMessage {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`無法解析訊息: ${error}`);
    }
  }

  static toMarkdown(message: PDCAMessage): string {
    return `## 📨 PDCA 訊息

**ID**: ${message.id}
**類型**: ${message.type}
**從**: ${message.from}
**到**: ${message.to}
**時間**: ${message.timestamp}
**優先級**: ${message.priority}
${message.status ? `**狀態**: ${message.status}` : ''}

### 內容
\`\`\`json
${JSON.stringify(message.content, null, 2)}
\`\`\`
`;
  }
}

/**
 * 訊息驗證
 */
export class MessageValidator {
  static validate(message: any): message is PDCAMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.from === 'string' &&
      typeof message.to === 'string' &&
      message.content !== undefined &&
      typeof message.timestamp === 'string' &&
      typeof message.priority === 'string'
    );
  }

  static isTaskAssignment(message: PDCAMessage): message is TaskAssignment {
    return message.type === MessageType.TASK_ASSIGN;
  }

  static isProgressUpdate(message: PDCAMessage): message is ProgressUpdate {
    return message.type === MessageType.PROGRESS_UPDATE;
  }

  static isResultReport(message: PDCAMessage): message is ResultReport {
    return message.type === MessageType.RESULT_REPORT;
  }
}