/**
 * 辅助工具设置组件
 * 提供一些辅助性的功能设置
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import {
    Card,
    Label,
    Switch
} from "@fluentui/react-components";

const HelperSettings = ({ config, updateConfig, styles }) => {
    // 确保 helper_tools 对象存在
    const helperTools = config.helper_tools || {};

    const handleToggle = (key, value) => {
        updateConfig({
            ...config,
            helper_tools: {
                ...helperTools,
                [key]: value
            }
        });
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>辅助工具</div>
                <div className={styles.description}>一些提高效率或解决冲突的辅助功能。</div>
            </div>

            <div className={styles.groupTitle}>通用</div>
            <Card className={styles.card}>
                <div className={styles.switchRow}>
                    <Label className={styles.label}>自动查杀同类软件窗口</Label>
                    <Switch
                        checked={helperTools.auto_kill_similar || false}
                        onChange={(_, data) => handleToggle('auto_kill_similar', data.checked)}
                    />
                </div>
                <div className={styles.helpText}>启动时自动关闭其他可能产生冲突的同类软件窗口</div>

                <div className={styles.switchRow} style={{ marginTop: '16px' }}>
                    <Label className={styles.label}>自动查杀同类软件计时器并打开本软件的计时器</Label>
                    <Switch
                        checked={helperTools.auto_kill_timer || false}
                        onChange={(_, data) => handleToggle('auto_kill_timer', data.checked)}
                    />
                </div>
                <div className={styles.helpText}>检测并关闭希沃计时器等同类软件，并自动启动本软件计时器</div>
            </Card>
        </div>
    );
};

export default HelperSettings;
