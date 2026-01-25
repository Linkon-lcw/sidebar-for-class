import React, { useState } from 'react';
import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogBody,
    DialogActions,
    Button,
    Field,
    Input
} from "@fluentui/react-components";

const CreateScriptModal = ({ isOpen, onOpenChange, onCreate }) => {
    const [filename, setFilename] = useState('');

    const handleCreate = () => {
        if (!filename) return;
        
        // 确保有后缀名，默认 .bat
        let finalName = filename;
        if (!finalName.includes('.')) {
            finalName += '.bat';
        }
        
        onCreate(finalName);
        setFilename('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>新建脚本</DialogTitle>
                    <DialogContent>
                        <Field label="脚本文件名" validationState={filename ? 'none' : 'error'} validationMessage={filename ? '' : '请输入文件名'}>
                            <Input 
                                value={filename} 
                                onChange={(_, data) => setFilename(data.value)} 
                                placeholder="例如: myscript.bat"
                                autoComplete="off"
                            />
                        </Field>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
                            支持 .bat, .js, .ps1 等。如果不输入后缀，将默认创建 .bat 文件。
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>取消</Button>
                        <Button appearance="primary" onClick={handleCreate} disabled={!filename}>创建</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default CreateScriptModal;
