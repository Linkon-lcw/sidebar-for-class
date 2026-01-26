/**
 * 窗口杀手模块
 * 负责定期检查并关闭特定的同类软件窗口
 */
const { exec } = require('child_process');
const { getConfigSync } = require('./config');

// 需要查杀的窗口标题关键字列表
const TARGET_TITLE_KEYWORDS = [
    'EasiSideBar'
];

let checkInterval = null;

/**
 * 执行查杀逻辑
 */
function performKill() {
    const config = getConfigSync();
    
    // 检查配置是否开启
    if (!config.helper_tools?.auto_kill_similar) {
        return;
    }

    // 构建 PowerShell 脚本
    // 查找标题包含关键字的窗口并尝试关闭
    const keywordsJson = JSON.stringify(TARGET_TITLE_KEYWORDS);
    
    const psScript = `
$keywords = '${keywordsJson}' | ConvertFrom-Json
$ownPid = ${process.pid}

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowUtils {
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    public const uint WM_CLOSE = 0x0010;
}
"@

Get-Process | Where-Object { $_.MainWindowTitle -and $_.Id -ne $ownPid } | ForEach-Object {
    $title = $_.MainWindowTitle
    $hwnd = $_.MainWindowHandle
    
    foreach ($keyword in $keywords) {
        if ($title -like "*$keyword*") {
            try {
                [WindowUtils]::PostMessage($hwnd, [WindowUtils]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero)
                Write-Host "Closed window: $title (PID: $($_.Id))"
            } catch {
                Write-Host "Failed to close window: $title"
            }
            break
        }
    }
}
`;

    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -EncodedCommand ${encodedCommand}`, (error, stdout, stderr) => {
        if (error) {
            // console.error('[Killer] Execution error:', error);
            return;
        }
        if (stdout.trim()) {
            console.log('[Killer] Result:', stdout.trim());
        }
    });
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
