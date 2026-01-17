import React from 'react';
import { mergeClasses } from "@fluentui/react-components";

const PreviewPanel = ({
    config,
    styles,
    widgetIcons,
    isLongPressing,
    draggingIndex,
    dragOverIndex,
    selectedWidgetIndex,
    pointerPos,
    clearSelection,
    handlePointerMove,
    handlePointerUp,
    handlePointerDown,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleWidgetClick,
    LauncherItemPreview,
    VolumeWidgetPreview,
    FilesWidgetPreview,
    DragToLaunchWidgetPreview
}) => {
    const WIDGET_TYPE_NAMES = {
        launcher: '启动器',
        volume_slider: '音量控制',
        files: '文件列表',
        drag_to_launch: '拖放速启'
    };

    const handlePointerUpWrapper = (e) => {
        handlePointerUp(dragOverIndex);
    };

    return (
        <div
            className={styles.previewPanel}
            style={{
                justifyContent: 'flex-start',
                overflowY: 'auto',
                touchAction: isLongPressing ? 'none' : 'auto'
            }}
            onClick={clearSelection}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpWrapper}
            onPointerCancel={handlePointerUpWrapper}
        >
            <div className={styles.widgetList}>
                {config.widgets.map((widget, index) => (
                    <div
                        key={index}
                        data-widget-index={index}
                        draggable={!isLongPressing}
                        onPointerDown={(e) => handlePointerDown(e, index)}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={mergeClasses(
                            styles.widgetItem,
                            selectedWidgetIndex === index && styles.widgetItemSelected,
                            draggingIndex === index && styles.widgetDragging,
                            dragOverIndex === index && styles.widgetDragOver,
                            isLongPressing && draggingIndex === index && styles.widgetHidden
                        )}
                        onClick={(e) => handleWidgetClick(e, index)}
                        onContextMenu={(e) => {
                            if (isLongPressing) e.preventDefault();
                        }}
                    >
                        <div style={{
                            pointerEvents: 'none',
                            userSelect: 'none',
                            marginBottom: selectedWidgetIndex === index ? '12px' : '0'
                        }}>
                            {widget.type === 'launcher' && (
                                <div className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                    {widget.targets?.map((target, tIndex) => (
                                        <LauncherItemPreview key={tIndex} {...target} widgetIndex={index} targetIndex={tIndex} />
                                    ))}
                                </div>
                            )}
                            {widget.type === 'volume_slider' && <VolumeWidgetPreview {...widget} />}
                            {widget.type === 'files' && <FilesWidgetPreview {...widget} widgetIndex={index} />}
                            {widget.type === 'drag_to_launch' && (
                                <div className="launcher-group layout-vertical">
                                    <DragToLaunchWidgetPreview {...widget} widgetIndex={index} />
                                </div>
                            )}
                        </div>

                        {selectedWidgetIndex === index && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--colorNeutralStroke2)',
                                paddingTop: '8px'
                            }}>
                                <div className={styles.widgetType} style={{ marginBottom: 0 }}>
                                    {WIDGET_TYPE_NAMES[widget.type] || widget.type}
                                </div>
                                <div className={styles.widgetInfo}>
                                    {widget.name || (widget.type === 'launcher' ? `${widget.targets?.length || 0} 个目标` : (WIDGET_TYPE_NAMES[widget.type] || widget.type))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div
                    data-widget-index={config.widgets.length}
                    onDragOver={(e) => handleDragOver(e, config.widgets.length)}
                    onDrop={(e) => handleDrop(e, config.widgets.length)}
                    className={mergeClasses(
                        styles.widgetDropZone,
                        dragOverIndex === config.widgets.length && styles.widgetDragOver
                    )}
                />
            </div>

            {isLongPressing && draggingIndex !== null && (
                <div
                    className={styles.dragGhost}
                    style={{
                        left: pointerPos.x,
                        top: pointerPos.y,
                        width: '200px',
                        opacity: 0.8,
                        pointerEvents: 'none',
                        position: 'fixed',
                        transform: 'translate(-50%, -50%) scale(1.05)',
                        zIndex: 1000,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'var(--colorNeutralBackground1)',
                        padding: '12px'
                    }}
                >
                    {(() => {
                        const widget = config.widgets[draggingIndex];
                        return (
                            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                {widget.type === 'launcher' && (
                                    <div className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                        {widget.targets?.map((target, tIndex) => (
                                            <LauncherItemPreview key={tIndex} {...target} widgetIndex={draggingIndex} targetIndex={tIndex} />
                                        ))}
                                    </div>
                                )}
                                {widget.type === 'volume_slider' && <VolumeWidgetPreview {...widget} />}
                                {widget.type === 'files' && <FilesWidgetPreview {...widget} widgetIndex={draggingIndex} />}
                                {widget.type === 'drag_to_launch' && (
                                    <div className="launcher-group layout-vertical">
                                        <DragToLaunchWidgetPreview {...widget} widgetIndex={draggingIndex} />
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default PreviewPanel;
