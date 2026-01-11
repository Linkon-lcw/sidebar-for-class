const { app, BrowserWindow, screen, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { getExePathFromProtocol, getSystemVolume, setSystemVolume } = require('./main-utils');

let mainWindow;

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

  mainWindow.loadFile('index.html');
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
