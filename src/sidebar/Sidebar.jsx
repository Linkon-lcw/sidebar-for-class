import React, { useState, useEffect, useRef, useCallback } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';

const Sidebar = () => {
    const [config, setConfig] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [scale, setScale] = useState(1);
    const [startH, setStartH] = useState(64);

    const sidebarRef = useRef(null);
    const wrapperRef = useRef(null);
    const animationIdRef = useRef(null);

    // Constants from renderer.js
    const BASE_START_W = 4;
    const BASE_START_H = 64;
    const TARGET_W = 400;
    const TARGET_H = 450;
    const THRESHOLD = 60;
    const VELOCITY_THRESHOLD = 0.5;

    // State for dragging
    const draggingState = useRef({
        isDragging: false,
        isSwipeActive: false,
        startX: 0,
        lastX: 0,
        lastTime: 0,
        startTimeStamp: 0,
        currentVelocity: 0,
        lastIgnoreState: null,
        lastResizeTime: 0
    });

    const setIgnoreMouse = (ignore) => {
        if (window.electronAPI && ignore !== draggingState.current.lastIgnoreState) {
            draggingState.current.lastIgnoreState = ignore;
            window.electronAPI.setIgnoreMouse(ignore, true);
        }
    };

    const updateSidebarStyles = useCallback((progress) => {
        if (!sidebarRef.current) return;

        progress = Math.max(0, Math.min(1, progress));
        const currentW = BASE_START_W + (TARGET_W - BASE_START_W) * progress;
        const currentH = startH + (TARGET_H - startH) * progress;
        const currentRadius = 4 + (12 * progress);
        const currentMargin = 6 + (6 * progress);

        sidebarRef.current.style.width = `${currentW}px`;
        sidebarRef.current.style.height = `${currentH}px`;
        sidebarRef.current.style.borderRadius = `${currentRadius}px`;
        sidebarRef.current.style.marginLeft = `${currentMargin}px`;

        if (config?.transforms && config?.displayBounds) {
            if (!window.electronAPI) return;
            const { posy } = config.transforms;
            const { y: screenY, height: screenH } = config.displayBounds;
            let targetWinW, targetWinH;

            if (progress <= 0) {
                targetWinW = 20 * scale;
                targetWinH = (startH + 40) * scale;
            } else {
                const rect = sidebarRef.current.getBoundingClientRect();
                targetWinW = Math.floor(rect.width + 100 * scale);
                targetWinH = Math.ceil(rect.height + 40 * scale);
            }

            const startCenterY = screenY + posy;
            const expandedWinH = (TARGET_H + 120) * scale;
            const safeCenterY = Math.max(
                screenY + expandedWinH / 2 + 20,
                Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)
            );
            const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
            const newWindowY = currentCenterY - (targetWinH / 2);

            if (progress === 0 || progress === 1) {
                window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
            } else {
                // Throttle resize
                if (Date.now() - draggingState.current.lastResizeTime > 16) {
                    window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
                    draggingState.current.lastResizeTime = Date.now();
                }
            }
        }

        const gray = Math.floor(156 + (255 - 156) * progress);
        sidebarRef.current.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
    }, [config, scale, startH]);

    const stopAnimation = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
    };

    const finishExpand = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) sidebarRef.current.style.transition = '';
    };

    const finishCollapse = () => {
        window.electronAPI.resizeWindow(20 * scale, (startH + 40) * scale);
        setIgnoreMouse(false);
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = '';
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebarRef.current.style[p] = '');
        }
    };

    const expand = () => {
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        if (isExpanded && !draggingState.current.isDragging && !animationIdRef.current && Math.abs(baseW - TARGET_W) < 1) return;

        stopAnimation();
        setIsExpanded(true);
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);
            if (t >= 1) {
                updateSidebarStyles(1);
                animationIdRef.current = null;
                finishExpand();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    const collapse = () => {
        stopAnimation();
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        setIsExpanded(false);

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress * (1 - easeOutQuart(t));
            if (t >= 1) {
                updateSidebarStyles(0);
                animationIdRef.current = null;
                finishCollapse();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    // Load initial config and watch for updates
    useEffect(() => {
        if (!window.electronAPI) return;
        const fetchConfig = async () => {
            const c = await window.electronAPI.getConfig();
            applyConfig(c);
        };
        fetchConfig();

        const unbind = window.electronAPI.onConfigUpdated((newConfig) => {
            applyConfig(newConfig);
        });

        return () => {
            // onConfigUpdated returns an unbind function or we just don't have one
            // Usually with ipcRenderer.on we should use ipcRenderer.removeListener
        };
    }, []);

    const applyConfig = (c) => {
        setConfig(c);
        if (c.transforms) {
            if (typeof c.transforms.size === 'number' && c.transforms.size > 0) {
                setScale(c.transforms.size / 100);
            }
            if (typeof c.transforms.height === 'number') {
                setStartH(c.transforms.height);
            }
            if (typeof c.transforms.animation_speed === 'number') {
                const speed = c.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        document.documentElement.style.setProperty('--sidebar-scale', String(c.transforms?.size / 100 || 1));
    };

    useEffect(() => {
        updateSidebarStyles(isExpanded ? 1 : 0);
    }, [isExpanded, scale, startH, updateSidebarStyles]);

    // Dragging handlers
    const activateDragVisuals = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '500px';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
    };

    const handleStart = (currentX, target) => {
        const isInteractive = (el) => {
            return el.tagName === 'INPUT' ||
                el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                el.closest('.launcher-item') ||
                el.closest('.volume-slider-container');
        };

        if (isExpanded && isInteractive(target)) return;

        const ds = draggingState.current;
        ds.isDragging = true;
        ds.lastX = currentX;
        ds.lastTime = performance.now();
        ds.startTimeStamp = ds.lastTime;
        ds.currentVelocity = 0;
        setIgnoreMouse(false);

        ds.isSwipeActive = true;

        if (animationIdRef.current) {
            const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
            const currentProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));
            ds.startX = currentX - (currentProgress * 250);
            stopAnimation();
        } else {
            if (isExpanded) {
                ds.isSwipeActive = false;
                ds.startX = currentX - 250;
            } else {
                ds.startX = currentX;
            }
        }

        if (ds.isSwipeActive) activateDragVisuals();
    };

    const handleMove = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;

        const now = performance.now();
        const dt = now - ds.lastTime;
        if (dt > 0) ds.currentVelocity = (currentX - ds.lastX) / dt;
        ds.lastX = currentX;
        ds.lastTime = now;

        if (!ds.isSwipeActive) {
            if (ds.currentVelocity < -0.8) {
                ds.isSwipeActive = true;
                activateDragVisuals();
            } else {
                return;
            }
        }

        const deltaX = currentX - ds.startX;
        updateSidebarStyles(deltaX / 250);
    }, [updateSidebarStyles]);

    const handleEnd = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;
        ds.isDragging = false;

        if (!ds.isSwipeActive) return;

        const deltaX = currentX ? (currentX - ds.startX) : 0;
        const duration = performance.now() - ds.startTimeStamp;

        if (ds.currentVelocity < -VELOCITY_THRESHOLD) {
            collapse();
            return;
        }

        if (deltaX > THRESHOLD || ds.currentVelocity > VELOCITY_THRESHOLD || (duration < 200 && deltaX > 20)) {
            expand();
        } else {
            collapse();
        }
    }, [expand, collapse]);

    useEffect(() => {
        const onMouseMove = (e) => {
            const ds = draggingState.current;
            if (ds.isDragging || animationIdRef.current) {
                setIgnoreMouse(false);
                return;
            }
            let shouldIgnore = true;
            if (isExpanded) {
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            } else {
                if (wrapperRef.current) {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            }
            setIgnoreMouse(shouldIgnore);
        };

        const onMouseLeave = () => setIgnoreMouse(true);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [isExpanded]);

    // External Drag and Auto-Collapse
    useEffect(() => {
        let dragLeaveTimer = null;

        const onDragEnter = (e) => {
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
            if (draggingState.current.isDragging || isExpanded) return;
            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                window.electronAPI.setAlwaysOnTop(false);
                expand();
            }
        };

        const onDragOver = (e) => {
            e.preventDefault();
            setIgnoreMouse(false);
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
        };

        const onDragLeave = () => {
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            dragLeaveTimer = setTimeout(() => {
                if (isExpanded && !draggingState.current.isDragging) {
                    collapse();
                    window.electronAPI.setAlwaysOnTop(true);
                }
            }, 150);
        };

        const onDrop = (e) => {
            e.preventDefault();
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            collapse();
            window.electronAPI.setAlwaysOnTop(true);
        };

        const onWindowMouseDown = (e) => {
            if (isExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                collapse();
            }
        };

        const onBlur = () => {
            if (isExpanded) collapse();
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('mousedown', onWindowMouseDown);
        window.addEventListener('blur', onBlur);
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
            window.removeEventListener('mousedown', onWindowMouseDown);
            window.removeEventListener('blur', onBlur);
        };
    }, [isExpanded, expand, collapse]);

    useEffect(() => {
        const onMouseMove = (e) => handleMove(e.screenX);
        const onMouseUp = (e) => handleEnd(e.screenX);
        const onTouchMove = (e) => {
            if (e.touches.length > 0 && draggingState.current.isDragging) {
                handleMove(e.touches[0].screenX);
            }
        };
        const onTouchEnd = (e) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handleMove, handleEnd]);

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
                            } else if (widget.type === 'volume_slider') {
                                return <VolumeWidget key={index} />;
                            } else if (widget.type === 'files') {
                                return <FilesWidget key={index} {...widget} />;
                            } else if (widget.type === 'drag_to_launch') {
                                return (
                                    <div key={index} className="launcher-group layout-vertical">
                                        <DragToLaunchWidget {...widget} />
                                    </div>
                                );
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
