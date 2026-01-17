import React from 'react';
import {
    Tab,
    TabList,
    Body1,
    Title2,
    Input,
    Field,
    Dropdown,
    Option,
    Slider
} from "@fluentui/react-components";

const PropertiesPanel = ({
    styles,
    activeTab,
    setActiveTab,
    selectedWidget,
    updateWidgetProperty
}) => {
    return (
        <div className={styles.propertiesPanel}>
            <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                <Tab value="properties">属性</Tab>
                <Tab value="style">样式</Tab>
            </TabList>

            {activeTab === 'properties' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3">组件属性</Title2>
                        <Body1>编辑选中组件的属性</Body1>
                    </div>

                    {selectedWidget.type === 'launcher' && (
                        <div className={styles.propertySection}>
                            <Field label="布局方向">
                                <Dropdown
                                    value={selectedWidget.layout || 'vertical'}
                                    onOptionSelect={(_, data) => updateWidgetProperty('layout', data.optionValue)}
                                >
                                    <Option value="vertical">垂直</Option>
                                    <Option value="horizontal">水平</Option>
                                </Dropdown>
                            </Field>
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
                                    value={selectedWidget.layout || 'vertical'}
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
                            <Field label="名称">
                                <Input
                                    value={selectedWidget.name || ''}
                                    onChange={(_, data) => updateWidgetProperty('name', data.value)}
                                />
                            </Field>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'style' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3">样式设置</Title2>
                        <Body1>调整组件的样式</Body1>
                    </div>

                    <div className={styles.propertySection}>
                        <Field label="宽度">
                            <Slider
                                min={100}
                                max={500}
                                value={selectedWidget.width || 200}
                                onChange={(_, data) => updateWidgetProperty('width', data.value)}
                            />
                        </Field>
                        <Field label="高度">
                            <Slider
                                min={50}
                                max={300}
                                value={selectedWidget.height || 100}
                                onChange={(_, data) => updateWidgetProperty('height', data.value)}
                            />
                        </Field>
                    </div>
                </div>
            )}

            {!selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Title2 as="h3">选择组件</Title2>
                        <Body1>点击左侧组件以编辑其属性</Body1>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
