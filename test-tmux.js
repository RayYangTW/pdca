#!/usr/bin/env node

import { spawn } from 'child_process';

async function testTmuxCreation() {
  console.log('測試 tmux 創建...');
  
  // 1. 先清理
  const kill = spawn('tmux', ['kill-session', '-t', 'pdca-test'], { stdio: 'pipe' });
  await new Promise(resolve => {
    kill.on('close', () => resolve());
    kill.on('error', () => resolve());
  });
  
  // 2. 創建 session
  console.log('創建 tmux session...');
  const create = spawn('tmux', [
    'new-session', '-d', '-s', 'pdca-test', '-n', 'test',
    'echo "Hello from tmux"; sleep 5'
  ], { stdio: 'inherit' });
  
  await new Promise((resolve, reject) => {
    create.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Session 創建成功');
        resolve();
      } else {
        reject(new Error(`創建失敗，代碼: ${code}`));
      }
    });
    create.on('error', (err) => reject(err));
  });
  
  // 3. 列出 sessions
  console.log('\n當前 sessions:');
  const list = spawn('tmux', ['list-sessions'], { stdio: 'inherit' });
  await new Promise(resolve => list.on('close', resolve));
  
  // 4. 檢查內容
  console.log('\n捕獲窗口內容:');
  const capture = spawn('tmux', ['capture-pane', '-t', 'pdca-test:0', '-p'], { stdio: 'inherit' });
  await new Promise(resolve => capture.on('close', resolve));
  
  // 5. 清理
  console.log('\n清理 session...');
  const cleanup = spawn('tmux', ['kill-session', '-t', 'pdca-test'], { stdio: 'inherit' });
  await new Promise(resolve => cleanup.on('close', resolve));
  
  console.log('✅ 測試完成');
}

testTmuxCreation().catch(console.error);