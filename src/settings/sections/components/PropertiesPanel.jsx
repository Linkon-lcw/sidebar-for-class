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
    ArrowDownRegular
} from "@fluentui/react-icons";

const PropertiesPanel = ({
    styles,
    activeTab,
    setActiveTab,
    selectedWidget,
    updateWidgetProperty,
    onDeselectWidget
}) => {
    const [editingTargetIndex, setEditingTargetIndex] = useState(null);

    const handleTabChange = (_, data) => {
        setActiveTab(data.value);
        if (data.value === 'library' && onDeselectWidget) {
            onDeselectWidget();
        }
    };

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

    return (
        <div className={styles.propertiesPanel}>
            <TabList selectedValue={activeTab} onTabSelect={handleTabChange}>
                <Tab value="properties">属性</Tab>
                <Tab value="library">组件库</Tab>
            </TabList>

            {activeTab === 'properties' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3" className={styles.panelTitle}>组件属性</Title2>
                        <Body1>编辑选中组件的属性</Body1>
                    </div>

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

                    {selectedWidget.type === 'volume_slider' && (
                        <div className={styles.propertySection}>
                            <Field label="最小值">
                                <Input
                                    type="number"
                                    value={selectedWidget.range?.[0] || 0}
                                    onChange={(_, data) => updateWidgetProperty('range', [parseInt(data.value) || 0, selectedWidget.range?.[1] || 100])}
                                />
                            </Field>
                            <Field label="最大值">
                                <Input
                                    type="number"
                                    value={selectedWidget.range?.[1] || 100}
                                    onChange={(_, data) => updateWidgetProperty('range', [selectedWidget.range?.[0] || 0, parseInt(data.value) || 100])}
                                />
                            </Field>
                        </div>
                    )}

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
                </div>
            )}

            {activeTab === 'library' && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3" className={styles.panelTitle}>组件库</Title2>
                        <Body1>暂时还没做这个功能</Body1>
                    </div>
                </div>
            )}

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
