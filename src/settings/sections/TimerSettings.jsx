/**
 * 计时器设置组件
 * 提供计时器相关的配置选项
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import {
    Card,
    Label,
    Dropdown,
    Option
} from "@fluentui/react-components";

const TimerSettings = ({ config, updateConfig, styles }) => {
    // 确保 timer 配置对象存在
    const timerConfig = config.timer || {};

    const handleAutoHideChange = (value) => {
        const newConfig = {
            ...config,
            timer: {
                ...timerConfig,
                auto_hide_seconds: value
            }
        };
        updateConfig(newConfig);
    };

    const options = [
        { label: '禁用', value: 0 },
        { label: '3秒', value: 3 },
        { label: '5秒', value: 5 },
        { label: '10秒', value: 10 }
    ];

    // 获取当前选中的选项，如果没有设置则默认为禁用(0)
    const currentAutoHide = timerConfig.auto_hide_seconds || 0;
    const currentOption = options.find(opt => opt.value === currentAutoHide) || options[0];

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>计时器设置</div>
                <div className={styles.description}>配置计时器的行为和自动化选项。</div>
            </div>

            <div className={styles.groupTitle}>常规</div>
            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Label className={styles.label} htmlFor="auto-hide-dropdown">自动收起至迷你模式</Label>
                    <Dropdown
                        id="auto-hide-dropdown"
                        value={currentOption.label}
                        onOptionSelect={(_, data) => handleAutoHideChange(data.optionValue)}
                        placeholder="选择时间"
                    >
                        {options.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Dropdown>
                </div>
                <div className={styles.helpText}>当计时器处于计时状态且无操作达到设定时间后，自动切换到迷你模式。</div>
            </Card>
        </div>
    );
};

export default TimerSettings;
