/**
 * 窗口杀手模块
 * 负责定期检查并关闭特定的同类软件窗口
 */
const { getConfigSync } = require('./config');
const { findWindowsByTitleKeywords, closeWindowByHwnd, killProcessByPid } = require('./window-history');

// 需要查杀的窗口标题关键字列表
const TARGET_TITLE_KEYWORDS = [
    'EasiSideBar'
];

let checkInterval = null;

/**
 * 执行查杀逻辑
 */
async function performKill() {
    try {
        const config = getConfigSync();
        
        // 检查配置是否开启
        if (!config.helper_tools?.auto_kill_similar) {
            return;
        }

        console.log(`[Killer] 正在扫描以下窗口: ${TARGET_TITLE_KEYWORDS.join(', ')}`);

        // 查找匹配的窗口句柄和 PID
        const items = await findWindowsByTitleKeywords(TARGET_TITLE_KEYWORDS);
        
        if (items && items.length > 0) {
            console.log(`[Killer] Found ${items.length} matching windows. Force closing processes...`);
            const killedPids = new Set();
            for (const item of items) {
                const [hwnd, pid] = item.split(':');
                if (pid && !killedPids.has(pid)) {
                    console.log(`[Killer] Force killing process ${pid} (Window HWND: ${hwnd})`);
                    await killProcessByPid(pid);
                    killedPids.add(pid);
                }
            }
        }
    } catch (err) {
        console.error('[Killer] Error during performKill:', err);
    }
}

/**
 * 启动自动查杀
 * @param {number} intervalMs 检查间隔，默认 5 秒
 */
function startKiller(intervalMs = 5000) {
    if (process.platform !== 'win32') return;
    
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    
    console.log('[Killer] Auto-kill service started with keywords:', TARGET_TITLE_KEYWORDS);
    
    // 立即执行一次
    performKill();
    
    // 开启定时任务
    checkInterval = setInterval(performKill, intervalMs);
}

/**
 * 停止自动查杀
 */
function stopKiller() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[Killer] Auto-kill service stopped.');
    }
}

module.exports = {
    startKiller,
    stopKiller
};