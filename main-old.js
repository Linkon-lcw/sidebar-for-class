const { app, BrowserWindow, screen, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { getExePathFromProtocol, getSystemVolume, setSystemVolume } = require('./main-utils');

const isDev = !app.isPackaged;

let mainWindow;
let settingsWindow = null; // 设置窗口


function getIsAdmin() {
  try {
    const { execSync } = require('child_process');
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function getConfigSync() {
  const configPath = path.join(__dirname, 'data', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('解析配置文件失败:', e);
    }
  }
  return { widgets: [], transforms: { display: 0, height: 64, posy: 0 } };
}

let config = getConfigSync();

function createWindow() {
  const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
  const displays = screen.getAllDisplays();
  const targetDisplay = (transforms.display < displays.length)
    ? displays[transforms.display]
    : screen.getPrimaryDisplay();

  const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;
  const initialHeight = 100;
  let yPos = screenY + transforms.posy - (initialHeight / 2);

  if (yPos < screenY) yPos = screenY;
  else if (yPos + initialHeight > screenY + screenHeight) yPos = screenY + screenHeight - initialHeight;

  mainWindow = new BrowserWindow({
    width: 20, height: initialHeight, x: screenX, y: yPos,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, movable: false, resizable: false, hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true);

  // 这里的 flag 控制是否强制置顶。
  // 当拖拽文件时，我们暂时取消置顶，以便让操作系统的拖拽缩略图能显示在窗口之上
  let shouldAlwaysOnTop = true;

  const topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else clearInterval(topInterval);
  }, 200);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/index.html');
  } else {
    mainWindow.loadFile('index.html');
  }
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('blur', () => {
    if (shouldAlwaysOnTop) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  ipcMain.on('set-always-on-top', (event, flag) => {
    shouldAlwaysOnTop = flag;
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(flag, 'screen-saver');
    }
  });
}

ipcMain.on('resize-window', (event, width, height, y) => {
  if (mainWindow) {
    const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length) ? displays[transforms.display] : screen.getPrimaryDisplay();
    const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;

    let newY = (typeof y === 'number') ? y : Math.floor(screenY + transforms.posy - height / 2);
    if (newY < screenY) newY = screenY;
    else if (newY + height > screenY + screenHeight) newY = screenY + screenHeight - height;

    let newX = screenX;
    if (newX + width > screenX + screenWidth) newX = screenX + screenWidth - width;

    mainWindow.setBounds({
      width: Math.floor(width), height: Math.floor(height),
      x: Math.floor(newX), y: Math.floor(newY)
    });
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore, forward) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, { forward: !!forward });
});

ipcMain.handle('get-config', async () => {
  config = getConfigSync();
  const displays = screen.getAllDisplays();
  const targetDisplay = (config.transforms?.display < displays.length) ? displays[config.transforms.display] : screen.getPrimaryDisplay();
  return { ...config, displayBounds: targetDisplay.bounds };
});

ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays();
});

ipcMain.on('update-config', (event, newConfig) => {
  const configPath = path.join(__dirname, 'data', 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4), 'utf8');
    config = newConfig;

    // 获取新的显示器边界信息
    const displays = screen.getAllDisplays();
    const targetDisplay = (config.transforms?.display < displays.length) ? displays[config.transforms.display] : screen.getPrimaryDisplay();
    const configWithBounds = { ...config, displayBounds: targetDisplay.bounds };

    // 通知渲染进程配置已更新
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config-updated', configWithBounds);
    }
  } catch (e) {
    console.error('保存配置文件失败:', e);
  }
});

ipcMain.on('preview-config', (event, newConfig) => {
  config = newConfig;

  // 获取新的显示器边界信息
  const displays = screen.getAllDisplays();
  const targetDisplay = (config.transforms?.display < displays.length) ? displays[config.transforms.display] : screen.getPrimaryDisplay();
  const configWithBounds = { ...config, displayBounds: targetDisplay.bounds };

  // 通知渲染进程配置已更新（用于实时预览）
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('config-updated', configWithBounds);
  }
});

ipcMain.on('launch-app', async (event, target, args) => {
  if (target.includes('://')) {
    shell.openExternal(target).catch(e => console.error('打开 URI 失败:', e));
    return;
  }

  // 如果没有参数，优先尝试用默认关联程序打开（支持打开各种文档、图片、快捷方式等）
  if (!args || args.length === 0) {
    // openPath 返回 Promise<string>，如果为空字符串则成功
    const error = await shell.openPath(target);
    if (error) {
      console.error('shell.openPath 失败, 尝试 spawn:', error);
      // 如果 openPath 失败，回退到 spawn 尝试（虽然对于非可执行文件 spawn 也很可能失败）
      spawn(target, args || [], { detached: true, stdio: 'ignore' }).unref();
    }
  } else {
    spawn(target, args, { detached: true, stdio: 'ignore' }).unref();
  }
});

ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    let resolvedPath = filePath;
    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);
      if (!resolvedPath) return null;
    } else if (!path.isAbsolute(filePath)) {
      try {
        const output = require('child_process').execSync(`where ${filePath}`, { encoding: 'utf8' });
        resolvedPath = output.split('\r\n')[0];
      } catch (e) { /* 回退到路径检查... */ }
    }
    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch (err) { return null; }
});

ipcMain.handle('get-volume', () => getSystemVolume());
ipcMain.on('set-volume', (e, val) => {
  console.log('[Main] Received set-volume request:', val);
  setSystemVolume(val);
});

ipcMain.on('execute-command', (event, command) => {
  const { exec } = require('child_process');
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
  });
});

function resolveWindowsEnv(pathStr) {
  if (!pathStr) return '';
  return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
}

ipcMain.handle('get-files-in-folder', async (event, folderPath, maxCount) => {
  try {
    const resolvedPath = resolveWindowsEnv(folderPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn('Folder does not exist:', resolvedPath);
      return [];
    }

    // 读取目录
    const files = fs.readdirSync(resolvedPath);

    // 按修改时间倒序排列，以便优先显示最近的项目
    // "Recent" 文件夹通常比较特殊，但 fs.readdir 仅提供文件名
    // 我们需要获取文件状态来进行排序
    const fileStats = files.map(file => {
      const fullPath = path.join(resolvedPath, file);
      try {
        const stats = fs.statSync(fullPath);
        return { name: file, path: fullPath, mtime: stats.mtime, isDirectory: stats.isDirectory() };
      } catch (e) {
        return null; // 跳过我们无法获取状态的文件
      }
    }).filter(f => f !== null && !f.isDirectory && !f.name.startsWith('desktop.ini')); // 过滤掉 desktop.ini 和目录（如果我们只需要文件）

    // 按时间倒序排列
    fileStats.sort((a, b) => b.mtime - a.mtime);

    // 截取到最大数量
    const result = fileStats.slice(0, maxCount || 100);

    return result;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
});

// 创建设置窗口
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
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // 加载设置页面（暂时先加载一个简单的HTML）
  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000/settings.html');
  } else {
    settingsWindow.loadFile('settings.html');
  }

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // 开发时可以打开开发者工具
  // settingsWindow.webContents.openDevTools();
}

// 监听打开设置窗口的请求
ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

// 显示桌面（模拟 Win+D）
ipcMain.on('show-desktop', () => {
  const { exec } = require('child_process');
  if (process.platform === 'win32') {
    exec('powershell -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"');
  }
});

// 任务视图（模拟 Win+Tab）
ipcMain.on('taskview', () => {
  const { exec } = require('child_process');
  if (process.platform === 'win32') {
    exec('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Keyboard {[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo); public const int KEYEVENTF_KEYUP = 0x0002; public const int VK_LWIN = 0x5B; public const int VK_TAB = 0x09;}\'; [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, 0, 0); [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, 0, 0); Start-Sleep -Milliseconds 50; [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, [Keyboard]::KEYEVENTF_KEYUP, 0); [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, [Keyboard]::KEYEVENTF_KEYUP, 0)"');
  }
});

// 截图
ipcMain.handle('screenshot', async () => {
  const screenshot = require('screenshot-desktop');
  const sharp = require('sharp');
  const os = require('os');
  const notifier = require('node-notifier');

  try {
    // 获取用户桌面路径
    const desktopPath = path.join(os.homedir(), 'Desktop');

    // 生成时间戳文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join(desktopPath, filename);

    // 等待一小段时间，让渲染进程完成收起动画
    await new Promise(resolve => setTimeout(resolve, 400));

    // 获取所有显示器
    const displays = await screenshot.listDisplays();
    console.log('Found displays:', displays);

    // 截取所有屏幕（返回的是 Buffer 数组）
    const images = await screenshot.all();

    if (!images || images.length === 0) {
      throw new Error('No screenshots captured');
    }

    // 如果只有一个显示器，直接保存
    if (images.length === 1) {
      fs.writeFileSync(filepath, images[0]);
    } else {
      // 计算所有显示器的总边界
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      displays.forEach(display => {
        minX = Math.min(minX, display.left);
        minY = Math.min(minY, display.top);
        maxX = Math.max(maxX, display.right);
        maxY = Math.max(maxY, display.bottom);
      });

      const totalWidth = maxX - minX;
      const totalHeight = maxY - minY;

      console.log('Total canvas size:', totalWidth, 'x', totalHeight);

      // 创建画布并合并所有截图
      const compositeOperations = [];

      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        const image = images[i];

        // 计算相对于总边界的偏移量
        const offsetX = display.left - minX;
        const offsetY = display.top - minY;

        compositeOperations.push({
          input: image,
          left: offsetX,
          top: offsetY
        });
      }

      // 创建画布并合并所有图片
      await sharp({
        create: {
          width: totalWidth,
          height: totalHeight,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      })
        .composite(compositeOperations)
        .png()
        .toFile(filepath);
    }

    // 验证文件是否创建成功
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log('Screenshot saved to:', filepath, 'Size:', stats.size, 'bytes');

      // 显示 Windows 系统通知
      notifier.notify({
        title: '截图成功',
        message: `已保存到: ${filename}`,
        icon: undefined,
        sound: true,
        wait: false
      });

      return filepath;
    } else {
      throw new Error('Screenshot file not created');
    }
  } catch (err) {
    console.error('Screenshot error:', err);

    // 截图失败时也显示通知
    notifier.notify({
      title: '截图失败',
      message: err.message || '截图过程中发生错误',
      icon: undefined,
      sound: true,
      wait: false
    });

    throw err;
  }
});


app.whenReady().then(() => {
  createWindow();

  // 监听显示器变化
  const updateDisplays = () => {
    const displays = screen.getAllDisplays();
    // 通知主窗口
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('displays-updated', displays);
    }
    // 通知设置窗口
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('displays-updated', displays);
    }
  };

  screen.on('display-added', updateDisplays);
  screen.on('display-removed', updateDisplays);
  screen.on('display-metrics-changed', updateDisplays);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
