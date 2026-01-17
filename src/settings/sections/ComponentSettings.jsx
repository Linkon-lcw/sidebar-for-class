/**
 * 组件设置页面
 * 提供可视化的组件管理界面，支持拖拽排序、属性编辑等功能
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 * @param {Map} widgetIcons - 组件图标缓存
 * @param {Function} loadIcon - 加载图标的函数
 * @param {Function} preloadWidgetIcons - 预加载组件图标的函数
 * @param {Function} setWidgetIcons - 设置组件图标的函数
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Tab,
    TabList,
    Body1,
    Title2,
    Caption1,
    mergeClasses,
    Input,
    Switch,
    Field,
    Label,
    Dropdown,
    Option,
    Button,
    Slider
} from "@fluentui/react-components";
import {
    DesignIdeasRegular,
    SettingsRegular,
    BoxRegular,
    InfoRegular,
    AddRegular,
    DeleteRegular,
    AppsRegular
} from "@fluentui/react-icons";

import '../../../style.css';
import useWidgetSelection from './hooks/useWidgetSelection.jsx';
import useDragAndDrop from './hooks/useDragAndDrop.jsx';
import useLongPress from './hooks/useLongPress.jsx';
import useWidgetIcons from './hooks/useWidgetIcons.jsx';
import useWidgetPropertyUpdate from './hooks/useWidgetPropertyUpdate.jsx';
import useWidgetPreviews from './hooks/useWidgetPreviews.jsx';
import PreviewPanel from './components/PreviewPanel.jsx';
import PropertiesPanel from './components/PropertiesPanel.jsx';

// 组件类型名称映射
const WIDGET_TYPE_NAMES = {
    launcher: '启动器',
    volume_slider: '音量控制',
    files: '文件列表',
    drag_to_launch: '拖放速启'
};

const ComponentSettings = ({ config, updateConfig, styles, widgetIcons, loadIcon, preloadWidgetIcons, setWidgetIcons }) => {
    // 使用组件选择 Hook：管理当前选中的组件和标签页状态
    const {
        activeTab,
        setActiveTab,
        selectedWidgetIndex,
        setSelectedWidgetIndex,
        handleWidgetClick,
        clearSelection
    } = useWidgetSelection();

    // 使用拖拽排序 Hook：管理组件的拖拽排序功能
    const {
        draggingIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    } = useDragAndDrop(config, updateConfig, setSelectedWidgetIndex);

    // 使用长按拖拽 Hook：管理触摸设备上的长按拖拽功能
    const {
        isLongPressing,
        draggedRecently,
        pointerPos,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    } = useLongPress(handleDragStart, handleDragOver, handleDrop);

    // 预加载组件图标
    useWidgetIcons(config.widgets, preloadWidgetIcons);

    // 使用组件属性更新 Hook：管理组件属性的更新
    const { updateWidgetProperty } = useWidgetPropertyUpdate(config, updateConfig, selectedWidgetIndex);

    // 获取组件预览组件
    const {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview
    } = useWidgetPreviews(widgetIcons);

    // 获取当前选中的组件
    const selectedWidget = selectedWidgetIndex !== null ? config.widgets[selectedWidgetIndex] : null;

    // 包装组件点击处理函数，传入最近拖拽状态
    const handleWidgetClickWrapper = (e, index) => {
        handleWidgetClick(e, index, draggedRecently);
    };

    // 左右面板宽度比例状态
    const [leftWidth, setLeftWidth] = useState(50);
    // 调整器拖拽状态
    const [isDragging, setIsDragging] = useState(false);
    // 容器引用
    const containerRef = useRef(null);

    // 处理调整器鼠标按下事件：开始拖拽调整面板宽度
    const handleResizerMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    // 处理调整器鼠标移动事件：更新面板宽度
    const handleResizerMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(clampedWidth);
    }, [isDragging]);

    // 处理调整器鼠标抬起事件：结束拖拽
    const handleResizerMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [isDragging]);

    // 监听拖拽状态，添加或移除全局事件监听器
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleResizerMouseMove);
            window.addEventListener('mouseup', handleResizerMouseUp);
            window.addEventListener('touchmove', handleResizerMouseMove);
            window.addEventListener('touchend', handleResizerMouseUp);
        } else {
            window.removeEventListener('mousemove', handleResizerMouseMove);
            window.removeEventListener('mouseup', handleResizerMouseUp);
            window.removeEventListener('touchmove', handleResizerMouseMove);
            window.removeEventListener('touchend', handleResizerMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizerMouseMove);
            window.removeEventListener('mouseup', handleResizerMouseUp);
            window.removeEventListener('touchmove', handleResizerMouseMove);
            window.removeEventListener('touchend', handleResizerMouseUp);
        };
    }, [isDragging, handleResizerMouseMove, handleResizerMouseUp]);

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>组件设置</div>
                <div className={styles.description}>可视化管理侧边栏组件，通过简单的拖拽和属性调整来定制你的侧边栏。</div>
            </div>

            <div className={styles.componentLayout} ref={containerRef}>
                {/* 左侧预览面板 */}
                <div className={styles.leftPanel} style={{ width: `calc(${leftWidth}% - 12px)`, transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <PreviewPanel
                        config={config}
                        styles={styles}
                        widgetIcons={widgetIcons}
                        isLongPressing={isLongPressing}
                        draggingIndex={draggingIndex}
                        dragOverIndex={dragOverIndex}
                        selectedWidgetIndex={selectedWidgetIndex}
                        pointerPos={pointerPos}
                        clearSelection={clearSelection}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                        handlePointerDown={handlePointerDown}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDragEnd={handleDragEnd}
                        handleDrop={handleDrop}
                        handleWidgetClick={handleWidgetClickWrapper}
                        LauncherItemPreview={LauncherItemPreview}
                        VolumeWidgetPreview={VolumeWidgetPreview}
                        FilesWidgetPreview={FilesWidgetPreview}
                        DragToLaunchWidgetPreview={DragToLaunchWidgetPreview}
                    />
                </div>

                {/* 面板宽度调整器 */}
                <div
                    className={styles.resizer}
                    onMouseDown={handleResizerMouseDown}
                    onTouchStart={handleResizerMouseDown}
                    style={{
                        cursor: isDragging ? 'col-resize' : 'col-resize',
                        backgroundColor: isDragging ? 'var(--colorBrandBackground2Pressed)' : 'var(--colorNeutralStroke1)'
                    }}
                />

                {/* 右侧属性面板 */}
                <div className={styles.rightPanel} style={{ width: `calc(${100 - leftWidth}% - 12px)`, transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <PropertiesPanel
                        styles={styles}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        selectedWidget={selectedWidget}
                        updateWidgetProperty={updateWidgetProperty}
                        onDeselectWidget={clearSelection}
                    />
                </div>
            </div>
        </div>
    );
};

export default ComponentSettings;
