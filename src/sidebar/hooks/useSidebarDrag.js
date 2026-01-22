import { useCallback } from 'react';

const useSidebarDrag = (isExpanded, updateSidebarStyles, expand, collapse, stopAnimation, setIgnoreMouse, sidebarRef, wrapperRef, animationIdRef, draggingState, constants, panelWidth, setWindowToLarge) => {
    const { BASE_START_W, VELOCITY_THRESHOLD } = constants;

    const activateDragVisuals = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '500px';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        if (setWindowToLarge) setWindowToLarge();
    };

    const handleStart = (currentX, target) => {
        const isInteractive = (el) => {
            return el.tagName === 'INPUT' ||
                el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                el.closest('.launcher-item') ||
                el.closest('.volume-slider-container');
        };

        if (isExpanded && isInteractive(target)) return;

        const ds = draggingState.current;
        ds.isDragging = true;
        ds.lastX = currentX;
        ds.lastTime = performance.now();
        ds.startTimeStamp = ds.lastTime;
        ds.currentVelocity = 0;
        setIgnoreMouse(false);

        ds.isSwipeActive = true;

        if (animationIdRef.current) {
            const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
            const currentProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (panelWidth - BASE_START_W)));
            ds.startX = currentX - (currentProgress * 250);
            stopAnimation();
        } else {
            if (isExpanded) {
                ds.isSwipeActive = false;
                ds.startX = currentX - 250;
            } else {
                ds.startX = currentX;
            }
        }

        if (ds.isSwipeActive) activateDragVisuals();
    };

    const handleMove = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;

        const now = performance.now();
        const dt = now - ds.lastTime;
        if (dt > 0) {
            // 使用简单的平滑处理
            const instantVelocity = (currentX - ds.lastX) / dt;
            ds.currentVelocity = ds.currentVelocity * 0.3 + instantVelocity * 0.7;
        }
        ds.lastX = currentX;
        ds.lastTime = now;

        const deltaXTotal = currentX - ds.startX;
        const deltaXFromStart = isExpanded ? (deltaXTotal - 250) : deltaXTotal;

        if (!ds.isSwipeActive) {
            // 如果移动距离超过 10px 或者速度超过某一阈值，则激活滑动
            if (Math.abs(deltaXFromStart) > 10 || Math.abs(ds.currentVelocity) > 0.3) {
                ds.isSwipeActive = true;
                activateDragVisuals();
            } else {
                return;
            }
        }

        const deltaX = currentX - ds.startX;
        updateSidebarStyles(deltaX / 250);
    }, [updateSidebarStyles, draggingState, activateDragVisuals, isExpanded]);

    const handleEnd = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;
        ds.isDragging = false;

        if (!ds.isSwipeActive) return;

        const finalX = currentX || ds.lastX;
        const deltaX = finalX - ds.startX;
        const duration = performance.now() - ds.startTimeStamp;

        // 根据速度和距离判断最终状态
        // 1. 如果向左快速划
        if (ds.currentVelocity < -VELOCITY_THRESHOLD) {
            collapse();
            return;
        }

        // 2. 如果向右快速划，或者滑动距离超过门槛，或者快速短促滑动
        if (ds.currentVelocity > VELOCITY_THRESHOLD || deltaX > 120 || (duration < 250 && deltaX > 30)) {
            expand();
        } else {
            collapse();
        }
    }, [expand, collapse, draggingState, VELOCITY_THRESHOLD]);

    return {
        handleStart,
        handleMove,
        handleEnd
    };
};

export default useSidebarDrag;
