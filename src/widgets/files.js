import { createLauncherItem } from './launcher.js';

/**
 * 创建文件列表组件
 */
export async function createFilesWidget(widget) {
    const container = document.createElement('div');
    const layout = widget.layout || 'vertical';
    container.className = `launcher-group layout-${layout} compact-files`;

    let files = [];
    try {
        files = await window.electronAPI.getFilesInFolder(widget.folder_path, widget.max_count);
    } catch (err) {
        console.error('获取文件列表失败:', err);
        return container;
    }

    for (const file of files) {
        let displayName = file.name;
        if (displayName.toLowerCase().endsWith('.lnk')) {
            displayName = displayName.slice(0, -4);
        }

        const itemConfig = {
            name: displayName,
            target: file.path
        };

        const item = await createLauncherItem(itemConfig);
        container.appendChild(item);
    }

    return container;
}
