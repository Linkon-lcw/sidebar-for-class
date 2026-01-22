/**
 * 窗口管理模块
 * 负责主窗口和设置窗口的创建与管理
 */
const { BrowserWindow } = require('electron');
const path = require('path');
const { isDev } = require('./constants');
const { getTargetDisplay, calculateWindowYPosition, calculateWindowXPosition } = require('./display');
const { getConfigSync } = require('./config');

let mainWindow = null;
let settingsWindow = null;
let shouldAlwaysOnTop = true;
let topInterval = null;

/**
 * 创建主窗口
 * @returns {BrowserWindow} 主窗口实例
 */
function createWindow() {
  const config = getConfigSync();
  const transforms = config.transforms || { display: 0, height: 64, posy: 0, size: 100 };
  const scale = (transforms.size || 100) / 100;

  const targetDisplay = getTargetDisplay(transforms.display);
  const screenBounds = targetDisplay.bounds;

  // 采用与 useSidebarAnimation 一致的初步计算逻辑
  const initialWidth = Math.floor(20 * scale);
  const initialHeight = Math.ceil((transforms.height + 40) * scale);

  let yPos = screenBounds.y + transforms.posy - (initialHeight / 2);
  yPos = calculateWindowYPosition(yPos, initialHeight, screenBounds);

  const xPos = screenBounds.x;

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: xPos,
    y: yPos,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      experimentalFeatures: true,
    },
    // backgroundMaterial: 'acrylic',
  });

  mainWindow.setVisibleOnAllWorkspaces(true);

  // 定时保持窗口置顶
  startTopInterval();

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/index.html');
  } else {
    mainWindow.loadFile('index.html');
  }

  // 事件监听
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('blur', () => {
    if (shouldAlwaysOnTop) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
    // 通知渲染进程窗口失去焦点
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-blur');
    }
  });

  return mainWindow;
}

/**
 * 启动置顶定时器
 */
function startTopInterval() {
  topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else {
      clearInterval(topInterval);
    }
  }, 200);
}

/**
 * 获取主窗口实例
 * @returns {BrowserWindow|null} 主窗口实例
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * 获取设置窗口实例
 * @returns {BrowserWindow|null} 设置窗口实例
 */
function getSettingsWindow() {
  return settingsWindow;
}

/**
 * 设置窗口是否保持置顶
 * @param {boolean} flag - 是否置顶
 */
function setAlwaysOnTopFlag(flag) {
  shouldAlwaysOnTop = flag;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver');
  }
}

/**
 * 调整主窗口大小和位置
 * @param {number} width - 窗口宽度
 * @param {number} height - 窗口高度
 * @param {number|null} y - 窗口 Y 坐标（可选）
 * @param {Object|null} config - 配置对象（可选，如果不提供则从文件读取）
 */
function resizeMainWindow(width, height, y = null, config = null) {
  if (!mainWindow) return;

  const finalConfig = config || getConfigSync();
  const transforms = finalConfig.transforms || { display: 0, height: 64, posy: 0 };

  const targetDisplay = getTargetDisplay(transforms.display);
  const screenBounds = targetDisplay.bounds;

  const newY = (typeof y === 'number')
    ? y
    : Math.floor(screenBounds.y + transforms.posy - height / 2);

  const adjustedY = calculateWindowYPosition(newY, height, screenBounds);
  const adjustedX = calculateWindowXPosition(screenBounds.x, width, screenBounds);

  mainWindow.setBounds({
    width: Math.floor(width),
    height: Math.floor(height),
    x: Math.floor(adjustedX),
    y: Math.floor(adjustedY)
  });
}

/**
 * 设置窗口是否忽略鼠标事件
 * @param {boolean} ignore - 是否忽略
 * @param {boolean} forward - 是否转发
 */
function setIgnoreMouseEvents(ignore, forward = false) {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward });
  }
}

/**
 * 创建设置窗口
 */
function createSettingsWindow() {
  // 如果设置窗口已经存在，则聚焦它
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '设置',
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // 加载设置页面
  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000/settings.html');
  } else {
    settingsWindow.loadFile('settings.html');
  }

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * 通知所有窗口显示器已更新
 * @param {Array} displays - 显示器列表
 */
function notifyDisplaysUpdated(displays) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('displays-updated', displays);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('displays-updated', displays);
  }
}

module.exports = {
  createWindow,
  createSettingsWindow,
  getMainWindow,
  getSettingsWindow,
  setAlwaysOnTopFlag,
  resizeMainWindow,
  setIgnoreMouseEvents,
  notifyDisplaysUpdated
};
