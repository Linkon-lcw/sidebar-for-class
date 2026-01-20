/**
 * 应用启动模块
 * 负责应用和URL的启动逻辑
 */
const { spawn } = require('child_process');
const { shell } = require('electron');
const path = require('path');
const { getExePathFromProtocol } = require('../main-utils');

/**
 * 启动应用或URL
 * @param {string} target - 目标路径或URL
 * @param {Array<string>} args - 命令行参数
 */
async function launchApp(target, args = []) {
  // 如果是URL
  if (target.includes('://')) {
    try {
      await shell.openExternal(target);
    } catch (e) {
      console.error('打开 URI 失败:', e);
    }
    return;
  }

  // 如果没有参数，优先尝试用默认关联程序打开
  if (!args || args.length === 0) {
    const error = await shell.openPath(target);
    if (error) {
      console.error('shell.openPath 失败, 尝试 spawn:', error);
      // 如果 openPath 失败，回退到 spawn 尝试
      spawn(target, [], { detached: true, stdio: 'ignore' }).unref();
    }
  } else {
    spawn(target, args, { detached: true, stdio: 'ignore' }).unref();
  }
}

/**
 * 获取文件图标
 * @param {string} filePath - 文件路径
 * @param {Electron.App} app - Electron app 实例
 * @returns {Promise<string|null>} 图标的 Data URL，失败返回 null
 */
async function getFileIcon(filePath, app) {
  try {
    let resolvedPath = filePath;
    
    // 如果是协议路径
    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);
      if (!resolvedPath) return null;
    } else if (!path.isAbsolute(filePath)) {
      // 如果是相对路径，尝试查找
      try {
        const { execSync } = require('child_process');
        const output = execSync(`where ${filePath}`, { encoding: 'utf8' });
        resolvedPath = output.split('\r\n')[0];
      } catch (e) {
        // 回退到路径检查
      }
    }
    
    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch (err) {
    return null;
  }
}

module.exports = {
  launchApp,
  getFileIcon
};
