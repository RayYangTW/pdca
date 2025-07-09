# 2025-07-09 多 AI 引擎支援架構

## 🎯 重大決策

### 架構轉變
從原本只支援 Claude CLI 的單一引擎架構，轉變為支援多種 AI CLI（Claude、Gemini、OpenAI）的通用架構。

### 關鍵設計決策

1. **AI 引擎適配器模式**
   - 建立統一的 `AIEngine` 介面
   - 每個 AI CLI 實作自己的適配器
   - 自動檢測可用引擎並選擇最佳選項

2. **優先順序策略**
   - Claude CLI > Gemini CLI > OpenAI CLI
   - 考量：功能完整性、免費額度、易用性

3. **Gemini CLI 作為推薦選項**
   - 免費使用（60 req/min, 1000 req/day）
   - 支援 `-p` 參數直接執行
   - 無需付費訂閱

## 🏗️ 技術實作

### AI 引擎適配器 (`ai-engine-adapter.ts`)
```typescript
interface AIEngine {
  name: string;
  command: string;
  checkCommand: string;
  promptFlag?: string;
  isAvailable(): Promise<boolean>;
  executePrompt(prompt: string): Promise<string>;
}
```

### 多 AI 協調器 (`multi-ai-orchestrator.ts`)
- 支援直接執行模式（Gemini）
- 支援互動模式（Claude）
- 統一的任務分配機制

### 執行模式差異
1. **Gemini 模式**：使用 bash 腳本循環 + `gemini -p`
2. **Claude 模式**：提示使用斜線指令或手動互動

## 📚 參考資源

### 技術來源
1. **Claude Squad** - tmux + git worktrees 多代理管理
2. **Claude Flow v2.0.0** - Queen AI 協調，87+ MCP 工具
3. **VibeTunnel** - 遠端終端監控解決方案

### 官方文檔
- Claude Code Hooks: 支援 PreToolUse、PostToolUse 等事件
- MCP Protocol: Anthropic 的開放協議（2024年11月推出）
- Gemini CLI: Google 的免費 AI CLI 工具

## 💡 學習要點

1. **適配器模式的威力**：讓系統能夠無縫支援不同的 AI 引擎
2. **優雅降級策略**：當首選引擎不可用時自動切換
3. **統一抽象的重要性**：上層邏輯不需要關心底層引擎差異

## 🚀 未來展望

1. **更多引擎支援**：可輕易加入新的 AI CLI
2. **智能引擎選擇**：根據任務類型選擇最適合的引擎
3. **混合執行模式**：不同代理使用不同引擎

---

**關鍵成就**：將 PDCA 系統從 Claude 專屬工具轉變為通用的多 AI 引擎平台，大幅提升可用性和普及度。