/**
 * 拖放启动组件
 * 允许用户拖放文件到此组件上，然后使用指定的命令启动应用并传递文件路径
 * @param {string} name - 显示名称
 * @param {string} targets - 执行命令模板，可使用 {{source}} 占位符表示文件路径
 * @param {boolean} show_all_time - 是否始终显示，false 时只在拖拽文件时显示
 * @param {boolean} isPreview - 是否为预览模式（在设置页面中使用）
 */

import React, { useState, useEffect, useRef } from 'react';
import { iconCache, pendingIcons } from './LauncherItem';

const DragToLaunchWidget = ({ name, targets, show_all_time = true, isPreview = false }) => {
    // 从命令模板中提取可执行文件路径
    const getExePath = (template) => {
        let exePath = template;
        if (typeof exePath === 'string') {
            const placeholderIndex = exePath.indexOf('{{source}}');
            let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;
            if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
                potentialPath = potentialPath.substring(1, potentialPath.length - 1);
            }
            return potentialPath;
        }
        return exePath;
    };

    const targetExePath = getExePath(targets);

    // 图标状态
    const [icon, setIcon] = useState(iconCache.get(targetExePath) || null);
    // 是否正在拖拽文件到此组件上方
    const [isDragOver, setIsDragOver] = useState(false);
    // 是否可见（当 show_all_time 为 false 时，只在拖拽时显示）
    const [isVisible, setIsVisible] = useState(isPreview || show_all_time);
    // 拖拽计数器：用于处理嵌套元素的拖拽事件
    const dragCounter = useRef(0);

    /**
     * 更新可见性状态
     */
    useEffect(() => {
        setIsVisible(isPreview || show_all_time);
    }, [isPreview, show_all_time]);

    /**
     * 加载图标和设置全局拖拽监听
     */
    useEffect(() => {
        const exePath = targetExePath;

        // 获取可执行文件的图标
        if (exePath) {
            // 1. 检查缓存
            if (iconCache.has(exePath)) {
                setIcon(iconCache.get(exePath));
            } else if (pendingIcons.has(exePath)) {
                // 2. 检查是否有正在进行的请求
                pendingIcons.get(exePath).then(iconDataUrl => {
                    if (iconDataUrl) setIcon(iconDataUrl);
                });
            } else {
                // 3. 发起新请求
                const iconPromise = window.electronAPI.getFileIcon(exePath)
                    .then(iconDataUrl => {
                        if (iconDataUrl) {
                            iconCache.set(exePath, iconDataUrl);
                            setIcon(iconDataUrl);
                        }
                        return iconDataUrl;
                    })
                    .catch(err => {
                        console.error('获取图标失败:', err);
                        return null;
                    })
                    .finally(() => {
                        pendingIcons.delete(exePath);
                    });
                pendingIcons.set(exePath, iconPromise);
            }
        }

        // 如果配置为不始终显示，则监听全局拖拽事件
        if (!show_all_time && !isPreview) {
            // 拖拽进入文档时
            const handleGlobalDragEnter = (e) => {
                // 检查是否为文件拖拽
                if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                    dragCounter.current++;
                    // 第一次进入时显示组件
                    if (dragCounter.current === 1) setIsVisible(true);
                }
            };
            // 拖拽离开文档时
            const handleGlobalDragLeave = (e) => {
                dragCounter.current--;
                // 当计数器归零时隐藏组件
                if (dragCounter.current <= 0) {
                    dragCounter.current = 0;
                    setIsVisible(false);
                }
            };
            // 文件放置时
            const handleGlobalDrop = () => {
                dragCounter.current = 0;
                setIsVisible(false);
            };

            document.addEventListener('dragenter', handleGlobalDragEnter);
            document.addEventListener('dragleave', handleGlobalDragLeave);
            document.addEventListener('drop', handleGlobalDrop);

            return () => {
                document.removeEventListener('dragenter', handleGlobalDragEnter);
                document.removeEventListener('dragleave', handleGlobalDragLeave);
                document.removeEventListener('drop', handleGlobalDrop);
            };
        }
    }, [targets, show_all_time]);

    /**
     * 处理拖拽悬停事件
     * @param {Event} e - 拖拽事件对象
     */
    const handleDragOver = (e) => {
        e.preventDefault();  // 允许放置
        setIsDragOver(true);  // 设置悬停状态，用于视觉反馈
    };

    /**
     * 处理拖拽离开事件
     * @param {Event} e - 拖拽事件对象
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);  // 取消悬停状态
    };

    /**
     * 处理文件放置事件
     * 构建命令并执行
     * @param {Event} e - 拖拽事件对象
     */
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files.length > 0) {
            // 遍历所有拖放的文件
            for (const file of e.dataTransfer.files) {
                // 获取文件路径
                const filePath = window.electronAPI.getFilePath(file);
                if (!filePath) continue;

                // 用引号包裹文件路径，处理路径中的空格
                const safeFilePath = `"${filePath}"`;
                let rawCommandTemplate = targets;
                let finalCommand = rawCommandTemplate;

                // 如果命令模板包含 {{source}} 占位符，则替换它
                if (rawCommandTemplate.includes('{{source}}')) {
                    const parts = rawCommandTemplate.split('{{source}}');
                    let exePart = parts[0].trim();  // 可执行文件部分
                    const suffixPart = parts[1];     // 后缀部分（占位符后的内容）
                    // 如果可执行文件路径包含空格且未被引号包裹，则添加引号
                    if (exePart.includes(' ') && !exePart.startsWith('"') && !exePart.endsWith('"')) {
                        exePart = `"${exePart}"`;
                    }
                    // 构建最终命令：可执行文件 + 文件路径 + 后缀
                    finalCommand = `${exePart} ${safeFilePath} ${suffixPart}`;
                } else {
                    // 如果没有占位符，直接将文件路径追加到命令末尾
                    finalCommand = `${rawCommandTemplate} ${safeFilePath}`;
                }

                // 执行命令
                window.electronAPI.executeCommand(finalCommand);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="launcher-group layout-vertical">
            <div
                className={`launcher-item drag-to-launch ${isDragOver ? 'drag-over' : ''}`}
                title={name || "Drag files here to send"}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
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
        </div>
    );
};

export default DragToLaunchWidget;
