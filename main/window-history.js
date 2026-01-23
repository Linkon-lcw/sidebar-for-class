const { exec } = require('child_process');

const WINDOW_HISTORY_MAX_LENGTH = 50;

let windowHistory = [];

let isMonitoring = false;
let monitorInterval = null;
let lastForegroundWindow = null;

const DEFAULT_BLACKLIST = [
  'sidebar-for-class',
  '侧边栏工具',
  'InkCanvasforClass',
  // 'explorer',
  // 'progman',
  // 'shell_traywnd',
  // 'taskmgr',
  // 'start'
];

let blacklist = [...DEFAULT_BLACKLIST];

function parseWindowInfo(output) {
  if (!output || typeof output !== 'string') return null;
  const parts = output.trim().split('|');
  if (parts.length < 3) return null;
  return {
    hwnd: parts[0].trim(),
    title: parts[1].trim(),
    processName: parts[2].trim().toLowerCase()
  };
}

function isWindowValid(windowInfo) {
  if (!windowInfo) return false;
  if (!windowInfo.hwnd || windowInfo.hwnd === '0') return false;
  if (!windowInfo.title || windowInfo.title.trim() === '') return false;
  const procLower = windowInfo.processName.toLowerCase();
  const titleLower = windowInfo.title.toLowerCase();
  return !blacklist.some(name => {
    const nameLower = name.toLowerCase();
    return procLower.includes(nameLower) || titleLower.includes(nameLower);
  });
}

function getCurrentForegroundWindow() {
  return new Promise((resolve) => {
    const rawPowershellScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class UserWindows {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
'@
Add-Type -TypeDefinition $code -Language CSharp

$hwnd = [UserWindows]::GetForegroundWindow()
if ($hwnd -ne 0) {
    $len = [UserWindows]::GetWindowTextLength($hwnd)
    $sb = New-Object System.Text.StringBuilder ($len + 1)
    [UserWindows]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()
    
    $pidOut = 0
    [UserWindows]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null
    
    $procName = ""
    try {
        $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        if ($p) { $procName = $p.ProcessName }
    } catch {}
    
    Write-Host "$hwnd|$title|$procName"
}
`;

    const encodedCommand = Buffer.from(rawPowershellScript, 'utf16le').toString('base64');
    const command = `powershell -EncodedCommand ${encodedCommand}`;
    exec(command, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        console.error('[Window History] 获取前台窗口失败:', error);
        console.error('[Window History] PowerShell stdout:', stdout);
        resolve(null);
        return;
      }
      const windowInfo = parseWindowInfo(stdout);
      if (windowInfo) {
        console.log('[Window History] 前台窗口:', windowInfo.title, '(', windowInfo.processName, ')');
      } else {
        console.log('[Window History] 未获取到有效的窗口信息, 原始输出:', stdout);
      }
      resolve(windowInfo);
    });
  });
}

function closeWindowByHwnd(hwnd) {
  return new Promise((resolve) => {
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowUtils {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool IsWindow(IntPtr hWnd);
    public const uint WM_CLOSE = 0x0010;
}
"@
try {
    $hWnd = [IntPtr]::new(${hwnd})
    if ([WindowUtils]::IsWindow($hWnd)) {
        $result = [WindowUtils]::PostMessage($hWnd, [WindowUtils]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero)
        Write-Host "RESULT:$result"
    } else {
        Write-Host "INVALID_WINDOW"
    }
} catch {
    Write-Host "ERROR:$($_.Exception.Message)"
}
`;
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -EncodedCommand ${encodedCommand}`, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        console.log('[Window History] 关闭窗口执行错误:', error.message);
      }
      const output = stdout.trim();
      console.log('[Window History] 关闭窗口原始输出:', output);
      
      if (output.startsWith('RESULT:')) {
        const success = output === 'RESULT:True';
        console.log('[Window History] 关闭窗口结果:', success);
        resolve(success);
      } else if (output === 'INVALID_WINDOW') {
        console.log('[Window History] 窗口句柄无效');
        resolve(false);
      } else if (output.startsWith('ERROR:')) {
        console.log('[Window History] 关闭窗口错误:', output);
        resolve(false);
      } else {
        console.log('[Window History] 关闭窗口未知状态');
        resolve(false);
      }
    });
  });
}

async function recordCurrentForegroundWindow() {
  const windowInfo = await getCurrentForegroundWindow();
  if (windowInfo && isWindowValid(windowInfo)) {
    console.log('[Window History] 检测到前台窗口:', windowInfo.title, '(', windowInfo.processName, ')', '有效:', isWindowValid(windowInfo));
    const existingIndex = windowHistory.findIndex(w => w.hwnd === windowInfo.hwnd);
    if (existingIndex !== -1) {
      windowHistory.splice(existingIndex, 1);
    }
    windowHistory.unshift(windowInfo);
    if (windowHistory.length > WINDOW_HISTORY_MAX_LENGTH) {
      windowHistory.pop();
    }
    lastForegroundWindow = windowInfo.hwnd;
    console.log('[Window History] 已添加到历史记录，历史长度:', windowHistory.length);
  } else {
    console.log('[Window History] 未检测到前台窗口或窗口无效');
  }
}

function startMonitoring(intervalMs = 500) {
  if (isMonitoring) return;
  isMonitoring = true;
  console.log('[Window History] 开始监控窗口活动');
  recordCurrentForegroundWindow();
  monitorInterval = setInterval(async () => {
    await recordCurrentForegroundWindow();
    if (windowHistory.length > 0) {
      console.log('[Window History] 最近窗口:', windowHistory[0].title, '(', windowHistory[0].processName, ')');
    }
  }, intervalMs);
}

function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  isMonitoring = false;
  console.log('[Window History] 停止监控窗口活动');
}

function getWindowHistory() {
  return [...windowHistory];
}

function clearHistory() {
  windowHistory = [];
  lastForegroundWindow = null;
  console.log('[Window History] 清空窗口历史记录');
}

function addToBlacklist(processNames) {
  if (Array.isArray(processNames)) {
    blacklist.push(...processNames);
    console.log('[Window History] 添加到黑名单:', processNames);
  }
}

function removeFromBlacklist(processNames) {
  if (Array.isArray(processNames)) {
    blacklist = blacklist.filter(name => !processNames.includes(name));
    console.log('[Window History] 从黑名单移除:', processNames);
  }
}

function setBlacklist(names) {
  blacklist = [...DEFAULT_BLACKLIST, ...names];
  console.log('[Window History] 设置黑名单:', blacklist);
}

async function closeLastActiveWindow() {
  console.log('[Window History] 尝试关闭最近活动窗口，历史记录长度:', windowHistory.length);
  if (windowHistory.length === 0) {
    console.log('[Window History] 窗口历史记录为空');
    return { success: false, message: '窗口历史记录为空' };
  }
  const windowInfo = windowHistory[0];
  console.log('[Window History] 检查窗口:', windowInfo.title, '(', windowInfo.processName, ')', '有效:', isWindowValid(windowInfo));
  if (isWindowValid(windowInfo)) {
    console.log('[Window History] 尝试关闭窗口:', windowInfo.title, '句柄:', windowInfo.hwnd);
    const closed = await closeWindowByHwnd(windowInfo.hwnd);
    if (closed) {
      windowHistory = windowHistory.filter(w => w.hwnd !== windowInfo.hwnd);
      console.log('[Window History] 成功关闭窗口:', windowInfo.title);
      return { success: true, window: windowInfo };
    }
  }
  console.log('[Window History] 最近的窗口无效或无法关闭');
  return { success: false, message: '最近的窗口无效或无法关闭' };
}

async function closeCurrentWindow() {
  const windowInfo = await getCurrentForegroundWindow();
  if (!windowInfo || !isWindowValid(windowInfo)) {
    return { success: false, message: '当前窗口无效或在黑名单中' };
  }
  const closed = await closeWindowByHwnd(windowInfo.hwnd);
  if (closed) {
    windowHistory = windowHistory.filter(w => w.hwnd !== windowInfo.hwnd);
    return { success: true, window: windowInfo };
  }
  return { success: false, message: '关闭窗口失败' };
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  getWindowHistory,
  clearHistory,
  addToBlacklist,
  removeFromBlacklist,
  setBlacklist,
  closeLastActiveWindow,
  closeCurrentWindow,
  getCurrentForegroundWindow,
  isMonitoring: () => isMonitoring
};
