/**
 * 组件图标 Hook
 * 监听组件列表变化，自动预加载组件图标
 * @param {Array} widgets - 组件列表
 * @param {Function} preloadWidgetIcons - 预加载组件图标的函数
 */

import { useEffect } from 'react';

const useWidgetIcons = (widgets, preloadWidgetIcons) => {
    // 当组件列表变化时，预加载所有组件的图标
    useEffect(() => {
        preloadWidgetIcons(widgets);
    }, [widgets, preloadWidgetIcons]);
};

export default useWidgetIcons;
