/**
 * 自动化管理模块
 * 负责处理自动化脚本的执行
 */
const path = require('path');
const { spawn } = require('child_process');
const { shell } = require('electron');
const { getConfigSync, getDataDir } = require('./config');

/**
 * 运行启动脚本
 * 遍历配置中的 automatic 列表，执行 on 包含 'startup' 的脚本
 */
async function runStartupScripts() {
  try {
    const config = getConfigSync();
    const automatic = config.automatic || [];
    const dataDir = getDataDir();

    console.log('[Automation] Checking for startup scripts...');

    for (const item of automatic) {
      // 检查是否需要在启动时运行
      if (item.on && Array.isArray(item.on) && item.on.includes('startup') && item.script) {
        let scriptPath = item.script;
        
        // 如果不是绝对路径且不是 URL，则相对于 data 目录解析
        if (!path.isAbsolute(scriptPath) && !scriptPath.includes('://')) {
          scriptPath = path.join(dataDir, scriptPath);
        }

        console.log(`[Automation] Executing startup script: ${scriptPath}`);
        
        try {
          if (scriptPath.includes('://')) {
            await shell.openExternal(scriptPath);
          } else {
            // 使用 spawn 并设置 windowsHide: true 以静默运行
            const child = spawn(scriptPath, item.args || [], {
              detached: true,
              stdio: 'ignore',
              shell: true,
              windowsHide: true
            });
            child.unref();
          }
        } catch (e) {
          console.error(`[Automation] Failed to execute script ${scriptPath}:`, e);
        }
      }
    }
  } catch (err) {
    console.error('[Automation] Error in runStartupScripts:', err);
  }
}

module.exports = {
  runStartupScripts
};
