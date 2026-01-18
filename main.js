/**
 * 主进程入口文件
 * Electron 应用主进程
 */
const { app } = require('electron');
const { createWindow } = require('./main/window');
const { registerIPCHandlers, registerDisplayEventListeners } = require('./main/ipcHandlers');

// 应用就绪后执行
app.whenReady().then(() => {
  // 创建主窗口
  createWindow();

  // 注册所有 IPC 处理器
  registerIPCHandlers();

  // 注册显示器事件监听器
  registerDisplayEventListeners();
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 特定：点击 dock 图标时重新创建窗口
app.on('activate', () => {
  const { getMainWindow } = require('./main/window');
  if (!getMainWindow()) {
    createWindow();
  }
});
