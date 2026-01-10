/**
 * 渲染进程逻辑
 */

const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');

let isDragging = false;
let startX = 0;
let lastLogTime = 0;
const THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.3;

let lastX = 0;
let lastTime = 0;
let currentConfig = null;
let animationId = null;
let currentVelocity = 0;
let startTimeStamp = 0;
let lastIgnoreState = null;

function setIgnoreMouse(ignore) {
    if (ignore !== lastIgnoreState) {
        lastIgnoreState = ignore;
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        setIgnoreMouse(false);
        return;
    }
    const isExpanded = document.body.classList.contains('expanded');
    let shouldIgnore = true;
    if (isExpanded) {
        const rect = sidebar.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    } else {
        const rect = wrapper.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            shouldIgnore = false;
        }
    }
    setIgnoreMouse(shouldIgnore);
});

window.addEventListener('mouseleave', () => setIgnoreMouse(true));

let START_W = 4, START_H = 64;
const TARGET_W = 400, TARGET_H = 450;

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        currentConfig = config;
        if (config.transforms) {
            if (typeof config.transforms.height === 'number') {
                START_H = config.transforms.height;
                updateSidebarStyles(0);
            }
            if (typeof config.transforms.animation_speed === 'number') {
                const speed = config.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        renderWidgets(config.widgets);
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

function updateSidebarStyles(progress) {
    progress = Math.max(0, Math.min(1, progress));
    const currentWidth = START_W + (TARGET_W - START_W) * progress;
    const currentHeight = START_H + (TARGET_H - START_H) * progress;
    const currentRadius = 4 + (12 * progress);
    const currentMargin = 6 + (6 * progress);

    sidebar.style.width = `${currentWidth}px`;
    sidebar.style.height = `${currentHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

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

        const startCenterY = screenY + posy;
        const safeCenterY = Math.max(screenY + TARGET_H / 2 + 20, Math.min(screenY + screenH - TARGET_H / 2 - 20, startCenterY));
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);

        if (progress === 0 || progress === 1) window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        else throttledResize(targetWinW, targetWinH, newWindowY);
    }

    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
}

let lastResizeTime = 0;
function throttledResize(w, h, y) {
    if (Date.now() - lastResizeTime > 16) {
        window.electronAPI.resizeWindow(w, h, y);
        lastResizeTime = Date.now();
    }
}

const handleStart = (clientX) => {
    if (document.body.classList.contains('expanded') && !animationId) return;
    isDragging = true;
    if (animationId) {
        const currentW = parseFloat(sidebar.style.width) || START_W;
        const currentProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));
        startX = clientX - (currentProgress * 250);
        stopAnimation();
    } else startX = clientX;
    lastX = clientX;
    lastTime = performance.now();
    startTimeStamp = lastTime;
    currentVelocity = 0;
    setIgnoreMouse(false);
    const currentW = parseFloat(sidebar.style.width) || START_W;
    window.electronAPI.resizeWindow(Math.max(Math.floor(currentW + 100), 200), START_H + 100);
    wrapper.style.width = '500px';
    sidebar.style.transition = 'none';
};

const handleMove = (clientX) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) currentVelocity = (clientX - lastX) / dt;
    lastX = clientX;
    lastTime = now;
    const deltaX = clientX - startX;
    if (deltaX > 0) updateSidebarStyles(Math.min(deltaX / 250, 1));
};

const handleEnd = (clientX) => {
    if (!isDragging) return;
    isDragging = false;
    const deltaX = clientX ? (clientX - startX) : 0;
    const duration = performance.now() - startTimeStamp;
    if (deltaX > THRESHOLD || currentVelocity > VELOCITY_THRESHOLD || (duration < 200 && deltaX > 20)) expand();
    else collapse();
};

function expand() {
    const currentW = parseFloat(sidebar.style.width) || START_W;
    if (document.body.classList.contains('expanded') && !isDragging && !animationId && Math.abs(currentW - TARGET_W) < 1) return;
    stopAnimation();
    document.body.classList.add('expanded');
    wrapper.style.width = '100%';
    sidebar.style.transition = 'none';
    const speed = currentConfig?.transforms?.animation_speed || 1;
    const duration = 300 / speed, startTime = performance.now();
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
    const startProgress = Math.max(0, Math.min(1, (currentW - START_W) / (TARGET_W - START_W)));

    function animate(currentTime) {
        if (!document.body.classList.contains('expanded')) { animationId = null; return; }
        const elapsed = currentTime - startTime, t = Math.min(1, elapsed / duration);
        const p = startProgress + (1 - startProgress) * easeOutQuart(t);
        if (t >= 1) { updateSidebarStyles(1); animationId = null; finishExpand(); }
        else { updateSidebarStyles(p); animationId = requestAnimationFrame(animate); }
    }
    animationId = requestAnimationFrame(animate);
}

function finishExpand() {
    if (document.body.classList.contains('expanded')) {
        wrapper.style.width = '';
        sidebar.style.transition = '';
    }
}

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

function finishCollapse() {
    if (!document.body.classList.contains('expanded')) {
        window.electronAPI.resizeWindow(20, START_H + 40);
        setIgnoreMouse(false);
        wrapper.style.width = '';
        sidebar.style.transition = '';
        ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebar.style[p] = '');
    }
}

wrapper.addEventListener('mousedown', (e) => { e.preventDefault(); handleStart(e.clientX); });
wrapper.addEventListener('touchstart', (e) => { if (e.touches.length > 0) { e.preventDefault(); handleStart(e.touches[0].clientX); } }, { passive: false });
window.addEventListener('mousemove', (e) => handleMove(e.clientX));
window.addEventListener('touchmove', (e) => { if (e.touches.length > 0) { if (isDragging) e.preventDefault(); handleMove(e.touches[0].clientX); } }, { passive: false });
window.addEventListener('mouseup', (e) => handleEnd(e.clientX));
window.addEventListener('touchend', (e) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].clientX : null));
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousedown', (e) => { if (document.body.classList.contains('expanded') && !sidebar.contains(e.target)) collapse(); });
window.addEventListener('blur', () => { if (document.body.classList.contains('expanded')) collapse(); });

loadConfig();
