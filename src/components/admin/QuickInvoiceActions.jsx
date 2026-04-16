import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    OpenInNew as OpenInNewIcon,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

/* ── Design tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

/* ── Toast ── */
const Toast = ({ msg, type, onClose }) => {
    const colors = { success: { bg: T.greenSoft, color: T.green }, error: { bg: T.roseSoft, color: T.rose }, info: { bg: T.accentSoft, color: T.accent } };
    const { bg, color } = colors[type] || colors.info;
    return (
        <Box sx={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            p: 1.8, borderRadius: '12px', bgcolor: bg, border: `1px solid ${color}28`,
            boxShadow: '0 8px 24px rgba(15,31,61,0.12)',
            display: 'flex', alignItems: 'center', gap: 1.5,
            animation: 'fadeUp 0.25s ease-out', minWidth: 220,
        }}>
            <Typography sx={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {msg}
            </Typography>
            <Box component="button" type="button" onClick={onClose}
                 sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', color, fontSize: '0.8rem', p: 0 }}>
                ✕
            </Box>
        </Box>
    );
};

/* ═══════════════════════════════ COMPONENT ═══════════════════════════════ */
const QuickInvoiceActions = ({ userId, fileName }) => {

    const [menuOpen,   setMenuOpen]   = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [toast,      setToast]      = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleMenuOpen = (e) => { setMenuAnchor(e.currentTarget); setMenuOpen(true); };
    const handleMenuClose = () => setMenuOpen(false);

    /* ── handleDownload — API call unchanged ── */
    const handleDownload = async () => {
        try {
            setLoading(true);
            handleMenuClose();

            const response = await adminAPI.downloadInvoice(userId);

            if (response.data.success && response.data.url) {
                // ✅ Always point to API server
                const apiBase = process.env.REACT_APP_API_URL || 'https://api.malcam.co.za';
                const fullUrl = response.data.url.startsWith('http')
                    ? response.data.url
                    : `${apiBase}${response.data.url}`;

                console.log('⬇️ [QuickInvoiceActions] Download URL:', fullUrl);

                const link = document.createElement('a');
                link.href = fullUrl;
                link.setAttribute('download', response.data.fileName || 'invoice.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();

                showToast('Invoice downloaded successfully', 'success');
            }
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download invoice', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleView = async () => {
        try {
            setLoading(true);
            handleMenuClose();

            const response = await adminAPI.viewInvoice(userId);

            if (response.data.success && response.data.url) {
                // ✅ Always point to API server
                const apiBase = process.env.REACT_APP_API_URL || 'https://api.malcam.co.za';
                const fullUrl = response.data.url.startsWith('http')
                    ? response.data.url
                    : `${apiBase}${response.data.url}`;

                console.log('🔗 [QuickInvoiceActions] Opening URL:', fullUrl);
                window.open(fullUrl, '_blank');
                showToast('Invoice opened in new tab', 'info');
            }
        } catch (error) {
            console.error('View error:', error);
            showToast('Failed to view invoice', 'error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

            {/* ── Trigger button ── */}
            <Box
                component="button" type="button"
                onClick={handleMenuOpen} disabled={loading}
                sx={{
                    width: 30, height: 30, border: `1px solid ${T.border}`,
                    borderRadius: '8px', bgcolor: T.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: T.accent,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent },
                }}
            >
                {loading
                    ? <CircularProgress size={13} sx={{ color: T.accent }} />
                    : <MoreVertIcon sx={{ fontSize: 16 }} />
                }
            </Box>

            {/* ── Dropdown menu ── */}
            {menuOpen && menuAnchor && (
                <>
                    <Box onClick={handleMenuClose} sx={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    <Box sx={{
                        position: 'fixed',
                        top: menuAnchor.getBoundingClientRect().bottom + 6,
                        left: menuAnchor.getBoundingClientRect().left,
                        zIndex: 999,
                        bgcolor: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: '12px', overflow: 'hidden',
                        boxShadow: '0 12px 32px rgba(15,31,61,0.12)',
                        minWidth: 170,
                        animation: 'fadeUp 0.18s ease-out',
                    }}>
                        {[
                            { icon: OpenInNewIcon, label: 'View Invoice',     onClick: handleView     },
                            { icon: DownloadIcon,  label: 'Download Invoice', onClick: handleDownload },
                        ].map(({ icon: Icon, label, onClick }) => (
                            <Box
                                key={label}
                                component="button" type="button"
                                onClick={onClick}
                                sx={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 1.2,
                                    px: 1.8, py: 1.1, border: 'none', bgcolor: 'transparent',
                                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: '0.83rem', fontWeight: 600, color: T.text,
                                    '&:hover': { bgcolor: T.bg }, transition: 'background-color 0.1s',
                                }}
                            >
                                <Icon sx={{ fontSize: 15, color: T.muted }} />
                                {label}
                            </Box>
                        ))}
                    </Box>
                </>
            )}

            {/* ── Toast ── */}
            {toast && <Toast msg={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default QuickInvoiceActions;