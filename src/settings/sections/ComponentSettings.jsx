import React from 'react';
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

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>组件设置</div>
                <div className={styles.description}>可视化管理侧边栏组件，通过简单的拖拽和属性调整来定制你的侧边栏。</div>
            </div>

            <div className={styles.componentLayout}>
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

                <PropertiesPanel
                    styles={styles}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedWidget={selectedWidget}
                    updateWidgetProperty={updateWidgetProperty}
                />
            </div>
        </div>
    );
};

export default ComponentSettings;
