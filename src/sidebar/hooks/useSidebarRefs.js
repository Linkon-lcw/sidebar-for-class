import { useRef } from 'react';

const useSidebarRefs = () => {
    const sidebarRef = useRef(null);
    const wrapperRef = useRef(null);
    const animationIdRef = useRef(null);

    const draggingState = useRef({
        isDragging: false,
        isSwipeActive: false,
        startX: 0,
        lastX: 0,
        lastTime: 0,
        startTimeStamp: 0,
        currentVelocity: 0,
        lastIgnoreState: null,
        lastResizeTime: 0
    });

    const constants = {
        BASE_START_W: 4,
        BASE_START_H: 64,
        TARGET_W: 400,
        TARGET_H: 450,
        THRESHOLD: 60,
        VELOCITY_THRESHOLD: 0.5
    };

    return {
        sidebarRef,
        wrapperRef,
        animationIdRef,
        draggingState,
        constants
    };
};

export default useSidebarRefs;
