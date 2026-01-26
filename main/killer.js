/**
 * 窗口杀手模块
 * 负责定期检查并关闭特定的同类软件窗口
 */
const { getConfigSync } = require('./config');
const { findWindowsByTitleKeywords, closeWindowByHwnd, killProcessByPid } = require('./window-history');

// 需要强行结束进程 (taskkill) 的窗口标题列表 (精确匹配)
const FORCE_KILL_TITLES = [
    'EasiSideBar',
];

// 需要普通关闭窗口 (WM_CLOSE) 的窗口标题列表 (精确匹配)
const NORMAL_CLOSE_TITLES = [
    
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

        // 1. 处理强制结束列表
        if (FORCE_KILL_TITLES.length > 0) {
            const forceItems = await findWindowsByTitleKeywords(FORCE_KILL_TITLES, true);
            if (forceItems.length > 0) {
                const killedPids = new Set();
                for (const item of forceItems) {
                    const [hwnd, pid] = item.split(':');
                    if (pid && !killedPids.has(pid)) {
                        console.log(`[Killer] Force killing process ${pid} because of exact window title match.`);
                        await killProcessByPid(pid);
                        killedPids.add(pid);
                    }
                }
            }
        }

        // 2. 处理普通关闭列表
        if (NORMAL_CLOSE_TITLES.length > 0) {
            const normalItems = await findWindowsByTitleKeywords(NORMAL_CLOSE_TITLES, true);
            for (const item of normalItems) {
                const [hwnd, pid] = item.split(':');
                console.log(`[Killer] Sending WM_CLOSE to window HWND: ${hwnd} (Title match).`);
                await closeWindowByHwnd(hwnd);
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
    
    console.log('[Killer] Auto-kill service started.');
    console.log('[Killer] Force Kill List:', FORCE_KILL_TITLES);
    console.log('[Killer] Normal Close List:', NORMAL_CLOSE_TITLES);
    
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
