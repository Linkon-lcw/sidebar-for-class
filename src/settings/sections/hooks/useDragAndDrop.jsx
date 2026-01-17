import { useState, useCallback } from 'react';

const useDragAndDrop = (config, updateConfig, setSelectedWidgetIndex) => {
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = useCallback((e, index) => {
        setSelectedWidgetIndex(null);
        setDraggingIndex(index);
        if (e && e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    }, [setSelectedWidgetIndex]);

    const handleDragOver = useCallback((e, index) => {
        if (e) e.preventDefault();
        if (draggingIndex === index || draggingIndex === null) return;
        setDragOverIndex(index);
    }, [draggingIndex]);

    const handleDragEnd = useCallback(() => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e, targetIndex) => {
        if (e) e.preventDefault();
        if (draggingIndex === null || draggingIndex === targetIndex) {
            setDraggingIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newWidgets = [...config.widgets];
        const draggedItem = newWidgets[draggingIndex];

        newWidgets.splice(draggingIndex, 1);

        if (targetIndex >= config.widgets.length) {
            newWidgets.push(draggedItem);
        } else {
            newWidgets.splice(targetIndex, 0, draggedItem);
        }

        updateConfig({
            ...config,
            widgets: newWidgets
        });

        setDraggingIndex(null);
        setDragOverIndex(null);
    }, [config, updateConfig, draggingIndex]);

    return {
        draggingIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    };
};

export default useDragAndDrop;
