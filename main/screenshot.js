/**
 * 截图模块
 * 负责屏幕截图功能
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Notification } = require('electron');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

/**
 * 执行截图并保存到桌面
 * @returns {Promise<string>} 截图文件路径
 */
async function takeScreenshot() {
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
      const bounds = calculateTotalBounds(displays);
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;

      console.log('Total canvas size:', totalWidth, 'x', totalHeight);

      // 创建画布并合并所有截图
      await mergeScreenshots(images, displays, bounds, totalWidth, totalHeight, filepath);
    }

    // 验证文件是否创建成功
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log('Screenshot saved to:', filepath, 'Size:', stats.size, 'bytes');

      // 显示 Windows 系统通知
      showNotification('截图成功', `已保存到: ${filename}`);

      return filepath;
    } else {
      throw new Error('Screenshot file not created');
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    // 截图失败时也显示通知
    showNotification('截图失败', err.message || '截图过程中发生错误');
    throw err;
  }
}

/**
 * 计算所有显示器的总边界
 * @param {Array} displays - 显示器数组
 * @returns {Object} 边界对象 { minX, minY, maxX, maxY }
 */
function calculateTotalBounds(displays) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  displays.forEach(display => {
    minX = Math.min(minX, display.left);
    minY = Math.min(minY, display.top);
    maxX = Math.max(maxX, display.right);
    maxY = Math.max(maxY, display.bottom);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * 合并多个截图到一个文件
 * @param {Array<Buffer>} images - 截图 Buffer 数组
 * @param {Array} displays - 显示器数组
 * @param {Object} bounds - 边界对象
 * @param {number} totalWidth - 总宽度
 * @param {number} totalHeight - 总高度
 * @param {string} filepath - 输出文件路径
 */
async function mergeScreenshots(images, displays, bounds, totalWidth, totalHeight, filepath) {
  const { minX, minY } = bounds;
  
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

/**
 * 显示系统通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function showNotification(title, message) {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body: message,
      silent: false
    }).show();
  } else {
    console.log(`Notification: [${title}] ${message}`);
  }
}

module.exports = {
  takeScreenshot
};
