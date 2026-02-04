/**
 * 守护进程 (Watchdog)
 * 负责监控主进程状态，并在主进程退出后执行清理/自动化任务
 * 运行环境：纯 Node.js (ELECTRON_RUN_AS_NODE=1)
 */
const fs = require('fs');
const path = require('path');
const { executeTask } = require('./automation');

// 获取参数: node guardian.js <parentPid> <dataDir>
const parentPid = parseInt(process.argv[2]);
const dataDir = process.argv[3];
const configPath = path.join(dataDir, 'config.json');
const logFile = path.join(dataDir, 'guardian.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
  fs.appendFileSync(logFile, `[${timestamp}] ${content}\n`);
}

// 覆盖 console.log 和 console.error，让 automation.js 的日志也能写入文件
console.log = log;
console.error = log;

log(`Started. Monitoring PID: ${parentPid}`);

// 关键：忽略 SIGINT 信号，防止 Ctrl+C 把守护进程也带走
process.on('SIGINT', () => {
  log('Received SIGINT, but ignoring it to wait for parent process.');
});

/**
 * 检查主进程是否存活
 */
function isParentAlive() {
  try {
    return process.kill(parentPid, 0);
  } catch (e) {
    return false;
  }
}

/**
 * 检查指定进程是否正在运行
 */
function isProcessRunning(processName) {
  if (process.platform !== 'win32') return false;
  try {
    const { execSync } = require('child_process');
    const nameWithoutExe = processName.toLowerCase().endsWith('.exe') 
      ? processName.slice(0, -4) 
      : processName;
    const command = `powershell -Command "if (Get-Process -Name '${nameWithoutExe}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 执行退出自动化任务
 */
async function runShutdownTasks() {
  log('Main process exited. Reading config...');
  
  if (!fs.existsSync(configPath)) {
    log('Config file not found: ' + configPath);
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const automatic = config.automatic || [];
    const tasks = [];

    // ICC-CE 兼容处理: 退出时恢复
    if (config.helper_tools?.icc_compatibility) {
      if (isProcessRunning('InkCanvasForClass.exe')) {
        log('ICC Compatibility enabled and ICC-CE is running. Restoring ICC-CE...');
        tasks.push(executeTask({ script: 'icc://thoroughHideOff' }, dataDir));
      } else {
        log('ICC Compatibility enabled but ICC-CE is not running. Skipping restore.');
      }
    }

    for (const item of automatic) {
      if (item.on && Array.isArray(item.on) && item.on.includes('shutdown')) {
        log(`Executing task: ${item.name || item.script}`);
        tasks.push(executeTask(item, dataDir));
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
      log('All shutdown tasks completed.');
    } else {
      log('No shutdown tasks to run.');
    }
  } catch (e) {
    log('Error: ' + e.message);
  }
}

const timer = setInterval(async () => {
  if (!isParentAlive()) {
    clearInterval(timer);
    await runShutdownTasks();
    log('Guardian exiting.');
    process.exit(0);
  }
}, 1000);

process.on('uncaughtException', (err) => {
  log('Uncaught Exception: ' + err.stack);
});
