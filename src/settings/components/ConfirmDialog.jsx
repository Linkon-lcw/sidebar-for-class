import React from 'react';
import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogBody,
    DialogActions,
    Button
} from "@fluentui/react-components";

const ConfirmDialog = ({ isOpen, onOpenChange, title, content, onConfirm }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{title || '确认'}</DialogTitle>
                    <DialogContent>
                        {content}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>取消</Button>
                        <Button 
                            appearance="primary" 
                            onClick={() => {
                                onConfirm();
                                onOpenChange(false);
                            }}
                        >
                            确定
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default ConfirmDialog;
