/**
 * 渲染进程逻辑
 */

const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');
const widgetContainer = document.getElementById('widget-container');

let isDragging = false;
let startX = 0;
let lastLogTime = 0;
const THRESHOLD = 60; // 触发展开的距离阈值（从 100 下调至 60，增加灵敏度）
const VELOCITY_THRESHOLD = 0.3; // 触发展开的速度阈值 (从 0.5 下调至 0.3)

// 拖拽速度追踪
let lastX = 0;
let lastTime = 0;
let currentConfig = null;
let animationId = null;
let currentVelocity = 0;
let startTimeStamp = 0;
let lastIgnoreState = null;

/**
 * 更新窗口鼠标穿透状态
 * @param {boolean} ignore 是否忽略鼠标事件
 */
function setIgnoreMouse(ignore) {
    if (ignore !== lastIgnoreState) {
        lastIgnoreState = ignore;
        // forward: true 极其重要，它允许我们在忽略点击的同时，依然能接收到 mousemove 事件以判断何时恢复点击
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

/**
 * 监听全局鼠标移动，动态切换穿透状态
 */
window.addEventListener('mousemove', (e) => {
    // 如果正在拖拽，绝对不能穿透
    if (isDragging) {
        setIgnoreMouse(false);
        return;
    }

    const isExpanded = document.body.classList.contains('expanded');
    let shouldIgnore = true;

    if (isExpanded) {
        // 展开状态下，判断是否在侧边栏主体内 (含 margin)
        const rect = sidebar.getBoundingClientRect();
        // 增加一点容错 marginal 区域
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    } else {
        // 收起状态下，判断是否在 wrapper (16px) 范围内
        // wrapper 宽度包含 4px 竖线和两侧约 6px 的留白，符合用户“5px判定区域”的要求
        const rect = wrapper.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    }

    setIgnoreMouse(shouldIgnore);
});

/**
 * 当鼠标离开窗口范围时，默认恢复穿透状态
 */
window.addEventListener('mouseleave', () => {
    setIgnoreMouse(true);
});

// 初始尺寸和目标尺寸
let START_W = 4, START_H = 64;
const TARGET_W = 400, TARGET_H = 450;

/**
 * 停止当前正在运行的 JS 动画
 */
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/**
 * 加载并渲染配置
 */
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        currentConfig = config;

        // 更新初始尺寸配置
        if (config.transforms) {
            if (typeof config.transforms.height === 'number') {
                START_H = config.transforms.height;
                console.log(`[配置] 已同步 START_H = ${START_H}`);
                // 立即应用初始样式
                updateSidebarStyles(0);
            }

            // 更新动画速度
            if (typeof config.transforms.animation_speed === 'number') {
                const speed = config.transforms.animation_speed;
                // 基础时间：sidebar = 0.5s, content = 0.3s
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
                console.log(`[配置] 动画速度已设为 ${speed}x`);
            }
        }

        renderWidgets(config.widgets);
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

/**
 * 渲染小组件列表
 * @param {Array} widgets 小组件配置数组
 */
async function renderWidgets(widgets) {
    widgetContainer.innerHTML = '';
    for (const widget of widgets) {
        if (widget.type === 'launcher' && Array.isArray(widget.targets)) {
            const group = document.createElement('div');
            group.className = 'launcher-group';

            for (const targetConfig of widget.targets) {
                const item = await createLauncherItem(targetConfig);
                group.appendChild(item);
            }
            widgetContainer.appendChild(group);
        }
    }
}

/**
 * 创建启动器项目元素
 * @param {Object} widget 小组件配置
 */
async function createLauncherItem(widget) {
    const div = document.createElement('div');
    div.className = 'launcher-item';

    // 如果提供了目标路径，尝试获取图标
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

    // 点击启动应用
    div.onclick = () => {
        window.electronAPI.launchApp(widget.target, widget.args || []);
    };
    return div;
}

/**
 * 更新侧边栏样式
 * @param {number} progress 进度 (0-1)
 */
function updateSidebarStyles(progress) {
    // 限制进度在 0-1 之间
    progress = Math.max(0, Math.min(1, progress));

    // 根据进度计算各项数值
    const currentWidth = START_W + (TARGET_W - START_W) * progress;
    const currentHeight = START_H + (TARGET_H - START_H) * progress;
    const currentRadius = 4 + (12 * progress);
    const currentMargin = 6 + (6 * progress);

    sidebar.style.width = `${currentWidth}px`;
    sidebar.style.height = `${currentHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

    // 补偿位移：当 Electron 窗口因触及屏幕边缘而被主进程移动时，
    // 在 CSS 中反向移动内容，确保竖线中心点位置保持在 posy 不变。
    // 顺滑位置修正逻辑：
    // 在拖拽过程中，逐渐将窗口中心从原始 posy 过渡到“安全区域”内的中心。
    if (currentConfig && currentConfig.transforms && currentConfig.displayBounds) {
        const posy = currentConfig.transforms.posy;
        const screenY = currentConfig.displayBounds.y;
        const screenH = currentConfig.displayBounds.height;

        let targetWinW, targetWinH;
        if (progress <= 0) {
            targetWinW = 20; // 窄窗口状态，确保触摸 100% 响应
            targetWinH = START_H + 40;
            setIgnoreMouse(false); // 窄窗口无需穿透
        } else {
            targetWinW = Math.floor(currentWidth + 100);
            targetWinH = Math.floor(currentHeight + 100);
        }

        // 基础中心点（progress=0 时）
        const startCenterY = screenY + posy;
        // 修正后的安全中心点（progress=1 时，确保面板完全在屏幕内）
        const safeCenterY = Math.max(screenY + TARGET_H / 2 + 20, Math.min(screenY + screenH - TARGET_H / 2 - 20, startCenterY));

        // 插值计算当前中心点
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);

        sidebar.style.transform = ''; // 清除旧偏移
        if (progress === 0 || progress === 1) {
            // 边界状态立即执行，确保位置完全正确
            window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        } else {
            // 拖拽中过程节流，减少 IPC 压力
            throttledResize(targetWinW, targetWinH, newWindowY);
        }
    }

    // 颜色渐变过渡
    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;

    // 限制日志频率
    if (Date.now() - lastLogTime > 100) {
        lastLogTime = Date.now();
    }
}

let lastResizeTime = 0;
/**
 * 节流版的调整窗口大小
 */
function throttledResize(w, h, y) {
    if (Date.now() - lastResizeTime > 16) { // 限制在约 60fps
        window.electronAPI.resizeWindow(w, h, y);
        lastResizeTime = Date.now();
    }
}

/**
 * 开始拖拽处理
 * @param {number} clientX 鼠标或触摸的 X 坐标
 */
const handleStart = (clientX) => {
    // 如果已经完全展开，则不处理拖拽（除非正在动画中，允许打断）
    if (document.body.classList.contains('expanded') && !animationId) return;

    isDragging = true;

    // 实现“打断动画”：
    // 如果当前正在播放动画（通常是收起动画），计算当前进度并修正 startX，实现无缝切换到拖拽
    if (animationId) {
        const currentW = parseFloat(sidebar.style.width) || START_W;
        const currentProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));
        // 修正 startX，使得目前的 deltaX / 250 刚好等于当前进度
        startX = clientX - (currentProgress * 250);
        stopAnimation();
        console.log(`[打断动画] 当前进度=${currentProgress.toFixed(2)}, 修正 startX=${startX}`);
    } else {
        startX = clientX;
    }

    // 初始化速度追踪
    lastX = clientX;
    lastTime = performance.now();
    startTimeStamp = lastTime; // 记录总起始时间
    currentVelocity = 0;

    console.log(`[开始拖拽] x=${startX}`);

    // 即使在穿透模式下，一旦触发点击，立即关闭穿透
    setIgnoreMouse(false);

    // 获取当前宽度，确保打断时窗口空间足够，不裁剪内容
    const currentW = parseFloat(sidebar.style.width) || START_W;
    const targetWinW = Math.max(Math.floor(currentW + 100), 200);
    window.electronAPI.resizeWindow(targetWinW, START_H + 100);

    wrapper.style.width = '500px';
    sidebar.style.transition = 'none'; // 拖拽时关闭过渡动画
};

/**
 * 拖拽移动处理
 * @param {number} clientX 鼠标或触摸的 X 坐标
 */
const handleMove = (clientX) => {
    if (!isDragging) return;

    // 计算速度
    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) {
        currentVelocity = (clientX - lastX) / dt;
    }
    lastX = clientX;
    lastTime = now;

    const deltaX = clientX - startX;
    if (deltaX > 0) {
        const progress = Math.min(deltaX / 250, 1);
        updateSidebarStyles(progress);
    }
};

/**
 * 拖拽结束处理
 * @param {number|null} clientX 鼠标或触摸的 X 坐标
 */
const handleEnd = (clientX) => {
    if (!isDragging) return;
    isDragging = false;

    const deltaX = clientX ? (clientX - startX) : 0;
    const duration = performance.now() - startTimeStamp;

    console.log(`[拖拽结束] 最终偏移量=${deltaX.toFixed(1)}, 时长=${duration.toFixed(0)}ms, 最终速度=${currentVelocity.toFixed(2)}`);

    // 综合判断：
    // 1. 位移超过硬阈值 (60px)
    // 2. 瞬时速度超过阈值 (0.3)
    // 3. 针对极速短扫：如果时长很短 (<200ms) 且有一定位移 (>20px)
    if (deltaX > THRESHOLD ||
        currentVelocity > VELOCITY_THRESHOLD ||
        (duration < 200 && deltaX > 20)) {

        if (duration < 200 && deltaX > 20 && currentVelocity <= VELOCITY_THRESHOLD) {
            console.log(`[极速扫动补偿] 触发展开`);
        }
        expand();
    } else {
        collapse();
    }
};

/**
 * 展开侧边栏
 */
function expand() {
    const currentW = parseFloat(sidebar.style.width) || START_W;
    const isFullyExpanded = Math.abs(currentW - TARGET_W) < 1;

    // 只有在已展开完成、且没有拖拽、没有动画的情况下才直接退出
    if (document.body.classList.contains('expanded') && !isDragging && !animationId && isFullyExpanded) return;

    console.log('[执行展开] 开始展开动画');

    // 停止任何正在进行的动画
    stopAnimation();

    // 状态切换
    document.body.classList.add('expanded');

    // 确保在动画期间容器宽度足够
    wrapper.style.width = '100%';
    sidebar.style.transition = 'none';

    // 动画配置
    const speed = (currentConfig && currentConfig.transforms && currentConfig.transforms.animation_speed) || 1;
    const duration = 300 / speed;
    const startTime = performance.now();
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    // 获取当前进度
    const startProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));

    function animate(currentTime) {
        // 如果中途被收起且不是正在进行展开，停止此动画
        if (!document.body.classList.contains('expanded')) {
            animationId = null;
            return;
        }

        const elapsed = currentTime - startTime;
        const t = Math.min(1, elapsed / duration);

        // 从当前进度到 1.0
        const p = startProgress + (1 - startProgress) * easeOutQuart(t);

        if (t >= 1) {
            updateSidebarStyles(1);
            animationId = null;
            finishExpand();
        } else {
            updateSidebarStyles(p);
            animationId = requestAnimationFrame(animate);
        }
    }

    animationId = requestAnimationFrame(animate);
}

/**
 * 展开动画结束后的处理
 */
function finishExpand() {
    console.log('[执行展开] 动画结束');
    if (document.body.classList.contains('expanded')) {
        wrapper.style.width = '';
        sidebar.style.transition = ''; // 恢复 CSS 过渡
    }
}

/**
 * 收起侧边栏
 */
function collapse() {
    console.log('[执行收起] 开始收起动画');

    // 停止任何正在进行的动画
    stopAnimation();

    // 在动画期间保持容器宽度，防止 flex 布局挤压导致宽度突变
    wrapper.style.width = '100%';

    // 禁用 CSS 过渡，使用 JS 手动每一帧更新
    sidebar.style.transition = 'none';
    document.body.classList.remove('expanded');

    // 计算动画时长 (基础 300ms)
    const speed = (currentConfig && currentConfig.transforms && currentConfig.transforms.animation_speed) || 1;
    const duration = 300 / speed;
    const startTime = performance.now();

    // 缓动函数: easeOutQuart
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    // 尝试获取当前进度（基于当前宽度）
    const currentW = parseFloat(sidebar.style.width) || START_W;
    const startProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));

    function animate(currentTime) {
        // 如果中途被重新展开，停止此动画
        if (document.body.classList.contains('expanded')) {
            animationId = null;
            return;
        }

        const elapsed = currentTime - startTime;
        const t = Math.min(1, elapsed / duration); // 时间进度 0 -> 1

        // 计算当前进度 p: 从 startProgress 变为 0
        const p = startProgress * (1 - easeOutQuart(t));

        // 结束条件
        if (t >= 1) {
            updateSidebarStyles(0);
            animationId = null;
            finishCollapse();
        } else {
            updateSidebarStyles(p);
            animationId = requestAnimationFrame(animate);
        }
    }

    animationId = requestAnimationFrame(animate);
}

/**
 * 动画彻底结束后的清理工作
 */
function finishCollapse() {
    console.log('[执行收起] 动画结束');
    if (!document.body.classList.contains('expanded')) {
        // 收起后将窗口缩到最窄，并禁用穿透以保证 100% 触摸响应
        window.electronAPI.resizeWindow(20, START_H + 40);
        setIgnoreMouse(false);
        wrapper.style.width = '';
        sidebar.style.transition = ''; // 恢复 CSS 过渡

        // 移除所有 inline 样式以恢复到 style.css 定义的状态
        sidebar.style.width = '';
        sidebar.style.height = '';
        sidebar.style.borderRadius = '';
        sidebar.style.marginLeft = '';
        sidebar.style.background = '';
        sidebar.style.backgroundColor = '';
    }
}

// 绑定事件监听器
wrapper.addEventListener('mousedown', (e) => {
    // 阻止默认行为（如窗口聚焦时的系统延迟）
    e.preventDefault();
    handleStart(e.clientX);
});

wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        // 核心：阻止默认行为以跳过 300ms 点击判定
        e.preventDefault();
        handleStart(e.touches[0].clientX);
    }
}, { passive: false });

window.addEventListener('mousemove', (e) => handleMove(e.clientX));
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        // 拖拽时禁止系统滚动，提高灵敏度
        if (isDragging) e.preventDefault();
        handleMove(e.touches[0].clientX);
    }
}, { passive: false });

window.addEventListener('mouseup', (e) => handleEnd(e.clientX));
window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
        handleEnd(e.changedTouches[0].clientX);
    } else {
        handleEnd(null);
    }
});

// 禁用右键菜单，防止长按导致误触发和延迟
window.addEventListener('contextmenu', (e) => e.preventDefault());

// 点击侧边栏外部（窗口内）收起
window.addEventListener('mousedown', (e) => {
    if (document.body.classList.contains('expanded') && !sidebar.contains(e.target)) {
        console.log('[动作] 点击外部，收起');
        collapse();
    }
});

// 窗口失去焦点时收起
window.addEventListener('blur', () => {
    if (document.body.classList.contains('expanded')) {
        console.log('[动作] 窗口失去焦点，收起');
        collapse();
    }
});

// 初始化
loadConfig();
