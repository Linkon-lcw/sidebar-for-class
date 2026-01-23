/**
 * 系统功能模块
 * 提供系统级功能，如音量控制、显示桌面、任务视图等
 */
const { exec } = require('child_process');
const { getSystemVolume, setSystemVolume } = require('../main-utils');

/**
 * 检查是否以管理员身份运行
 * @returns {boolean} 是否具有管理员权限
 */
function getIsAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 解析 Windows 环境变量
 * @param {string} pathStr - 包含环境变量的路径
 * @returns {string} 解析后的路径
 */
function resolveWindowsEnv(pathStr) {
  if (!pathStr) return '';
  return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
}

/**
 * 获取系统音量
 * @returns {number} 音量值 0-100
 */
function getVolume() {
  return getSystemVolume();
}

/**
 * 设置系统音量
 * @param {number} val - 音量值 0-100
 */
function setVolume(val) {
  console.log('[Main] Received set-volume request:', val);
  setSystemVolume(val);
}

/**
 * 执行系统命令
 * @param {string} command - 要执行的命令
 */
function executeCommand(command) {
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
  });
}

/**
 * 显示桌面（模拟 Win+D）
 * 只在 Windows 平台有效
 */
function showDesktop() {
  if (process.platform === 'win32') {
    exec('powershell -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"');
  }
}

/**
 * 打开任务视图（模拟 Win+Tab）
 * 只在 Windows 平台有效
 */
function taskView() {
  if (process.platform === 'win32') {
    exec('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Keyboard {[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo); public const int KEYEVENTF_KEYUP = 0x0002; public const int VK_LWIN = 0x5B; public const int VK_TAB = 0x09;}\'; [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, 0, 0); [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, 0, 0); Start-Sleep -Milliseconds 50; [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, [Keyboard]::KEYEVENTF_KEYUP, 0); [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, [Keyboard]::KEYEVENTF_KEYUP, 0)"');
  }
}

/**
 * 关闭前台窗口
 * 优先关闭历史记录中非黑名单的最近激活窗口
 * 只在 Windows 平台有效
 */
function closeFrontWindow() {
  if (process.platform === 'win32') {
    const windowHistoryModule = require('./window-history');
    windowHistoryModule.closeLastActiveWindow().then(result => {
      console.log('[System] Close window result:', result);
      // if (!result.success) {
      //   console.log('[System] Falling back to Alt+F4 method');
      //   const vbscript = 'Set objShell = CreateObject("WScript.Shell"): objShell.SendKeys "%{F4}"';
      //   const tempFile = require('path').join(require('os').tmpdir(), 'close_window.vbs');
      //   require('fs').writeFileSync(tempFile, vbscript);
      //   exec(`wscript "${tempFile}"`);
      // }
    }).catch(error => {
      console.error('[System] Error closing window:', error);
      const vbscript = 'Set objShell = CreateObject("WScript.Shell"): objShell.SendKeys "%{F4}"';
      const tempFile = require('path').join(require('os').tmpdir(), 'close_window.vbs');
      require('fs').writeFileSync(tempFile, vbscript);
      exec(`wscript "${tempFile}"`);
    });
  }
}

module.exports = {
  getIsAdmin,
  resolveWindowsEnv,
  getVolume,
  setVolume,
  executeCommand,
  showDesktop,
  taskView,
  closeFrontWindow
};
