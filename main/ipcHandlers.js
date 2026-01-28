/**
 * IPC 处理器注册模块
 * 集中注册所有 IPC 处理器
 */
const { ipcMain } = require('electron');
const { app } = require('electron');
const { screen } = require('electron');
const { getConfigSync, updateConfig, previewConfig } = require('./config');
const { getAllDisplays } = require('./display');
const { getMainWindow, createSettingsWindow, setAlwaysOnTopFlag, resizeMainWindow, setIgnoreMouseEvents, notifyDisplaysUpdated, blurMainWindow } = require('./window');
const { getVolume, setVolume, executeCommand, showDesktop, taskView, closeFrontWindow } = require('./system');
const { launchApp, getFileIcon } = require('./launcher');
const { getFilesInFolder } = require('./fileSystem');
const { takeScreenshot } = require('./screenshot');
const { getStartMenuItems, launchStartMenuItem } = require('./quickLaunch');

/**
 * 注册所有 IPC 处理器
 */
function registerIPCHandlers() {
  // ===== 窗口管理 =====

  ipcMain.on('resize-window', (event, width, height, y) => {
    resizeMainWindow(width, height, y);
  });

  ipcMain.on('set-ignore-mouse', (event, ignore, forward) => {
    setIgnoreMouseEvents(ignore, forward);
  });

  ipcMain.on('set-always-on-top', (event, flag) => {
    setAlwaysOnTopFlag(flag);
  });

  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });

  // ===== 配置管理 =====

  ipcMain.handle('get-config', async () => {
    const config = getConfigSync();
    const displays = getAllDisplays();
    const targetDisplay = (config.transforms?.display < displays.length)
      ? displays[config.transforms.display]
      : screen.getPrimaryDisplay();
    return { ...config, displayBounds: targetDisplay.bounds };
  });

  ipcMain.on('update-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    updateConfig(newConfig, { screen, mainWindow });

    // 同时更新窗口位置
    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    // 采用与 useSidebarAnimation 一致的计算逻辑
    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    // 调用窗口位置更新函数，传入配置对象
    resizeMainWindow(winW, winH, yPos, newConfig);
  });

  ipcMain.on('preview-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    previewConfig(newConfig, { screen, mainWindow });

    // 同时更新窗口位置
    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    // 采用与 useSidebarAnimation 一致的计算逻辑
    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    // 调用窗口位置更新函数，传入配置对象
    resizeMainWindow(winW, winH, yPos, newConfig);
  });

  // ===== 显示器管理 =====

  ipcMain.handle('get-displays', () => {
    return getAllDisplays();
  });

  // ===== 系统功能 =====

  ipcMain.handle('get-volume', () => getVolume());

  ipcMain.on('set-volume', (e, val) => {
    setVolume(val);
  });

  ipcMain.on('execute-command', (event, command) => {
    executeCommand(command);
  });

  ipcMain.on('show-desktop', () => {
    showDesktop();
  });

  ipcMain.on('taskview', () => {
    taskView();
  });

  ipcMain.on('close-front-window', () => {
    closeFrontWindow();
  });

  ipcMain.on('blur-and-close-front-window', () => {
    blurMainWindow();
    closeFrontWindow();
  });

  // ===== 应用启动 =====

  ipcMain.on('launch-app', async (event, target, args) => {
    await launchApp(target, args);
  });

  ipcMain.handle('get-file-icon', async (event, filePath) => {
    return await getFileIcon(filePath, app);
  });

  // ===== 文件系统 =====

  ipcMain.handle('get-files-in-folder', async (event, folderPath, maxCount) => {
    return await getFilesInFolder(folderPath, maxCount);
  });

  // ===== 截图 =====

  ipcMain.handle('screenshot', async () => {
    return await takeScreenshot();
  });

  // ===== 快速启动 =====

  ipcMain.handle('get-start-menu-items', async () => {
    return await getStartMenuItems(app);
  });

  ipcMain.on('launch-start-menu-item', (event, appInfo) => {
    launchStartMenuItem(appInfo);
  });
}

/**
 * 注册显示器事件监听器
 */
function registerDisplayEventListeners() {
  const updateDisplays = () => {
    const displays = getAllDisplays();
    notifyDisplaysUpdated(displays);
  };

  screen.on('display-added', updateDisplays);
  screen.on('display-removed', updateDisplays);
  screen.on('display-metrics-changed', updateDisplays);
}

module.exports = {
  registerIPCHandlers,
  registerDisplayEventListeners
};
