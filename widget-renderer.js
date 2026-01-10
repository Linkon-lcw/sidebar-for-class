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
 * 创建文件列表组件
 * 专门用于显示文件夹内容（如"最近使用"）
 * 采用紧凑的垂直列表布局，模仿 Windows 资源管理器详情视图
 */
async function createFilesWidget(widget) {
    const container = document.createElement('div');
    const layout = widget.layout || 'vertical';

    // 添加 compact-files 类以应用紧凑样式
    container.className = `launcher-group layout-${layout} compact-files`;

    let files = [];
    try {
        // 调用主进程接口获取文件列表
        files = await window.electronAPI.getFilesInFolder(widget.folder_path, widget.max_count);
    } catch (err) {
        console.error('获取文件列表失败:', err);
        return container;
    }

    for (const file of files) {
        // 去除 .lnk 后缀显示，使界面更整洁
        let displayName = file.name;
        if (displayName.toLowerCase().endsWith('.lnk')) {
            displayName = displayName.slice(0, -4);
        }

        // 构造显示配置
        const itemConfig = {
            name: displayName,
            target: file.path
        };

        // 复用通用的启动器项目创建逻辑
        const item = await createLauncherItem(itemConfig);
        container.appendChild(item);
    }

    return container;
}

/**
 * 核心渲染函数
 * 负责遍历配置并渲染所有小组件
 */
async function renderWidgets(widgets) {
    const container = document.getElementById('widget-container');
    container.innerHTML = ''; // 清空现有内容

    for (const widget of widgets) {
        // 渲染普通启动器组 (快捷方式网格/列表)
        if (widget.type === 'launcher' && Array.isArray(widget.targets)) {
            const group = document.createElement('div');
            const layout = widget.layout || 'vertical';
            group.className = `launcher-group layout-${layout}`;

            for (const targetConfig of widget.targets) {
                const item = await createLauncherItem(targetConfig);
                group.appendChild(item);
            }
            container.appendChild(group);

            // 渲染音量调节滑块
        } else if (widget.type === 'volume_slider') {
            const slider = await createVolumeSlider(widget);
            container.appendChild(slider);

            // 渲染文件列表 (最近文件等)
        } else if (widget.type === 'files') {
            const filesWidget = await createFilesWidget(widget);
            container.appendChild(filesWidget);
        }
    }
}
