/**
 * 预览面板组件
 * 显示所有组件的预览，支持拖拽排序和选择
 * @param {Object} config - 配置对象
 * @param {Object} styles - 样式对象
 * @param {Map} widgetIcons - 组件图标缓存
 * @param {boolean} isLongPressing - 是否正在长按拖拽
 * @param {number} draggingIndex - 正在拖拽的组件索引
 * @param {number} dragOverIndex - 拖拽悬停的组件索引
 * @param {number} selectedWidgetIndex - 选中的组件索引
 * @param {Object} pointerPos - 指针位置
 * @param {Function} clearSelection - 清除选择的回调
 * @param {Function} handlePointerMove - 指针移动处理函数
 * @param {Function} handlePointerUp - 指针抬起处理函数
 * @param {Function} handlePointerDown - 指针按下处理函数
 * @param {Function} handleDragStart - 拖拽开始处理函数
 * @param {Function} handleDragOver - 拖拽悬停处理函数
 * @param {Function} handleDragEnd - 拖拽结束处理函数
 * @param {Function} handleDrop - 放置处理函数
 * @param {Function} handleWidgetClick - 组件点击处理函数
 * @param {Component} LauncherItemPreview - 启动器项预览组件
 * @param {Component} VolumeWidgetPreview - 音量控制预览组件
 * @param {Component} FilesWidgetPreview - 文件列表预览组件
 * @param {Component} DragToLaunchWidgetPreview - 拖放速启预览组件
 */

import React from 'react';
import { mergeClasses, Button } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";

const PreviewPanel = ({
    config,
    styles,
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
    handleDragLeave,
    handleDragEnd,
    handleDrop,
    handleWidgetClick,
    handleDeleteWidget,
    LauncherItemPreview,
    VolumeWidgetPreview,
    FilesWidgetPreview,
    DragToLaunchWidgetPreview,
    ToolbarWidgetPreview
}) => {
    // 组件类型名称映射
    const WIDGET_TYPE_NAMES = {
        launcher: '启动器',
        volume_slider: '音量控制',
        files: '文件列表',
        drag_to_launch: '拖放速启',
        toolbar: '快捷工具栏'
    };

    // 包装指针抬起处理函数
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
            <div className={styles.widgetList} style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 渲染所有组件 */}
                {config.widgets.map((widget, index) => (
                    <div
                        key={index}
                        data-widget-index={index}
                        draggable={!isLongPressing}
                        onPointerDown={(e) => handlePointerDown(e, index)}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget)) return;
                            handleDragLeave(index);
                        }}
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
                            {/* 根据组件类型渲染不同的预览 */}
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
                            {widget.type === 'toolbar' && <ToolbarWidgetPreview {...widget} />}
                        </div>

                        {/* 选中时显示组件信息 */}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className={styles.widgetInfo}>
                                        {widget.name || (widget.type === 'launcher' ? `${widget.targets?.length || 0} 个目标` : (WIDGET_TYPE_NAMES[widget.type] || widget.type))}
                                    </div>
                                    <Button
                                        icon={<DeleteRegular />}
                                        appearance="subtle"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteWidget(index);
                                        }}
                                        aria-label="删除组件"
                                        title="删除组件"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* 底部放置区域：占据剩余空间，但指示线只在顶部显示 */}
                <div
                    style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100px' }}
                    onDragOver={(e) => handleDragOver(e, config.widgets.length)}
                    onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        handleDragLeave(config.widgets.length);
                    }}
                    onDrop={(e) => handleDrop(e, config.widgets.length)}
                >
                    <div
                        data-widget-index={config.widgets.length}
                        className={mergeClasses(
                            styles.widgetDropZone,
                            dragOverIndex === config.widgets.length && styles.widgetDropZoneDragOver
                        )}
                    />
                </div>
            </div>

            {/* 长按拖拽时的幽灵元素 */}
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
                                    <DragToLaunchWidgetPreview {...widget} widgetIndex={draggingIndex} />
                                )}
                                {widget.type === 'toolbar' && <ToolbarWidgetPreview {...widget} />}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default PreviewPanel;
