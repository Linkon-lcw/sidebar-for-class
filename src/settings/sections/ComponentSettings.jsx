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

const WIDGET_TYPE_NAMES = {
    launcher: '启动器',
    volume_slider: '音量控制',
    files: '文件列表',
    drag_to_launch: '拖放速启'
};

const ComponentSettings = ({ config, updateConfig, styles, widgetIcons, loadIcon, preloadWidgetIcons, setWidgetIcons }) => {
    const {
        activeTab,
        setActiveTab,
        selectedWidgetIndex,
        setSelectedWidgetIndex,
        handleWidgetClick,
        clearSelection
    } = useWidgetSelection();

    const {
        draggingIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    } = useDragAndDrop(config, updateConfig, setSelectedWidgetIndex);

    const {
        isLongPressing,
        draggedRecently,
        pointerPos,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    } = useLongPress(handleDragStart, handleDragOver, handleDrop);

    useWidgetIcons(config.widgets, preloadWidgetIcons);

    const { updateWidgetProperty } = useWidgetPropertyUpdate(config, updateConfig, selectedWidgetIndex);

    const {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview
    } = useWidgetPreviews(widgetIcons);

    const selectedWidget = selectedWidgetIndex !== null ? config.widgets[selectedWidgetIndex] : null;

    const handleWidgetClickWrapper = (e, index) => {
        handleWidgetClick(e, index, draggedRecently);
    };

    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleResizerMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleResizerMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(clampedWidth);
    }, [isDragging]);

    const handleResizerMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [isDragging]);

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

                <div
                    className={styles.resizer}
                    onMouseDown={handleResizerMouseDown}
                    onTouchStart={handleResizerMouseDown}
                    style={{
                        cursor: isDragging ? 'col-resize' : 'col-resize',
                        backgroundColor: isDragging ? 'var(--colorBrandBackground2Pressed)' : 'var(--colorNeutralStroke1)'
                    }}
                />

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
