import { useEffect } from 'react';

const useGlobalEvents = (handleMove, handleEnd, draggingState) => {
    useEffect(() => {
        const onMouseMove = (e) => handleMove(e.screenX);
        const onMouseUp = (e) => handleEnd(e.screenX);
        const onTouchMove = (e) => {
            if (e.touches.length > 0 && draggingState.current.isDragging) {
                handleMove(e.touches[0].screenX);
            }
        };
        const onTouchEnd = (e) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handleMove, handleEnd, draggingState]);
};

export default useGlobalEvents;
