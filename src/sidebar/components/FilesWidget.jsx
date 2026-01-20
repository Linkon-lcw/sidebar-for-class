/**
 * 文件列表组件
 * 显示指定文件夹中的文件，每个文件作为一个可启动项
 * @param {string} folder_path - 文件夹路径
 * @param {number} max_count - 最大显示文件数量
 * @param {string} layout - 布局模式，默认为 'vertical'（垂直列表）
 */

import React, { useState, useEffect } from 'react';
import LauncherItem from './LauncherItem';

const FilesWidget = ({ folder_path, max_count, layout = 'vertical', isPreview = false }) => {
    // 文件列表状态
    const [files, setFiles] = useState([]);

    /**
     * 加载文件夹中的文件列表
     * 当文件夹路径或最大数量改变时重新加载
     */
    useEffect(() => {
        window.electronAPI.getFilesInFolder(folder_path, max_count)
            .then(fileList => setFiles(fileList))
            .catch(err => console.error('获取文件列表失败:', err));
    }, [folder_path, max_count]);

    return (
        <div className={`launcher-group layout-${layout} compact-files`}>
            {files.map((file, index) => {
                // 处理显示名称：如果是 .lnk 快捷方式，去掉扩展名
                let displayName = file.name;
                if (displayName.toLowerCase().endsWith('.lnk')) {
                    displayName = displayName.slice(0, -4);
                }
                return (
                    <LauncherItem
                        key={index}
                        name={displayName}
                        target={file.path}
                        isPreview={isPreview}
                    />
                );
            })}
        </div>
    );
};

export default FilesWidget;
