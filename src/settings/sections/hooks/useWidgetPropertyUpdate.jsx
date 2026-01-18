/**
 * 组件属性更新 Hook
 * 提供更新组件属性的功能，自动同步到配置对象
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {number} selectedWidgetIndex - 当前选中的组件索引
 * @returns {Object} 包含更新组件属性函数的对象
 */

import { useCallback } from 'react';

const useWidgetPropertyUpdate = (config, updateConfig, selectedWidgetIndex) => {
    // 更新组件属性
    const updateWidgetProperty = useCallback((key, value) => {
        // 创建新的组件数组
        const newWidgets = [...config.widgets];
        // 更新指定组件的属性
        newWidgets[selectedWidgetIndex] = {
            ...newWidgets[selectedWidgetIndex],
            [key]: value
        };
        // 更新配置
        updateConfig({
            ...config,
            widgets: newWidgets
        });
    }, [config, updateConfig, selectedWidgetIndex]);

    return { updateWidgetProperty };
};

export default useWidgetPropertyUpdate;
