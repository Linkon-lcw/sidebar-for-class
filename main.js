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
  const topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      mainWindow.moveTop();
    } else clearInterval(topInterval);
  }, 200);

  mainWindow.loadFile('index.html');
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('blur', () => mainWindow.setAlwaysOnTop(true, 'screen-saver'));
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

ipcMain.on('launch-app', (event, target, args) => {
  if (target.includes('://')) {
    shell.openExternal(target).catch(e => console.error('打开 URI 失败:', e));
    return;
  }
  spawn(target, args, { detached: true, stdio: 'ignore' }).unref();
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
      } catch (e) { /* fallback to path check... */ }
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
