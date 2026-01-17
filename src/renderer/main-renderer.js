/**
 * 渲染进程主入口
 * 管理侧边栏的状态、动画和配置加载
 * 注意：此文件可能已被 React 版本替代，保留用于兼容性
 */

import { renderWidgets } from '../widgets/index.js';
import { updateSidebarStyles } from './sidebar-ui.js';
import { createAnimationManager } from './animation.js';

// 获取 DOM 元素
const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');

// 状态对象：存储侧边栏的各种状态
const state = {
    isDragging: false,        // 是否正在拖拽
    isSwipeActive: false,     // 是否激活了滑动交互
    startX: 0,                // 拖拽开始的 X 坐标
    currentConfig: null,      // 当前配置对象
    animationId: null,        // 动画帧 ID
    currentVelocity: 0,       // 当前拖拽速度
    startTimeStamp: 0,       // 拖拽开始的时间戳
    lastIgnoreState: null,   // 上一次的鼠标穿透状态
    lastX: 0,                // 上一次的 X 坐标
    lastTime: 0,             // 上一次的时间戳
    lastResizeTime: 0,       // 上一次窗口调整大小的时间戳
    SCALE: 1,                // 缩放比例
    START_H: 64,             // 初始高度
    START_W: 4,              // 初始宽度
};

// 尺寸常量
const BASE_START_W = 4;      // 收起状态的宽度（像素）
const BASE_START_H = 64;     // 收起状态的基础高度（像素）
const TARGET_W = 400;        // 展开状态的目标宽度（像素）
const TARGET_H = 450;        // 展开状态的目标高度（像素）

/**
 * 节流窗口调整大小函数
 * 限制窗口调整频率，避免性能问题
 * @param {number} w - 窗口宽度
 * @param {number} h - 窗口高度
 * @param {number} y - 窗口 Y 坐标
 */
function throttledResize(w, h, y) {
    // 限制为每 16ms（约 60fps）最多调用一次
    if (Date.now() - state.lastResizeTime > 16) {
        window.electronAPI.resizeWindow(w, h, y);
        state.lastResizeTime = Date.now();
    }
}

/**
 * 设置鼠标事件穿透
 * @param {boolean} ignore - true 表示忽略鼠标事件（穿透），false 表示接收鼠标事件
 */
function setIgnoreMouse(ignore) {
    // 只在状态改变时调用，避免频繁的 IPC 通信
    if (ignore !== state.lastIgnoreState) {
        state.lastIgnoreState = ignore;
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

/**
 * UI 更新包装函数
 * 根据展开进度更新侧边栏样式
 * @param {number} progress - 展开进度（0-1）
 */
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

// 创建动画管理器
const anim = createAnimationManager(sidebar, wrapper, state, uiUpdater);

/**
 * 加载配置
 * 从主进程获取配置并应用到侧边栏
 */
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        state.currentConfig = config;
        if (config.transforms) {
            // 应用缩放比例（配置中存储的是百分比，需要转换为小数）
            state.SCALE = (config.transforms.size || 100) / 100;
            document.documentElement.style.setProperty('--sidebar-scale', String(state.SCALE));
            // 应用初始高度
            state.START_H = config.transforms.height || BASE_START_H;
            // 初始化 UI 状态（收起状态）
            uiUpdater(0);
            // 应用动画速度
            if (config.transforms.animation_speed) {
                const speed = config.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
        // 渲染组件
        renderWidgets(config.widgets);
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

// 事件处理 (简化示例，实际应包含 handleStart/Move/End)
// ... 

// 初始化：加载配置
loadConfig();

// 监听配置更新事件
window.electronAPI.onConfigUpdated((newConfig) => {
    state.currentConfig = newConfig;
    // ... update logic
    // 根据当前展开状态更新 UI
    uiUpdater(document.body.classList.contains('expanded') ? 1 : 0);
    // 重新渲染组件
    renderWidgets(newConfig.widgets);
});

// 导出一些可能需要的方法
export { anim, state, uiUpdater };
