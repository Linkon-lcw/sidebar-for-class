import { useEffect } from 'react';

const useWidgetIcons = (widgets, preloadWidgetIcons) => {
    useEffect(() => {
        preloadWidgetIcons(widgets);
    }, [widgets, preloadWidgetIcons]);
};

export default useWidgetIcons;
