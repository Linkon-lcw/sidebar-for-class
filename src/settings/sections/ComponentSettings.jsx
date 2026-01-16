import React, { useState } from 'react';
import {
    Tab,
    TabList,
    Body1,
    Title2,
    Caption1,
    mergeClasses,
    Input,
    Switch,
    Field,
    Label,
    Dropdown,
    Option,
    Button,
    Slider
} from "@fluentui/react-components";
import {
    DesignIdeasRegular,
    SettingsRegular,
    BoxRegular,
    InfoRegular,
    AddRegular,
    DeleteRegular,
    AppsRegular
} from "@fluentui/react-icons";

// 导入窗口组件
import LauncherItem from '../../sidebar/components/LauncherItem';
import VolumeWidget from '../../sidebar/components/VolumeWidget';
import FilesWidget from '../../sidebar/components/FilesWidget';
import DragToLaunchWidget from '../../sidebar/components/DragToLaunchWidget';

// 导入侧边栏样式
import '../../../style.css';

const WIDGET_TYPE_NAMES = {
    launcher: '启动器',
    volume_slider: '音量控制',
    files: '文件列表',
    drag_to_launch: '拖放速启'
};

const ComponentSettings = ({ config, updateConfig, styles }) => {
    const [activeTab, setActiveTab] = useState('properties');
    const [selectedWidgetIndex, setSelectedWidgetIndex] = useState(null);
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const selectedWidget = selectedWidgetIndex !== null ? config.widgets[selectedWidgetIndex] : null;

    const handleWidgetClick = (e, index) => {
        e.stopPropagation();
        setSelectedWidgetIndex(index);
        setActiveTab('properties');
    };

    const handleDragStart = (e, index) => {
        setSelectedWidgetIndex(null);
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggingIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === targetIndex) {
            setDraggingIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newWidgets = [...config.widgets];
        const draggedItem = newWidgets[draggingIndex];

        // 确定插入位置
        // 如果 targetIndex 等于数组长度，说明是拖到了最后的空白区域
        const actualTargetIndex = targetIndex >= newWidgets.length ? newWidgets.length - 1 : targetIndex;

        // 删除原位置
        newWidgets.splice(draggingIndex, 1);

        // 插入新位置
        // 如果原来后面没东西了，就 push，否则 splice
        if (targetIndex >= config.widgets.length) {
            newWidgets.push(draggedItem);
        } else {
            newWidgets.splice(targetIndex, 0, draggedItem);
        }

        // 由于在 handleDragStart 中已经清除了选中状态，这里不再需要更新选中索引


        updateConfig({
            ...config,
            widgets: newWidgets
        });

        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const updateWidgetProperty = (key, value) => {
        const newWidgets = [...config.widgets];
        newWidgets[selectedWidgetIndex] = {
            ...newWidgets[selectedWidgetIndex],
            [key]: value
        };
        updateConfig({
            ...config,
            widgets: newWidgets
        });
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>组件设置</div>
                <div className={styles.description}>可视化管理侧边栏组件，通过简单的拖拽和属性调整来定制你的侧边栏。</div>
            </div>

            <div className={styles.componentLayout}>
                {/* 左侧：可视化预览 */}
                <div
                    className={styles.previewPanel}
                    style={{ justifyContent: 'flex-start', overflowY: 'auto' }}
                    onClick={() => setSelectedWidgetIndex(null)}
                >
                    <div className={styles.widgetList}>
                        {config.widgets.map((widget, index) => (
                            <div
                                key={index}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, index)}
                                className={mergeClasses(
                                    styles.widgetItem,
                                    selectedWidgetIndex === index && styles.widgetItemSelected,
                                    draggingIndex === index && styles.widgetDragging,
                                    dragOverIndex === index && styles.widgetDragOver
                                )}
                                onClick={(e) => handleWidgetClick(e, index)}
                            >


                                {/* 实际视觉效果预览 */}
                                <div style={{
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                    marginBottom: selectedWidgetIndex === index ? '12px' : '0'
                                }}>
                                    {widget.type === 'launcher' && (
                                        <div className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                            {widget.targets?.map((target, tIndex) => (
                                                <LauncherItem key={tIndex} {...target} />
                                            ))}
                                        </div>
                                    )}
                                    {widget.type === 'volume_slider' && <VolumeWidget {...widget} />}
                                    {widget.type === 'files' && <FilesWidget {...widget} />}
                                    {widget.type === 'drag_to_launch' && (
                                        <div className="launcher-group layout-vertical">
                                            <DragToLaunchWidget {...widget} isPreview={true} />
                                        </div>
                                    )}
                                </div>

                                {/* 组件标识信息 - 仅在选中时显示 */}
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

                        {/* 末尾拖拽放置区域 */}
                        <div
                            onDragOver={(e) => handleDragOver(e, config.widgets.length)}
                            onDrop={(e) => handleDrop(e, config.widgets.length)}
                            className={mergeClasses(
                                styles.widgetDropZone,
                                dragOverIndex === config.widgets.length && styles.widgetDragOver
                            )}
                        />
                    </div>
                </div>

                {/* 右侧：属性和组件库 */}
                <div className={styles.editorPanel}>
                    <TabList
                        selectedValue={activeTab}
                        onTabSelect={(_, data) => setActiveTab(data.value)}
                        style={{ borderBottom: '1px solid var(--colorNeutralStroke2)', padding: '0 8px' }}
                    >
                        <Tab id="properties" value="properties" icon={<SettingsRegular />}>属性</Tab>
                        <Tab id="library" value="library" icon={<BoxRegular />}>组件库</Tab>
                    </TabList>

                    <div className={styles.tabContent}>
                        {activeTab === 'properties' && (
                            <div>
                                {/* <Title2 block style={{ marginBottom: '16px', fontSize: '18px' }}>
                                    {selectedWidget ? `${selectedWidget.type} 属性` : '组件属性'}
                                </Title2> */}

                                {!selectedWidget ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', color: 'var(--colorNeutralForeground4)', gap: '8px' }}>
                                        <InfoRegular style={{ fontSize: '32px' }} />
                                        <Body1>请选择一个组件以编辑其属性</Body1>
                                    </div>
                                ) : (
                                    <div className={styles.propertyGroup}>
                                        {selectedWidget.type === 'drag_to_launch' && (
                                            <>
                                                <div className={styles.propertyRow}>
                                                    <Body1 style={{ color: 'var(--colorNeutralForeground3)' }}>
                                                        拖放启动：允许你通过拖拽文件到侧边栏上，可实现快速启动指定程序
                                                    </Body1>
                                                </div>

                                                <div className={styles.propertyRow}>
                                                    <Label className={styles.propertyLabel} htmlFor="widget-name">显示名称</Label>
                                                    <Input
                                                        id="widget-name"
                                                        value={selectedWidget.name || ''}
                                                        onChange={(e) => updateWidgetProperty('name', e.target.value)}
                                                        placeholder="例如: 发送到 LocalSend"
                                                    />
                                                </div>

                                                <div className={styles.propertyRow}>
                                                    <Label className={styles.propertyLabel} htmlFor="widget-targets">执行命令</Label>
                                                    <Input
                                                        id="widget-targets"
                                                        value={selectedWidget.targets || ''}
                                                        onChange={(e) => updateWidgetProperty('targets', e.target.value)}
                                                        placeholder="例如: C:\Path\To\App.exe {{source}}"
                                                    />
                                                    <Caption1 style={{ color: 'var(--colorNeutralForeground3)' }}>
                                                        使用 &#123;&#123;source&#125;&#125; 代表拖入的文件路径
                                                    </Caption1>
                                                </div>

                                                <div className={styles.propertyRow} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                                    <Label className={styles.propertyLabel} htmlFor="widget-show-all-time">始终显示</Label>
                                                    <Switch
                                                        id="widget-show-all-time"
                                                        checked={selectedWidget.show_all_time}
                                                        onChange={(e, data) => updateWidgetProperty('show_all_time', data.checked)}
                                                    />
                                                    <Caption1 style={{ color: 'var(--colorNeutralForeground3)', width: '100%', marginTop: '4px' }}>
                                                        开启后，侧边栏无论是否通过拖放文件触发展开，都会显示此组件
                                                    </Caption1>
                                                </div>
                                            </>
                                        )}

                                        {selectedWidget.type === 'launcher' && (
                                            <>
                                                <div className={styles.propertyRow}>
                                                    <Label className={styles.propertyLabel}>布局模式</Label>
                                                    <Dropdown
                                                        value={
                                                            selectedWidget.layout === 'vertical' ? '垂直列表' :
                                                                selectedWidget.layout === 'grid' ? '网格 (带文字) (最多3×n)' :
                                                                    selectedWidget.layout === 'grid_no_text' ? '网格 (仅图标) (最多4×n)' : '垂直列表'
                                                        }
                                                        selectedOptions={[selectedWidget.layout || 'vertical']}
                                                        onOptionSelect={(_, data) => updateWidgetProperty('layout', data.selectedOptions[0])}
                                                    >
                                                        <Option value="vertical">垂直列表</Option>
                                                        <Option value="grid">网格 (带文字) (最多3×n)</Option>
                                                        <Option value="grid_no_text">网格 (仅图标) (最多4×n)</Option>
                                                    </Dropdown>
                                                </div>

                                                <div className={styles.propertyRow} style={{ marginTop: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <Label className={styles.propertyLabel}>启动目标</Label>
                                                        <Button
                                                            size="small"
                                                            icon={<AddRegular />}
                                                            onClick={() => {
                                                                const newTargets = [...(selectedWidget.targets || []), { name: '新项目', target: '' }];
                                                                updateWidgetProperty('targets', newTargets);
                                                            }}
                                                        >
                                                            添加
                                                        </Button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {(selectedWidget.targets || []).map((target, tIndex) => (
                                                            <div key={tIndex} style={{
                                                                padding: '12px',
                                                                border: '1px solid var(--colorNeutralStroke2)',
                                                                borderRadius: '4px',
                                                                backgroundColor: 'var(--colorNeutralBackground2)',
                                                                position: 'relative'
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <Label size="small" style={{ marginBottom: '4px', display: 'block' }}>名称</Label>
                                                                            <Input
                                                                                size="small"
                                                                                value={target.name || ''}
                                                                                onChange={(e) => {
                                                                                    const newTargets = [...selectedWidget.targets];
                                                                                    newTargets[tIndex] = { ...target, name: e.target.value };
                                                                                    updateWidgetProperty('targets', newTargets);
                                                                                }}
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                        </div>
                                                                        <Button
                                                                            size="small"
                                                                            appearance="subtle"
                                                                            icon={<DeleteRegular />}
                                                                            onClick={() => {
                                                                                const newTargets = selectedWidget.targets.filter((_, i) => i !== tIndex);
                                                                                updateWidgetProperty('targets', newTargets);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label size="small" style={{ marginBottom: '4px', display: 'block' }}>路径 / URI</Label>
                                                                        <Input
                                                                            size="small"
                                                                            value={target.target || ''}
                                                                            onChange={(e) => {
                                                                                const newTargets = [...selectedWidget.targets];
                                                                                newTargets[tIndex] = { ...target, target: e.target.value };
                                                                                updateWidgetProperty('targets', newTargets);
                                                                            }}
                                                                            style={{ width: '100%' }}
                                                                            placeholder="exe路径或 https://..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label size="small" style={{ marginBottom: '4px', display: 'block' }}>参数 (空格分隔)</Label>
                                                                        <Input
                                                                            size="small"
                                                                            value={target.args?.join(' ') || ''}
                                                                            onChange={(e) => {
                                                                                const newTargets = [...selectedWidget.targets];
                                                                                newTargets[tIndex] = { ...target, args: e.target.value.split(' ').filter(a => a) };
                                                                                updateWidgetProperty('targets', newTargets);
                                                                            }}
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {selectedWidget.type === 'volume_slider' && (
                                            <>
                                                <div className={styles.propertyRow}>
                                                    <Body1 style={{ color: 'var(--colorNeutralForeground3)' }}>
                                                        音量控制：通过滑动滑块来快速调整系统总音量。
                                                    </Body1>
                                                </div>

                                                <div className={styles.propertyRow}>
                                                    <Label className={styles.propertyLabel}>音量范围</Label>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                                                        <div className={styles.formGroup}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Caption1>最小值</Caption1>
                                                                <span className={styles.rangeValue}>{selectedWidget.range?.[0] ?? 0}%</span>
                                                            </div>
                                                            <Slider
                                                                min={0}
                                                                max={100}
                                                                value={selectedWidget.range?.[0] ?? 0}
                                                                onChange={(_, data) => {
                                                                    const newRange = [...(selectedWidget.range || [0, 100])];
                                                                    newRange[0] = data.value;
                                                                    // 确保最小值不大于最大值
                                                                    if (newRange[0] > newRange[1]) newRange[1] = newRange[0];
                                                                    updateWidgetProperty('range', newRange);
                                                                }}
                                                            />
                                                        </div>

                                                        <div className={styles.formGroup}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Caption1>最大值</Caption1>
                                                                <span className={styles.rangeValue}>{selectedWidget.range?.[1] ?? 100}%</span>
                                                            </div>
                                                            <Slider
                                                                min={0}
                                                                max={100}
                                                                value={selectedWidget.range?.[1] ?? 100}
                                                                onChange={(_, data) => {
                                                                    const newRange = [...(selectedWidget.range || [0, 100])];
                                                                    newRange[1] = data.value;
                                                                    // 确保最大值不小于最小值
                                                                    if (newRange[1] < newRange[0]) newRange[0] = newRange[1];
                                                                    updateWidgetProperty('range', newRange);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Caption1 style={{ color: 'var(--colorNeutralForeground3)', marginTop: '4px' }}>
                                                        配置组件所能调节的系统音量区间。
                                                    </Caption1>
                                                </div>
                                            </>
                                        )}

                                        {selectedWidget.type !== 'drag_to_launch' && selectedWidget.type !== 'launcher' && selectedWidget.type !== 'volume_slider' && (
                                            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--colorNeutralStroke1)', borderRadius: '4px' }}>
                                                <Body1 style={{ color: 'var(--colorNeutralForeground4)' }}>
                                                    该组件类型 ({WIDGET_TYPE_NAMES[selectedWidget.type] || selectedWidget.type}) 的属性编辑功能开发中...
                                                </Body1>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'library' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', color: 'var(--colorNeutralForeground4)', gap: '8px' }}>
                                <BoxRegular style={{ fontSize: '32px' }} />
                                <Title2 block style={{ marginBottom: '4px', fontSize: '16px' }}>组件库</Title2>
                                <Body1>从此处拖拽组件到左侧预览区域</Body1>
                                <Caption1>(即将推出)</Caption1>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComponentSettings;
