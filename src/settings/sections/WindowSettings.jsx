import React from 'react';
import {
    Card,
    Label,
    Input,
    Slider,
    useId,
    Dropdown,
    Option,
} from "@fluentui/react-components";
import { useState, useEffect } from 'react';

const WindowSettings = ({ config, handleTransformChange, styles }) => {
    const sliderId = useId("slider");
    const dropdownId = useId("display-dropdown");
    const [displays, setDisplays] = useState([]);

    useEffect(() => {
        const fetchDisplays = async () => {
            const displayList = await window.electronAPI.getDisplays();
            setDisplays(displayList);
        };
        fetchDisplays();
    }, []);

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>窗口设置</div>
            </div>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label} htmlFor={dropdownId}>显示器</Label>
                    <Dropdown
                        id={dropdownId}
                        value={displays[config.transforms.display] ?
                            (displays[config.transforms.display].label || `显示器 ${config.transforms.display} (${displays[config.transforms.display].bounds.width}x${displays[config.transforms.display].bounds.height})`) :
                            `显示器 ${config.transforms.display}`}
                        selectedOptions={[config.transforms.display.toString()]}
                        onOptionSelect={(_, data) => handleTransformChange('display', parseInt(data.selectedOptions[0]))}
                    >
                        {displays.map((display, index) => (
                            <Option key={index} value={index.toString()}>
                                {display.label || `显示器 ${index} (${display.bounds.width}x${display.bounds.height})`}
                            </Option>
                        ))}
                    </Dropdown>
                    <div className={styles.helpText}>选择侧边栏所在的屏幕</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label} htmlFor={sliderId}>垂直位置</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            id={sliderId}
                            min={0}
                            max={config.displayBounds?.height || 2000}
                            value={config.transforms.posy}
                            onChange={(_, data) => handleTransformChange('posy', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.posy}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏中心的垂直坐标</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>初始高度</Label>
                    <Input
                        type="number"
                        contentAfter="px"
                        value={config.transforms.height}
                        onChange={(_, data) => handleTransformChange('height', parseInt(data.value))}
                    />
                    <div className={styles.helpText}>收起状态下的侧边栏的高度</div>
                </div>
            </Card>




        </div>
    );
};

export default WindowSettings;
