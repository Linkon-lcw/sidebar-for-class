/**
 * 侧边栏 UI 样式更新逻辑
 */

export function updateSidebarStyles(sidebar, currentConfig, progress, START_W, TARGET_W, START_H, TARGET_H, SCALE, setIgnoreMouse, throttledResize) {
    progress = Math.max(0, Math.min(1, progress));

    const baseWidth = START_W + (TARGET_W - START_W) * progress;
    const baseHeight = START_H + (TARGET_H - START_H) * progress;
    const currentRadius = 4 + (12 * progress);
    const currentMargin = 6 + (6 * progress);

    sidebar.style.width = `${baseWidth}px`;
    sidebar.style.height = `${baseHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

    if (currentConfig?.transforms && currentConfig?.displayBounds) {
        const { posy } = currentConfig.transforms;
        const { y: screenY, height: screenH } = currentConfig.displayBounds;
        let targetWinW, targetWinH;

        if (progress <= 0) {
            targetWinW = 20 * SCALE;
            targetWinH = (START_H + 40) * SCALE;
            setIgnoreMouse(false);
        } else {
            const rect = sidebar.getBoundingClientRect();
            targetWinW = Math.floor(rect.width + 100 * SCALE);
            targetWinH = Math.ceil(rect.height + 40 * SCALE);
        }

        const startCenterY = screenY + posy;
        const expandedWinH = (TARGET_H + 120) * SCALE;
        const safeCenterY = Math.max(
            screenY + expandedWinH / 2 + 20,
            Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)
        );
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);

        if (progress === 0 || progress === 1) window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        else throttledResize(targetWinW, targetWinH, newWindowY);
    }

    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
}
