/**
 * 显示器管理模块
 * 负责显示器信息的获取和事件监听
 */
const { screen } = require('electron');

/**
 * 获取目标显示器
 * @param {number} displayIndex - 显示器索引
 * @returns {Display} 目标显示器对象
 */
function getTargetDisplay(displayIndex = 0) {
  const displays = screen.getAllDisplays();
  return (displayIndex < displays.length) 
    ? displays[displayIndex] 
    : screen.getPrimaryDisplay();
}

/**
 * 获取显示器的边界信息
 * @param {number} displayIndex - 显示器索引
 * @returns {Object} 显示器边界对象 { x, y, width, height }
 */
function getDisplayBounds(displayIndex = 0) {
  const targetDisplay = getTargetDisplay(displayIndex);
  return targetDisplay.bounds;
}

/**
 * 获取所有显示器
 * @returns {Array<Display>} 所有显示器数组
 */
function getAllDisplays() {
  return screen.getAllDisplays();
}

/**
 * 计算窗口的 Y 坐标，确保在屏幕范围内
 * @param {number} yPos - 初始 Y 坐标
 * @param {number} height - 窗口高度
 * @param {Object} screenBounds - 屏幕边界 { x, y, width, height }
 * @returns {number} 调整后的 Y 坐标
 */
function calculateWindowYPosition(yPos, height, screenBounds) {
  const { y: screenY, height: screenHeight } = screenBounds;
  
  if (yPos < screenY) return screenY;
  if (yPos + height > screenY + screenHeight) return screenY + screenHeight - height;
  return yPos;
}

/**
 * 计算窗口的 X 坐标，确保在屏幕范围内
 * @param {number} xPos - 初始 X 坐标
 * @param {number} width - 窗口宽度
 * @param {Object} screenBounds - 屏幕边界 { x, y, width, height }
 * @returns {number} 调整后的 X 坐标
 */
function calculateWindowXPosition(xPos, width, screenBounds) {
  const { x: screenX, width: screenWidth } = screenBounds;
  
  if (xPos + width > screenX + screenWidth) return screenX + screenWidth - width;
  return xPos;
}

module.exports = {
  getTargetDisplay,
  getDisplayBounds,
  getAllDisplays,
  calculateWindowYPosition,
  calculateWindowXPosition
};
