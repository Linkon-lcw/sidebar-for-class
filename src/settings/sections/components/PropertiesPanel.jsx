/**
 * 属性面板组件
 * 显示选中组件的属性，支持编辑组件的各种配置
 * @param {Object} styles - 样式对象
 * @param {string} activeTab - 当前激活的标签页
 * @param {Function} setActiveTab - 设置激活标签页的函数
 * @param {Object} selectedWidget - 当前选中的组件对象
 * @param {Function} updateWidgetProperty - 更新组件属性的函数
 * @param {Function} onDeselectWidget - 取消选择组件的回调函数
 */

import React, { useState } from 'react';
import {
    Tab,
    TabList,
    Body1,
    Title2,
    Input,
    Field,
    Dropdown,
    Option,
    Slider,
    Button,
    Divider,
    Caption1,
    Switch
} from "@fluentui/react-components";
import {
    AddRegular,
    DeleteRegular,
    ArrowUpRegular,
    ArrowDownRegular,
    RocketRegular,
    Speaker2Regular,
    ArrowImportRegular,
    FolderRegular,
    WrenchRegular,
    LineHorizontal3Regular,
    FlashRegular
} from "@fluentui/react-icons";

const PropertiesPanel = ({
    styles,
    activeTab,
    setActiveTab,
    selectedWidget,
    updateWidgetProperty,
    onDeselectWidget,
    onAddComponent,
    onDragEnd
}) => {
    // 当前正在编辑的目标索引（用于启动器组件）
    const [editingTargetIndex, setEditingTargetIndex] = useState(null);

    // 工具栏拖拽状态
    const [draggingToolIndex, setDraggingToolIndex] = useState(null);
    const [dragOverToolIndex, setDragOverToolIndex] = useState(null);

    // 处理标签页切换事件
    const handleTabChange = (_, data) => {
        setActiveTab(data.value);
        if (data.value === 'library' && onDeselectWidget) {
            onDeselectWidget();
        }
    };

    // 添加新的启动目标
    const handleAddTarget = () => {
        const currentTargets = selectedWidget.targets || [];
        const newTarget = {
            name: '新目标',
            target: '',
            args: []
        };
        updateWidgetProperty('targets', [...currentTargets, newTarget]);
        setEditingTargetIndex(currentTargets.length);
    };

    // 删除启动目标
    const handleDeleteTarget = (index) => {
        const currentTargets = selectedWidget.targets || [];
        const newTargets = currentTargets.filter((_, i) => i !== index);
        updateWidgetProperty('targets', newTargets);
        if (editingTargetIndex === index) {
            setEditingTargetIndex(null);
        } else if (editingTargetIndex > index) {
            setEditingTargetIndex(editingTargetIndex - 1);
        }
    };

    // 更新启动目标
    const handleUpdateTarget = (index, field, value) => {
        const currentTargets = selectedWidget.targets || [];
        const newTargets = currentTargets.map((target, i) => {
            if (i === index) {
                return { ...target, [field]: value };
            }
            return target;
        });
        updateWidgetProperty('targets', newTargets);
    };

    // 移动启动目标位置
    const handleMoveTarget = (index, direction) => {
        const currentTargets = selectedWidget.targets || [];
        if (direction === 'up' && index > 0) {
            const newTargets = [...currentTargets];
            [newTargets[index - 1], newTargets[index]] = [newTargets[index], newTargets[index - 1]];
            updateWidgetProperty('targets', newTargets);
            if (editingTargetIndex === index) {
                setEditingTargetIndex(index - 1);
            } else if (editingTargetIndex === index - 1) {
                setEditingTargetIndex(index);
            }
        } else if (direction === 'down' && index < currentTargets.length - 1) {
            const newTargets = [...currentTargets];
            [newTargets[index], newTargets[index + 1]] = [newTargets[index + 1], newTargets[index]];
            updateWidgetProperty('targets', newTargets);
            if (editingTargetIndex === index) {
                setEditingTargetIndex(index + 1);
            } else if (editingTargetIndex === index + 1) {
                setEditingTargetIndex(index);
            }
        }
    };

    // --- 工具栏组件处理函数 ---

    // 添加工具项
    const handleAddTool = () => {
        const currentTools = selectedWidget.tools || [];
        updateWidgetProperty('tools', [...currentTools, 'screenshot']);
    };

    // 删除工具项
    const handleDeleteTool = (index) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = currentTools.filter((_, i) => i !== index);
        updateWidgetProperty('tools', newTools);
    };

    // 更新工具项
    const handleUpdateTool = (index, newValue) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = [...currentTools];
        newTools[index] = newValue;
        updateWidgetProperty('tools', newTools);
    };

    // 工具项拖拽开始
    const handleToolDragStart = (e, index) => {
        setDraggingToolIndex(index);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    // 工具项拖拽悬停
    const handleToolDragOver = (e, index) => {
        e.preventDefault();
        if (draggingToolIndex === null || draggingToolIndex === index) return;
        setDragOverToolIndex(index);
    };

    // 工具项放置
    const handleToolDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingToolIndex === null || draggingToolIndex === targetIndex) {
            setDraggingToolIndex(null);
            setDragOverToolIndex(null);
            return;
        }

        const currentTools = selectedWidget.tools || [];
        const newTools = [...currentTools];
        const draggedTool = newTools[draggingToolIndex];

        newTools.splice(draggingToolIndex, 1);
        newTools.splice(targetIndex, 0, draggedTool);

        updateWidgetProperty('tools', newTools);
        setDraggingToolIndex(null);
        setDragOverToolIndex(null);
    };

    // 处理库组件拖拽开始
    const handleLibraryDragStart = (e, type) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/react-dnd-type', type);
    };

    return (
        <div className={styles.propertiesPanel}>
            {/* 标签页导航 */}
            <TabList selectedValue={activeTab} onTabSelect={handleTabChange}>
                <Tab value="properties">属性</Tab>
                <Tab value="library">组件库</Tab>
            </TabList>

            {/* 属性标签页内容 */}
            {activeTab === 'properties' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3" className={styles.panelTitle}>组件属性</Title2>
                        <Body1>编辑选中组件的属性</Body1>
                    </div>

                    {/* 启动器组件的属性 */}
                    {selectedWidget.type === 'launcher' && (
                        <div className={styles.propertySection}>
                            <Field label="布局方式">
                                <Dropdown
                                    value={{
                                        'vertical': '列表',
                                        'grid': '网格（最大3×n）',
                                        'grid_no_text': '无文字网格（最大4×n）'
                                    }[selectedWidget.layout || 'vertical'] || '列表'}
                                    selectedOptions={[selectedWidget.layout || 'vertical']}
                                    onOptionSelect={(_, data) => updateWidgetProperty('layout', data.optionValue)}
                                >
                                    <Option value="vertical">列表</Option>
                                    <Option value="grid">网格（最大3×n）</Option>
                                    <Option value="grid_no_text">无文字网格（最大4×n）</Option>
                                </Dropdown>
                            </Field>
                            <Divider />
                            <div className={styles.propertyGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <Title2 as="h3" className={styles.sectionTitle}>启动目标</Title2>
                                    <Button
                                        appearance="primary"
                                        icon={<AddRegular />}
                                        onClick={handleAddTarget}
                                    >
                                        添加目标
                                    </Button>
                                </div>
                                {/* 渲染所有启动目标 */}
                                {(selectedWidget.targets || []).map((target, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: 'var(--colorNeutralBackground1)',
                                            border: '1px solid var(--colorNeutralStroke1)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <Caption1 style={{ fontWeight: '600' }}>目标 {index + 1}</Caption1>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <Button
                                                    appearance="subtle"
                                                    size="small"
                                                    icon={<ArrowUpRegular />}
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveTarget(index, 'up')}
                                                />
                                                <Button
                                                    appearance="subtle"
                                                    size="small"
                                                    icon={<ArrowDownRegular />}
                                                    disabled={index === (selectedWidget.targets?.length || 0) - 1}
                                                    onClick={() => handleMoveTarget(index, 'down')}
                                                />
                                                <Button
                                                    appearance="subtle"
                                                    size="small"
                                                    icon={<DeleteRegular />}
                                                    onClick={() => handleDeleteTarget(index)}
                                                />
                                            </div>
                                        </div>
                                        <Field label="显示名称">
                                            <Input
                                                value={target.name || ''}
                                                onChange={(_, data) => handleUpdateTarget(index, 'name', data.value)}
                                                placeholder="输入显示名称"
                                            />
                                        </Field>
                                        <Field label="目标路径或 URI">
                                            <Input
                                                value={target.target || ''}
                                                onChange={(_, data) => handleUpdateTarget(index, 'target', data.value)}
                                                placeholder="例如: notepad.exe 或 classisland://app/test"
                                            />
                                        </Field>
                                        <Field label="启动参数">
                                            <Input
                                                value={Array.isArray(target.args) ? target.args.join(' ') : ''}
                                                onChange={(_, data) => handleUpdateTarget(index, 'args', data.value.split(' ').filter(arg => arg.trim()))}
                                                placeholder="输入启动参数，用空格分隔"
                                            />
                                        </Field>
                                    </div>
                                ))}
                                {/* 无目标时的提示 */}
                                {(selectedWidget.targets || []).length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '24px',
                                        color: 'var(--colorNeutralForeground3)'
                                    }}>
                                        暂无启动目标，点击上方按钮添加
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 音量控制组件的属性 */}
                    {selectedWidget.type === 'volume_slider' && (
                        <div className={styles.propertySection}>
                            <Field label="最小值">
                                <div className={styles.rangeContainer}>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[0] || 0}
                                        onChange={(_, data) => {
                                            const currentMax = selectedWidget.range?.[1] || 100;
                                            const newVal = Math.min(data.value, currentMax);
                                            updateWidgetProperty('range', [newVal, currentMax]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[0] || 0}%</span>
                                </div>
                            </Field>
                            <Field label="最大值">
                                <div className={styles.rangeContainer}>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[1] || 100}
                                        onChange={(_, data) => {
                                            const currentMin = selectedWidget.range?.[0] || 0;
                                            const newVal = Math.max(data.value, currentMin);
                                            updateWidgetProperty('range', [currentMin, newVal]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[1] || 100}%</span>
                                </div>
                            </Field>
                        </div>
                    )}

                    {/* 文件列表组件的属性 */}
                    {selectedWidget.type === 'files' && (
                        <div className={styles.propertySection}>
                            <Field label="文件夹路径">
                                <Input
                                    value={selectedWidget.folder_path || ''}
                                    onChange={(_, data) => updateWidgetProperty('folder_path', data.value)}
                                />
                            </Field>
                            <Field label="最大显示数量">
                                <Input
                                    type="number"
                                    value={selectedWidget.max_count || 10}
                                    onChange={(_, data) => updateWidgetProperty('max_count', parseInt(data.value) || 10)}
                                />
                            </Field>
                            <Field label="布局方向">
                                <Dropdown
                                    value={{
                                        'vertical': '垂直',
                                        'horizontal': '水平'
                                    }[selectedWidget.layout || 'vertical'] || '垂直'}
                                    selectedOptions={[selectedWidget.layout || 'vertical']}
                                    onOptionSelect={(_, data) => updateWidgetProperty('layout', data.optionValue)}
                                >
                                    <Option value="vertical">垂直</Option>
                                    <Option value="horizontal">水平</Option>
                                </Dropdown>
                            </Field>
                        </div>
                    )}

                    {/* 拖放速启组件的属性 */}
                    {selectedWidget.type === 'drag_to_launch' && (
                        <div className={styles.propertySection}>
                            <Field label="显示名称">
                                <Input
                                    value={selectedWidget.name || ''}
                                    onChange={(_, data) => updateWidgetProperty('name', data.value)}
                                />
                            </Field>
                            <Field label="目标路径">
                                <Input
                                    value={selectedWidget.targets || ''}
                                    onChange={(_, data) => updateWidgetProperty('targets', data.value)}
                                    placeholder="例如: C:\\Program Files\\LocalSend\\localsend_app.exe {{source}}"
                                />
                            </Field>
                            <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)', marginTop: '-8px', marginBottom: '16px' }}>
                                {"{{source}}"} 表示拖放的文件路径，会在运行时自动替换为实际文件路径
                            </div>
                            <Field label="是否始终显示">
                                <Switch
                                    checked={selectedWidget.show_all_time || false}
                                    onChange={(_, data) => updateWidgetProperty('show_all_time', data.checked)}
                                />
                            </Field>
                            <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)', marginTop: '-8px', marginBottom: '16px' }}>
                                开启后，即使侧边栏不是通过检测到拖放自动展开的，也会显示
                            </div>
                        </div>
                    )}
                    {/* 工具栏组件的属性 */}
                    {selectedWidget.type === 'toolbar' && (
                        <div className={styles.propertySection}>
                            <div className={styles.propertyGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <Title2 as="h3" className={styles.sectionTitle}>显示的工具</Title2>
                                    <Button
                                        appearance="primary"
                                        icon={<AddRegular />}
                                        onClick={handleAddTool}
                                    >
                                        添加工具
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(selectedWidget.tools || []).map((toolId, index) => {
                                        const toolOptions = [
                                            { id: 'screenshot', label: '截图' },
                                            { id: 'show_desktop', label: '显示桌面' },
                                            { id: 'taskview', label: '任务视图' },
                                            { id: 'close_front_window', label: '关闭窗口' },
                                        ];
                                        const currentTool = toolOptions.find(t => t.id === toolId) || { id: toolId, label: toolId };

                                        return (
                                            <div
                                                key={`${index}-${toolId}`}
                                                draggable
                                                onDragStart={(e) => handleToolDragStart(e, index)}
                                                onDragOver={(e) => handleToolDragOver(e, index)}
                                                onDrop={(e) => handleToolDrop(e, index)}
                                                onDragEnd={() => {
                                                    setDraggingToolIndex(null);
                                                    setDragOverToolIndex(null);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px',
                                                    backgroundColor: draggingToolIndex === index 
                                                        ? 'var(--colorNeutralBackground3)' 
                                                        : dragOverToolIndex === index 
                                                            ? 'var(--colorNeutralBackground2)' 
                                                            : 'var(--colorNeutralBackground1)',
                                                    border: '1px solid var(--colorNeutralStroke1)',
                                                    borderRadius: '4px',
                                                    cursor: 'default',
                                                    opacity: draggingToolIndex === index ? 0.5 : 1,
                                                    transition: 'all 0.1s ease'
                                                }}
                                            >
                                                <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--colorNeutralForeground3)' }}>
                                                    <LineHorizontal3Regular />
                                                </div>
                                                
                                                <div style={{ flex: 1 }}>
                                                    <Dropdown
                                                        style={{ minWidth: 'auto', width: '100%' }}
                                                        value={currentTool.label}
                                                        selectedOptions={[toolId]}
                                                        onOptionSelect={(_, data) => handleUpdateTool(index, data.optionValue)}
                                                    >
                                                        {toolOptions.map(option => (
                                                            <Option key={option.id} value={option.id}>
                                                                {option.label}
                                                            </Option>
                                                        ))}
                                                    </Dropdown>
                                                </div>

                                                <Button
                                                    appearance="subtle"
                                                    icon={<DeleteRegular />}
                                                    onClick={() => handleDeleteTool(index)}
                                                />
                                            </div>
                                        );
                                    })}

                                    {(selectedWidget.tools || []).length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            color: 'var(--colorNeutralForeground3)',
                                            fontSize: '12px',
                                            border: '1px dashed var(--colorNeutralStroke1)',
                                            borderRadius: '4px'
                                        }}>
                                            暂无工具，点击上方按钮添加
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 快速启动组件的属性 */}
                    {selectedWidget.type === 'quick_launch' && (
                        <div className={styles.propertySection}>
                            <Field label="布局方式">
                                <Dropdown
                                    value={{
                                        'grid': '网格',
                                        'list': '列表'
                                    }[selectedWidget.layout || 'grid'] || '网格'}
                                    selectedOptions={[selectedWidget.layout || 'grid']}
                                    onOptionSelect={(_, data) => updateWidgetProperty('layout', data.optionValue)}
                                >
                                    <Option value="grid">网格</Option>
                                    <Option value="list">列表</Option>
                                </Dropdown>
                            </Field>
                            <Field label="最大显示数量">
                                <Input
                                    type="number"
                                    min={10}
                                    max={200}
                                    value={selectedWidget.maxItems || 50}
                                    onChange={(_, data) => updateWidgetProperty('maxItems', parseInt(data.value) || 50)}
                                />
                            </Field>
                        </div>
                    )}
                </div>
            )}

            {/* 组件库标签页内容 */}
            {activeTab === 'library' && (
                <div className={styles.propertiesContent}>
                    <Title2 as="h3" className={styles.panelTitle}>组件库</Title2>
                    <div className={styles.libraryGrid}>
                        {/* 启动器组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('launcher')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'launcher')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <RocketRegular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>启动器</span>
                                <span className={styles.libraryItemDesc}>快速启动应用程序或文件</span>
                            </div>
                        </div>

                        {/* 音量控制组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('volume_slider')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'volume_slider')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <Speaker2Regular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>音量控制</span>
                                <span className={styles.libraryItemDesc}>滑动调节系统音量</span>
                            </div>
                        </div>

                        {/* 拖放速启组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('drag_to_launch')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'drag_to_launch')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <ArrowImportRegular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>拖放速启</span>
                                <span className={styles.libraryItemDesc}>拖拽文件到此处快速打开</span>
                            </div>
                        </div>

                        {/* 文件列表组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('files')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'files')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <FolderRegular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>文件列表</span>
                                <span className={styles.libraryItemDesc}>显示指定文件夹内容</span>
                            </div>
                        </div>

                        {/* 工具栏组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('toolbar')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'toolbar')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <WrenchRegular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>工具栏</span>
                                <span className={styles.libraryItemDesc}>包含截图、显示桌面等工具</span>
                            </div>
                        </div>

                        {/* 快速启动组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('quick_launch')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'quick_launch')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <FlashRegular />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>快速启动</span>
                                <span className={styles.libraryItemDesc}>从开始菜单快速启动应用</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 未选择组件时的提示 */}
            {activeTab === 'properties' && !selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3" className={styles.panelTitle}>选择组件</Title2>
                        <Body1>点击左侧组件以编辑其属性</Body1>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
