/**
 * 渲染进程逻辑
 */

const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');

// 拖拽相关状态变量
let isDragging = false; // 是否正在拖拽
let isSwipeActive = false; // 是否激活了拖拽跟手（用于展开状态下的快速左滑检测）
let startX = 0; // 拖拽开始时的 X 坐标
let lastLogTime = 0; // 上次记录日志的时间（未使用）
const THRESHOLD = 60; // 触发展开的拖拽距离阈值
const VELOCITY_THRESHOLD = 0.3; // 触发展开的速度阈值

// 动画和状态跟踪变量
let lastX = 0; // 上一次鼠标移动的 X 坐标
let lastTime = 0; // 上一次鼠标移动的时间戳
let currentConfig = null; // 当前加载的配置
let animationId = null; // 当前动画帧 ID
let currentVelocity = 0; // 当前拖拽速度
let startTimeStamp = 0; // 拖拽开始的时间戳
let lastIgnoreState = null; // 上一次的鼠标穿透状态

/**
 * 设置是否忽略鼠标事件（鼠标穿透）
 * @param {boolean} ignore 是否忽略鼠标事件
 */
function setIgnoreMouse(ignore) {
    if (ignore !== lastIgnoreState) {
        lastIgnoreState = ignore;
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

// 监听鼠标移动，判断是否要在非拖拽状态下忽略鼠标事件
window.addEventListener('mousemove', (e) => {
    // 拖拽中或动画进行中，强制不忽略鼠标，防止闪烁和逻辑冲突
    if (isDragging || animationId) {
        setIgnoreMouse(false);
        return;
    }
    const isExpanded = document.body.classList.contains('expanded');
    let shouldIgnore = true;
    if (isExpanded) {
        // 展开状态下，鼠标在侧边栏区域内时不忽略
        const rect = sidebar.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    } else {
        // 收起状态下，鼠标在 wrapper 区域内时不忽略
        const rect = wrapper.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    }
    setIgnoreMouse(shouldIgnore);
});

// 鼠标离开窗口时忽略鼠标事件
window.addEventListener('mouseleave', () => setIgnoreMouse(true));

// 侧边栏尺寸和目标尺寸常量
let START_W = 4, START_H = 64;
const TARGET_W = 400, TARGET_H = 450;

/**
 * 停止当前进行的动画
 */
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/**
 * 加载配置文件
 */
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        currentConfig = config;
        // 应用配置中的变换参数
        if (config.transforms) {
            if (typeof config.transforms.height === 'number') {
                START_H = config.transforms.height;
                updateSidebarStyles(0); // 初始化样式
            }
            if (typeof config.transforms.animation_speed === 'number') {
                const speed = config.transforms.animation_speed;
                // 根据速度配置调整 CSS 变量
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        // 渲染小部件
        renderWidgets(config.widgets);
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

/**
 * 更新侧边栏样式
 * @param {number} progress 展开进度 (0 到 1)
 */
function updateSidebarStyles(progress) {
    progress = Math.max(0, Math.min(1, progress));
    // 计算当前的宽度、高度、圆角和边距
    const currentWidth = START_W + (TARGET_W - START_W) * progress;
    const currentHeight = START_H + (TARGET_H - START_H) * progress;
    const currentRadius = 4 + (12 * progress);
    const currentMargin = 6 + (6 * progress);

    sidebar.style.width = `${currentWidth}px`;
    sidebar.style.height = `${currentHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

    // 如果有配置，动态调整窗口大小和位置以适应侧边栏变化
    if (currentConfig?.transforms && currentConfig?.displayBounds) {
        const { posy } = currentConfig.transforms;
        const { y: screenY, height: screenH } = currentConfig.displayBounds;
        let targetWinW, targetWinH;

        if (progress <= 0) {
            targetWinW = 20;
            targetWinH = START_H + 40;
            setIgnoreMouse(false);
        } else {
            targetWinW = Math.floor(currentWidth + 100);
            targetWinH = Math.floor(currentHeight + 100);
        }

        // 计算窗口应该在的位置，保持侧边栏相对屏幕位置合理
        const startCenterY = screenY + posy;
        const safeCenterY = Math.max(screenY + TARGET_H / 2 + 20, Math.min(screenY + screenH - TARGET_H / 2 - 20, startCenterY));
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);

        // 更新窗口大小和位置
        if (progress === 0 || progress === 1) window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        else throttledResize(targetWinW, targetWinH, newWindowY);
    }

    // 根据进度调整背景颜色透明度
    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
}

let lastResizeTime = 0;
/**
 * 节流调整窗口大小，防止过于频繁调用
 */
function throttledResize(w, h, y) {
    if (Date.now() - lastResizeTime > 16) {
        window.electronAPI.resizeWindow(w, h, y);
        lastResizeTime = Date.now();
    }
}

/**
 * 激活拖拽时的视觉状态（调整窗口大小等）
 */
const activateDragVisuals = () => {
    wrapper.style.width = '500px';
    sidebar.style.transition = 'none';
};

/**
 * 处理拖拽开始
 */
const handleStart = (currentX) => {
    isDragging = true;
    lastX = currentX;
    lastTime = performance.now();
    startTimeStamp = lastTime;
    currentVelocity = 0;
    setIgnoreMouse(false);

    // 默认激活，除非是展开状态且没有正在进行的动画
    isSwipeActive = true;

    if (animationId) {
        // 如果正在动画中，计算当前的进度并接管拖拽
        const currentW = parseFloat(sidebar.style.width) || START_W;
        const currentProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));
        startX = currentX - (currentProgress * 250);
        stopAnimation();
    } else {
        if (document.body.classList.contains('expanded')) {
            // 展开状态下，进入等待模式，检测快速滑动
            isSwipeActive = false;
            // 展开状态下，假设当前处于最大拖拽距离 (250px)
            startX = currentX - 250;
        } else {
            startX = currentX;
        }
    }

    // 如果一开始就是激活状态（非展开，或者正在动画），则立即调整窗口
    if (isSwipeActive) {
        activateDragVisuals();
    }
};

/**
 * 处理拖拽移动
 */
const handleMove = (currentX) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = now - lastTime;
    // 计算速度
    if (dt > 0) currentVelocity = (currentX - lastX) / dt;
    lastX = currentX;
    lastTime = now;

    // 如果尚未激活跟手（展开状态等待快滑）
    if (!isSwipeActive) {
        // 只有向左快速滑动才激活 (速度阈值设为 0.5)
        if (currentVelocity < -0.5) {
            isSwipeActive = true;
            activateDragVisuals();
        } else {
            return; // 未激活则不更新样式
        }
    }

    const deltaX = currentX - startX;
    // 根据拖拽距离更新样式
    updateSidebarStyles(deltaX / 250);
};

/**
 * 处理拖拽结束
 */
const handleEnd = (currentX) => {
    if (!isDragging) return;
    isDragging = false;

    // 如果没有激活过跟手，说明用户操作未达标，保持原状
    if (!isSwipeActive) return;

    const deltaX = currentX ? (currentX - startX) : 0;
    const duration = performance.now() - startTimeStamp;
    // 如果向左快速滑动，强制收起
    if (currentVelocity < -VELOCITY_THRESHOLD) {
        collapse();
        return;
    }
    // 判断是否满足展开条件（距离、速度或短时间内的快速滑动）
    if (deltaX > THRESHOLD || currentVelocity > VELOCITY_THRESHOLD || (duration < 200 && deltaX > 20)) expand();
    else collapse();
};

/**
 * 展开侧边栏
 */
function expand() {
    const currentW = parseFloat(sidebar.style.width) || START_W;
    // 如果已经完全展开且未拖拽，直接返回
    if (document.body.classList.contains('expanded') && !isDragging && !animationId && Math.abs(currentW - TARGET_W) < 1) return;
    stopAnimation();
    document.body.classList.add('expanded');
    wrapper.style.width = '100%';
    sidebar.style.transition = 'none';
    const speed = currentConfig?.transforms?.animation_speed || 1;
    const duration = 300 / speed, startTime = performance.now();
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4); // 缓动函数
    const startProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));

    // 动画帧函数
    function animate(currentTime) {
        if (!document.body.classList.contains('expanded')) { animationId = null; return; }
        const elapsed = currentTime - startTime, t = Math.min(1, elapsed / duration);
        const p = startProgress + (1 - startProgress) * easeOutQuart(t);
        if (t >= 1) { updateSidebarStyles(1); animationId = null; finishExpand(); }
        else { updateSidebarStyles(p); animationId = requestAnimationFrame(animate); }
    }
    animationId = requestAnimationFrame(animate);
}

/**
 * 完成展开后的清理工作
 */
function finishExpand() {
    if (document.body.classList.contains('expanded')) {
        wrapper.style.width = '';
        sidebar.style.transition = '';
    }
}

/**
 * 收起侧边栏
 */
function collapse() {
    stopAnimation();
    wrapper.style.width = '100%';
    sidebar.style.transition = 'none';
    document.body.classList.remove('expanded');
    const speed = currentConfig?.transforms?.animation_speed || 1;
    const duration = 300 / speed, startTime = performance.now();
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
    const currentW = parseFloat(sidebar.style.width) || START_W;
    const startProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));

    function animate(currentTime) {
        if (document.body.classList.contains('expanded')) { animationId = null; return; }
        const elapsed = currentTime - startTime, t = Math.min(1, elapsed / duration);
        const p = startProgress * (1 - easeOutQuart(t));
        if (t >= 1) { updateSidebarStyles(0); animationId = null; finishCollapse(); }
        else { updateSidebarStyles(p); animationId = requestAnimationFrame(animate); }
    }
    animationId = requestAnimationFrame(animate);
}

/**
 * 完成收起后的清理工作
 */
function finishCollapse() {
    if (!document.body.classList.contains('expanded')) {
        window.electronAPI.resizeWindow(20, START_H + 40);
        setIgnoreMouse(false);
        wrapper.style.width = '';
        sidebar.style.transition = '';
        // 清除样式，恢复初始状态
        ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebar.style[p] = '');
    }
}

// 事件监听绑定
// 辅助函数：判断是否为交互元素
function isInteractive(target) {
    return target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('.launcher-item') ||
        target.closest('.volume-slider-container');
}

// 事件监听绑定
wrapper.addEventListener('mousedown', (e) => {
    // 如果是展开状态且点击了交互元素，则允许默认行为（如滑块拖动、按钮点击），不触发侧边栏拖拽
    if (document.body.classList.contains('expanded') && isInteractive(e.target)) {
        return;
    }
    e.preventDefault();
    handleStart(e.screenX);
});

wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        if (document.body.classList.contains('expanded') && isInteractive(e.target)) {
            // 对于触摸事件，如果是交互元素，我们允许冒泡，不阻止默认行为（除非需要防止滚动等）
            // 但这里主要是不进入 handleStart
            return;
        }
        e.preventDefault();
        handleStart(e.touches[0].screenX);
    }
}, { passive: false });

window.addEventListener('mousemove', (e) => handleMove(e.screenX));
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        // 只有在拖拽侧边栏时才阻止默认行为
        if (isDragging) {
            e.preventDefault();
            handleMove(e.touches[0].screenX);
        }
    }
}, { passive: false });

window.addEventListener('mouseup', (e) => handleEnd(e.screenX));
window.addEventListener('touchend', (e) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null));
window.addEventListener('contextmenu', (e) => e.preventDefault());
// 点击侧边栏外部区域收起
window.addEventListener('mousedown', (e) => { if (document.body.classList.contains('expanded') && !sidebar.contains(e.target)) collapse(); });
// 窗口失去焦点时收起
window.addEventListener('blur', () => { if (document.body.classList.contains('expanded')) collapse(); });

// 拖拽相关定时器
let dragLeaveTimer = null;

// 监听外部拖拽进入（如拖动文件），自动展开侧边栏
window.addEventListener('dragenter', (e) => {
    // 进入时清除收起定时器
    if (dragLeaveTimer) {
        clearTimeout(dragLeaveTimer);
        dragLeaveTimer = null;
    }

    if (isDragging || document.body.classList.contains('expanded')) return;
    // 检查是否有拖拽数据
    if (e.dataTransfer && e.dataTransfer.types.length > 0) {
        expand();
    }
});

// 拖拽悬停时阻止默认行为并确保鼠标不穿透
window.addEventListener('dragover', (e) => {
    e.preventDefault();
    setIgnoreMouse(false);

    // 持续悬停时清除收起定时器
    if (dragLeaveTimer) {
        clearTimeout(dragLeaveTimer);
        dragLeaveTimer = null;
    }
});

// 拖拽离开时延迟收起
window.addEventListener('dragleave', (e) => {
    // 延迟收起，防止鼠标在子元素间移动时误触发收起
    if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
    dragLeaveTimer = setTimeout(() => {
        // 如果侧边栏是展开状态且没有在进行内部拖拽，则收起
        // 注意：这里我们假设如果是外部拖拽离开，就应该收起
        if (document.body.classList.contains('expanded') && !isDragging) {
            collapse();
        }
    }, 150); // 150ms 延迟足够处理子元素切换
});

// 拖放结束（放下）时收起
window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
    // 这里未来可以处理文件放置逻辑
    // 目前先统一收起，恢复初始状态
    collapse();
});

loadConfig();
