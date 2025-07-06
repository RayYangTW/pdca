#!/usr/bin/env node

/**
 * PDCA-Shokunin Setup Script
 * 在當前專案初始化 PDCA-Shokunin
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const force = process.argv.includes('--force');

console.log('🎌 初始化 PDCA-Shokunin...\n');

// 1. 創建目錄結構
console.log('📁 創建目錄結構...');
const dirs = [
  '.pdca-shokunin',
  '.claude/commands',
  'memories/decisions',
  'memories/solutions',
  'memories/patterns',
  'memories/learnings',
  'memories/progress',
  'memories/logs',
  'memories/short_term',
  'memories/long_term'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ ${dir}`);
  } else if (force) {
    console.log(`  → ${dir} (已存在)`);
  }
});

// 2. 複製核心檔案
console.log('\n📥 複製核心檔案...');
const sourceBase = path.join(__dirname, '..');
const targetBase = process.cwd();

// 複製 launcher.py 和 monitor.py
const coreFiles = [
  '.pdca-shokunin/launcher.py',
  '.pdca-shokunin/monitor.py',
  '.pdca-shokunin/config.template.json'
];

coreFiles.forEach(file => {
  const source = path.join(sourceBase, file);
  const target = path.join(targetBase, file);
  
  if (fs.existsSync(source)) {
    if (!fs.existsSync(target) || force) {
      fs.copyFileSync(source, target);
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  → ${file} (已存在，使用 --force 覆蓋)`);
    }
  }
});

// 3. 創建 Claude 指令
console.log('\n⚙️ 設置 Claude 斜線指令...');
const pdcaCommand = `# PDCA-Shokunin Multi-Agent System

啟動 PDCA 職人級多代理協調系統處理任務：**$ARGUMENTS**

## 🎌 系統啟動

\`\`\`bash
python3 .pdca-shokunin/launcher.py "$ARGUMENTS"
\`\`\`

這將創建真正的多代理非同步協作環境：

### 🔄 PDCA 循環代理
- 🎯 **pdca-plan**: Plan 階段協調者 - 需求分析、策略制定、任務協調
- 🎨 **pdca-do**: Do 階段執行者 - 架構設計、功能實作、代碼開發
- 🔍 **pdca-check**: Check 階段驗證者 - 品質驗證、測試檢查、結果評估
- 🚀 **pdca-act**: Act 階段改善者 - 性能優化、問題改善、持續改進

### 📝 知識管理代理
- **knowledge-agent**: 專職記錄和知識管理 - 智能監聽、分類歸檔、經驗累積

## 🛠️ 技術架構

- **tmux session**: 5 個獨立 Claude 實例並行運作
- **git worktree**: 代理工作空間完全隔離
- **實時 TUI**: 監控介面顯示所有代理狀態
- **智能通訊**: 文件系統協調代理間協作

## 🎯 職人承諾

- **一鍵啟動**: 零配置即用
- **真正並行**: 5 個獨立 AI 代理同時工作  
- **隨時介入**: 實時查看和指導任一代理
- **工匠品質**: 每個細節都追求完美

---

**正在啟動 PDCA-Shokunin 系統...**`;

const commandFile = path.join(targetBase, '.claude/commands/pdca.md');
if (!fs.existsSync(commandFile) || force) {
  fs.writeFileSync(commandFile, pdcaCommand);
  console.log('  ✓ .claude/commands/pdca.md');
}

// 4. 創建權限設置
const settings = {
  permissions: {
    allow: [
      "Bash(python:*)",
      "Bash(mv:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "Bash(tmux:*)"
    ],
    deny: []
  }
};

const settingsFile = path.join(targetBase, '.claude/settings.local.json');
if (!fs.existsSync(settingsFile) || force) {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  console.log('  ✓ .claude/settings.local.json');
}

// 5. 創建 project.md
console.log('\n📝 創建記憶檔案...');
const projectMd = `# 🎌 PDCA-Shokunin Project Context

**專案名稱**: ${path.basename(process.cwd())}
**初始化日期**: ${new Date().toISOString().split('T')[0]}
**系統版本**: PDCA-Shokunin v3.0

## 📋 專案概要

此專案已配置 PDCA-Shokunin 多代理協調系統。

## 🚀 快速開始

\`\`\`bash
# 使用 npm 命令
pdca-shokunin "你的任務描述"

# 或使用 Claude CLI
/pdca "你的任務描述"

# 或直接執行
python3 .pdca-shokunin/launcher.py "你的任務描述"
\`\`\`

## 📝 記憶體結構

- \`decisions/\` - 決策記錄
- \`solutions/\` - 解決方案
- \`patterns/\` - 設計模式
- \`learnings/\` - 經驗教訓
- \`progress/\` - 進度追蹤

---`;

const projectFile = path.join(targetBase, 'memories/project.md');
if (!fs.existsSync(projectFile) || force) {
  fs.writeFileSync(projectFile, projectMd);
  console.log('  ✓ memories/project.md');
}

// 6. 創建快速啟動腳本
console.log('\n🚀 創建快速啟動腳本...');
const quickStart = `#!/bin/bash
# PDCA-Shokunin 快速啟動腳本

if [ $# -eq 0 ]; then
    echo "使用方式: ./pdca \\"任務描述\\""
    echo "範例: ./pdca \\"建立用戶登入系統\\""
    exit 1
fi

# 優先使用 npm 全局命令
if command -v pdca-shokunin &> /dev/null; then
    pdca-shokunin "$@"
# 其次使用本地 npx
elif [ -f "node_modules/.bin/pdca-shokunin" ]; then
    npx pdca-shokunin "$@"
# 最後直接執行 Python
else
    python3 .pdca-shokunin/launcher.py "$@"
fi`;

const quickStartFile = path.join(targetBase, 'pdca');
fs.writeFileSync(quickStartFile, quickStart);
fs.chmodSync(quickStartFile, '755');
console.log('  ✓ ./pdca (快速啟動腳本)');

// 完成
console.log('\n✅ 初始化完成！');
console.log('\n現在可以使用:');
console.log('  1. pdca-shokunin "任務"');
console.log('  2. /pdca "任務" (在 Claude CLI 中)');
console.log('  3. ./pdca "任務"');

// 如果是 git 倉庫，提醒添加 .gitignore
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  console.log('\n💡 提示: 建議將以下內容加入 .gitignore:');
  console.log('  .pdca-shokunin/worktrees/');
  console.log('  .pdca-shokunin/communication/');
  console.log('  .pdca-shokunin/logs/');
  console.log('  .pdca-shokunin/current_task.json');
} catch (e) {
  // 不是 git 倉庫，忽略
}