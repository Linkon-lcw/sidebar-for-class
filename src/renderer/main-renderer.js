/**
 * 渲染进程主入口
 */

import { renderWidgets } from '../widgets/index.js';
import { updateSidebarStyles } from './sidebar-ui.js';
import { createAnimationManager } from './animation.js';

const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');

// 状态对象
const state = {
    isDragging: false,
    isSwipeActive: false,
    startX: 0,
    currentConfig: null,
    animationId: null,
    currentVelocity: 0,
    startTimeStamp: 0,
    lastIgnoreState: null,
    lastX: 0,
    lastTime: 0,
    lastResizeTime: 0,
    SCALE: 1,
    START_H: 64,
    START_W: 4,
};

const BASE_START_W = 4;
const BASE_START_H = 64;
const TARGET_W = 400;
const TARGET_H = 450;

// 节流函数
function throttledResize(w, h, y) {
    if (Date.now() - state.lastResizeTime > 16) {
        window.electronAPI.resizeWindow(w, h, y);
        state.lastResizeTime = Date.now();
    }
}

// 穿透设置
function setIgnoreMouse(ignore) {
    if (ignore !== state.lastIgnoreState) {
        state.lastIgnoreState = ignore;
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

// UI 更新包装
const uiUpdater = (progress) => {
    updateSidebarStyles(
        sidebar,
        state.currentConfig,
        progress,
        state.START_W,
        TARGET_W,
        state.START_H,
        TARGET_H,
        state.SCALE,
        setIgnoreMouse,
        throttledResize
    );
};

// 动画管理器
const anim = createAnimationManager(sidebar, wrapper, state, uiUpdater);

// 加载配置
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        state.currentConfig = config;
        if (config.transforms) {
            state.SCALE = (config.transforms.size || 100) / 100;
            document.documentElement.style.setProperty('--sidebar-scale', String(state.SCALE));
            state.START_H = config.transforms.height || BASE_START_H;
            uiUpdater(0);
            if (config.transforms.animation_speed) {
                const speed = config.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        renderWidgets(config.widgets);
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

// 事件处理 (简化示例，实际应包含 handleStart/Move/End)
// ... 

// 初始化
loadConfig();

window.electronAPI.onConfigUpdated((newConfig) => {
    state.currentConfig = newConfig;
    // ... update logic
    uiUpdater(document.body.classList.contains('expanded') ? 1 : 0);
    renderWidgets(newConfig.widgets);
});

// 导出一些可能需要的方法
export { anim, state, uiUpdater };
