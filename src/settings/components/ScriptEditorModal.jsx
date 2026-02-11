import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogBody,
    DialogActions,
    Button,
    Spinner,
    MessageBar,
    MessageBarTitle,
    MessageBarBody
} from "@fluentui/react-components";
import Editor from "@monaco-editor/react";

const ScriptEditorModal = ({ isOpen, onOpenChange, filePath, onSave }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && filePath) {
            loadFileContent();
        }
    }, [isOpen, filePath]);

    const loadFileContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.readFile(filePath);
            setContent(result);
        } catch (err) {
            console.error('Failed to load file:', err);
            // If file doesn't exist, we might want to start with empty content
            if (err.message.includes('File not found')) {
                setContent('');
            } else {
                setError('无法读取文件内容：' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await window.electronAPI.writeFile(filePath, content);
            if (onSave) onSave();
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save file:', err);
            setError('保存失败：' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getLanguage = (path) => {
        if (!path) return 'plaintext';
        const ext = path.split('.').pop().toLowerCase();
        switch (ext) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'json': return 'json';
            case 'bat': case 'cmd': return 'bat';
            case 'ps1': return 'powershell';
            case 'py': return 'python';
            case 'sh': return 'shell';
            case 'html': return 'html';
            case 'css': return 'css';
            default: return 'plaintext';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: '90vw', width: '800px', height: '80vh' }}>
                <DialogBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DialogTitle>编辑脚本: {filePath}</DialogTitle>
                    <DialogContent style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 16px' }}>
                        {error && (
                            <MessageBar intent="error" style={{ marginBottom: '10px' }}>
                                <MessageBarBody>
                                    <MessageBarTitle>错误</MessageBarTitle>
                                    {error}
                                </MessageBarBody>
                            </MessageBar>
                        )}
                        
                        <div style={{ flex: 1, border: '1px solid var(--colorNeutralStroke1)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Spinner label="正在加载内容..." />
                                </div>
                            ) : (
                                <Editor
                                    height="100%"
                                    language={getLanguage(filePath)}
                                    value={content}
                                    onChange={(value) => setContent(value)}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        automaticLayout: true,
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>取消</Button>
                        <Button 
                            appearance="primary" 
                            onClick={handleSave} 
                            loading={saving}
                            disabled={loading}
                        >
                            保存
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default ScriptEditorModal;
