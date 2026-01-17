import { useState, useCallback } from 'react';

const useWidgetSelection = (initialActiveTab = 'properties') => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [selectedWidgetIndex, setSelectedWidgetIndex] = useState(null);

    const handleWidgetClick = useCallback((e, index, draggedRecently) => {
        e.stopPropagation();
        if (draggedRecently) return;
        setSelectedWidgetIndex(index);
        setActiveTab('properties');
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedWidgetIndex(null);
    }, []);

    return {
        activeTab,
        setActiveTab,
        selectedWidgetIndex,
        setSelectedWidgetIndex,
        handleWidgetClick,
        clearSelection
    };
};

export default useWidgetSelection;
