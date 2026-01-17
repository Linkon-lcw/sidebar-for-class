/**
 * 长按拖拽 Hook
 * 管理触摸设备上的长按拖拽功能，支持移动端的组件排序
 * @param {Function} handleDragStart - 拖拽开始处理函数
 * @param {Function} handleDragOver - 拖拽悬停处理函数
 * @param {Function} handleDrop - 放置处理函数
 * @returns {Object} 包含长按状态和处理函数的对象
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const useLongPress = (handleDragStart, handleDragOver, handleDrop) => {
    // 是否正在长按拖拽
    const [isLongPressing, setIsLongPressing] = useState(false);
    // 是否最近发生过拖拽（用于区分点击和拖拽）
    const [draggedRecently, setDraggedRecently] = useState(false);
    // 指针位置
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

    // 长按定时器引用
    const longPressTimer = useRef(null);
    // 初始触摸位置引用
    const initialTouchPos = useRef({ x: 0, y: 0 });

    // 清理定时器
    useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    // 处理指针按下事件：开始长按检测
    const handlePointerDown = useCallback((e, index) => {
        if (e.pointerType === 'touch') {
            initialTouchPos.current = { x: e.clientX, y: e.clientY };
            if (longPressTimer.current) clearTimeout(longPressTimer.current);

            // 设置长按定时器，500ms 后触发拖拽
            longPressTimer.current = setTimeout(() => {
                setIsLongPressing(true);
                handleDragStart(null, index);
                // 触发设备震动反馈
                if (window.navigator.vibrate) window.navigator.vibrate(50);
            }, 500);
        }
    }, [handleDragStart]);

    // 处理指针移动事件：检测移动距离并更新拖拽状态
    const handlePointerMove = useCallback((e) => {
        // 如果未开始长按，检测移动距离
        if (longPressTimer.current && !isLongPressing) {
            const dist = Math.sqrt(
                Math.pow(e.clientX - initialTouchPos.current.x, 2) +
                Math.pow(e.clientY - initialTouchPos.current.y, 2)
            );
            // 移动距离超过 10px 则取消长按
            if (dist > 10) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }

        // 如果正在长按拖拽，更新指针位置并检测悬停目标
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

    // 处理指针抬起事件：结束拖拽
    const handlePointerUp = useCallback((dragOverIndex) => {
        // 清除长按定时器
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // 如果正在长按，执行放置操作
        if (isLongPressing) {
            handleDrop(null, dragOverIndex);
            setDraggedRecently(true);
            // 100ms 后重置拖拽状态
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
