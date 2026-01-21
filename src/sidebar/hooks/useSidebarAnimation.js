import { useState, useCallback, useEffect } from 'react';

const useSidebarAnimation = (config, scale, startH, sidebarRef, wrapperRef, animationIdRef, draggingState, constants) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { BASE_START_W, TARGET_W, TARGET_H } = constants;

    const setIgnoreMouse = (ignore) => {
        if (window.electronAPI && ignore !== draggingState.current.lastIgnoreState) {
            draggingState.current.lastIgnoreState = ignore;
            window.electronAPI.setIgnoreMouse(ignore, true);
        }
    };

    const calculateLayout = useCallback((progress, windowType = 'large') => {
        if (!config?.transforms || !config?.displayBounds) return null;
        
        const { posy } = config.transforms;
        const { y: screenY, height: screenH } = config.displayBounds;

        // Calculate Window Dimensions
        const winW = (windowType === 'large')
            ? Math.floor(TARGET_W * scale + 100)
            : Math.floor(20 * scale);
        const winH = (windowType === 'large')
            ? Math.ceil(TARGET_H * scale + 40)
            : Math.ceil((startH + 40) * scale);

        // Sidebar current visual height
        const currentSidebarH = (startH + (TARGET_H - startH) * progress) * scale;

        // Target center position (absolute)
        const startCenterY = screenY + posy;

        // Window Center (clamped to keep window on screen)
        const safeCenterY = Math.max(
            screenY + winH / 2,
            Math.min(screenY + screenH - winH / 2, startCenterY)
        );

        // Final Window Y Position
        const windowY = safeCenterY - (winH / 2);

        // Calculate offsetY to align sidebar center with startCenterY
        let offsetY = startCenterY - safeCenterY;

        // Clamp offsetY to prevent sidebar from being clipped by window bounds
        const maxOffset = Math.max(0, (winH - currentSidebarH) / 2);
        offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));

        return {
            targetWinW: winW,
            targetWinH: winH,
            finalWindowY: windowY,
            offsetY,
            safeCenterY,
            startCenterY
        };
    }, [config, scale, startH, TARGET_W, TARGET_H]);

    const setWindowToLarge = useCallback(() => {
        if (!window.electronAPI) return;
        const layout = calculateLayout(1, 'large');
        if (layout) {
            window.electronAPI.resizeWindow(layout.targetWinW, layout.targetWinH, layout.finalWindowY);
        }
    }, [calculateLayout]);

    const setWindowToSmall = useCallback(() => {
        if (!window.electronAPI) return;
        const layout = calculateLayout(0, 'small');
        if (layout) {
            window.electronAPI.resizeWindow(layout.targetWinW, layout.targetWinH, layout.finalWindowY);
        }
    }, [calculateLayout]);

    const updateSidebarStyles = useCallback((progress) => {
        if (!sidebarRef.current) return;

        progress = Math.max(0, Math.min(1, progress));

        const currentW = BASE_START_W + (TARGET_W - BASE_START_W) * progress;
        const currentH = startH + (TARGET_H - startH) * progress;
        const currentRadius = 4 + (12 * progress);
        const currentMargin = 6 + (6 * progress);

        sidebarRef.current.style.width = `${currentW}px`;
        sidebarRef.current.style.height = `${currentH}px`;
        sidebarRef.current.style.borderRadius = `${currentRadius}px`;
        sidebarRef.current.style.marginLeft = `${currentMargin}px`;

        // Handle visual position offset (compensate for Window Center shift)
        if (wrapperRef.current && config?.transforms && config?.displayBounds) {
            // During animation we are in 'large' window
            const windowType = (progress > 0 || isExpanded) ? 'large' : 'small';
            const layout = calculateLayout(progress, windowType);
            if (layout) {
                wrapperRef.current.style.transform = `translateY(${layout.offsetY}px)`;
            }
        }

        const gray = Math.floor(156 + (255 - 156) * progress);
        sidebarRef.current.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
    }, [config, scale, startH, sidebarRef, wrapperRef, BASE_START_W, TARGET_W, TARGET_H, calculateLayout, isExpanded]);

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
        setWindowToSmall();
        setIgnoreMouse(false);
        if (wrapperRef.current) {
            wrapperRef.current.style.width = '';
            // Do not reset transform here, as it might contain the offsetY for clamped positions
        }
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = '';
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebarRef.current.style[p] = '');
        }
    };

    const expand = () => {
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        if (isExpanded && !draggingState.current.isDragging && !animationIdRef.current && Math.abs(baseW - TARGET_W) < 1) return;

        stopAnimation();
        setIsExpanded(true);
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';

        // Immediately resize window to Large
        setWindowToLarge();

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

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
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

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
    }, [isExpanded, scale, startH, updateSidebarStyles]);

    return {
        isExpanded,
        expand,
        collapse,
        updateSidebarStyles,
        stopAnimation,
        setIgnoreMouse,
        setWindowToLarge // Exported for drag
    };
};

export default useSidebarAnimation;
