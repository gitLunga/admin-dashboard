// src/components/ToastProvider.jsx
import React, { createContext, useCallback, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

export const ToastContext = createContext({
    toast: () => {},
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
});

const TOAST_META = {
    success: { color: '#059669', soft: '#D1FAE5', border: '#059669', Icon: SuccessIcon },
    error:   { color: '#DC2626', soft: '#FEE2E2', border: '#DC2626', Icon: ErrorIcon   },
    warning: { color: '#D97706', soft: '#FEF3C7', border: '#D97706', Icon: WarningIcon },
    info:    { color: '#1E4FD8', soft: '#EBF0FF', border: '#1E4FD8', Icon: InfoIcon    },
};

let _id = 0;

const Toast = ({ id, type = 'info', message, title, onDismiss }) => {
    const meta = TOAST_META[type] || TOAST_META.info;
    const Icon = meta.Icon;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.2,
                p: 1.6,
                pr: 1,
                borderRadius: '12px',
                bgcolor: '#FFFFFF',
                border: `1px solid ${meta.border}28`,
                borderLeft: `3.5px solid ${meta.color}`,
                boxShadow: '0 8px 28px rgba(15,31,61,0.13)',
                minWidth: 300,
                maxWidth: 400,
                animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
                '@keyframes toastIn': {
                    from: { opacity: 0, transform: 'translateX(110%) scale(0.92)' },
                    to:   { opacity: 1, transform: 'translateX(0)    scale(1)'    },
                },
            }}
        >
            {/* Icon */}
            <Box sx={{
                width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                bgcolor: meta.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.1,
            }}>
                <Icon sx={{ fontSize: 16, color: meta.color }} />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {title && (
                    <Typography sx={{
                        fontSize: '0.8rem', fontWeight: 700, color: '#0F1F3D',
                        fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 0.2,
                    }}>
                        {title}
                    </Typography>
                )}
                <Typography sx={{
                    fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.45,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                    {message}
                </Typography>
            </Box>

            {/* Dismiss */}
            <IconButton
                size="small"
                onClick={() => onDismiss(id)}
                sx={{ p: 0.4, color: '#9CA3AF', borderRadius: '6px', alignSelf: 'flex-start', '&:hover': { color: '#374151', bgcolor: '#F3F4F6' } }}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, type, message, title }]);
        if (duration > 0) setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    const success = useCallback((message, title = 'Success')       => toast({ type: 'success', message, title }), [toast]);
    const error   = useCallback((message, title = 'Error')         => toast({ type: 'error',   message, title, duration: 6000 }), [toast]);
    const warning = useCallback((message, title = 'Warning')       => toast({ type: 'warning', message, title }), [toast]);
    const info    = useCallback((message, title = 'Info')          => toast({ type: 'info',    message, title }), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info }}>
            {children}

            {/* Toast container */}
            <Box sx={{
                position: 'fixed', top: 24, right: 24,
                zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: 1.2,
                pointerEvents: 'none',
                '& > *': { pointerEvents: 'auto' },
            }}>
                {toasts.map(t => (
                    <Toast key={t.id} {...t} onDismiss={dismiss} />
                ))}
            </Box>
        </ToastContext.Provider>
    );
};

export default ToastProvider;