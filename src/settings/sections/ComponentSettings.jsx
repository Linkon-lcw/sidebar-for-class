import React from 'react';
import { Card, Body1 } from "@fluentui/react-components";

const ComponentSettings = ({ config, updateConfig, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>组件设置</div>
                <div className={styles.description}>管理和配置侧边栏中的各种组件。</div>
            </div>
            <div className={styles.groupTitle}>组件列表</div>
            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Body1 color="var(--colorNeutralForeground2)">组件管理功能即将上线。</Body1>
                </div>
            </Card>
        </div>
    );
};

export default ComponentSettings;
