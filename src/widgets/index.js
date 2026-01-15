import { createLauncherItem } from './launcher.js';
import { createVolumeSlider } from './volume.js';
import { createFilesWidget } from './files.js';
import { createDragToLaunchWidget } from './drag-to-launch.js';

/**
 * 核心渲染函数
 */
export async function renderWidgets(widgets) {
    const container = document.getElementById('widget-container');
    if (!container) return;

    container.innerHTML = '';

    for (const widget of widgets) {
        if (widget.type === 'launcher' && Array.isArray(widget.targets)) {
            const group = document.createElement('div');
            const layout = widget.layout || 'vertical';
            group.className = `launcher-group layout-${layout}`;

            for (const targetConfig of widget.targets) {
                const item = await createLauncherItem(targetConfig);
                group.appendChild(item);
            }
            container.appendChild(group);

        } else if (widget.type === 'volume_slider') {
            const slider = await createVolumeSlider(widget);
            container.appendChild(slider);

        } else if (widget.type === 'files') {
            const filesWidget = await createFilesWidget(widget);
            container.appendChild(filesWidget);

        } else if (widget.type === 'drag_to_launch') {
            const item = await createDragToLaunchWidget(widget);
            const wrapper = document.createElement('div');
            wrapper.className = 'launcher-group layout-vertical';
            wrapper.appendChild(item);
            container.appendChild(wrapper);
        }
    }
}
