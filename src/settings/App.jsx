import React, { useState, useEffect } from 'react';
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

const App = () => {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState('basic');
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [config, setConfig] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success

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

    const handleTransformChange = (key, value) => {
        setConfig(prev => ({
            ...prev,
            transforms: {
                ...prev.transforms,
                [key]: value
            }
        }));
    };

    const saveSettings = async () => {
        setSaveStatus('saving');
        await window.electronAPI.updateConfig(config);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
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
                        <BasicSettings styles={styles} />
                    )}

                    {selectedTab === 'components' && (
                        <ComponentSettings styles={styles} />
                    )}

                    {selectedTab === 'window' && (
                        <WindowSettings
                            config={config}
                            handleTransformChange={handleTransformChange}
                            saveSettings={saveSettings}
                            saveStatus={saveStatus}
                            styles={styles}
                        />
                    )}
                </main>
            </div>
        </FluentProvider>
    );
};

export default App;
