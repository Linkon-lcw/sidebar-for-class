/**
 * 拖拽排序 Hook
 * 管理组件的拖拽排序功能，支持桌面端的拖放操作
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Function} setSelectedWidgetIndex - 设置选中组件索引的函数
 * @returns {Object} 包含拖拽状态和处理函数的对象
 */

import { useState, useCallback } from 'react';

const useDragAndDrop = (config, updateConfig, setSelectedWidgetIndex) => {
    // 正在拖拽的组件索引
    const [draggingIndex, setDraggingIndex] = useState(null);
    // 拖拽悬停的组件索引
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // 处理拖拽开始事件
    const handleDragStart = useCallback((e, index) => {
        setSelectedWidgetIndex(null);
        setDraggingIndex(index);
        setDragOverIndex(null);
        if (e && e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    }, [setSelectedWidgetIndex]);

    // 处理拖拽悬停事件
    const handleDragOver = useCallback((e, index) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (draggingIndex === null) return;

        // 计算调整后的目标索引（与 handleDrop 中的逻辑一致）
        const adjustedTargetIndex = index > draggingIndex ? index - 1 : index;

        // 只有当调整后的目标索引与原始索引不同时，才是有效操作
        if (adjustedTargetIndex === draggingIndex) {
            setDragOverIndex(null);
            return;
        }

        setDragOverIndex(index);
    }, [draggingIndex]);

    // 处理拖拽结束事件
    const handleDragEnd = useCallback(() => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    }, []);

    // 处理放置事件：重新排列组件顺序
    const handleDrop = useCallback((e, targetIndex) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (draggingIndex === null || draggingIndex === targetIndex) {
            setDraggingIndex(null);
            setDragOverIndex(null);
            return;
        }

        // 创建新的组件数组
        const newWidgets = [...config.widgets];
        const draggedItem = newWidgets[draggingIndex];

        // 从原位置移除
        newWidgets.splice(draggingIndex, 1);

        // 插入到新位置
        // 如果向下拖拽（targetIndex > draggingIndex），由于已经移除了一个元素，目标索引需要减 1
        const adjustedTargetIndex = targetIndex > draggingIndex ? targetIndex - 1 : targetIndex;

        if (adjustedTargetIndex >= newWidgets.length) {
            newWidgets.push(draggedItem);
        } else {
            newWidgets.splice(adjustedTargetIndex, 0, draggedItem);
        }

        // 更新配置
        updateConfig({
            ...config,
            widgets: newWidgets
        });

        // 清除拖拽状态
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
