import React, { useEffect } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';
import Toolbar from './components/Toolbar';
import useSidebarRefs from './hooks/useSidebarRefs';
import useSidebarConfig from './hooks/useSidebarConfig';
import useSidebarAnimation from './hooks/useSidebarAnimation';
import useSidebarDrag from './hooks/useSidebarDrag';
import useSidebarMouseIgnore from './hooks/useSidebarMouseIgnore';
import useExternalDrag from './hooks/useExternalDrag';
import useGlobalEvents from './hooks/useGlobalEvents';

const Sidebar = () => {
    const { sidebarRef, wrapperRef, animationIdRef, draggingState, constants } = useSidebarRefs();
    const { config, scale, startH, panelWidth, panelHeight } = useSidebarConfig();
    const { isExpanded, expand, collapse, updateSidebarStyles, stopAnimation, setIgnoreMouse, setWindowToLarge } = useSidebarAnimation(config, scale, startH, panelWidth, panelHeight, sidebarRef, wrapperRef, animationIdRef, draggingState, constants);
    const { handleStart, handleMove, handleEnd } = useSidebarDrag(isExpanded, updateSidebarStyles, expand, collapse, stopAnimation, setIgnoreMouse, sidebarRef, wrapperRef, animationIdRef, draggingState, constants, panelWidth, setWindowToLarge);
    useSidebarMouseIgnore(isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse);
    useExternalDrag(isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config);
    useGlobalEvents(handleMove, handleEnd, draggingState);

    useEffect(() => {
        if (!window.electronAPI) {
            console.log('Not in Electron environment, auto-hide functionality disabled');
            return;
        }

        const handleWindowBlur = () => {
            console.log('Auto-hide debug:', {
                autoHideEnabled: config?.transforms?.auto_hide,
                isExpanded: isExpanded,
                event: 'window-blur'
            });

            if (config?.transforms?.auto_hide && isExpanded) {
                console.log('Collapsing sidebar due to window focus loss');
                collapse();
            }
        };

        console.log('Adding window blur listener');
        const unsubscribe = window.electronAPI.onWindowBlur(handleWindowBlur);

        return () => {
            console.log('Removing window blur listener');
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [config, isExpanded, collapse]);

    const handleSettingsClick = (e) => {
        e.stopPropagation();
        window.electronAPI.openSettings();
    };

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
                                return <Toolbar key={index} {...widget} isExpanded={isExpanded} collapse={collapse} />;
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
