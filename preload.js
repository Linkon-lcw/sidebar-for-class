const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本：在渲染进程和主进程之间架起桥梁
 * 安全地暴露部分 API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 调整窗口大小
    resizeWindow: (width, height, y) => ipcRenderer.send('resize-window', width, height, y),

    // 设置鼠标穿透（预留接口）
    setIgnoreMouse: (ignore, forward) => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    // 获取配置信息
    getConfig: () => ipcRenderer.invoke('get-config'),

    // 启动外部应用
    launchApp: (target, args) => ipcRenderer.send('launch-app', target, args),

    // 获取文件图标
    getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),

    // 设置窗口置顶状态
    setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),

    // 音量控制
    getVolume: () => ipcRenderer.invoke('get-volume'),
    setVolume: (value) => ipcRenderer.send('set-volume', value),

    // 获取文件夹下的文件
    getFilesInFolder: (path, maxCount) => ipcRenderer.invoke('get-files-in-folder', path, maxCount)
});
