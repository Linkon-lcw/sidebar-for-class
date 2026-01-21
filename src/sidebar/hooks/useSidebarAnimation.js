import { useState, useCallback, useEffect } from 'react';

const useSidebarAnimation = (config, scale, startH, targetW, targetH, sidebarRef, wrapperRef, animationIdRef, draggingState, constants) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { BASE_START_W } = constants;

    const setIgnoreMouse = (ignore) => {
        if (window.electronAPI && ignore !== draggingState.current.lastIgnoreState) {
            draggingState.current.lastIgnoreState = ignore;
            window.electronAPI.setIgnoreMouse(ignore, true);
        }
    };

    const updateSidebarStyles = useCallback((progress) => {
        if (!sidebarRef.current) return;

        progress = Math.max(0, Math.min(1, progress));

        const currentW = BASE_START_W + (targetW - BASE_START_W) * progress;
        const currentH = startH + (targetH - startH) * progress;
        const currentRadius = 4 + (12 * progress);
        const currentMargin = 6 + (6 * progress);

        sidebarRef.current.style.width = `${currentW}px`;
        sidebarRef.current.style.height = `${currentH}px`;
        sidebarRef.current.style.borderRadius = `${currentRadius}px`;
        sidebarRef.current.style.marginLeft = `${currentMargin}px`;

        // 控制内容容器的透明度，实现平滑的显示/隐藏效果
        const contentElement = sidebarRef.current.querySelector('#content');
        if (contentElement) {
            contentElement.style.opacity = `${progress}`;
            contentElement.style.pointerEvents = progress > 0.1 ? 'auto' : 'none';
        }

        if (config?.transforms && config?.displayBounds) {
            if (!window.electronAPI) return;
            const { posy } = config.transforms;
            const { y: screenY, height: screenH } = config.displayBounds;
            let targetWinW, targetWinH;

            if (progress <= 0) {
                targetWinW = 20 * scale;
                targetWinH = (startH + 40) * scale;
            } else {
                const rect = sidebarRef.current.getBoundingClientRect();
                targetWinW = Math.floor(rect.width + 100 * scale);
                targetWinH = Math.ceil(rect.height + 40 * scale);
            }

            const startCenterY = screenY + posy;
            const expandedWinH = (targetH + 120) * scale;
            const safeCenterY = Math.max(
                screenY + expandedWinH / 2 + 20,
                Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)
            );
            const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
            const newWindowY = currentCenterY - (targetWinH / 2);

            if (progress === 0 || progress === 1) {
                window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
            } else {
                if (Date.now() - draggingState.current.lastResizeTime > 16) {
                    window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
                    draggingState.current.lastResizeTime = Date.now();
                }
            }
        }

        const gray = Math.floor(156 + (255 - 156) * progress);
        const targetOpacity = config?.transforms?.panel?.opacity || 0.9;
        const startOpacity = 0.6; // 收起状态的透明度
        const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
        sidebarRef.current.style.background = `rgba(${gray}, ${gray}, ${gray}, ${currentOpacity})`;
    }, [config, scale, startH, targetW, targetH, sidebarRef, draggingState, BASE_START_W]);

    const stopAnimation = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
    };

    const finishExpand = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) sidebarRef.current.style.transition = '';
    };

    const finishCollapse = () => {
        window.electronAPI.resizeWindow(20 * scale, (startH + 40) * scale);
        setIgnoreMouse(false);
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = '';
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebarRef.current.style[p] = '');
        }
    };

    const expand = () => {
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        if (isExpanded && !draggingState.current.isDragging && !animationIdRef.current && Math.abs(baseW - targetW) < 1) return;

        stopAnimation();
        setIsExpanded(true);
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (targetW - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);
            if (t >= 1) {
                updateSidebarStyles(1);
                animationIdRef.current = null;
                finishExpand();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    const collapse = () => {
        stopAnimation();
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        setIsExpanded(false);

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (targetW - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress * (1 - easeOutQuart(t));
            if (t >= 1) {
                updateSidebarStyles(0);
                animationIdRef.current = null;
                finishCollapse();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        updateSidebarStyles(isExpanded ? 1 : 0);
    }, [isExpanded, scale, startH, targetW, targetH, updateSidebarStyles]);

    return {
        isExpanded,
        expand,
        collapse,
        updateSidebarStyles,
        stopAnimation,
        setIgnoreMouse
    };
};

export default useSidebarAnimation;
