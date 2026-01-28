/**
 * 组件预览 Hook
 * 提供各种组件类型的预览组件，用于在设置界面中显示组件效果
 * 现在直接使用实际组件，通过 isPreview 属性控制不可交互
 * @returns {Object} 包含各种组件预览组件的对象
 */

import React from 'react';

// 直接导入实际组件
import LauncherItem from '../../../sidebar/components/LauncherItem';
import VolumeWidget from '../../../sidebar/components/VolumeWidget';
import FilesWidget from '../../../sidebar/components/FilesWidget';
import DragToLaunchWidget from '../../../sidebar/components/DragToLaunchWidget';
import Toolbar from '../../../sidebar/components/Toolbar';
import QuickLaunchWidget from '../../../sidebar/components/QuickLaunchWidget';

// 启动器项预览：使用实际组件并设置 isPreview 为 true
const LauncherItemPreview = React.memo(({ name, target, widgetIndex, targetIndex }) => {
    return (
        <LauncherItem
            name={name}
            target={target}
            isPreview={true}
        />
    );
});

// 音量控制预览：使用实际组件并设置 isPreview 为 true
const VolumeWidgetPreview = React.memo(({ range }) => {
    return (
        <VolumeWidget
            range={range}
            isPreview={true}
        />
    );
});

// 文件列表预览：使用实际组件并设置 isPreview 为 true
const FilesWidgetPreview = React.memo(({ folder_path, max_count, layout = 'vertical', widgetIndex }) => {
    return (
        <FilesWidget
            folder_path={folder_path}
            max_count={max_count}
            layout={layout}
            isPreview={true}
        />
    );
});

// 拖放速启预览：使用实际组件并设置 isPreview 为 true
const DragToLaunchWidgetPreview = React.memo(({ name, targets, widgetIndex }) => {
    return (
        <DragToLaunchWidget
            name={name}
            targets={targets}
            isPreview={true}
            show_all_time={true}
        />
    );
});

// 工具栏预览：使用实际组件并设置 isPreview 为 true
const ToolbarWidgetPreview = React.memo(({ tools = [] }) => {
    return (
        <Toolbar
            tools={tools}
            isPreview={true}
        />
    );
});

// 快速启动预览：使用实际组件并设置 isPreview 为 true
const QuickLaunchWidgetPreview = React.memo(({ icon_size = 48, show_recent = true }) => {
    return (
        <QuickLaunchWidget
            icon_size={icon_size}
            show_recent={show_recent}
            isPreview={true}
        />
    );
});

const useWidgetPreviews = () => {
    return {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview,
        ToolbarWidgetPreview,
        QuickLaunchWidgetPreview
    };
};

export default useWidgetPreviews;
