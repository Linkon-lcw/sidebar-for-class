/**
 * 自动化设置组件
 * 管理自动执行的脚本和任务
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React, { useState } from 'react';
import {
    Card,
    Label,
    Input,
    Button,
    Field,
    Title2,
    Caption1,
    Divider,
    Checkbox,
    Combobox,
    Option
} from "@fluentui/react-components";
import {
    AddRegular,
    DeleteRegular,
    PlayRegular,
    EditRegular,
    DocumentAddRegular
} from "@fluentui/react-icons";
import ScriptEditorModal from '../components/ScriptEditorModal';
import CreateScriptModal from '../components/CreateScriptModal';

const AutomationSettings = ({ config, updateConfig, styles }) => {
    // 获取当前的自动化任务列表
    const automatic = config.automatic || [];
    const [editorOpen, setEditorOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [currentScriptIndex, setCurrentScriptIndex] = useState(-1);
    const [existingScripts, setExistingScripts] = useState([]);

    // 获取 data 目录下的现有脚本
    const fetchScripts = async () => {
        try {
            // 传入 '.' 代表数据目录
            const files = await window.electronAPI.getFilesInFolder('.', 100);
            // 过滤出常见的脚本后缀
            const scriptExtensions = ['.bat', '.cmd', '.js', '.ps1', '.py', '.sh'];
            const scripts = files
                .filter(f => scriptExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))
                .map(f => f.name);
            setExistingScripts(scripts);
        } catch (err) {
            console.error('Failed to fetch scripts:', err);
        }
    };

    React.useEffect(() => {
        fetchScripts();
    }, []);

    // 添加新任务
    const handleAddTask = () => {
        const newTask = {
            name: '',
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

    const handleCreateScript = (filename) => {
        handleUpdateTask(currentScriptIndex, 'script', filename);
        // 刷新列表以包含新创建的文件
        fetchScripts();
        // 延迟一点打开编辑器，确保状态已更新
        setTimeout(() => {
            setEditorOpen(true);
        }, 100);
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
                                <Caption1 style={{ fontWeight: '600' }}>{task.name || `任务 ${index + 1}`}</Caption1>
                            </div>
                            <Button
                                appearance="subtle"
                                icon={<DeleteRegular />}
                                size="small"
                                onClick={() => handleDeleteTask(index)}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Field label="任务名称">
                                <Input
                                    value={task.name || ''}
                                    onChange={(e) => handleUpdateTask(index, 'name', e.target.value)}
                                    placeholder="例如：启动自备工具"
                                />
                            </Field>

                            <Field label="脚本路径或命令">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Combobox
                                        style={{ flex: 1 }}
                                        value={task.script || ''}
                                        onOptionSelect={(_, data) => handleUpdateTask(index, 'script', data.optionValue)}
                                        onChange={(e) => handleUpdateTask(index, 'script', e.target.value)}
                                        placeholder="例如: test.bat 或 C:\\Windows\\notepad.exe"
                                        freeform
                                    >
                                        {existingScripts.map((script) => (
                                            <Option key={script} value={script}>
                                                {script}
                                            </Option>
                                        ))}
                                    </Combobox>
                                    <Button
                                        icon={<DocumentAddRegular />}
                                        onClick={() => {
                                            setCurrentScriptIndex(index);
                                            setCreateModalOpen(true);
                                        }}
                                        title="新建脚本文件"
                                    />
                                    <Button
                                        icon={<EditRegular />}
                                        onClick={() => {
                                            setCurrentScriptIndex(index);
                                            setEditorOpen(true);
                                        }}
                                        disabled={!task.script}
                                        title="在编辑器中打开"
                                    />
                                    <Button
                                        icon={<PlayRegular />}
                                        onClick={() => {
                                            window.electronAPI.launchApp(task.script);
                                        }}
                                        disabled={!task.script}
                                        title="立即试运行"
                                        appearance="subtle"
                                    />
                                </div>
                            </Field>

                            <div>
                                <Label style={{ marginBottom: '8px', display: 'block' }}>触发器</Label>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <Checkbox
                                        label="在 SidebarForClass 启动时"
                                        checked={task.on?.includes('startup')}
                                        onChange={() => handleToggleOn(index, 'startup')}
                                    />
                                    <Checkbox
                                        label="在 SidebarForClass 退出时"
                                        checked={task.on?.includes('shutdown')}
                                        onChange={() => handleToggleOn(index, 'shutdown')}
                                    />
                                    {/* 未来可以添加更多触发条件，如：屏幕解锁、定时等 */}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))
            )}

            <CreateScriptModal 
                isOpen={createModalOpen} 
                onOpenChange={setCreateModalOpen} 
                onCreate={handleCreateScript} 
            />

            <ScriptEditorModal
                isOpen={editorOpen}
                onOpenChange={setEditorOpen}
                filePath={currentScriptIndex >= 0 ? automatic[currentScriptIndex]?.script : ''}
            />
            
            <div className={styles.helpText} style={{ marginTop: '16px' }}>
                提示：相对路径将相对于程序的数据目录 (data/) 进行解析。脚本将以隐藏窗口模式静默运行。
            </div>
        </div>
    );
};

export default AutomationSettings;
