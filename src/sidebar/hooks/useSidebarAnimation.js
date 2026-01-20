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

    const calculateLayout = useCallback((progress) => {
        if (!config?.transforms || !config?.displayBounds) return null;
        
        const { posy } = config.transforms;
        const { y: screenY, height: screenH } = config.displayBounds;

        // Calculate Target Window Dimensions (Max Size)
        const expandedWinH = (TARGET_H + 120) * scale;
        const targetWinW = Math.floor(TARGET_W + 100 * scale); // Max Width
        const targetWinH = Math.ceil(TARGET_H + 40 * scale);   // Max Height

        // Calculate Centers
        const startCenterY = screenY + posy;
        const safeCenterY = Math.max(
            screenY + expandedWinH / 2 + 20,
            Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)
        );

        // Interpolate CenterY based on progress
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;

        // Final Window Position (at progress = 1)
        const finalWindowY = safeCenterY - (targetWinH / 2);

        return {
            targetWinW,
            targetWinH,
            finalWindowY,
            currentCenterY,
            safeCenterY,
            startCenterY
        };
    }, [config, scale, TARGET_W, TARGET_H]);

    const setWindowToLarge = useCallback(() => {
        if (!window.electronAPI) return;
        const layout = calculateLayout(1);
        if (layout) {
            window.electronAPI.resizeWindow(layout.targetWinW, layout.targetWinH, layout.finalWindowY);
        }
    }, [calculateLayout]);

    const setWindowToSmall = useCallback(() => {
        if (!window.electronAPI) return;
        // Small Window Size
        window.electronAPI.resizeWindow(20 * scale, (startH + 40) * scale);
    }, [scale, startH]);

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
            const layout = calculateLayout(progress);
            if (layout) {
                // We assume the window is at the "Final" position (Large).
                // Window Center is layout.safeCenterY.
                // We want Sidebar Center to be at layout.currentCenterY.
                const offsetY = layout.currentCenterY - layout.safeCenterY;
                wrapperRef.current.style.transform = `translateY(${offsetY}px)`;
            }
        }

        const gray = Math.floor(156 + (255 - 156) * progress);
        sidebarRef.current.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
    }, [config, scale, startH, sidebarRef, wrapperRef, BASE_START_W, TARGET_W, TARGET_H, calculateLayout]);

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
            wrapperRef.current.style.transform = ''; // Reset transform
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
