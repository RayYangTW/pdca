#!/usr/bin/env python3
"""
PDCA 提示生成器 - 適配 Claude -p 模式
當使用 claude -p "pdca 任務描述" 時，直接生成 PDCA 協調提示
"""

import sys
import json
from datetime import datetime
from pathlib import Path

def generate_pdca_prompt(task_description):
    """生成適合 -p 模式的 PDCA 協調提示"""
    
    # 記錄任務（如果在專案目錄中）
    pdca_dir = Path(".pdca")
    if pdca_dir.exists() or Path("memories").exists():
        pdca_dir.mkdir(exist_ok=True)
        task_data = {
            "task": task_description,
            "created_at": datetime.now().isoformat(),
            "status": "initiated",
            "source": "claude_p_mode"
        }
        
        try:
            with open(pdca_dir / "current_task.json", "w", encoding="utf-8") as f:
                json.dump(task_data, f, indent=2, ensure_ascii=False)
        except:
            pass  # 如果無法寫入檔案就跳過
    
    # 生成 PDCA 協調提示
    prompt = f"""# 🎯 PDCA 多代理協調系統啟動

## 任務：{task_description}

作為 **[協調者]**，我將啟動四大專家協作來處理這個任務。請按照以下流程進行：

### 🎨 [設計專家] - 設計宗師
**職責**：架構設計，技術方案規劃
**核心屬性**：
- 🤔 **質疑精神**：質疑需求的真實性和完整性  
- 💎 **追求卓越**：追求最優雅和可擴展的架構設計
- 🔍 **自主搜尋**：主動搜尋相關技術方案和最佳實踐
- 📡 **技術敏銳度**：掌握最新的架構模式和設計工具

### 💻 [開發專家] - 實作職人  
**職責**：程式實作，代碼編寫
**核心屬性**：
- 🤔 **質疑精神**：質疑實作方式的效率和正確性
- 💎 **追求卓越**：追求最優雅和高效的代碼實現
- 🔍 **自主搜尋**：主動學習新的開發技術和工具
- 📡 **技術敏銳度**：掌握最新的程式語言特性和開發框架

### 🔍 [品質專家] - 品質守護者
**職責**：測試驗證，品質保證
**核心屬性**：
- 🤔 **質疑精神**：質疑所有假設和測試的充分性
- 💎 **追求卓越**：追求最全面和嚴格的品質標準
- 🔍 **自主搜尋**：主動搜尋最新的測試方法和工具
- 📡 **技術敏銳度**：掌握最新的測試框架和品質工具

### 🚀 [優化專家] - 改善大師
**職責**：性能改善，系統優化
**核心屬性**：
- 🤔 **質疑精神**：質疑改善方案的有效性和可持續性
- 💎 **追求卓越**：追求系統性和根本性的改善
- 🔍 **自主搜尋**：主動搜尋改善方法和成功案例
- 📡 **技術敏銳度**：掌握最新的改善方法論和工具

## 🔄 PDCA 循環流程

### Plan (計劃階段)
[設計專家] 請首先分析需求並提出架構方案，記住要質疑和搜尋最佳實踐。

### Do (執行階段)  
[開發專家] 基於設計專家的方案進行實作，追求代碼品質和技術卓越。

### Check (檢查階段)
[品質專家] 驗證實作品質，確保符合標準，不滿足於基本通過。

### Act (改善階段)
[優化專家] 分析整體表現，提出系統性改善建議。

## 🎯 職人精神提醒

- **尊重用戶需求**：絕不質疑「{task_description}」這個需求本身
- **質疑解決方案**：對我們提出的每個技術方案保持批判思考
- **追求卓越**：不滿足於「能用」，要追求「最優」
- **持續學習**：主動搜尋最新技術和最佳實踐

請開始 PDCA 協調流程！"""

    return prompt

def main():
    """主入口函數"""
    # 檢查是否在 claude -p 環境中被調用
    if len(sys.argv) > 1:
        task_description = " ".join(sys.argv[1:])
        prompt = generate_pdca_prompt(task_description)
        print(prompt)
    else:
        print("使用方式: claude -p \"pdca 任務描述\"")
        print("範例: claude -p \"pdca 建立用戶登入系統\"")

if __name__ == "__main__":
    main()