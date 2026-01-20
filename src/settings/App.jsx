/**
 * 设置应用主组件
 * 管理设置界面的整体布局、配置状态和标签页切换
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
} from "@fluentui/react-components";

// 导入样式
import { useStyles } from './App.styles';

// 导入组件
import SidebarNav from './components/SidebarNav';
import BasicSettings from './sections/BasicSettings';
import ComponentSettings from './sections/ComponentSettings';
import WindowSettings from './sections/WindowSettings';
import StyleSettings from './sections/StyleSettings';

// 导入图标缓存
import { iconCache } from '../sidebar/components/LauncherItem';

const App = () => {
    const styles = useStyles();
    // 当前选中的标签页
    const [selectedTab, setSelectedTab] = useState('basic');
    // 是否为深色模式（根据系统偏好自动检测）
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    // 配置对象
    const [config, setConfig] = useState(null);

    // 初始化时避免触发保存
    const isInitialMount = useRef(true);  // 标记是否为首次挂载
    const saveTimeoutRef = useRef(null);   // 保存操作的防抖定时器

    // 使用全局共享的图标缓存
    const pendingIconRequests = useRef(new Map());


    const loadIcon = useCallback(async (target) => {
        if (!target) return null;

        const cacheKey = target;
        if (iconCache.has(cacheKey)) {
            return iconCache.get(cacheKey);
        }

        if (pendingIconRequests.current.has(cacheKey)) {
            return pendingIconRequests.current.get(cacheKey);
        }

        const promise = window.electronAPI.getFileIcon(target)
            .then(iconDataUrl => {
                if (iconDataUrl) {
                    iconCache.set(cacheKey, iconDataUrl);
                }
                return iconDataUrl;
            })
            .catch(err => {
                console.error('获取图标失败:', err);
                return null;
            })
            .finally(() => {
                pendingIconRequests.current.delete(cacheKey);
            });

        pendingIconRequests.current.set(cacheKey, promise);
        return promise;
    }, []);

    const preloadWidgetIcons = useCallback(async (widgets) => {
        widgets.forEach((widget, index) => {
            if (widget.type === 'launcher' && widget.targets) {
                widget.targets.forEach((target) => {
                    const key = target.target;
                    // 不再需要 widgetIcons 缓存，直接加载
                    loadIcon(target.target).then(icon => {
                        // 不再需要 widgetIcons 缓存
                    });
                });
            } else if (widget.type === 'drag_to_launch' && widget.targets) {
                let exePath = widget.targets;
                if (typeof exePath === 'string') {
                    const placeholderIndex = exePath.indexOf('{{source}}');
                    let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;
                    if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
                        potentialPath = potentialPath.substring(1, potentialPath.length - 1);
                    }
                    exePath = potentialPath;
                }
                const key = exePath;
                // 不再需要 widgetIcons 缓存，直接加载
                loadIcon(exePath).then(icon => {
                    // 不再需要 widgetIcons 缓存
                });
            } else if (widget.type === 'files' && widget.folder_path) {
                window.electronAPI.getFilesInFolder(widget.folder_path, widget.max_count)
                    .then(fileList => {
                        fileList.forEach((file) => {
                            const key = file.path;
                            // 不再需要 widgetIcons 缓存，直接加载
                            loadIcon(file.path).then(icon => {
                                // 不再需要 widgetIcons 缓存
                            });
                        });
                    })
                    .catch(err => console.error('获取文件列表失败:', err));
            }
        });
    }, [loadIcon]);

    /**
     * 初始化：加载配置和监听系统主题变化
     */
    useEffect(() => {
        const fetchConfig = async () => {
            const initialConfig = await window.electronAPI.getConfig();
            setConfig(initialConfig);
            preloadWidgetIcons(initialConfig.widgets);
        };
        fetchConfig();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [preloadWidgetIcons]);

    /**
     * 自动保存逻辑（仅负责写入磁盘）
     * 当配置改变时，延迟 1 秒后保存到磁盘，避免频繁 IO 操作
     */
    useEffect(() => {
        // 首次挂载时不保存（避免初始化时触发保存）
        if (isInitialMount.current) {
            if (config) {
                isInitialMount.current = false;
            }
            return;
        }

        // 清除之前的定时器
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // 写入磁盘保留 1 秒防抖，避免频繁 IO
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await window.electronAPI.updateConfig(config);
            } catch (err) {
                console.error('Failed to save config:', err);
            }
        }, 1000);

        return () => {
            // 清理定时器
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [config]);

    /**
     * 更新配置
     * 更新状态并触发实时预览（不写入文件）
     * @param {Object} newConfig - 新的配置对象
     */
    const updateConfig = (newConfig) => {
        setConfig(newConfig);
        // 实时预览，不写入文件
        window.electronAPI.previewConfig(newConfig);
    };

    /**
     * 处理变换属性变化
     * 用于窗口和样式相关的配置，需要立即预览
     * @param {string} key - 配置键名
     * @param {any} value - 配置值
     */
    const handleTransformChange = (key, value) => {
        // 使用函数式更新确保实时性
        setConfig(prev => {
            const next = {
                ...prev,
                transforms: {
                    ...prev.transforms,
                    [key]: value
                }
            };
            // 立即触发视觉预览，不经过任何 React 周期外的延迟
            window.electronAPI.previewConfig(next);
            return next;
        });
    };

    if (!config) return null;

    return (
        <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
            <div className={styles.root}>
                <SidebarNav
                    selectedTab={selectedTab}
                    onTabSelect={setSelectedTab}
                    styles={styles}
                />

                <main className={styles.main}>
                    {selectedTab === 'basic' && (
                        <BasicSettings config={config} updateConfig={updateConfig} styles={styles} />
                    )}

                    {selectedTab === 'components' && (
                        <ComponentSettings 
                            config={config} 
                            updateConfig={updateConfig} 
                            styles={styles}
                            loadIcon={loadIcon}
                            preloadWidgetIcons={preloadWidgetIcons}
                        />
                    )}

                    {selectedTab === 'window' && (
                        <WindowSettings
                            config={config}
                            handleTransformChange={handleTransformChange}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'style' && (
                        <StyleSettings
                            config={config}
                            handleTransformChange={handleTransformChange}
                            styles={styles}
                        />
                    )}
                </main>
            </div>
        </FluentProvider>
    );
};

export default App;
