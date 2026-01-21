/**
 * 样式设置组件
 * 配置侧边栏的动画速度和整体缩放
 * @param {Object} config - 配置对象
 * @param {Function} handleTransformChange - 处理变换属性变化的回调函数
 * @param {Object} styles - 样式对象
 */

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

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>展开后宽度</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.width || 450}
                            onChange={(_, data) => {
                                const newWidth = data.value;
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, width: newWidth });
                            }}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.panel?.width || 450}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的宽度</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>展开后高度</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.height || 400}
                            onChange={(_, data) => {
                                const newHeight = data.value;
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, height: newHeight });
                            }}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.panel?.height || 400}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的高度</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label}>展开后不透明度</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={0.1}
                            max={1}
                            step={0.05}
                            value={config.transforms?.panel?.opacity || 0.9}
                            onChange={(_, data) => {
                                const newOpacity = data.value;
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, opacity: newOpacity });
                            }}
                        />
                        <span className={styles.rangeValue}>{((config.transforms?.panel?.opacity || 0.9) * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的不透明度</div>
                </div>
            </Card>
        </div>
    );
};

export default StyleSettings;