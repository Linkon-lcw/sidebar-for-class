import { useCallback } from 'react';

const useWidgetPropertyUpdate = (config, updateConfig, selectedWidgetIndex) => {
    const updateWidgetProperty = useCallback((key, value) => {
        const newWidgets = [...config.widgets];
        newWidgets[selectedWidgetIndex] = {
            ...newWidgets[selectedWidgetIndex],
            [key]: value
        };
        updateConfig({
            ...config,
            widgets: newWidgets
        });
    }, [config, updateConfig, selectedWidgetIndex]);

    return { updateWidgetProperty };
};

export default useWidgetPropertyUpdate;
