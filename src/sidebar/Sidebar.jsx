/**
 * 侧边栏主组件
 * 负责管理侧边栏的展开/收起状态、拖拽交互、配置加载等功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';

const Sidebar = () => {
    // 配置状态：存储从主进程获取的配置信息
    const [config, setConfig] = useState(null);
    // 展开状态：标识侧边栏是否处于展开状态
    const [isExpanded, setIsExpanded] = useState(false);
    // 缩放比例：侧边栏的整体缩放倍数
    const [scale, setScale] = useState(1);
    // 初始高度：侧边栏收起状态下的高度（像素）
    const [startH, setStartH] = useState(64);

    // DOM 引用
    const sidebarRef = useRef(null);  // 侧边栏容器的 DOM 引用
    const wrapperRef = useRef(null);  // 外层包装器的 DOM 引用
    const animationIdRef = useRef(null);  // 动画帧 ID，用于取消动画

    // 尺寸常量（从 renderer.js 继承）
    const BASE_START_W = 4;      // 收起状态的宽度（像素）
    const BASE_START_H = 64;     // 收起状态的基础高度（像素）
    const TARGET_W = 400;        // 展开状态的目标宽度（像素）
    const TARGET_H = 450;        // 展开状态的目标高度（像素）
    const THRESHOLD = 60;         // 拖拽距离阈值，超过此值则展开
    const VELOCITY_THRESHOLD = 0.5;  // 速度阈值，用于判断快速滑动

    // 拖拽状态管理（使用 ref 避免触发重渲染）
    const draggingState = useRef({
        isDragging: false,        // 是否正在拖拽
        isSwipeActive: false,     // 是否激活了滑动交互
        startX: 0,                // 拖拽开始的 X 坐标
        lastX: 0,                 // 上一次的 X 坐标
        lastTime: 0,              // 上一次的时间戳
        startTimeStamp: 0,        // 拖拽开始的时间戳
        currentVelocity: 0,       // 当前拖拽速度
        lastIgnoreState: null,    // 上一次的鼠标穿透状态
        lastResizeTime: 0         // 上一次窗口调整大小的时间戳（用于节流）
    });

    /**
     * 设置鼠标事件穿透
     * @param {boolean} ignore - true 表示忽略鼠标事件（穿透），false 表示接收鼠标事件
     */
    const setIgnoreMouse = (ignore) => {
        // 只在状态改变时调用，避免频繁的 IPC 通信
        if (window.electronAPI && ignore !== draggingState.current.lastIgnoreState) {
            draggingState.current.lastIgnoreState = ignore;
            window.electronAPI.setIgnoreMouse(ignore, true);
        }
    };

    /**
     * 更新侧边栏样式
     * 根据展开进度（0-1）计算并应用样式
     * @param {number} progress - 展开进度，0 表示完全收起，1 表示完全展开
     */
    const updateSidebarStyles = useCallback((progress) => {
        if (!sidebarRef.current) return;

        // 将进度限制在 0-1 之间
        progress = Math.max(0, Math.min(1, progress));
        
        // 根据进度计算当前尺寸和样式值（线性插值）
        const currentW = BASE_START_W + (TARGET_W - BASE_START_W) * progress;  // 宽度
        const currentH = startH + (TARGET_H - startH) * progress;              // 高度
        const currentRadius = 4 + (12 * progress);                              // 圆角半径
        const currentMargin = 6 + (6 * progress);                               // 左边距

        // 应用计算出的样式
        sidebarRef.current.style.width = `${currentW}px`;
        sidebarRef.current.style.height = `${currentH}px`;
        sidebarRef.current.style.borderRadius = `${currentRadius}px`;
        sidebarRef.current.style.marginLeft = `${currentMargin}px`;

        // 如果配置了窗口变换和显示器边界，则调整窗口大小和位置
        if (config?.transforms && config?.displayBounds) {
            if (!window.electronAPI) return;
            const { posy } = config.transforms;  // 垂直位置偏移
            const { y: screenY, height: screenH } = config.displayBounds;  // 显示器边界
            let targetWinW, targetWinH;

            // 根据展开状态计算窗口尺寸
            if (progress <= 0) {
                // 收起状态：窗口很小
                targetWinW = 20 * scale;
                targetWinH = (startH + 40) * scale;
            } else {
                // 展开状态：根据实际 DOM 尺寸计算窗口大小
                const rect = sidebarRef.current.getBoundingClientRect();
                targetWinW = Math.floor(rect.width + 100 * scale);   // 宽度加上边距
                targetWinH = Math.ceil(rect.height + 40 * scale);      // 高度加上边距
            }

            // 计算窗口垂直位置，确保窗口不会超出屏幕边界
            const startCenterY = screenY + posy;  // 初始中心 Y 坐标
            const expandedWinH = (TARGET_H + 120) * scale;  // 展开时的窗口高度
            // 计算安全的中心 Y 坐标，确保窗口完全在屏幕内
            const safeCenterY = Math.max(
                screenY + expandedWinH / 2 + 20,  // 上边界
                Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)  // 下边界
            );
            // 根据进度插值计算当前中心 Y 坐标
            const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
            const newWindowY = currentCenterY - (targetWinH / 2);  // 窗口顶部 Y 坐标

            // 在完全收起或展开时立即调整，否则节流调整（避免频繁调用）
            if (progress === 0 || progress === 1) {
                window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
            } else {
                // 节流：限制调整频率，避免性能问题
                if (Date.now() - draggingState.current.lastResizeTime > 16) {
                    window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
                    draggingState.current.lastResizeTime = Date.now();
                }
            }
        }

        // 根据进度计算背景颜色（从灰色渐变到白色，透明度也增加）
        const gray = Math.floor(156 + (255 - 156) * progress);
        sidebarRef.current.style.background = `rgba(${gray}, ${gray}, ${gray}, ${0.8 + 0.15 * progress})`;
    }, [config, scale, startH]);

    /**
     * 停止当前动画
     */
    const stopAnimation = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
    };

    /**
     * 完成展开动画后的清理工作
     */
    const finishExpand = () => {
        // 清除内联样式，让 CSS 接管
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) sidebarRef.current.style.transition = '';
    };

    /**
     * 完成收起动画后的清理工作
     */
    const finishCollapse = () => {
        // 调整窗口到最小尺寸
        window.electronAPI.resizeWindow(20 * scale, (startH + 40) * scale);
        // 恢复鼠标事件接收
        setIgnoreMouse(false);
        // 清除所有内联样式
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = '';
            // 清除所有尺寸和样式相关的内联样式
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebarRef.current.style[p] = '');
        }
    };

    /**
     * 展开侧边栏
     * 使用缓动函数创建平滑的展开动画
     */
    const expand = () => {
        // 获取当前宽度，如果无法获取则使用基础宽度
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        // 如果已经展开且不在拖拽中且没有动画且已接近目标宽度，则直接返回
        if (isExpanded && !draggingState.current.isDragging && !animationIdRef.current && Math.abs(baseW - TARGET_W) < 1) return;

        // 停止任何正在进行的动画
        stopAnimation();
        setIsExpanded(true);
        // 设置包装器宽度为 100%，禁用过渡效果以便手动控制动画
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';

        // 获取动画速度配置，默认值为 1
        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;  // 动画持续时间（毫秒），速度越快时间越短
        const startTime = performance.now();
        // 缓动函数：四次方缓出（ease-out quart）
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        // 计算起始进度（基于当前宽度）
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

        // 动画循环函数
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;  // 已过时间
            const t = Math.min(1, elapsed / duration);  // 归一化时间（0-1）
            // 计算当前进度：从起始进度到 1，应用缓动函数
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);
            if (t >= 1) {
                // 动画完成
                updateSidebarStyles(1);
                animationIdRef.current = null;
                finishExpand();
            } else {
                // 继续动画
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    /**
     * 收起侧边栏
     * 使用缓动函数创建平滑的收起动画
     */
    const collapse = () => {
        // 停止任何正在进行的动画
        stopAnimation();
        // 设置包装器宽度为 100%，禁用过渡效果
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        setIsExpanded(false);

        // 获取动画速度配置
        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        // 缓动函数：四次方缓出
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        // 获取当前宽度并计算起始进度
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));

        // 动画循环函数
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            // 计算当前进度：从起始进度到 0，应用缓动函数
            const p = startProgress * (1 - easeOutQuart(t));
            if (t >= 1) {
                // 动画完成
                updateSidebarStyles(0);
                animationIdRef.current = null;
                finishCollapse();
            } else {
                // 继续动画
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    /**
     * 加载初始配置并监听配置更新
     * 组件挂载时执行
     */
    useEffect(() => {
        if (!window.electronAPI) return;
        
        // 异步获取配置
        const fetchConfig = async () => {
            const c = await window.electronAPI.getConfig();
            applyConfig(c);
        };
        fetchConfig();

        // 监听配置更新事件
        const unbind = window.electronAPI.onConfigUpdated((newConfig) => {
            applyConfig(newConfig);
        });

        return () => {
            // 清理函数：如果需要取消监听，可以在这里调用 unbind
            // 注意：onConfigUpdated 可能返回一个取消监听的函数
        };
    }, []);

    /**
     * 应用配置
     * 将配置值应用到组件状态和 CSS 变量
     * @param {Object} c - 配置对象
     */
    const applyConfig = (c) => {
        setConfig(c);
        if (c.transforms) {
            // 应用缩放比例（配置中存储的是百分比，需要转换为小数）
            if (typeof c.transforms.size === 'number' && c.transforms.size > 0) {
                setScale(c.transforms.size / 100);
            }
            // 应用初始高度
            if (typeof c.transforms.height === 'number') {
                setStartH(c.transforms.height);
            }
            // 应用动画速度，更新 CSS 变量
            if (typeof c.transforms.animation_speed === 'number') {
                const speed = c.transforms.animation_speed;
                // 设置侧边栏和内容的动画持续时间（速度越快，时间越短）
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        // 设置全局缩放 CSS 变量
        document.documentElement.style.setProperty('--sidebar-scale', String(c.transforms?.size / 100 || 1));
    };

    /**
     * 当展开状态、缩放或高度改变时，更新侧边栏样式
     */
    useEffect(() => {
        updateSidebarStyles(isExpanded ? 1 : 0);
    }, [isExpanded, scale, startH, updateSidebarStyles]);

    /**
     * 激活拖拽视觉效果
     * 在开始拖拽时调用，为拖拽交互做准备
     */
    const activateDragVisuals = () => {
        // 设置包装器宽度，为拖拽提供足够的空间
        if (wrapperRef.current) wrapperRef.current.style.width = '500px';
        // 禁用过渡效果，以便实时响应拖拽
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
    };

    /**
     * 处理拖拽开始事件
     * @param {number} currentX - 当前鼠标/触摸的屏幕 X 坐标
     * @param {HTMLElement} target - 触发事件的 DOM 元素
     */
    const handleStart = (currentX, target) => {
        // 判断元素是否为可交互元素（不应触发拖拽）
        const isInteractive = (el) => {
            return el.tagName === 'INPUT' ||
                el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                el.closest('.launcher-item') ||
                el.closest('.volume-slider-container');
        };

        // 如果侧边栏已展开且点击的是交互元素，则不处理拖拽
        if (isExpanded && isInteractive(target)) return;

        const ds = draggingState.current;
        // 初始化拖拽状态
        ds.isDragging = true;
        ds.lastX = currentX;
        ds.lastTime = performance.now();
        ds.startTimeStamp = ds.lastTime;
        ds.currentVelocity = 0;
        // 恢复鼠标事件接收（不再穿透）
        setIgnoreMouse(false);

        ds.isSwipeActive = true;

        // 如果正在动画中，需要计算正确的起始位置
        if (animationIdRef.current) {
            const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
            const currentProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (TARGET_W - BASE_START_W)));
            // 根据当前进度计算起始 X 坐标（250 是拖拽范围）
            ds.startX = currentX - (currentProgress * 250);
            stopAnimation();
        } else {
            // 如果已展开，从当前位置减去 250（假设已完全展开）
            if (isExpanded) {
                ds.isSwipeActive = false;  // 已展开时不激活滑动
                ds.startX = currentX - 250;
            } else {
                // 收起状态：从当前位置开始
                ds.startX = currentX;
            }
        }

        // 如果激活了滑动，则激活拖拽视觉效果
        if (ds.isSwipeActive) activateDragVisuals();
    };

    /**
     * 处理拖拽移动事件
     * @param {number} currentX - 当前鼠标/触摸的屏幕 X 坐标
     */
    const handleMove = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;

        // 计算速度（像素/毫秒）
        const now = performance.now();
        const dt = now - ds.lastTime;
        if (dt > 0) ds.currentVelocity = (currentX - ds.lastX) / dt;
        ds.lastX = currentX;
        ds.lastTime = now;

        // 如果滑动未激活，检查速度是否足够快以激活滑动
        if (!ds.isSwipeActive) {
            // 向左快速滑动（负速度）时激活
            if (ds.currentVelocity < -0.8) {
                ds.isSwipeActive = true;
                activateDragVisuals();
            } else {
                return;  // 速度不够，不处理
            }
        }

        // 计算拖拽距离并转换为展开进度（250 是拖拽范围）
        const deltaX = currentX - ds.startX;
        updateSidebarStyles(deltaX / 250);
    }, [updateSidebarStyles]);

    /**
     * 处理拖拽结束事件
     * 根据拖拽距离、速度和持续时间决定是展开还是收起
     * @param {number} currentX - 当前鼠标/触摸的屏幕 X 坐标（可能为 null）
     */
    const handleEnd = useCallback((currentX) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;
        ds.isDragging = false;

        // 如果滑动未激活，不处理
        if (!ds.isSwipeActive) return;

        // 计算拖拽距离和持续时间
        const deltaX = currentX ? (currentX - ds.startX) : 0;
        const duration = performance.now() - ds.startTimeStamp;

        // 如果向左快速滑动（负速度），则收起
        if (ds.currentVelocity < -VELOCITY_THRESHOLD) {
            collapse();
            return;
        }

        // 判断是否应该展开：
        // 1. 拖拽距离超过阈值
        // 2. 向右快速滑动（正速度）
        // 3. 快速短距离拖拽（持续时间短且距离足够）
        if (deltaX > THRESHOLD || ds.currentVelocity > VELOCITY_THRESHOLD || (duration < 200 && deltaX > 20)) {
            expand();
        } else {
            collapse();
        }
    }, [expand, collapse]);

    /**
     * 鼠标移动事件处理
     * 根据鼠标位置动态设置鼠标事件穿透，实现侧边栏的"点击穿透"效果
     */
    useEffect(() => {
        const onMouseMove = (e) => {
            const ds = draggingState.current;
            // 如果正在拖拽或动画中，不穿透鼠标事件
            if (ds.isDragging || animationIdRef.current) {
                setIgnoreMouse(false);
                return;
            }
            
            let shouldIgnore = true;  // 默认穿透
            // 检查鼠标是否在侧边栏区域内
            if (isExpanded) {
                // 展开状态：检查是否在侧边栏内
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;  // 在侧边栏内，不穿透
                    }
                }
            } else {
                // 收起状态：检查是否在包装器内
                if (wrapperRef.current) {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;  // 在包装器内，不穿透
                    }
                }
            }
            setIgnoreMouse(shouldIgnore);
        };

        // 鼠标离开窗口时，恢复穿透
        const onMouseLeave = () => setIgnoreMouse(true);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [isExpanded]);

    /**
     * 外部拖拽和自动收起功能
     * 处理从外部拖拽文件到侧边栏的场景，以及点击外部区域自动收起
     */
    useEffect(() => {
        let dragLeaveTimer = null;  // 拖拽离开的延迟定时器

        // 拖拽进入窗口时
        const onDragEnter = (e) => {
            // 清除之前的延迟定时器
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
            // 如果正在拖拽侧边栏本身或已展开，则不处理
            if (draggingState.current.isDragging || isExpanded) return;
            // 如果有拖拽数据，则展开侧边栏并取消置顶（以便接收文件）
            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                window.electronAPI.setAlwaysOnTop(false);
                expand();
            }
        };

        // 拖拽在窗口上方时
        const onDragOver = (e) => {
            e.preventDefault();  // 允许放置
            setIgnoreMouse(false);  // 不穿透鼠标事件
            // 清除延迟定时器（因为还在拖拽中）
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
        };

        // 拖拽离开窗口时
        const onDragLeave = () => {
            // 设置延迟定时器，避免频繁触发
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            dragLeaveTimer = setTimeout(() => {
                // 如果已展开且不在拖拽侧边栏本身，则收起并恢复置顶
                if (isExpanded && !draggingState.current.isDragging) {
                    collapse();
                    window.electronAPI.setAlwaysOnTop(true);
                }
            }, 150);
        };

        // 文件放置时
        const onDrop = (e) => {
            e.preventDefault();
            // 清除延迟定时器
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            // 收起侧边栏并恢复置顶
            collapse();
            window.electronAPI.setAlwaysOnTop(true);
        };

        // 窗口内鼠标按下时
        const onWindowMouseDown = (e) => {
            // 如果侧边栏已展开且点击的不是侧边栏内部，则收起
            if (isExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                collapse();
            }
        };

        // 窗口失去焦点时
        const onBlur = () => {
            // 如果已展开，则收起
            if (isExpanded) collapse();
        };

        // 注册事件监听器
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('mousedown', onWindowMouseDown);
        window.addEventListener('blur', onBlur);
        // 禁用右键菜单
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            // 清理事件监听器
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
            window.removeEventListener('mousedown', onWindowMouseDown);
            window.removeEventListener('blur', onBlur);
        };
    }, [isExpanded, expand, collapse]);

    /**
     * 全局鼠标和触摸事件处理
     * 监听窗口级别的鼠标移动、抬起和触摸事件，用于拖拽交互
     */
    useEffect(() => {
        // 鼠标移动事件
        const onMouseMove = (e) => handleMove(e.screenX);
        // 鼠标抬起事件
        const onMouseUp = (e) => handleEnd(e.screenX);
        // 触摸移动事件
        const onTouchMove = (e) => {
            if (e.touches.length > 0 && draggingState.current.isDragging) {
                handleMove(e.touches[0].screenX);
            }
        };
        // 触摸结束事件
        const onTouchEnd = (e) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });  // 非被动，可以阻止默认行为
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handleMove, handleEnd]);

    /**
     * 处理设置按钮点击事件
     * @param {Event} e - 点击事件对象
     */
    const handleSettingsClick = (e) => {
        e.stopPropagation();  // 阻止事件冒泡，避免触发侧边栏的拖拽
        window.electronAPI.openSettings();  // 打开设置窗口
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
                    {/* 设置按钮 */}
                    <button id="settings-btn" className="settings-button" title="设置" onClick={handleSettingsClick}>
                        <i className="fas fa-cog"></i>
                    </button>
                    {/* 组件容器：根据配置渲染不同类型的组件 */}
                    <div id="widget-container" className="widget-list">
                        {config?.widgets?.map((widget, index) => {
                            // 启动器组件：显示多个可启动的应用
                            if (widget.type === 'launcher') {
                                return (
                                    <div key={index} className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                        {widget.targets.map((target, tIndex) => (
                                            <LauncherItem key={tIndex} {...target} />
                                        ))}
                                    </div>
                                );
                            } 
                            // 音量控制组件：显示音量滑块
                            else if (widget.type === 'volume_slider') {
                                return <VolumeWidget key={index} />;
                            } 
                            // 文件列表组件：显示指定文件夹中的文件
                            else if (widget.type === 'files') {
                                return <FilesWidget key={index} {...widget} />;
                            } 
                            // 拖放启动组件：允许拖放文件来启动应用
                            else if (widget.type === 'drag_to_launch') {
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
