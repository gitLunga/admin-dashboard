import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Grid, Typography, CircularProgress, IconButton,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Close as CloseIcon,
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    Image as ImageIcon,
    Description,
    Receipt as ReceiptIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

/* ── Design tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const InfoItem = ({ label, value }) => (
    <Box>
        <Typography sx={{
            fontSize: '0.67rem', fontWeight: 700, color: T.muted,
            textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.4,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
            {label}
        </Typography>
        <Typography sx={{
            fontSize: '0.87rem', fontWeight: 600, color: T.text,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
            {value || '—'}
        </Typography>
    </Box>
);

const getFileConfig = (fileName) => {
    if (!fileName) return { icon: ReceiptIcon, color: T.accent, soft: T.accentSoft };
    if (fileName.toLowerCase().endsWith('.pdf'))           return { icon: PdfIcon,   color: T.rose,   soft: T.roseSoft   };
    if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) return { icon: ImageIcon, color: T.accent, soft: T.accentSoft };
    if (fileName.toLowerCase().match(/\.(doc|docx)$/))    return { icon: DocIcon,   color: T.purple, soft: T.purpleSoft };
    return { icon: Description, color: T.muted, soft: T.bg };
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/* ═══════════════════════════════ COMPONENT ═══════════════════════════════ */
const InvoiceViewer = ({ open, userId, userName, onClose }) => {

    const [loading,     setLoading]     = useState(false);
    const [invoiceInfo, setInvoiceInfo] = useState(null);
    const [error,       setError]       = useState(null);

    /* ── fetchInvoiceInfo — API call unchanged ── */
    const fetchInvoiceInfo = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true); setError(null);
            const response = await adminAPI.getInvoiceInfo(userId);
            setInvoiceInfo(response.data.data);
        } catch (err) {
            console.error('Error fetching invoice info:', err);
            setError('Invoice not found or not uploaded yet');
            setInvoiceInfo(null);
        } finally { setLoading(false); }
    }, [userId]);

    useEffect(() => {
        if (open && userId) { fetchInvoiceInfo(); }
    }, [open, userId, fetchInvoiceInfo]);

    /* ── handleDownload — API call unchanged ── */
    const handleDownload = useCallback(async () => {
        if (!userId || !invoiceInfo) return;
        try {
            setLoading(true);
            const response = await adminAPI.downloadInvoice(userId);
            const url  = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', invoiceInfo.file_name || 'invoice.pdf');
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download invoice');
        } finally { setLoading(false); }
    }, [userId, invoiceInfo]);

    /* ── handleView — API call unchanged ── */
    const handleView = useCallback(async () => {
        if (!userId || !invoiceInfo) return;
        try {
            setLoading(true);
            const response = await adminAPI.viewInvoice(userId);
            const blob = new Blob([response.data], { type: invoiceInfo.mime_type });
            const url  = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => { window.URL.revokeObjectURL(url); }, 100);
        } catch (err) {
            console.error('View error:', err);
            setError('Failed to view invoice');
        } finally { setLoading(false); }
    }, [userId, invoiceInfo]);

    /* ── handleImageError unchanged ── */
    const handleImageError = useCallback((e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        const parent = e.target.parentNode;
        if (parent) {
            const fallbackIcon = document.createElement('div');
            fallbackIcon.innerHTML = '📄';
            fallbackIcon.style.fontSize = '48px';
            fallbackIcon.style.textAlign = 'center';
            parent.appendChild(fallbackIcon);
        }
    }, []);

    const handleClose = useCallback(() => {
        setInvoiceInfo(null); setError(null); setLoading(false);
        onClose();
    }, [onClose]);

    const { icon: FileTypeIcon, color: fileColor, soft: fileSoft } = getFileConfig(invoiceInfo?.file_name);

    const ActionBtn = ({ onClick, icon: Icon, label, primary, disabled }) => (
        <Box
            component="button" type="button"
            onClick={onClick} disabled={disabled}
            sx={{
                display: 'flex', alignItems: 'center', gap: 0.7,
                px: 1.8, py: 0.9, border: `1.5px solid ${primary ? T.accent : T.border}`,
                borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
                bgcolor: primary ? T.accent : T.surface,
                color:   primary ? '#fff'   : T.text,
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem',
                boxShadow: primary ? `0 3px 10px ${T.accent}33` : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor:     disabled ? undefined : primary ? '#1641B8' : T.bg,
                    borderColor: disabled ? undefined : primary ? '#1641B8' : T.accent,
                },
            }}
        >
            {disabled && primary
                ? <CircularProgress size={13} sx={{ color: 'rgba(255,255,255,0.6)' }} />
                : <Icon sx={{ fontSize: 14 }} />
            }
            {disabled && primary ? 'Processing…' : label}
        </Box>
    );

    return (
        <Dialog
            open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px', bgcolor: T.bg,
                    border: `1px solid ${T.border}`,
                    boxShadow: '0 20px 60px rgba(15,31,61,0.15)',
                    overflow: 'hidden',
                },
            }}
        >
            {/* ── Title bar ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ReceiptIcon sx={{ fontSize: 20, color: T.accent }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.97rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Invoice
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {userName}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={handleClose} size="small"
                    sx={{ color: T.muted, bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', '&:hover': { bgcolor: T.roseSoft, color: T.rose, borderColor: T.rose } }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {loading && !invoiceInfo ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                        <CircularProgress size={36} sx={{ color: T.accent }} />
                        <Typography sx={{ fontSize: '0.82rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Loading invoice…
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.amberSoft, border: `1px solid ${T.amber}22` }}>
                        <Typography sx={{ fontSize: '0.85rem', color: T.amber, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {error}
                        </Typography>
                    </Box>
                ) : invoiceInfo ? (
                    <Box>
                        {/* Invoice info card */}
                        <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.surface, border: `1px solid ${T.border}`, mb: 2.5 }}>
                            {/* File name row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: fileSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileTypeIcon sx={{ fontSize: 20, color: fileColor }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {invoiceInfo.file_name}
                                    </Typography>
                                    {/* Available badge */}
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.3, px: 1, py: 0.25, borderRadius: '20px', bgcolor: T.greenSoft, border: `1px solid ${T.green}28` }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.green }} />
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.green, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            Available
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ height: 1, bgcolor: T.border, mb: 2 }} />

                            <Grid container spacing={2.5}>
                                <Grid item xs={6} sm={3}>
                                    <InfoItem label="File Size" value={formatFileSize(invoiceInfo.file_size)} />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <InfoItem
                                        label="Uploaded"
                                        value={invoiceInfo.uploaded_date
                                            ? new Date(invoiceInfo.uploaded_date).toLocaleDateString()
                                            : 'N/A'}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={6}>
                                    <InfoItem label="File Type" value={invoiceInfo.mime_type || 'Unknown'} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Preview section */}
                        {invoiceInfo.mime_type?.includes('image') && invoiceInfo.file_path ? (
                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Preview
                                </Typography>
                                <Box sx={{
                                    border: `1px solid ${T.border}`, borderRadius: '12px',
                                    p: 2, display: 'flex', justifyContent: 'center',
                                    bgcolor: T.surface, minHeight: '100px',
                                }}>
                                    <img
                                        src={`/api${invoiceInfo.file_path}`}
                                        alt="Invoice preview"
                                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }}
                                        onError={handleImageError}
                                        loading="lazy"
                                    />
                                </Box>
                            </Box>
                        ) : invoiceInfo.mime_type?.includes('pdf') && (
                            <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}22`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PdfIcon sx={{ fontSize: 24, color: T.rose, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.83rem', color: T.rose, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    PDF preview is not available inline. Use "Open in tab" to view.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22` }}>
                        <Typography sx={{ fontSize: '0.83rem', color: T.accent, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            No invoice has been uploaded for this user yet.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* ── Actions ── */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1 }}>
                <Box
                    component="button" type="button" onClick={handleClose}
                    sx={{
                        border: `1.5px solid ${T.border}`, borderRadius: '10px',
                        px: 1.8, py: 0.9, cursor: 'pointer',
                        bgcolor: T.bg, color: T.muted, mr: 'auto',
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem',
                        '&:hover': { bgcolor: T.border }, transition: 'background-color 0.15s',
                    }}
                >
                    Close
                </Box>
                {invoiceInfo && (
                    <>
                        <ActionBtn onClick={handleView}     icon={OpenInNewIcon} label="Open in tab" disabled={loading} />
                        <ActionBtn onClick={handleDownload} icon={DownloadIcon}  label="Download"    primary disabled={loading} />
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default InvoiceViewer;