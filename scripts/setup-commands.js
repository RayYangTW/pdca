#!/usr/bin/env node

/**
 * PDCA 斜線指令設置腳本
 * 自動將 pdca 斜線指令安裝到用戶的全域 Claude 指令目錄
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CommandSetup {
  constructor(isGlobal = false) {
    this.isGlobal = isGlobal;
    this.homeDir = os.homedir();
    this.projectCommandsDir = path.join(process.cwd(), '.claude', 'commands');
    this.globalCommandsDir = path.join(this.homeDir, '.claude', 'commands');
    this.sourceCommandFile = path.resolve(__dirname, '..', '.claude', 'commands', 'pdca.md');
    
    // 根據模式決定目標路徑
    if (isGlobal) {
      this.targetCommandsDir = this.globalCommandsDir;
      this.targetCommandFile = path.join(this.globalCommandsDir, 'pdca.md');
    } else {
      this.targetCommandsDir = this.projectCommandsDir;
      this.targetCommandFile = path.join(this.projectCommandsDir, 'pdca.md');
    }
  }

  /**
   * 檢查並創建 .claude/commands 目錄
   */
  ensureCommandsDir() {
    try {
      if (!fs.existsSync(this.targetCommandsDir)) {
        fs.mkdirSync(this.targetCommandsDir, { recursive: true });
        console.log(`✅ 創建${this.isGlobal ? '全域' : '專案'}指令目錄: ${this.targetCommandsDir}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ 無法創建${this.isGlobal ? '全域' : '專案'}指令目錄: ${error.message}`);
      return false;
    }
  }

  /**
   * 檢查來源指令檔案是否存在
   */
  checkSourceCommand() {
    if (!fs.existsSync(this.sourceCommandFile)) {
      console.error(`❌ 找不到來源指令檔案: ${this.sourceCommandFile}`);
      return false;
    }
    return true;
  }

  /**
   * 檢查目標位置是否已有指令檔案
   */
  checkExistingCommand() {
    return fs.existsSync(this.targetCommandFile);
  }

  /**
   * 複製指令檔案到全域目錄
   */
  copyCommand(force = false) {
    try {
      if (this.checkExistingCommand() && !force) {
        console.log(`ℹ️  斜線指令已存在: ${this.targetCommandFile}`);
        console.log('   如需覆蓋，請使用 --force 參數');
        return false;
      }

      const content = fs.readFileSync(this.sourceCommandFile, 'utf-8');
      fs.writeFileSync(this.targetCommandFile, content, 'utf-8');
      
      console.log(`✅ 成功安裝斜線指令: ${this.targetCommandFile}`);
      return true;
    } catch (error) {
      console.error(`❌ 複製指令檔案失敗: ${error.message}`);
      return false;
    }
  }

  /**
   * 移除已安裝的斜線指令
   */
  removeCommand() {
    try {
      if (!this.checkExistingCommand()) {
        console.log('ℹ️  斜線指令不存在，無需移除');
        return true;
      }

      fs.unlinkSync(this.targetCommandFile);
      console.log(`✅ 成功移除斜線指令: ${this.targetCommandFile}`);
      return true;
    } catch (error) {
      console.error(`❌ 移除指令檔案失敗: ${error.message}`);
      return false;
    }
  }

  /**
   * 驗證安裝狀態
   */
  verifySetup() {
    console.log('\n🔍 PDCA 設置檢查:');
    
    // 檢查專案級
    const projectDir = path.join(process.cwd(), '.claude', 'commands');
    const projectCommand = path.join(projectDir, 'pdca.md');
    const projectDirExists = fs.existsSync(projectDir);
    const projectCommandExists = fs.existsSync(projectCommand);
    
    console.log('📁 專案級設置:');
    console.log(`   目錄: ${projectDir}`);
    console.log(`   ${projectDirExists ? '✅' : '❌'} 指令目錄存在`);
    console.log(`   ${projectCommandExists ? '✅' : '❌'} PDCA 斜線指令已安裝`);
    
    // 檢查全域級
    const globalCommandExists = fs.existsSync(path.join(this.globalCommandsDir, 'pdca.md'));
    console.log('\n📁 全域設置:');
    console.log(`   目錄: ${this.globalCommandsDir}`);
    console.log(`   ${globalCommandExists ? '✅' : '❌'} PDCA 斜線指令已安裝`);
    
    if (projectCommandExists) {
      console.log('\n🎉 專案設置完成！您可以在此專案中使用 /pdca "任務描述" 指令');
    }
    if (globalCommandExists) {
      console.log('🌍 全域設置完成！您可以在任何專案中使用 /pdca "任務描述" 指令');
    }
    if (!projectCommandExists && !globalCommandExists) {
      console.log('\n⚠️  請執行以下指令之一完成設置:');
      console.log('   pdca setup-commands          # 安裝到當前專案');
      console.log('   pdca setup-commands --global  # 安裝到全域');
    }
    
    return projectCommandExists || globalCommandExists;
  }

  /**
   * 執行完整安裝流程
   */
  install(force = false) {
    console.log('🎌 PDCA 斜線指令安裝程式');
    console.log('=' .repeat(50));
    console.log(`📍 安裝模式: ${this.isGlobal ? '全域' : '專案級'}`);
    console.log(`📁 目標目錄: ${this.targetCommandsDir}`);

    // 檢查來源檔案
    if (!this.checkSourceCommand()) {
      return false;
    }

    // 確保目錄存在
    if (!this.ensureCommandsDir()) {
      return false;
    }

    // 複製指令檔案
    const success = this.copyCommand(force);
    
    if (success) {
      console.log('\n🎉 安裝完成！');
      if (this.isGlobal) {
        console.log('💡 現在您可以在任何專案的 Claude Code 中使用:');
      } else {
        console.log('💡 現在您可以在此專案的 Claude Code 中使用:');
      }
      console.log('   /pdca "您的任務描述"');
      console.log('\n📚 更多使用方式請參考: https://github.com/raiyyang/pdca');
    }

    return success;
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const isGlobal = args.includes('--global');
  const action = args.find(arg => !arg.startsWith('--'));
  
  const setup = new CommandSetup(isGlobal);

  switch (action) {
    case 'install':
      setup.install(force);
      break;
    case 'remove':
      setup.removeCommand();
      break;
    case 'verify':
      setup.verifySetup();
      break;
    case 'postinstall':
      // npm postinstall 專用
      console.log('\n💡 PDCA 安裝完成！');
      console.log('   若要使用斜線指令，請執行:');
      console.log('   pdca setup-commands          # 安裝到當前專案');
      console.log('   pdca setup-commands --global  # 安裝到全域');
      break;
    default:
      // 預設執行安裝
      setup.install(force);
  }
}

export default CommandSetup;