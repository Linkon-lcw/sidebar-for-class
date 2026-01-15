/**
 * 创建音量滑块元素
 */
export async function createVolumeSlider(widget) {
    const container = document.createElement('div');
    container.className = 'volume-slider-container';

    let currentVol = 0;
    try {
        currentVol = await window.electronAPI.getVolume();
    } catch (err) {
        console.error('获取音量失败:', err);
    }

    container.innerHTML = `
        <div class="volume-slider-row">
            <div class="volume-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            </div>
            <div class="slider-wrapper">
                <input type="range" class="volume-slider" min="0" max="100" value="${currentVol}">
                <div class="slider-fill" style="width: ${currentVol}%"></div>
            </div>
            <div class="volume-value">${currentVol}%</div>
        </div>
    `;

    const slider = container.querySelector('.volume-slider');
    const fill = container.querySelector('.slider-fill');
    const valueDisp = container.querySelector('.volume-value');

    slider.oninput = (e) => {
        const val = e.target.value;
        fill.style.width = `${val}%`;
        valueDisp.textContent = `${val}%`;
        window.electronAPI.setVolume(parseInt(val));
    };

    return container;
}
