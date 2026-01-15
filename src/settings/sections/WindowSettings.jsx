import React from 'react';
import {
    Card,
    CardHeader,
    Subtitle1,
    Label,
    Input,
    Slider,
    Button,
    useId,
} from "@fluentui/react-components";
import {
    Save24Regular,
    Checkmark24Regular,
} from "@fluentui/react-icons";

const WindowSettings = ({ config, handleTransformChange, saveSettings, saveStatus, styles }) => {
    const sliderId = useId("slider");

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>窗口设置</div>
                <div className={styles.description}>调整侧边栏窗口的位置、大小和动画效果。</div>
            </div>

            <Card className={styles.card}>
                <CardHeader header={<Subtitle1>布局与位置</Subtitle1>} />
                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                    <Label className={styles.label}>显示器索引 (Display Index)</Label>
                    <Input
                        type="number"
                        value={config.transforms.display}
                        onChange={(_, data) => handleTransformChange('display', parseInt(data.value))}
                    />
                    <div className={styles.helpText}>多显示器环境下，指定侧边栏所在的屏幕（0 为主屏幕）</div>
                </div>

                <div className={styles.formGroup}>
                    <Label className={styles.label} htmlFor={sliderId}>垂直位置 (Y Position)</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            id={sliderId}
                            min={0}
                            max={config.displayBounds?.height || 2000}
                            value={config.transforms.posy}
                            onChange={(_, data) => handleTransformChange('posy', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.posy}</span>
                    </div>
                    <div className={styles.helpText}>侧边栏中心的垂直坐标</div>
                </div>

                <div className={styles.formGroup}>
                    <Label className={styles.label}>初始高度 (Initial Height)</Label>
                    <Input
                        type="number"
                        value={config.transforms.height}
                        onChange={(_, data) => handleTransformChange('height', parseInt(data.value))}
                    />
                    <div className={styles.helpText}>收起状态下的触发区域高度</div>
                </div>
            </Card>

            <Card className={styles.card}>
                <CardHeader header={<Subtitle1>动画与样式</Subtitle1>} />
                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                    <Label className={styles.label}>动画速度 (Animation Speed)</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={0.1}
                            max={3}
                            step={0.1}
                            value={config.transforms.animation_speed}
                            onChange={(_, data) => handleTransformChange('animation_speed', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.animation_speed.toFixed(1)}</span>
                    </div>
                    <div className={styles.helpText}>设置侧边栏展开和收起的动画播放速度</div>
                </div>

                <div className={styles.formGroup}>
                    <Label className={styles.label}>整体缩放 (Size %)</Label>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={50}
                            max={200}
                            value={config.transforms.size}
                            onChange={(_, data) => handleTransformChange('size', data.value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.size}%</span>
                    </div>
                    <div className={styles.helpText}>侧边栏窗口的全局缩放比例</div>
                </div>
            </Card>

            <div className={styles.footer}>
                <Button
                    appearance="accent"
                    size="large"
                    icon={saveStatus === 'success' ? <Checkmark24Regular /> : <Save24Regular />}
                    onClick={saveSettings}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'success' ? '已保存' : '保存修改'}
                </Button>
            </div>
        </div>
    );
};

export default WindowSettings;
