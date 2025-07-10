#!/usr/bin/env node

/**
 * 測試 PDCA 多代理系統
 */

import { PDCAOrchestratorV3 } from './dist/modes/shokunin/orchestrator-v3.js';

async function testSystem() {
  console.log('🧪 開始測試 PDCA 系統...\n');

  const orchestrator = new PDCAOrchestratorV3();

  // 監聽事件
  orchestrator.on('system-started', () => {
    console.log('✅ 系統啟動事件觸發');
  });

  orchestrator.on('progress-updated', (data) => {
    console.log(`📊 進度更新: ${data.agent} - ${data.progress}%`);
  });

  orchestrator.on('message-processed', (message) => {
    console.log(`📨 處理訊息: ${message.type} from ${message.from}`);
  });

  orchestrator.on('error', (error) => {
    console.error('❌ 錯誤:', error);
  });

  try {
    // 啟動系統
    console.log('1️⃣ 測試啟動系統...');
    await orchestrator.start();
    
    // 等待一下讓系統穩定
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 檢查狀態
    console.log('\n2️⃣ 測試系統狀態...');
    const status = orchestrator.getSystemStatus();
    console.log('代理數量:', status.agents.size);
    console.log('通訊統計:', status.communication);
    
    // 分配任務
    console.log('\n3️⃣ 測試任務分配...');
    await orchestrator.assignTask('測試任務：創建一個 Hello World 函數');
    
    // 等待一些處理
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 停止系統
    console.log('\n4️⃣ 測試停止系統...');
    await orchestrator.stop();
    
    console.log('\n✅ 測試完成！');
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error);
    process.exit(1);
  }
}

// 執行測試
testSystem().catch(console.error);