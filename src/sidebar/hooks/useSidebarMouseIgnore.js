import { useEffect } from 'react';

const useSidebarMouseIgnore = (isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse) => {
    useEffect(() => {
        const onMouseMove = (e) => {
            const ds = draggingState.current;
            if (ds.isDragging || animationIdRef.current) {
                setIgnoreMouse(false);
                return;
            }

            let shouldIgnore = true;
            if (isExpanded) {
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            } else {
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    // 允许左右各有 6px 的额外触发区域
                    if (e.clientX >= rect.left - 6 && e.clientX <= rect.right + 6 && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            }
            setIgnoreMouse(shouldIgnore);
        };

        const onMouseLeave = () => setIgnoreMouse(true);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse]);
};

export default useSidebarMouseIgnore;
