/**
 * 文件系统模块
 * 提供文件系统操作功能
 */
const fs = require('fs');
const path = require('path');
const { resolveWindowsEnv } = require('./system');
const { getDataDir } = require('./config');

/**
 * 获取文件夹中的文件列表
 * @param {string} folderPath - 文件夹路径
 * @param {number} maxCount - 最大返回数量
 * @returns {Promise<Array>} 文件信息数组
 */
async function getFilesInFolder(folderPath, maxCount = 100) {
  try {
    // 处理路径：如果是相对路径且不包含环境变量，则相对于数据目录
    let targetPath = folderPath || '.';
    if (!path.isAbsolute(targetPath) && !targetPath.includes('%')) {
       targetPath = path.join(getDataDir(), targetPath);
    }
    
    const resolvedPath = resolveWindowsEnv(targetPath);
    console.log('[FileSystem] Listing files in:', resolvedPath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn('[FileSystem] Folder does not exist:', resolvedPath);
      return [];
    }

    // 读取目录
    const files = fs.readdirSync(resolvedPath);
    console.log('[FileSystem] Found files:', files.length);

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

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
async function readFileContent(filePath) {
  try {
    // 允许使用数据目录的相对路径
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
       targetPath = path.join(getDataDir(), filePath);
    }
    
    const resolvedPath = resolveWindowsEnv(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    return fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
}

/**
 * 写入文件内容
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {Promise<boolean>} 是否成功
 */
async function writeFileContent(filePath, content) {
  try {
    // 允许使用数据目录的相对路径
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
       targetPath = path.join(getDataDir(), filePath);
       // 确保目录存在
       const dir = path.dirname(targetPath);
       if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
       }
    }

    const resolvedPath = resolveWindowsEnv(targetPath);
    fs.writeFileSync(resolvedPath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing file:', err);
    throw err;
  }
}

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否成功
 */
async function deleteFile(filePath) {
  try {
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
      targetPath = path.join(getDataDir(), filePath);
    }
    const resolvedPath = resolveWindowsEnv(targetPath);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting file:', err);
    throw err;
  }
}

/**
 * 重命名文件
 * @param {string} oldPath - 原文件路径
 * @param {string} newPath - 新文件路径
 * @returns {Promise<boolean>} 是否成功
 */
async function renameFile(oldPath, newPath) {
  try {
    let targetOldPath = oldPath;
    let targetNewPath = newPath;
    
    if (!path.isAbsolute(oldPath) && !oldPath.includes('%')) {
      targetOldPath = path.join(getDataDir(), oldPath);
    }
    if (!path.isAbsolute(newPath) && !newPath.includes('%')) {
      targetNewPath = path.join(getDataDir(), newPath);
    }

    const resolvedOldPath = resolveWindowsEnv(targetOldPath);
    const resolvedNewPath = resolveWindowsEnv(targetNewPath);

    if (fs.existsSync(resolvedOldPath)) {
      fs.renameSync(resolvedOldPath, resolvedNewPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error renaming file:', err);
    throw err;
  }
}

module.exports = {
  getFilesInFolder,
  readFileContent,
  writeFileContent,
  deleteFile,
  renameFile
};
