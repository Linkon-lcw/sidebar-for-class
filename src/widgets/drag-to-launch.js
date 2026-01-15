/**
 * 创建拖拽启动组件
 */
export async function createDragToLaunchWidget(widget) {
    const div = document.createElement('div');
    div.className = 'launcher-item drag-to-launch';
    div.title = widget.name || "Drag files here to send";

    let exePath = widget.targets;
    if (typeof exePath === 'string') {
        const placeholderIndex = exePath.indexOf('{{source}}');
        let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;

        if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
            potentialPath = potentialPath.substring(1, potentialPath.length - 1);
        } else if (potentialPath.startsWith('"')) {
            const nextQuote = potentialPath.indexOf('"', 1);
            if (nextQuote > -1) {
                potentialPath = potentialPath.substring(1, nextQuote);
            }
        }
        exePath = potentialPath;
    }

    let iconHtml = '<div class="launcher-icon-placeholder" style="width:32px; height:32px; background:#e5e7eb; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size: 20px;">📤</div>';

    if (exePath) {
        try {
            const iconDataUrl = await window.electronAPI.getFileIcon(exePath);
            if (iconDataUrl) {
                iconHtml = `<img src="${iconDataUrl}" alt="${widget.name || 'Drop Target'}">`;
            }
        } catch (err) {
            console.error('获取图标失败:', err);
        }
    }

    div.innerHTML = `
        <div class="launcher-icon">
            ${iconHtml}
        </div>
        <div class="launcher-info">
            <div class="launcher-name">${widget.name || 'Drop to Send'}</div>
        </div>
    `;

    const showAllTime = widget.show_all_time !== false;

    if (!showAllTime) {
        div.style.display = 'none';
        if (!window._dragToLaunchManager) {
            window._dragToLaunchManager = {
                elements: [],
                dragCounter: 0,
                show() {
                    this.elements.forEach(el => {
                        if (el && el.style) el.style.display = 'flex';
                    });
                },
                hide() {
                    this.elements.forEach(el => {
                        if (el && el.style) el.style.display = 'none';
                    });
                }
            };

            document.addEventListener('dragenter', (e) => {
                if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                    window._dragToLaunchManager.dragCounter++;
                    if (window._dragToLaunchManager.dragCounter === 1) {
                        window._dragToLaunchManager.show();
                    }
                }
            });

            document.addEventListener('dragleave', (e) => {
                window._dragToLaunchManager.dragCounter--;
                if (window._dragToLaunchManager.dragCounter <= 0) {
                    window._dragToLaunchManager.dragCounter = 0;
                    window._dragToLaunchManager.hide();
                }
            });

            document.addEventListener('drop', (e) => {
                window._dragToLaunchManager.dragCounter = 0;
                window._dragToLaunchManager.hide();
            });
        }
        window._dragToLaunchManager.elements.push(div);
    }

    div.ondragover = (e) => {
        e.preventDefault();
        div.classList.add('drag-over');
    };

    div.ondragleave = (e) => {
        e.preventDefault();
        div.classList.remove('drag-over');
    };

    div.ondrop = (e) => {
        e.preventDefault();
        div.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            for (const file of e.dataTransfer.files) {
                const filePath = window.electronAPI.getFilePath(file);
                if (!filePath) continue;

                const safeFilePath = `"${filePath}"`;
                let rawCommandTemplate = widget.targets;
                let finalCommand = rawCommandTemplate;

                if (rawCommandTemplate.includes('{{source}}')) {
                    const parts = rawCommandTemplate.split('{{source}}');
                    let exePart = parts[0].trim();
                    const suffixPart = parts[1];
                    if (exePart.includes(' ') && !exePart.startsWith('"') && !exePart.endsWith('"')) {
                        exePart = `"${exePart}"`;
                    }
                    finalCommand = `${exePart} ${safeFilePath} ${suffixPart}`;
                } else {
                    finalCommand = `${rawCommandTemplate} ${safeFilePath}`;
                }
                window.electronAPI.executeCommand(finalCommand);
            }
        }
    };

    return div;
}
