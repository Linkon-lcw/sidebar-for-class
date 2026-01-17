/**
 * 组件预览 Hook
 * 提供各种组件类型的预览组件，用于在设置界面中显示组件效果
 * @param {Map} widgetIcons - 组件图标缓存
 * @returns {Object} 包含各种组件预览组件的对象
 */

import React, { useState, useEffect } from 'react';

const useWidgetPreviews = (widgetIcons) => {
    // 启动器项预览组件：显示单个启动目标
    const LauncherItemPreview = React.memo(({ name, target, widgetIndex, targetIndex }) => {
        const iconKey = `${widgetIndex}-${targetIndex}`;
        const icon = widgetIcons.get(iconKey);

        return (
            <div className="launcher-item">
                <div className="launcher-icon">
                    {icon ? (
                        <img src={icon} alt={name} />
                    ) : (
                        <div className="launcher-icon-placeholder" style={{ width: '32px', height: '32px', background: '#e5e7eb', borderRadius: '6px' }} />
                    )}
                </div>
                <div className="launcher-info">
                    <div className="launcher-name">{name}</div>
                </div>
            </div>
        );
    });

    // 音量控制预览组件：显示音量滑块
    const VolumeWidgetPreview = React.memo(({ range }) => {
        const min = range ? range[0] : 0;
        const max = range ? range[1] : 100;
        const volume = 50;

        // 计算音量百分比
        const percentage = ((volume - min) / (max - min)) * 100;

        return (
            <div className="volume-slider-container">
                <div className="volume-slider-row">
                    <div className="volume-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </div>
                    <div className="slider-wrapper">
                        <input
                            type="range"
                            className="volume-slider"
                            min={min}
                            max={max}
                            value={volume}
                            disabled
                        />
                        <div className="slider-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="volume-value">{volume}%</div>
                </div>
            </div>
        );
    });

    // 文件列表预览组件：显示文件夹中的文件
    const FilesWidgetPreview = React.memo(({ folder_path, max_count, layout = 'vertical', widgetIndex }) => {
        const [files, setFiles] = useState([]);

        // 加载文件夹中的文件列表
        useEffect(() => {
            window.electronAPI.getFilesInFolder(folder_path, max_count)
                .then(fileList => setFiles(fileList))
                .catch(err => console.error('获取文件列表失败:', err));
        }, [folder_path, max_count]);

        return (
            <div className={`launcher-group layout-${layout} compact-files`}>
                {files.map((file, index) => {
                    // 移除 .lnk 扩展名
                    let displayName = file.name;
                    if (displayName.toLowerCase().endsWith('.lnk')) {
                        displayName = displayName.slice(0, -4);
                    }
                    return (
                        <LauncherItemPreview
                            key={index}
                            name={displayName}
                            target={file.path}
                            widgetIndex={`files-${widgetIndex}`}
                            targetIndex={index}
                        />
                    );
                })}
            </div>
        );
    });

    // 拖放速启预览组件：显示拖放启动目标
    const DragToLaunchWidgetPreview = React.memo(({ name, targets, widgetIndex }) => {
        const iconKey = `drag-${widgetIndex}`;
        const icon = widgetIcons.get(iconKey);

        return (
            <div className="launcher-item drag-to-launch">
                <div className="launcher-icon">
                    {icon ? (
                        <img src={icon} alt={name || 'Drop Target'} />
                    ) : (
                        <div className="launcher-icon-placeholder" style={{ width: '32px', height: '32px', background: '#e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📤</div>
                    )}
                </div>
                <div className="launcher-info">
                    <div className="launcher-name">{name || 'Drop to Send'}</div>
                </div>
            </div>
        );
    });

    return {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview
    };
};

export default useWidgetPreviews;
