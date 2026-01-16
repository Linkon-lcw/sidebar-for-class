import React, { useState, useEffect } from 'react';

const LauncherItem = ({ name, target, args }) => {
    const [icon, setIcon] = useState(null);

    useEffect(() => {
        if (target) {
            window.electronAPI.getFileIcon(target)
                .then(iconDataUrl => {
                    if (iconDataUrl) setIcon(iconDataUrl);
                })
                .catch(err => console.error('获取图标失败:', err));
        }
    }, [target]);

    const handleClick = (e) => {
        e.stopPropagation();
        window.electronAPI.launchApp(target, args || []);
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
