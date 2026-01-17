import { useState, useRef, useEffect, useCallback } from 'react';

const useLongPress = (handleDragStart, handleDragOver, handleDrop) => {
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [draggedRecently, setDraggedRecently] = useState(false);
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

    const longPressTimer = useRef(null);
    const initialTouchPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    const handlePointerDown = useCallback((e, index) => {
        if (e.pointerType === 'touch') {
            initialTouchPos.current = { x: e.clientX, y: e.clientY };
            if (longPressTimer.current) clearTimeout(longPressTimer.current);

            longPressTimer.current = setTimeout(() => {
                setIsLongPressing(true);
                handleDragStart(null, index);
                if (window.navigator.vibrate) window.navigator.vibrate(50);
            }, 500);
        }
    }, [handleDragStart]);

    const handlePointerMove = useCallback((e) => {
        if (longPressTimer.current && !isLongPressing) {
            const dist = Math.sqrt(
                Math.pow(e.clientX - initialTouchPos.current.x, 2) +
                Math.pow(e.clientY - initialTouchPos.current.y, 2)
            );
            if (dist > 10) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }

        if (isLongPressing) {
            setPointerPos({ x: e.clientX, y: e.clientY });
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const item = target?.closest('[data-widget-index]');
            if (item) {
                const overIndex = parseInt(item.getAttribute('data-widget-index'));
                if (!isNaN(overIndex)) {
                    handleDragOver(null, overIndex);
                }
            }
        }
    }, [isLongPressing, handleDragOver]);

    const handlePointerUp = useCallback((dragOverIndex) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPressing) {
            handleDrop(null, dragOverIndex);
            setDraggedRecently(true);
            setTimeout(() => setDraggedRecently(false), 100);
        }
    }, [isLongPressing, handleDrop]);

    return {
        isLongPressing,
        draggedRecently,
        pointerPos,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    };
};

export default useLongPress;
