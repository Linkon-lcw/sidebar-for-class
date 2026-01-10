/**
 * 创建启动器项目元素
 */
async function createLauncherItem(widget) {
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

/**
 * 创建音量滑块元素
 */
async function createVolumeSlider(widget) {
    const container = document.createElement('div');
    container.className = 'volume-slider-container';

    let currentVol = 0;
    try {
        currentVol = await window.electronAPI.getVolume();
    } catch (err) {
        console.error('获取音量失败:', err);
    }

    container.innerHTML = `
        <div class="volume-slider-title">系统音量</div>
        <div class="volume-slider-row">
            <div class="volume-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            </div>
            <div class="slider-wrapper">
                <input type="range" class="volume-slider" min="0" max="100" value="${currentVol}">
                <div class="slider-fill" style="width: ${currentVol}%"></div>
            </div>
            <div class="volume-value">${currentVol}%</div>
        </div>
    `;

    const slider = container.querySelector('.volume-slider');
    const fill = container.querySelector('.slider-fill');
    const valueDisp = container.querySelector('.volume-value');

    slider.oninput = (e) => {
        const val = e.target.value;
        console.log('[Renderer] Slider input:', val);
        fill.style.width = `${val}%`;
        valueDisp.textContent = `${val}%`;
        window.electronAPI.setVolume(parseInt(val));
    };

    return container;
}

/**
 * 核心渲染函数
 */
async function renderWidgets(widgets) {
    const container = document.getElementById('widget-container');
    container.innerHTML = '';
    for (const widget of widgets) {
        if (widget.type === 'launcher' && Array.isArray(widget.targets)) {
            const group = document.createElement('div');
            const layout = widget.layout || 'vertical';
            group.className = `launcher-group layout-${layout}`;

            for (const targetConfig of widget.targets) {
                const item = await createLauncherItem(targetConfig);
                group.appendChild(item);
            }
            container.appendChild(group);
        } else if (widget.type === 'volume_slider') {
            const slider = await createVolumeSlider(widget);
            container.appendChild(slider);
        }
    }
}
