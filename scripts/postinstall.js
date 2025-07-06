#!/usr/bin/env node

/**
 * PDCA-Shokunin Post-install Script
 * 安裝後自動設置
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🎌 PDCA-Shokunin 安裝後設置...\n');

// 檢查是否為全局安裝
const isGlobal = process.env.npm_config_global === 'true';

if (isGlobal) {
  console.log('✓ 檢測到全局安裝');
  console.log('✓ 命令 pdca-shokunin 已可在任何地方使用');
  
  // 提示設置 Claude 指令
  console.log('\n📌 設置 Claude CLI 斜線指令:');
  console.log('1. 在任意專案中執行: pdca-shokunin init');
  console.log('2. 這將在專案中創建 .claude/commands/pdca.md');
  console.log('3. 之後即可使用 /pdca "任務" 啟動系統');
} else {
  console.log('✓ 檢測到本地安裝');
  console.log('✓ 可使用 npx pdca-shokunin "任務" 啟動系統');
}

// 檢查系統需求
console.log('\n🔍 檢查系統需求...');

// 檢查 Python
const pythonVersion = checkCommand('python3 --version', /Python (\d+\.\d+)/);
if (pythonVersion) {
  const version = parseFloat(pythonVersion[1]);
  if (version >= 3.8) {
    console.log(`✓ Python ${pythonVersion[1]}`);
  } else {
    console.log(`⚠ Python ${pythonVersion[1]} (建議 3.8+)`);
  }
} else {
  console.log('❌ Python 3 未安裝');
}

// 檢查 tmux
const tmuxVersion = checkCommand('tmux -V', /tmux (\d+\.\d+)/);
if (tmuxVersion) {
  console.log(`✓ tmux ${tmuxVersion[1]}`);
} else {
  console.log('❌ tmux 未安裝');
  console.log('  macOS: brew install tmux');
  console.log('  Ubuntu: sudo apt install tmux');
}

// 檢查 Claude CLI
const claudeInstalled = checkCommand('claude --version');
if (claudeInstalled) {
  console.log('✓ Claude CLI');
} else {
  console.log('⚠ Claude CLI 未安裝');
  console.log('  參考: https://docs.anthropic.com/claude/docs/claude-code');
}

console.log('\n✨ 安裝完成！');
console.log('\n使用方法:');
console.log('  全局: pdca-shokunin "你的任務"');
console.log('  本地: npx pdca-shokunin "你的任務"');
console.log('  初始化: pdca-shokunin init');
console.log('\n詳細文檔: https://github.com/raiyyang/pdca-shokunin');

/**
 * 檢查命令是否存在
 */
function checkCommand(command, pattern) {
  try {
    const result = require('child_process').execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (pattern) {
      return result.match(pattern);
    }
    return true;
  } catch (e) {
    return false;
  }
}