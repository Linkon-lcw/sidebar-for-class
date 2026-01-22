/**
 * 配置管理模块
 * 负责配置文件的读取、更新和预览
 */
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

/**
 * 同步读取配置文件
 * @returns {Object} 配置对象
 */
function getConfigSync() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('解析配置文件失败:', e);
    }
  }
  return { widgets: [], transforms: { display: 0, height: 64, posy: 0 } };
}

/**
 * 更新配置文件
 * @param {Object} newConfig - 新的配置对象
 * @param {Object} dependencies - 依赖对象 { screen, mainWindow }
 * @returns {Object} 包含显示器边界的配置对象
 */
function updateConfig(newConfig, dependencies = {}) {
  const { screen, mainWindow } = dependencies;
  
  try {
    const { displayBounds, ...configToSave } = newConfig;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 4), 'utf8');
    
    const displays = screen.getAllDisplays();
    const targetDisplay = (newConfig.transforms?.display < displays.length) 
      ? displays[newConfig.transforms.display] 
      : screen.getPrimaryDisplay();
    const configWithBounds = { ...newConfig, displayBounds: targetDisplay.bounds };

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config-updated', configWithBounds);
    }

    return configWithBounds;
  } catch (e) {
    console.error('保存配置文件失败:', e);
    throw e;
  }
}

/**
 * 预览配置（不保存到文件）
 * @param {Object} newConfig - 预览的配置对象
 * @param {Object} dependencies - 依赖对象 { screen, mainWindow }
 * @returns {Object} 包含显示器边界的配置对象
 */
function previewConfig(newConfig, dependencies = {}) {
  const { screen, mainWindow } = dependencies;
  
  // 获取新的显示器边界信息
  const displays = screen.getAllDisplays();
  const targetDisplay = (newConfig.transforms?.display < displays.length) 
    ? displays[newConfig.transforms.display] 
    : screen.getPrimaryDisplay();
  const configWithBounds = { ...newConfig, displayBounds: targetDisplay.bounds };

  // 通知渲染进程配置已更新（用于实时预览）
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('config-updated', configWithBounds);
  }

  return configWithBounds;
}

module.exports = {
  getConfigSync,
  updateConfig,
  previewConfig
};
