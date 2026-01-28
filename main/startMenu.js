const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let shortcutsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

function getStartMenuPaths() {
  const paths = [];
  
  const appData = process.env.APPDATA;
  const programData = process.env.ProgramData;
  
  if (appData) {
    paths.push(path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));
  }
  
  if (programData) {
    paths.push(path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));
  }
  
  return paths.filter(p => fs.existsSync(p));
}

function resolveLnkTarget(lnkPath) {
  try {
    const psScript = `
      $shell = New-Object -ComObject WScript.Shell
      $shortcut = $shell.CreateShortcut('${lnkPath.replace(/\\/g, '\\\\')}')
      Write-Output $shortcut.TargetPath
      Write-Output $shortcut.Description
    `;
    const output = execSync(`powershell -Command "${psScript}"`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    return {
      target: lines[0]?.trim() || '',
      description: lines[1]?.trim() || ''
    };
  } catch (e) {
    return { target: '', description: '' };
  }
}

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (item.toLowerCase().endsWith('.lnk')) {
      const name = path.basename(item, '.lnk');
      const resolved = resolveLnkTarget(fullPath);
      
      if (resolved.target && fs.existsSync(resolved.target)) {
        results.push({
          name: name,
          target: resolved.target,
          description: resolved.description,
          lnkPath: fullPath
        });
      }
    }
  }
  
  return results;
}

function getStartMenuShortcuts() {
  const now = Date.now();
  
  if (shortcutsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return shortcutsCache;
  }
  
  const startMenuPaths = getStartMenuPaths();
  const allShortcuts = [];
  
  for (const dir of startMenuPaths) {
    scanDirectory(dir, allShortcuts);
  }
  
  shortcutsCache = allShortcuts.sort((a, b) => a.name.localeCompare(b.name));
  cacheTimestamp = now;
  
  return shortcutsCache;
}

function clearCache() {
  shortcutsCache = null;
  cacheTimestamp = null;
}

module.exports = {
  getStartMenuShortcuts,
  clearCache
};