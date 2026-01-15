/**
 * 侧边栏动画逻辑
 */

export function createAnimationManager(sidebar, wrapper, state, uiUpdater) {
    let animationId = null;

    const stopAnimation = () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    const finishExpand = () => {
        if (document.body.classList.contains('expanded')) {
            wrapper.style.width = '';
            sidebar.style.transition = '';
        }
    };

    const finishCollapse = (SCALE, START_H, setIgnoreMouse) => {
        if (!document.body.classList.contains('expanded')) {
            window.electronAPI.resizeWindow(20 * SCALE, (START_H + 40) * SCALE);
            setIgnoreMouse(false);
            wrapper.style.width = '';
            sidebar.style.transition = '';
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebar.style[p] = '');
        }
    };

    const expand = (currentConfig, START_W, TARGET_W, START_H, TARGET_H, SCALE, setIgnoreMouse, throttledResize) => {
        const baseW = parseFloat(sidebar.style.width) || START_W;
        if (document.body.classList.contains('expanded') && !state.isDragging && !animationId && Math.abs(baseW - TARGET_W) < 1) return;

        stopAnimation();
        document.body.classList.add('expanded');
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';

        const speed = currentConfig?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        function animate(currentTime) {
            if (!document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);

            if (t >= 1) {
                uiUpdater(1);
                animationId = null;
                finishExpand();
            } else {
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        }
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    const collapse = (START_W, TARGET_W, START_H, SCALE, setIgnoreMouse, throttledResize) => {
        stopAnimation();
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';
        document.body.classList.remove('expanded');

        const baseW = parseFloat(sidebar.style.width) || START_W;
        const speed = 1; // Default speed or from config
        const duration = 300; // Simplified
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        function animate(currentTime) {
            if (document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress * (1 - easeOutQuart(t));

            if (t >= 1) {
                uiUpdater(0);
                animationId = null;
                finishCollapse(SCALE, START_H, setIgnoreMouse);
            } else {
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        }
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    return { expand, collapse, stopAnimation };
}
