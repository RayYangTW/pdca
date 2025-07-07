# 🎯 Raiy-PDCA 代理配置系統設計

## 概述

Raiy-PDCA 支援靈活的代理配置系統，允許用戶自定義代理的數量、角色、風格和行為模式。系統預設提供「職人版」風格，並支援擴展其他風格。

## 🏗️ 配置架構

### 1. 配置層級

```
raiy-pdca/
├── agents/
│   ├── profiles/              # 預設風格配置
│   │   ├── shokunin.yaml     # 職人版（預設）
│   │   ├── agile.yaml        # 敏捷版
│   │   ├── academic.yaml     # 學術版
│   │   └── enterprise.yaml   # 企業版
│   ├── templates/             # 代理模板
│   │   ├── plan.yaml         # Plan 代理模板
│   │   ├── do.yaml           # Do 代理模板
│   │   ├── check.yaml        # Check 代理模板
│   │   └── act.yaml          # Act 代理模板
│   └── custom/                # 用戶自定義配置
│       └── my-profile.yaml
```

### 2. 配置檔案結構

#### 風格配置檔 (profiles/shokunin.yaml)
```yaml
name: "職人版"
version: "1.0.0"
description: "追求極致簡潔與工匠品質的 PDCA 實踐"
author: "Raiy Yang"

# 全域設定
globals:
  language: "zh-TW"
  thinking_depth: "think hard"
  communication_style: "precise"
  
# 代理配置
agents:
  plan:
    name: "pdca-plan"
    role: "規劃師"
    icon: "🎯"
    personality:
      name: "謹慎規劃師"
      traits:
        - "注重細節"
        - "追求完美"
        - "系統思考"
      thinking: "think hard"
      approach: "top-down"
    prompts:
      initial: |
        你是 PDCA 循環中的 Plan 代理，採用職人精神進行規劃。
        你的任務是深入理解需求，制定完善的計畫。
        請保持簡潔、精確、高品質的輸出。
      mission: |
        任務：{{mission}}
        請分析需求並制定詳細的執行計畫。
    
  do:
    name: "pdca-do"
    role: "執行者"
    icon: "🎨"
    personality:
      name: "實踐匠人"
      traits:
        - "專注執行"
        - "精益求精"
        - "寧缺勿濫"
      thinking: "think"
      approach: "iterative"
    prompts:
      initial: |
        你是 PDCA 循環中的 Do 代理，以職人精神執行任務。
        專注於高品質的實作，每一行代碼都要精雕細琢。
      mission: |
        任務：{{mission}}
        根據 Plan 代理的計畫，開始實作。

  check:
    name: "pdca-check"
    role: "檢查員"
    icon: "🔍"
    personality:
      name: "品質守護者"
      traits:
        - "嚴格檢查"
        - "客觀評估"
        - "追求卓越"
      thinking: "think hard"
      approach: "systematic"
      
  act:
    name: "pdca-act"
    role: "改善者"
    icon: "🚀"
    personality:
      name: "持續改進大師"
      traits:
        - "優化導向"
        - "創新思維"
        - "永不滿足"
      thinking: "think harder"
      approach: "evolutionary"

  knowledge:
    name: "knowledge-agent"
    role: "知識管理"
    icon: "📝"
    personality:
      name: "智慧守護者"
      traits:
        - "細心記錄"
        - "智能分類"
        - "經驗萃取"
      thinking: "think"
      approach: "observational"

# 通訊設定
communication:
  method: "file-based"
  directory: ".raiy-pdca/communication"
  sync_interval: 5
  protocols:
    - "task-assignment"
    - "progress-report"
    - "knowledge-sharing"

# 執行設定
execution:
  parallel: true
  max_agents: 5
  startup_delay: 1500
  health_check_interval: 30
```

#### 敏捷版配置檔 (profiles/agile.yaml)
```yaml
name: "敏捷版"
version: "1.0.0"
description: "快速迭代，持續改進的 PDCA 實踐"

agents:
  plan:
    personality:
      name: "敏捷教練"
      traits:
        - "快速決策"
        - "迭代思維"
        - "用戶導向"
      thinking: "think"
      approach: "user-story"
    prompts:
      initial: |
        你是敏捷 PDCA 的 Plan 代理。
        專注於快速產出 MVP，迭代改進。
        優先考慮用戶價值和快速反饋。
```

### 3. 代理模板系統

```yaml
# templates/plan.yaml
template: "plan-agent"
base_config:
  type: "claude-cli"
  window_name: "plan"
  required_tools:
    - "read"
    - "write"
    - "search"
  
customizable:
  - personality
  - prompts
  - thinking_depth
  - communication_style
  
constraints:
  min_thinking: "think"
  max_thinking: "ultrathink"
```

### 4. 自定義配置

用戶可以創建自己的配置檔：

```yaml
# custom/my-team-profile.yaml
name: "我的團隊風格"
base: "shokunin"  # 基於職人版修改

# 覆蓋特定代理設定
agents:
  plan:
    personality:
      name: "戰略規劃師"
      thinking: "superthink"  # 加強思考深度
    
  do:
    count: 3  # 增加 Do 代理數量
    personalities:
      - name: "前端工程師"
        focus: "UI/UX"
      - name: "後端工程師"
        focus: "API/Database"
      - name: "DevOps 工程師"
        focus: "Infrastructure"
```

## 🚀 使用方式

### 1. 命令行參數

```bash
# 使用預設職人版
pdca -s "建立登入系統"

# 指定風格
pdca -s "建立登入系統" --profile agile

# 使用自定義配置
pdca -s "建立登入系統" --config ./custom/my-team-profile.yaml

# 覆蓋特定設定
pdca -s "建立登入系統" --agents 7 --thinking "ultrathink"
```

### 2. 環境變數

```bash
export PDCA_PROFILE=agile
export PDCA_AGENTS_COUNT=7
export PDCA_THINKING_DEPTH=hard
```

### 3. 專案配置檔

```yaml
# .pdca/config.yaml
profile: "enterprise"
agents:
  plan:
    thinking: "superthink"
  do:
    count: 5
communication:
  sync_interval: 3
```

## 🔧 配置載入優先級

1. 命令行參數（最高優先級）
2. 專案配置檔 (.pdca/config.yaml)
3. 環境變數
4. 用戶自定義配置 (--config)
5. 風格配置檔 (--profile)
6. 系統預設值（職人版）

## 📊 配置驗證

系統會在啟動時驗證配置：

```typescript
interface AgentConfig {
  name: string;
  role: string;
  icon: string;
  personality: {
    name: string;
    traits: string[];
    thinking: ThinkingDepth;
    approach: string;
  };
  prompts: {
    initial: string;
    mission: string;
  };
}

type ThinkingDepth = 'think' | 'think hard' | 'think harder' | 'superthink' | 'ultrathink';

// 驗證規則
const validateConfig = (config: AgentConfig): ValidationResult => {
  // 檢查必填欄位
  // 驗證 thinking depth
  // 確認 prompts 格式
  // 檢查代理數量限制 (1-10)
};
```

## 🎨 風格設計指南

創建新風格時，考慮以下要素：

1. **目標用戶**：這個風格適合什麼類型的團隊？
2. **核心價值**：強調什麼特質？（品質、速度、創新等）
3. **思考深度**：各代理需要多深入的思考？
4. **溝通風格**：正式、輕鬆、技術性？
5. **協作模式**：順序、並行、混合？

## 🔄 動態調整

系統支援運行時調整：

```bash
# 查看當前配置
pdca config show

# 調整特定代理
pdca config set plan.thinking "ultrathink"

# 重新載入配置
pdca config reload
```

## 📚 配置範例庫

提供多種場景的配置範例：

- **startup.yaml**: 適合新創團隊的快速迭代配置
- **research.yaml**: 適合研究項目的深度思考配置
- **enterprise.yaml**: 適合大型企業的規範化配置
- **education.yaml**: 適合教學場景的詳細解釋配置
- **hackathon.yaml**: 適合黑客松的極速開發配置