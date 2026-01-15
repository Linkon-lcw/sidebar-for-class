/**
 * 创建启动器项目元素
 */
export async function createLauncherItem(widget) {
    const div = document.createElement('div');
    div.className = 'launcher-item';

    let iconHtml = '<div class="launcher-icon-placeholder" style="width:32px; height:32px; background:#e5e7eb; border-radius:6px;"></div>';
    if (widget.target) {
        try {
            const iconDataUrl = await window.electronAPI.getFileIcon(widget.target);
            if (iconDataUrl) {
                iconHtml = `<img src="${iconDataUrl}" alt="${widget.name}">`;
            }
        } catch (err) {
            console.error('获取图标失败:', err);
        }
    }

    div.innerHTML = `
        <div class="launcher-icon">
            ${iconHtml}
        </div>
        <div class="launcher-info">
            <div class="launcher-name">${widget.name}</div>
        </div>
    `;

    div.onclick = () => {
        window.electronAPI.launchApp(widget.target, widget.args || []);
    };
    return div;
}
