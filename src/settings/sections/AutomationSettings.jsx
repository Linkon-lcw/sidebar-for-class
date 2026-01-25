/**
 * 自动化设置组件
 * 管理自动执行的脚本和任务
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import {
    Card,
    Label,
    Input,
    Button,
    Field,
    Title2,
    Caption1,
    Divider,
    Checkbox
} from "@fluentui/react-components";
import {
    AddRegular,
    DeleteRegular,
    PlayRegular
} from "@fluentui/react-icons";

const AutomationSettings = ({ config, updateConfig, styles }) => {
    // 获取当前的自动化任务列表
    const automatic = config.automatic || [];

    // 添加新任务
    const handleAddTask = () => {
        const newTask = {
            on: ['startup'],
            script: ''
        };
        updateConfig({
            ...config,
            automatic: [...automatic, newTask]
        });
    };

    // 删除任务
    const handleDeleteTask = (index) => {
        const newAutomatic = automatic.filter((_, i) => i !== index);
        updateConfig({
            ...config,
            automatic: newAutomatic
        });
    };

    // 更新任务属性
    const handleUpdateTask = (index, field, value) => {
        const newAutomatic = automatic.map((task, i) => {
            if (i === index) {
                return { ...task, [field]: value };
            }
            return task;
        });
        updateConfig({
            ...config,
            automatic: newAutomatic
        });
    };

    // 切换触发条件
    const handleToggleOn = (index, condition) => {
        const task = automatic[index];
        const currentOn = task.on || [];
        let newOn;
        if (currentOn.includes(condition)) {
            newOn = currentOn.filter(c => c !== condition);
        } else {
            newOn = [...currentOn, condition];
        }
        handleUpdateTask(index, 'on', newOn);
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>自动化</div>
                <div className={styles.description}>配置在特定事件发生时自动运行的脚本或程序。</div>
            </div>

            <div className={styles.groupTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>任务列表</span>
                <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    size="small"
                    onClick={handleAddTask}
                >
                    添加任务
                </Button>
            </div>

            {automatic.length === 0 ? (
                <Card className={styles.card}>
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--colorNeutralForeground3)' }}>
                        暂无自动化任务，点击上方按钮添加。
                    </div>
                </Card>
            ) : (
                automatic.map((task, index) => (
                    <Card key={index} className={styles.card} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PlayRegular />
                                <Caption1 style={{ fontWeight: '600' }}>任务 {index + 1}</Caption1>
                            </div>
                            <Button
                                appearance="subtle"
                                icon={<DeleteRegular />}
                                size="small"
                                onClick={() => handleDeleteTask(index)}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Field label="脚本路径或命令">
                                <Input
                                    value={task.script || ''}
                                    onChange={(_, data) => handleUpdateTask(index, 'script', data.value)}
                                    placeholder="例如: test.bat 或 C:\\Windows\\notepad.exe"
                                />
                            </Field>

                            <div>
                                <Label style={{ marginBottom: '8px', display: 'block' }}>触发条件</Label>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <Checkbox
                                        label="SidebarForClass 启动时"
                                        checked={task.on?.includes('startup')}
                                        onChange={() => handleToggleOn(index, 'startup')}
                                    />
                                    {/* 未来可以添加更多触发条件，如：屏幕解锁、定时等 */}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))
            )}
            
            <div className={styles.helpText} style={{ marginTop: '16px' }}>
                提示：相对路径将相对于程序的数据目录 (data/) 进行解析。脚本将以隐藏窗口模式静默运行。
            </div>
        </div>
    );
};

export default AutomationSettings;
