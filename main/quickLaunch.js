/**
 * 快速启动模块
 * 负责从开始菜单获取快捷方式并解析
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { resolveWindowsEnv } = require('./system');

const execAsync = util.promisify(exec);

// 缓存开始菜单项
let startMenuCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

/**
 * 获取开始菜单目录路径
 * @returns {string[]} 开始菜单目录路径数组
 */
function getStartMenuPaths() {
    const paths = [];

    // 系统开始菜单
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    paths.push(path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));

    // 用户开始菜单
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
    paths.push(path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));

    return paths.filter(p => fs.existsSync(p));
}

/**
 * 递归获取目录中的所有 .lnk 文件
 * @param {string} dir - 目录路径
 * @param {number} maxDepth - 最大递归深度
 * @returns {string[]} .lnk 文件路径数组
 */
function getLnkFiles(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    const lnkFiles = [];

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 递归子目录
                lnkFiles.push(...getLnkFiles(fullPath, maxDepth, currentDepth + 1));
            } else if (stat.isFile() && item.toLowerCase().endsWith('.lnk')) {
                lnkFiles.push(fullPath);
            }
        }
    } catch (err) {
        console.error('读取目录失败:', dir, err.message);
    }

    return lnkFiles;
}

/**
 * 使用 PowerShell 解析快捷方式
 * @param {string} lnkPath - 快捷方式路径
 * @returns {Promise<Object|null>} 解析结果
 */
async function parseShortcut(lnkPath) {
    try {
        // 使用 PowerShell 解析快捷方式
        const psScript = `
            $shell = New-Object -ComObject WScript.Shell
            $shortcut = $shell.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
            Write-Output $shortcut.TargetPath
            Write-Output $shortcut.WorkingDirectory
            Write-Output $shortcut.Arguments
            Write-Output $shortcut.IconLocation
        `;

        const { stdout } = await execAsync(`powershell -Command "${psScript.replace(/"/g, '\"')}"`, {
            timeout: 10000,
            encoding: 'utf8'
        });

        const lines = stdout.trim().split('\r\n').filter(line => line.trim());

        if (lines.length >= 1) {
            const targetPath = lines[0].trim();
            const workingDir = lines[1] || '';
            const args = lines[2] || '';
            const iconLocation = lines[3] || '';

            // 如果目标路径为空，跳过
            if (!targetPath) {
                return null;
            }

            // 获取显示名称（去掉 .lnk 扩展名）
            const displayName = path.basename(lnkPath, '.lnk');

            return {
                name: displayName,
                target: targetPath,
                args: args,
                workingDir: workingDir,
                iconLocation: iconLocation,
                lnkPath: lnkPath
            };
        }

        return null;
    } catch (err) {
        console.error('解析快捷方式失败:', lnkPath, err.message);
        return null;
    }
}

/**
 * 获取应用图标
 * @param {string} targetPath - 应用路径
 * @param {Electron.App} app - Electron app 实例
 * @returns {Promise<string|null>} 图标的 Data URL
 */
async function getAppIcon(targetPath, app) {
    try {
        // 检查文件是否存在
        if (!fs.existsSync(targetPath)) {
            return null;
        }

        const icon = await app.getFileIcon(targetPath, { size: 'large' });
        return icon.toDataURL();
    } catch (err) {
        return null;
    }
}

/**
 * 扫描开始菜单并解析所有快捷方式
 * @param {Electron.App} app - Electron app 实例
 * @param {boolean} forceRefresh - 是否强制刷新缓存
 * @returns {Promise<Array>} 应用列表
 */
async function scanStartMenu(app, forceRefresh = false) {
    // 检查缓存
    if (!forceRefresh && startMenuCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        console.log('[QuickLaunch] 使用缓存的开始菜单数据');
        return startMenuCache;
    }

    console.log('[QuickLaunch] 开始扫描开始菜单...');

    const startMenuPaths = getStartMenuPaths();
    const allLnkFiles = [];

    // 收集所有 .lnk 文件
    for (const menuPath of startMenuPaths) {
        const lnkFiles = getLnkFiles(menuPath);
        allLnkFiles.push(...lnkFiles);
    }

    console.log(`[QuickLaunch] 找到 ${allLnkFiles.length} 个快捷方式`);

    // 解析所有快捷方式
    const apps = [];
    const seenTargets = new Set(); // 用于去重

    for (const lnkPath of allLnkFiles) {
        try {
            const shortcut = await parseShortcut(lnkPath);

            if (shortcut && shortcut.target) {
                // 跳过重复的目标
                if (seenTargets.has(shortcut.target.toLowerCase())) {
                    continue;
                }
                seenTargets.add(shortcut.target.toLowerCase());

                // 获取图标
                const icon = await getAppIcon(shortcut.target, app);

                apps.push({
                    name: shortcut.name,
                    target: shortcut.target,
                    args: shortcut.args,
                    icon: icon,
                    lnkPath: shortcut.lnkPath
                });
            }
        } catch (err) {
            console.error('处理快捷方式失败:', lnkPath, err.message);
        }
    }

    // 按名称排序
    apps.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

    console.log(`[QuickLaunch] 成功解析 ${apps.length} 个应用`);

    // 更新缓存
    startMenuCache = apps;
    cacheTimestamp = Date.now();

    return apps;
}

/**
 * 获取开始菜单应用列表
 * @param {Electron.App} app - Electron app 实例
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<Array>} 应用列表
 */
async function getStartMenuItems(app, forceRefresh = false) {
    return await scanStartMenu(app, forceRefresh);
}

/**
 * 启动应用
 * @param {Object} appInfo - 应用信息
 */
async function launchStartMenuItem(appInfo) {
    const { spawn } = require('child_process');
    const { shell } = require('electron');

    if (!appInfo || !appInfo.target) {
        console.error('[QuickLaunch] 无效的应用信息');
        return;
    }

    try {
        // 如果有参数，使用 spawn
        if (appInfo.args) {
            spawn(appInfo.target, [appInfo.args], {
                detached: true,
                stdio: 'ignore',
                cwd: appInfo.workingDir || path.dirname(appInfo.target)
            }).unref();
        } else {
            // 否则使用 shell.openPath
            const error = await shell.openPath(appInfo.target);
            if (error) {
                console.error('[QuickLaunch] 启动失败:', error);
                // 回退到 spawn
                spawn(appInfo.target, [], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }
        }

        console.log('[QuickLaunch] 启动应用:', appInfo.name);
    } catch (err) {
        console.error('[QuickLaunch] 启动应用失败:', err);
    }
}

/**
 * 清除缓存
 */
function clearCache() {
    startMenuCache = null;
    cacheTimestamp = 0;
    console.log('[QuickLaunch] 缓存已清除');
}

module.exports = {
    getStartMenuItems,
    launchStartMenuItem,
    clearCache
};
