import React from 'react';
import { Card, Body1 } from "@fluentui/react-components";

const BasicSettings = ({ config, updateConfig, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>基本设置</div>
                <div className={styles.description}>配置应用程序的基本选项和偏好设置。</div>
            </div>
            <div className={styles.groupTitle}>常规</div>
            <Card className={styles.card}>
                <div className={styles.formGroup}>
                    <Body1 color="var(--colorNeutralForeground2)">基本设置内容将在这里显示。</Body1>
                </div>
            </Card>
        </div>
    );
};

export default BasicSettings;
