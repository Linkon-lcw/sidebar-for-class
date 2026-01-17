/**
 * 侧边栏动画逻辑
 * 管理侧边栏的展开和收起动画
 * @param {HTMLElement} sidebar - 侧边栏 DOM 元素
 * @param {HTMLElement} wrapper - 包装器 DOM 元素
 * @param {Object} state - 状态对象
 * @param {Function} uiUpdater - UI 更新函数
 * @returns {Object} 动画管理器对象，包含 expand、collapse、stopAnimation 方法
 */

export function createAnimationManager(sidebar, wrapper, state, uiUpdater) {
    // 动画帧 ID
    let animationId = null;

    /**
     * 停止当前动画
     */
    const stopAnimation = () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    /**
     * 完成展开动画后的清理工作
     */
    const finishExpand = () => {
        if (document.body.classList.contains('expanded')) {
            // 清除内联样式，让 CSS 接管
            wrapper.style.width = '';
            sidebar.style.transition = '';
        }
    };

    /**
     * 完成收起动画后的清理工作
     * @param {number} SCALE - 缩放比例
     * @param {number} START_H - 初始高度
     * @param {Function} setIgnoreMouse - 设置鼠标穿透的函数
     */
    const finishCollapse = (SCALE, START_H, setIgnoreMouse) => {
        if (!document.body.classList.contains('expanded')) {
            // 调整窗口到最小尺寸
            window.electronAPI.resizeWindow(20 * SCALE, (START_H + 40) * SCALE);
            // 恢复鼠标事件接收
            setIgnoreMouse(false);
            // 清除所有内联样式
            wrapper.style.width = '';
            sidebar.style.transition = '';
            // 清除所有尺寸和样式相关的内联样式
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'].forEach(p => sidebar.style[p] = '');
        }
    };

    /**
     * 展开侧边栏
     * 使用缓动函数创建平滑的展开动画
     * @param {Object} currentConfig - 当前配置对象
     * @param {number} START_W - 收起状态的宽度
     * @param {number} TARGET_W - 展开状态的目标宽度
     * @param {number} START_H - 收起状态的高度
     * @param {number} TARGET_H - 展开状态的目标高度
     * @param {number} SCALE - 缩放比例
     * @param {Function} setIgnoreMouse - 设置鼠标穿透的函数
     * @param {Function} throttledResize - 节流的窗口调整大小函数
     * @returns {number} 动画帧 ID
     */
    const expand = (currentConfig, START_W, TARGET_W, START_H, TARGET_H, SCALE, setIgnoreMouse, throttledResize) => {
        // 获取当前宽度，如果无法获取则使用基础宽度
        const baseW = parseFloat(sidebar.style.width) || START_W;
        // 如果已经展开且不在拖拽中且没有动画且已接近目标宽度，则直接返回
        if (document.body.classList.contains('expanded') && !state.isDragging && !animationId && Math.abs(baseW - TARGET_W) < 1) return;

        // 停止任何正在进行的动画
        stopAnimation();
        document.body.classList.add('expanded');
        // 设置包装器宽度为 100%，禁用过渡效果以便手动控制动画
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';

        // 获取动画速度配置，默认值为 1
        const speed = currentConfig?.transforms?.animation_speed || 1;
        const duration = 300 / speed;  // 动画持续时间（毫秒），速度越快时间越短
        const startTime = performance.now();
        // 缓动函数：四次方缓出（ease-out quart）
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        // 计算起始进度（基于当前宽度）
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        // 动画循环函数
        function animate(currentTime) {
            // 如果展开状态被取消，停止动画
            if (!document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;  // 已过时间
            const t = Math.min(1, elapsed / duration);  // 归一化时间（0-1）
            // 计算当前进度：从起始进度到 1，应用缓动函数
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);

            if (t >= 1) {
                // 动画完成
                uiUpdater(1);
                animationId = null;
                finishExpand();
            } else {
                // 继续动画
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        }
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    /**
     * 收起侧边栏
     * 使用缓动函数创建平滑的收起动画
     * @param {number} START_W - 收起状态的宽度
     * @param {number} TARGET_W - 展开状态的目标宽度
     * @param {number} START_H - 收起状态的高度
     * @param {number} SCALE - 缩放比例
     * @param {Function} setIgnoreMouse - 设置鼠标穿透的函数
     * @param {Function} throttledResize - 节流的窗口调整大小函数
     * @returns {number} 动画帧 ID
     */
    const collapse = (START_W, TARGET_W, START_H, SCALE, setIgnoreMouse, throttledResize) => {
        // 停止任何正在进行的动画
        stopAnimation();
        // 设置包装器宽度为 100%，禁用过渡效果
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';
        document.body.classList.remove('expanded');

        // 获取当前宽度并计算起始进度
        const baseW = parseFloat(sidebar.style.width) || START_W;
        const speed = 1; // 默认速度或从配置获取
        const duration = 300; // 简化的持续时间
        const startTime = performance.now();
        // 缓动函数：四次方缓出
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        // 动画循环函数
        function animate(currentTime) {
            // 如果展开状态被恢复，停止动画
            if (document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            // 计算当前进度：从起始进度到 0，应用缓动函数
            const p = startProgress * (1 - easeOutQuart(t));

            if (t >= 1) {
                // 动画完成
                uiUpdater(0);
                animationId = null;
                finishCollapse(SCALE, START_H, setIgnoreMouse);
            } else {
                // 继续动画
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        }
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    // 返回动画管理器对象
    return { expand, collapse, stopAnimation };
}
