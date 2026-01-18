/**
 * 组件选择 Hook
 * 管理组件的选择状态和标签页切换
 * @param {string} initialActiveTab - 初始激活的标签页，默认为 'properties'
 * @returns {Object} 包含选择状态和处理函数的对象
 */

import { useState, useCallback } from 'react';

const useWidgetSelection = (initialActiveTab = 'properties') => {
    // 当前激活的标签页
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    // 当前选中的组件索引
    const [selectedWidgetIndex, setSelectedWidgetIndex] = useState(null);

    // 处理组件点击事件：选中组件并切换到属性标签页
    const handleWidgetClick = useCallback((e, index, draggedRecently) => {
        e.stopPropagation();
        // 如果最近发生过拖拽，不执行选中操作（避免拖拽结束时的误触）
        if (draggedRecently) return;
        setSelectedWidgetIndex(index);
        setActiveTab('properties');
    }, []);

    // 清除选中状态
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
