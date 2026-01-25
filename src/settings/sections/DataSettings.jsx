/**
 * 数据管理设置组件
 * 管理 data 目录下的所有文件
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Button,
    Caption1,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    TableSelectionCell,
    Badge,
    Tooltip
} from "@fluentui/react-components";
import {
    AddRegular,
    DeleteRegular,
    EditRegular,
    DocumentRegular,
    ArrowClockwiseRegular,
    RenameRegular,
    InfoRegular,
    BotRegular
} from "@fluentui/react-icons";
import ScriptEditorModal from '../components/ScriptEditorModal';
import CreateScriptModal from '../components/CreateScriptModal';
import RenameFileModal from '../components/RenameFileModal';
import ConfirmDialog from '../components/ConfirmDialog';

const DataSettings = ({ config, updateConfig, styles }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [fileToRename, setFileToRename] = useState('');
    const [fileToDelete, setFileToDelete] = useState('');

    // 获取所有在自动化中引用的脚本及其对应的任务名称/索引
    const scriptToTasks = React.useMemo(() => {
        const map = new Map();
        if (!config || !config.automatic) return map;
        
        config.automatic.forEach((task, index) => {
            if (task.script) {
                const tasks = map.get(task.script) || [];
                // 优先使用任务名称，否则显示任务编号
                tasks.push(task.name || `任务 ${index + 1}`);
                map.set(task.script, tasks);
            }
        });
        return map;
    }, [config]);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            // 获取 data 目录下的所有文件
            const result = await window.electronAPI.getFilesInFolder('.', 500);
            setFiles(result);
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleCreateFile = async (filename) => {
        try {
            // 创建空文件
            await window.electronAPI.writeFile(filename, '');
            await fetchFiles();
            setSelectedFilePath(filename);
            setEditorOpen(true);
        } catch (err) {
            console.error('Failed to create file:', err);
        }
    };

    const handleDeleteFile = (filename) => {
        setFileToDelete(filename);
        setConfirmOpen(true);
    };

    const onDeleteConfirm = async () => {
        try {
            await window.electronAPI.deleteFile(fileToDelete);
            await fetchFiles();
        } catch (err) {
            console.error('Failed to delete file:', err);
        }
    };

    const handleRenameFile = (filename) => {
        setFileToRename(filename);
        setRenameModalOpen(true);
    };

    const onRenameConfirm = async (oldName, newName) => {
        try {
            await window.electronAPI.renameFile(oldName, newName);
            
            // 如果该文件被自动化引用，自动更新配置
            if (scriptToTasks.has(oldName)) {
                const newAutomatic = config.automatic.map(task => {
                    if (task.script === oldName) {
                        return { ...task, script: newName };
                    }
                    return task;
                });
                updateConfig({
                    ...config,
                    automatic: newAutomatic
                });
            }

            await fetchFiles();
        } catch (err) {
            console.error('Failed to rename file:', err);
            // 可以在这里加个错误提示
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const getFileBadge = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const badges = [];

        // 添加文件类型徽标
        switch (ext) {
            case 'js': badges.push(<Badge key="ext" appearance="outline" color="brand">JS</Badge>); break;
            case 'json': badges.push(<Badge key="ext" appearance="outline" color="success">JSON</Badge>); break;
            case 'bat': case 'cmd': badges.push(<Badge key="ext" appearance="outline" color="important">BAT</Badge>); break;
            case 'ps1': badges.push(<Badge key="ext" appearance="outline" color="informative">PS1</Badge>); break;
            default: badges.push(<Badge key="ext" appearance="outline">{ext.toUpperCase()}</Badge>);
        }

        if (filename.toLowerCase() === 'config.json') {
            badges.push(<Badge key="config" appearance="filled" color="brand">当前配置</Badge>);
        }

        if (scriptToTasks.has(filename)) {
            const tasks = scriptToTasks.get(filename);
            badges.push(
                <Tooltip key="auto" content={`此脚本已被自动化任务使用: ${tasks.join('、')}`} relationship="label">
                    <Badge appearance="tint" color="informative" icon={<BotRegular />}>自动化引用</Badge>
                </Tooltip>
            );
        }

        return <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{badges}</div>;
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>数据管理</div>
                <div className={styles.description}>管理数据目录 (data/) 中的所有脚本和配置文件。</div>
            </div>

            <div className={styles.groupTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>文件列表</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        icon={<ArrowClockwiseRegular />}
                        size="small"
                        onClick={fetchFiles}
                        disabled={loading}
                    >
                        刷新
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        size="small"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        新建文件
                    </Button>
                </div>
            </div>

            <Card className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <Table size="extra-small">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell style={{ width: '40%' }}>文件名</TableHeaderCell>
                            <TableHeaderCell style={{ width: '15%' }}>类型</TableHeaderCell>
                            <TableHeaderCell style={{ width: '30%' }}>修改时间</TableHeaderCell>
                            <TableHeaderCell style={{ width: '15%' }}>操作</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                    数据目录为空
                                </TableCell>
                            </TableRow>
                        ) : (
                            files.map((file) => (
                                <TableRow key={file.name}>
                                    <TableCell>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <DocumentRegular />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file.name}
                                            </span>
                                            {file.name.toLowerCase() === 'config.json' && (
                                                <Tooltip content="这是应用程序的主配置文件" relationship="label">
                                                    <InfoRegular style={{ fontSize: '12px', color: 'var(--colorBrandForeground1)' }} />
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getFileBadge(file.name)}
                                    </TableCell>
                                    <TableCell>
                                        <Caption1>{formatDate(file.mtime)}</Caption1>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Tooltip content="编辑" relationship="label">
                                                <Button
                                                    appearance="subtle"
                                                    icon={<EditRegular />}
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedFilePath(file.name);
                                                        setEditorOpen(true);
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip content="重命名" relationship="label">
                                                <Button
                                                    appearance="subtle"
                                                    icon={<RenameRegular />}
                                                    size="small"
                                                    onClick={() => handleRenameFile(file.name)}
                                                />
                                            </Tooltip>
                                            <Tooltip content="删除" relationship="label">
                                                <Button
                                                    appearance="subtle"
                                                    icon={<DeleteRegular />}
                                                    size="small"
                                                    onClick={() => handleDeleteFile(file.name)}
                                                    disabled={file.name.toLowerCase() === 'config.json'}
                                                />
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <CreateScriptModal
                isOpen={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onCreate={handleCreateFile}
            />

            <ScriptEditorModal
                isOpen={editorOpen}
                onOpenChange={setEditorOpen}
                filePath={selectedFilePath}
                onSave={fetchFiles}
            />

            <RenameFileModal
                isOpen={renameModalOpen}
                onOpenChange={setRenameModalOpen}
                oldName={fileToRename}
                referencedTasks={scriptToTasks.get(fileToRename)}
                onRename={onRenameConfirm}
            />

            <ConfirmDialog
                isOpen={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="确认删除"
                content={`确定要删除文件 ${fileToDelete} 吗？`}
                onConfirm={onDeleteConfirm}
            />
        </div>
    );
};

export default DataSettings;
