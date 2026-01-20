/**
 * 文件系统模块
 * 提供文件系统操作功能
 */
const fs = require('fs');
const path = require('path');
const { resolveWindowsEnv } = require('./system');

/**
 * 获取文件夹中的文件列表
 * @param {string} folderPath - 文件夹路径
 * @param {number} maxCount - 最大返回数量
 * @returns {Promise<Array>} 文件信息数组
 */
async function getFilesInFolder(folderPath, maxCount = 100) {
  try {
    const resolvedPath = resolveWindowsEnv(folderPath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn('Folder does not exist:', resolvedPath);
      return [];
    }

    // 读取目录
    const files = fs.readdirSync(resolvedPath);

    // 获取文件状态并进行排序
    const fileStats = files.map(file => {
      const fullPath = path.join(resolvedPath, file);
      try {
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          mtime: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      } catch (e) {
        return null; // 跳过无法获取状态的文件
      }
    }).filter(f => f !== null && !f.isDirectory && !f.name.startsWith('desktop.ini'));

    // 按修改时间倒序排列
    fileStats.sort((a, b) => b.mtime - a.mtime);

    // 截取到最大数量
    return fileStats.slice(0, maxCount);
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
}

module.exports = {
  getFilesInFolder
};
