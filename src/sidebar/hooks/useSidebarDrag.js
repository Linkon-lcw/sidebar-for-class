import { useCallback } from 'react';

const useSidebarDrag = (isExpanded, updateSidebarStyles, expand, collapse, stopAnimation, setIgnoreMouse, sidebarRef, wrapperRef, animationIdRef, draggingState, constants) => {
    const { BASE_START_W, TARGET_W, VELOCITY_THRESHOLD } = constants;

    const activateDragVisuals = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '500px';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
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
            const currentProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));
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
        if (dt > 0) ds.currentVelocity = (currentX - ds.lastX) / dt;
        ds.lastX = currentX;
        ds.lastTime = now;

        if (!ds.isSwipeActive) {
            if (ds.currentVelocity < -0.8) {
                ds.isSwipeActive = true;
                activateDragVisuals();
            } else {
                return;
            }
        }

        const deltaX = currentX - ds.startX;
        updateSidebarStyles(deltaX / 250);
    }, [updateSidebarStyles, draggingState, activateDragVisuals]);

    const handleEnd = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;
        ds.isDragging = false;

        if (!ds.isSwipeActive) return;

        const deltaX = currentX ? (currentX - ds.startX) : 0;
        const duration = performance.now() - ds.startTimeStamp;

        if (ds.currentVelocity < -VELOCITY_THRESHOLD) {
            collapse();
            return;
        }

        if (deltaX > 60 || ds.currentVelocity > VELOCITY_THRESHOLD || (duration < 200 && deltaX > 20)) {
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
