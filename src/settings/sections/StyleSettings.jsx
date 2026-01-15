import React from 'react';
import {
    Card,
    Label,
    Slider,
} from "@fluentui/react-components";

const StyleSettings = ({ config, handleTransformChange, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>界面样式</div>
            </div>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>动画速度</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={0.1}
                            max={3}
                            step={0.1}
                            value={config.transforms.animation_speed}
                            onChange={(_, data) => handleTransformChange('animation_speed', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.animation_speed.toFixed(1)}x</span>
                    </div>
                    <div className={styles.helpText}>设置侧边栏展开和收起的动画播放速度</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>整体缩放</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={50}
                            max={200}
                            step={10}
                            value={config.transforms.size}
                            onChange={(_, data) => handleTransformChange('size', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.size}%</span>
                    </div>
                    <div className={styles.helpText}>侧边栏窗口的全局缩放比例</div>
                </div>
            </Card>
        </div>
    );
};

export default StyleSettings;