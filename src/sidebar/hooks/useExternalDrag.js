import { useEffect } from 'react';

const useExternalDrag = (isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config) => {
    useEffect(() => {
        let dragLeaveTimer = null;

        const onDragEnter = (e) => {
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
            if (draggingState.current.isDragging || isExpanded) return;

            // 检查是否在侧边栏及其 6px 缓冲区内
            if (sidebarRef.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                if (e.clientX < rect.left - 6 || e.clientX > rect.right + 6 || e.clientY < rect.top || e.clientY > rect.bottom) {
                    return;
                }
            }

            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                window.electronAPI.setAlwaysOnTop(false);
                expand();
            }
        };

        const onDragOver = (e) => {
            e.preventDefault();
            
            // 检查是否在侧边栏及其 6px 缓冲区内
            if (!isExpanded && sidebarRef.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                if (e.clientX < rect.left - 6 || e.clientX > rect.right + 6 || e.clientY < rect.top || e.clientY > rect.bottom) {
                    setIgnoreMouse(true);
                    return;
                }
            }

            setIgnoreMouse(false);
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
        };

        const onDragLeave = () => {
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            dragLeaveTimer = setTimeout(() => {
                if (isExpanded && !draggingState.current.isDragging) {
                    collapse();
                    window.electronAPI.setAlwaysOnTop(true);
                }
            }, 150);
        };

        const onDrop = (e) => {
            e.preventDefault();
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            collapse();
            window.electronAPI.setAlwaysOnTop(true);
        };

        const onWindowMouseDown = (e) => {
            if (isExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target) && config?.auto_hide) {
                collapse();
            }
        };

        const onBlur = () => {
            if (isExpanded && config?.auto_hide) collapse();
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('mousedown', onWindowMouseDown);
        window.addEventListener('blur', onBlur);
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
            window.removeEventListener('mousedown', onWindowMouseDown);
            window.removeEventListener('blur', onBlur);
        };
    }, [isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config]);
};

export default useExternalDrag;
