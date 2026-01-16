import React, { useState, useEffect, useRef } from 'react';

const DragToLaunchWidget = ({ name, targets, show_all_time = true, isPreview = false }) => {
    const [icon, setIcon] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isVisible, setIsVisible] = useState(isPreview || show_all_time);
    const dragCounter = useRef(0);

    useEffect(() => {
        setIsVisible(isPreview || show_all_time);
    }, [isPreview, show_all_time]);

    useEffect(() => {
        // Extract exe path for icon
        let exePath = targets;
        if (typeof exePath === 'string') {
            const placeholderIndex = exePath.indexOf('{{source}}');
            let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;
            if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
                potentialPath = potentialPath.substring(1, potentialPath.length - 1);
            }
            exePath = potentialPath;
        }

        if (exePath) {
            window.electronAPI.getFileIcon(exePath)
                .then(iconDataUrl => {
                    if (iconDataUrl) setIcon(iconDataUrl);
                })
                .catch(err => console.error('获取图标失败:', err));
        }

        if (!show_all_time && !isPreview) {
            const handleGlobalDragEnter = (e) => {
                if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                    dragCounter.current++;
                    if (dragCounter.current === 1) setIsVisible(true);
                }
            };
            const handleGlobalDragLeave = (e) => {
                dragCounter.current--;
                if (dragCounter.current <= 0) {
                    dragCounter.current = 0;
                    setIsVisible(false);
                }
            };
            const handleGlobalDrop = () => {
                dragCounter.current = 0;
                setIsVisible(false);
            };

            document.addEventListener('dragenter', handleGlobalDragEnter);
            document.addEventListener('dragleave', handleGlobalDragLeave);
            document.addEventListener('drop', handleGlobalDrop);

            return () => {
                document.removeEventListener('dragenter', handleGlobalDragEnter);
                document.removeEventListener('dragleave', handleGlobalDragLeave);
                document.removeEventListener('drop', handleGlobalDrop);
            };
        }
    }, [targets, show_all_time]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files.length > 0) {
            for (const file of e.dataTransfer.files) {
                const filePath = window.electronAPI.getFilePath(file);
                if (!filePath) continue;

                const safeFilePath = `"${filePath}"`;
                let rawCommandTemplate = targets;
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

    if (!isVisible) return null;

    return (
        <div
            className={`launcher-item drag-to-launch ${isDragOver ? 'drag-over' : ''}`}
            title={name || "Drag files here to send"}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="launcher-icon">
                {icon ? (
                    <img src={icon} alt={name || 'Drop Target'} />
                ) : (
                    <div className="launcher-icon-placeholder" style={{ width: '32px', height: '32px', background: '#e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📤</div>
                )}
            </div>
            <div className="launcher-info">
                <div className="launcher-name">{name || 'Drop to Send'}</div>
            </div>
        </div>
    );
};

export default DragToLaunchWidget;
