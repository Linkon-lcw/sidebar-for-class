import React, { useState, useEffect, useRef } from 'react';

const QuickLaunchWidget = ({ icon_size = 48, show_recent = true, isPreview = false }) => {
    const [shortcuts, setShortcuts] = useState([]);
    const [filteredShortcuts, setFilteredShortcuts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);
    const searchInputRef = useRef(null);

    useEffect(() => {
        loadShortcuts();
    }, []);

    useEffect(() => {
        if (!isPreview && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isPreview]);

    const loadShortcuts = async () => {
        try {
            const result = await window.electronAPI.getStartMenuShortcuts();
            setShortcuts(result);
            setFilteredShortcuts(result);
            setIsLoading(false);
        } catch (error) {
            console.error('加载快捷方式失败:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredShortcuts(shortcuts);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = shortcuts.filter(shortcut =>
                shortcut.name.toLowerCase().includes(query) ||
                (shortcut.description && shortcut.description.toLowerCase().includes(query))
            );
            setFilteredShortcuts(filtered);
        }
        setSelectedIndex(-1);
    }, [searchQuery, shortcuts]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleShortcutClick = (shortcut) => {
        if (isPreview) return;
        window.electronAPI.launchApp(shortcut.target);
    };

    const handleKeyDown = (e) => {
        if (isPreview) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => {
                const next = Math.min(prev + 1, filteredShortcuts.length - 1);
                return next;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => {
                const next = Math.max(prev - 1, 0);
                return next;
            });
        } else if (e.key === 'Enter' && selectedIndex >= 0 && filteredShortcuts[selectedIndex]) {
            e.preventDefault();
            handleShortcutClick(filteredShortcuts[selectedIndex]);
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            setSelectedIndex(-1);
        }
    };

    const QuickLaunchItem = ({ shortcut, index }) => {
        const [icon, setIcon] = useState(null);

        useEffect(() => {
            if (shortcut.target) {
                window.electronAPI.getFileIcon(shortcut.target)
                    .then(iconData => {
                        if (iconData) setIcon(iconData);
                    })
                    .catch(err => console.error('获取图标失败:', err));
            }
        }, [shortcut.target]);

        return (
            <div
                className={`quick-launch-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleShortcutClick(shortcut)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    backgroundColor: selectedIndex === index ? 'var(--colorBrandBackground2)' : 'transparent',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
            >
                <div
                    style={{
                        width: `${icon_size}px`,
                        height: `${icon_size}px`,
                        marginRight: '12px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {icon ? (
                        <img
                            src={icon}
                            alt={shortcut.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'var(--colorNeutralStroke1)',
                                borderRadius: '4px'
                            }}
                        />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '14px',
                            color: 'var(--colorNeutralForeground1)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {shortcut.name}
                    </div>
                    {shortcut.description && (
                        <div
                            style={{
                                fontSize: '12px',
                                color: 'var(--colorNeutralForeground3)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {shortcut.description}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="quick-launch-widget" style={{ padding: '8px' }}>
            <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索应用..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                disabled={isPreview}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: '8px',
                    border: '1px solid var(--colorNeutralStroke1)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--colorNeutralBackground1)',
                    color: 'var(--colorNeutralForeground1)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />
            <div
                style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}
            >
                {isLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--colorNeutralForeground3)' }}>
                        加载中...
                    </div>
                ) : filteredShortcuts.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--colorNeutralForeground3)' }}>
                        {searchQuery ? '未找到匹配的应用' : '暂无快捷方式'}
                    </div>
                ) : (
                    filteredShortcuts.map((shortcut, index) => (
                        <QuickLaunchItem key={`${shortcut.target}-${index}`} shortcut={shortcut} index={index} />
                    ))
                )}
            </div>
        </div>
    );
};

export default QuickLaunchWidget;