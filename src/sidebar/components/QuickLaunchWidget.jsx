/**
 * 快速启动组件
 * 显示开始菜单中的应用列表，支持搜索和启动
 * @param {string} layout - 布局方式：'grid' 或 'list'
 * @param {number} maxItems - 最大显示数量
 * @param {boolean} isExpanded - 侧边栏是否展开
 * @param {Function} collapse - 收起侧边栏的函数
 */

import React, { useState, useEffect, useMemo } from 'react';

const QuickLaunchWidget = ({ layout = 'grid', maxItems = 50, isExpanded, collapse, isPreview = false }) => {
    // 应用列表状态
    const [apps, setApps] = useState([]);
    // 搜索关键词
    const [searchQuery, setSearchQuery] = useState('');
    // 是否显示快速启动页面
    const [showQuickLaunch, setShowQuickLaunch] = useState(false);
    // 加载状态
    const [isLoading, setIsLoading] = useState(false);
    // 初始加载完成
    const [initialLoaded, setInitialLoaded] = useState(false);

    /**
     * 加载开始菜单应用列表
     * 组件挂载时自动加载
     */
    useEffect(() => {
        if (isPreview) return;

        // 异步加载应用列表
        const loadApps = async () => {
            try {
                const items = await window.electronAPI.getStartMenuItems();
                setApps(items);
                setInitialLoaded(true);
            } catch (err) {
                console.error('加载开始菜单失败:', err);
            }
        };

        loadApps();
    }, [isPreview]);

    /**
     * 打开快速启动页面
     */
    const handleOpenQuickLaunch = async () => {
        if (isPreview) return;

        setShowQuickLaunch(true);

        // 如果还没有加载完成，显示加载状态
        if (!initialLoaded) {
            setIsLoading(true);
            try {
                const items = await window.electronAPI.getStartMenuItems();
                setApps(items);
                setInitialLoaded(true);
            } catch (err) {
                console.error('加载开始菜单失败:', err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    /**
     * 关闭快速启动页面
     */
    const handleCloseQuickLaunch = () => {
        setShowQuickLaunch(false);
        setSearchQuery('');
    };

    /**
     * 启动应用
     */
    const handleLaunchApp = (app) => {
        if (isPreview) return;

        // 启动应用
        window.electronAPI.launchStartMenuItem(app);

        // 关闭快速启动页面
        handleCloseQuickLaunch();

        // 如果侧边栏是展开的，收起它
        if (isExpanded && collapse) {
            collapse();
        }
    };

    /**
     * 过滤后的应用列表
     */
    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) {
            return apps.slice(0, maxItems);
        }

        const query = searchQuery.toLowerCase();
        return apps
            .filter(app => app.name.toLowerCase().includes(query))
            .slice(0, maxItems);
    }, [apps, searchQuery, maxItems]);

    /**
     * 处理搜索输入
     */
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // 快速启动页面
    if (showQuickLaunch) {
        return (
            <div className="quick-launch-overlay" onClick={(e) => {
                // 点击背景关闭
                if (e.target === e.currentTarget) {
                    handleCloseQuickLaunch();
                }
            }}>
                <div className="quick-launch-panel">
                    {/* 标题栏 */}
                    <div className="quick-launch-header">
                        <h3 className="quick-launch-title">快速启动</h3>
                        <button
                            className="quick-launch-close"
                            onClick={handleCloseQuickLaunch}
                            title="关闭"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* 搜索框 */}
                    <div className="quick-launch-search">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="搜索应用..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchQuery('')}
                            >
                                <i className="fas fa-times-circle"></i>
                            </button>
                        )}
                    </div>

                    {/* 应用列表 */}
                    <div className={`quick-launch-apps layout-${layout}`}>
                        {isLoading ? (
                            <div className="quick-launch-loading">
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>正在加载应用...</span>
                            </div>
                        ) : filteredApps.length > 0 ? (
                            filteredApps.map((app, index) => (
                                <div
                                    key={index}
                                    className="quick-launch-app-item"
                                    onClick={() => handleLaunchApp(app)}
                                    title={app.name}
                                >
                                    <div className="quick-launch-app-icon">
                                        {app.icon ? (
                                            <img src={app.icon} alt={app.name} />
                                        ) : (
                                            <div className="quick-launch-icon-placeholder">
                                                <i className="fas fa-cube"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="quick-launch-app-name">{app.name}</div>
                                </div>
                            ))
                        ) : (
                            <div className="quick-launch-empty">
                                <i className="fas fa-search"></i>
                                <span>未找到匹配的应用</span>
                            </div>
                        )}
                    </div>

                    {/* 底部信息 */}
                    <div className="quick-launch-footer">
                        <span>共 {apps.length} 个应用</span>
                        {searchQuery && (
                            <span> · 找到 {filteredApps.length} 个结果</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 入口按钮
    return (
        <div className="quick-launch-widget">
            <button
                className="quick-launch-button"
                onClick={handleOpenQuickLaunch}
                title="快速启动"
            >
                <i className="fas fa-rocket"></i>
                <span className="quick-launch-button-text">快速启动</span>
            </button>
        </div>
    );
};

export default QuickLaunchWidget;
