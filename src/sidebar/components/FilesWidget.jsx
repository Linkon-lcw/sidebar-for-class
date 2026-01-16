import React, { useState, useEffect } from 'react';
import LauncherItem from './LauncherItem';

const FilesWidget = ({ folder_path, max_count, layout = 'vertical' }) => {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        window.electronAPI.getFilesInFolder(folder_path, max_count)
            .then(fileList => setFiles(fileList))
            .catch(err => console.error('获取文件列表失败:', err));
    }, [folder_path, max_count]);

    return (
        <div className={`launcher-group layout-${layout} compact-files`}>
            {files.map((file, index) => {
                let displayName = file.name;
                if (displayName.toLowerCase().endsWith('.lnk')) {
                    displayName = displayName.slice(0, -4);
                }
                return (
                    <LauncherItem
                        key={index}
                        name={displayName}
                        target={file.path}
                    />
                );
            })}
        </div>
    );
};

export default FilesWidget;
