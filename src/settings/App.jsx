import React, { useState, useEffect, useRef } from 'react';
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

const App = () => {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState('basic');
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [config, setConfig] = useState(null);

    // 初始化时避免触发保存
    const isInitialMount = useRef(true);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const initialConfig = await window.electronAPI.getConfig();
            setConfig(initialConfig);
        };
        fetchConfig();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 自动保存逻辑（仅负责写入磁盘）
    useEffect(() => {
        if (isInitialMount.current) {
            if (config) {
                isInitialMount.current = false;
            }
            return;
        }

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
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [config]);

    const updateConfig = (newConfig) => {
        setConfig(newConfig);
        // 实时预览，不写入文件
        window.electronAPI.previewConfig(newConfig);
    };

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
                        <ComponentSettings config={config} updateConfig={updateConfig} styles={styles} />
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
