/**
 * 启动器项组件
 * 显示一个可点击的应用启动项，包含图标和名称
 * @param {string} name - 显示名称
 * @param {string} target - 目标应用路径或 URI
 * @param {Array<string>} args - 启动参数数组
 */

import React, { useState, useEffect } from 'react';

const LauncherItem = ({ name, target, args }) => {
    // 图标状态：存储从主进程获取的图标数据 URL
    const [icon, setIcon] = useState(null);

    /**
     * 加载应用图标
     * 当 target 改变时，从主进程获取对应的文件图标
     */
    useEffect(() => {
        if (target) {
            window.electronAPI.getFileIcon(target)
                .then(iconDataUrl => {
                    if (iconDataUrl) setIcon(iconDataUrl);
                })
                .catch(err => console.error('获取图标失败:', err));
        }
    }, [target]);

    /**
     * 处理点击事件
     * 启动目标应用
     * @param {Event} e - 点击事件对象
     */
    const handleClick = (e) => {
        e.stopPropagation();  // 阻止事件冒泡，避免触发侧边栏的拖拽
        window.electronAPI.launchApp(target, args || []);  // 调用主进程启动应用
    };

    return (
        <div className="launcher-item" onClick={handleClick}>
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
};

export default LauncherItem;
