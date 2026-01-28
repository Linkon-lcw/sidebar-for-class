const koffi = require('koffi');
const path = require('path');

const WINDOW_HISTORY_MAX_LENGTH = 50;
const WM_CLOSE = 0x0010;
const PROCESS_QUERY_INFORMATION = 0x0400;
const PROCESS_VM_READ = 0x0010;
const MAX_PATH = 260;

let windowHistory = [];

let isMonitoring = false;
let monitorInterval = null;
let lastForegroundWindow = null;

const DEFAULT_BLACKLIST = [
  // 'sidebar-for-class',
  '侧边栏工具',
  'InkCanvasforClass',
  // 'explorer',
  // 'progman',
  // 'shell_traywnd',
  // 'taskmgr',
  // 'start'
];

let blacklist = [...DEFAULT_BLACKLIST];

const user32 = koffi.load('user32.dll');
const psapi = koffi.load('psapi.dll');
const kernel32 = koffi.load('kernel32.dll');

const GetForegroundWindow = user32.func('GetForegroundWindow', 'uint64', []);
const GetWindowTextLengthW = user32.func('GetWindowTextLengthW', 'int32', ['uint64']);
const GetWindowTextW = user32.func('GetWindowTextW', 'int32', ['uint64', 'char*', 'int32']);
const GetWindowThreadProcessId = user32.func('GetWindowThreadProcessId', 'uint32', ['uint64', 'uint32*']);
const PostMessageW = user32.func('PostMessageW', 'int32', ['uint64', 'uint32', 'uint64', 'int64']);
const OpenProcess = kernel32.func('OpenProcess', 'void*', ['uint32', 'uint32', 'uint32']);
const CloseHandle = kernel32.func('CloseHandle', 'int32', ['void*']);
const GetModuleFileNameExW = psapi.func('GetModuleFileNameExW', 'uint32', ['void*', 'void*', 'char*', 'uint32']);

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

function getProcessName(pid) {
  return new Promise((resolve) => {
    if (!pid || pid <= 0) {
      resolve('');
      return;
    }
    try {
      const processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
      if (!processHandle) {
        resolve('');
        return;
      }
      
      const buffer = Buffer.alloc(MAX_PATH * 2);
      const length = GetModuleFileNameExW(processHandle, 0, buffer, MAX_PATH);
      
      CloseHandle(processHandle);
      
      if (length > 0) {
        const exePath = buffer.toString('ucs2', 0, length * 2).replace(/\0/g, '');
        const processName = path.basename(exePath, '.exe').toLowerCase();
        resolve(processName);
      } else {
        resolve('');
      }
    } catch (error) {
      console.error('[Window History] 获取进程名失败:', error);
      resolve('');
    }
  });
}

function getCurrentForegroundWindow() {
  return new Promise((resolve) => {
    try {
      const hwnd = GetForegroundWindow();
      if (hwnd === 0) {
        console.log('[Window History] 未找到前台窗口');
        resolve(null);
        return;
      }

      const length = GetWindowTextLengthW(hwnd);
      
      let title = '';
      if (length > 0) {
        const buffer = Buffer.alloc((length + 1) * 2);
        GetWindowTextW(hwnd, buffer, length + 1);
        title = buffer.toString('ucs2', 0, length * 2).replace(/\0/g, '');
      }

      const pidPtr = Buffer.alloc(4);
      GetWindowThreadProcessId(hwnd, pidPtr);
      const processId = pidPtr.readUInt32LE(0);

      getProcessName(processId).then(processName => {
        const windowInfo = {
          hwnd: hwnd.toString(),
          title: title || '',
          processName: processName || ''
        };

        if (windowInfo.title || windowInfo.processName) {
          console.log('[Window History] 前台窗口:', windowInfo.title, '(', windowInfo.processName, ')');
          resolve(windowInfo);
        } else {
          console.log('[Window History] 未获取到有效的窗口信息');
          resolve(null);
        }
      });
    } catch (error) {
      console.error('[Window History] 获取前台窗口失败:', error);
      resolve(null);
    }
  });
}

function closeWindowByHwnd(hwnd) {
  return new Promise((resolve) => {
    try {
      const hwndValue = parseInt(hwnd);
      if (!hwndValue || hwndValue <= 0) {
        console.log('[Window History] 窗口句柄无效');
        resolve(false);
        return;
      }

      const result = PostMessageW(hwndValue, WM_CLOSE, 0, 0);
      const success = result !== 0;
      
      console.log('[Window History] 关闭窗口结果:', success);
      resolve(success);
    } catch (error) {
      console.log('[Window History] 关闭窗口执行错误:', error.message);
      resolve(false);
    }
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
