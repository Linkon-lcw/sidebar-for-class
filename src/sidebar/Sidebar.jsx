import React, { useEffect, useState } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';
import Toolbar from './components/Toolbar';
import ScreenshotOverlay from './components/ScreenshotOverlay';
import useSidebarRefs from './hooks/useSidebarRefs';
import useSidebarConfig from './hooks/useSidebarConfig';
import useSidebarAnimation from './hooks/useSidebarAnimation';
import useSidebarDrag from './hooks/useSidebarDrag';
import useSidebarMouseIgnore from './hooks/useSidebarMouseIgnore';
import useExternalDrag from './hooks/useExternalDrag';
import useGlobalEvents from './hooks/useGlobalEvents';

const Sidebar = () => {
    // 1. 基础 Refs 和配置
    const { sidebarRef, wrapperRef, animationIdRef, draggingState, constants } = useSidebarRefs();
    const { config, scale, startH, panelWidth, panelHeight } = useSidebarConfig();
    
    // 2. 所有的 useState 定义
    const [screenshotPath, setScreenshotPath] = useState(null);

    // 4. 钩子函数调用 (获取控制状态)
    const { isExpanded, expand, collapse, updateSidebarStyles, stopAnimation, setIgnoreMouse, setWindowToLarge } = useSidebarAnimation(config, scale, startH, panelWidth, panelHeight, sidebarRef, wrapperRef, animationIdRef, draggingState, constants);
    const { handleStart, handleMove, handleEnd } = useSidebarDrag(isExpanded, updateSidebarStyles, expand, collapse, stopAnimation, setIgnoreMouse, sidebarRef, wrapperRef, animationIdRef, draggingState, constants, panelWidth, setWindowToLarge, screenshotPath);
    
    // 5. 其他辅助钩子
    useSidebarMouseIgnore(isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse);
    useExternalDrag(isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config);
    useGlobalEvents(handleMove, handleEnd, draggingState);

    // 6. useEffect 逻辑

    // 当侧边栏收起时，自动清除截图状态
    useEffect(() => {
        if (!isExpanded) {
            setScreenshotPath(null);
        }
    }, [isExpanded]);

    useEffect(() => {
        if (!window.electronAPI) return;
        const handleWindowBlur = () => {
            if (config?.transforms?.auto_hide && isExpanded) {
                collapse();
            }
        };
        const unsubscribe = window.electronAPI.onWindowBlur(handleWindowBlur);
        return () => { if (unsubscribe) unsubscribe(); };
    }, [config, isExpanded, collapse]);

    // 7. 事件处理函数

    const handleSettingsClick = (e) => {
        e.stopPropagation();
        window.electronAPI.openSettings();
    };

    const handleScreenshot = async () => {
        try {
            if (isExpanded) {
                collapse();
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            const result = await window.electronAPI.screenshot();
            if (result) {
                setScreenshotPath(result);
                expand();
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
    };

    // 8. 渲染
    return (
        <div id="sidebar-wrapper"
            ref={wrapperRef}
            className={isExpanded ? 'expanded' : ''}
            onMouseDown={(e) => handleStart(e.screenX, e.target)}
            onTouchStart={(e) => e.touches.length > 0 && handleStart(e.touches[0].screenX, e.target)}
        >
            <div id="sidebar" ref={sidebarRef}>
                <div id="content">
                    <button id="settings-btn" className="settings-button" title="设置" onClick={handleSettingsClick}>
                        <i className="fas fa-cog"></i>
                    </button>
                    <div id="widget-container" className="widget-list">
                        {config?.widgets?.map((widget, index) => {
                            if (widget.type === 'launcher') {
                                return (
                                    <div key={index} className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                        {widget.targets.map((target, tIndex) => (
                                            <LauncherItem key={tIndex} {...target} />
                                        ))}
                                    </div>
                                );
                            } 
                            else if (widget.type === 'volume_slider') {
                                return <VolumeWidget key={index} />;
                            } 
                            else if (widget.type === 'files') {
                                return <FilesWidget key={index} {...widget} />;
                            } 
                            else if (widget.type === 'drag_to_launch') {
                                return <DragToLaunchWidget key={index} {...widget} />;
                            }
                            else if (widget.type === 'toolbar') {
                                return <Toolbar 
                                    key={index} 
                                    {...widget} 
                                    isExpanded={isExpanded} 
                                    collapse={collapse} 
                                    onScreenshot={handleScreenshot}
                                />;
                            }
                            return null;
                        })}
                    </div>
                </div>

                {screenshotPath && (
                    <ScreenshotOverlay 
                        screenshotPath={screenshotPath} 
                        setScreenshotPath={setScreenshotPath} 
                    />
                )}
            </div>
        </div>
    );
};

export default Sidebar;
