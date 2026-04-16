import React, {useState, useEffect, useCallback} from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Grid, Typography, CircularProgress, IconButton,
} from '@mui/material';
import {
    Download as DownloadIcon, Close as CloseIcon,
    PictureAsPdf as PdfIcon, Image as ImageIcon,
    Description as DocIcon, Receipt as ReceiptIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {adminAPI} from '../../services/api';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const InfoItem = ({label, value}) => (
    <Box>
        <Typography sx={{
            fontSize: '0.67rem',
            fontWeight: 700,
            color: T.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            mb: 0.4,
            fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
            {label}
        </Typography>
        <Typography
            sx={{fontSize: '0.87rem', fontWeight: 600, color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
            {value || '—'}
        </Typography>
    </Box>
);

const getFileConfig = (mimeType) => {
    if (!mimeType) return {icon: ReceiptIcon, color: T.accent, soft: T.accentSoft};
    if (mimeType.includes('pdf')) return {icon: PdfIcon, color: T.rose, soft: T.roseSoft};
    if (mimeType.includes('image')) return {icon: ImageIcon, color: T.accent, soft: T.accentSoft};
    if (mimeType.includes('word')) return {icon: DocIcon, color: T.purple, soft: T.purpleSoft};
    return {icon: ReceiptIcon, color: T.accent, soft: T.accentSoft};
};

// ─────────────────────────────────────────────────────────────────────────────
const InvoiceViewer = ({open, userId, userName, onClose}) => {
    const [loading, setLoading] = useState(false);
    const [invoiceInfo, setInvoiceInfo] = useState(null);
    const [error, setError] = useState(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);

    // Backend returns JSON: { success, url, fileName, mimeType }
    const fetchInvoice = useCallback(async () => {
        if (!userId || !open) return;
        setLoading(true);
        setError(null);
        setFetchAttempted(false);
        try {
            const response = await adminAPI.viewInvoice(userId);
            const body = response.data;   // plain JSON — NOT a Blob

            if (!body?.success || !body?.url) {
                throw new Error(body?.message || 'Failed to get invoice URL');
            }

            setInvoiceInfo({
                file_name: body.fileName || `invoice_${userId}`,
                mime_type: body.mimeType || 'application/octet-stream',
                url: body.url,
            });
        } catch (err) {
            const data = err?.response?.data;
            setError(
                data?.legacy
                    ? 'This invoice was uploaded before cloud storage. The user needs to re-upload it.'
                    : data?.message || err?.message || 'Invoice not found or not uploaded yet'
            );
        } finally {
            setLoading(false);
            setFetchAttempted(true);
        }
    }, [userId, open]);

    useEffect(() => {
        if (open && userId) fetchInvoice();
        return () => {
            setInvoiceInfo(null);
            setError(null);
            setFetchAttempted(false);
        };
    }, [open, userId, fetchInvoice]);

    const handleView = useCallback(() => {
        if (invoiceInfo?.url) {
            // ✅ Construct FULL URL to API backend
            const fullUrl = invoiceInfo.url.startsWith('http')
                ? invoiceInfo.url
                : `${process.env.REACT_APP_API_URL}${invoiceInfo.url}`;
            console.log('📄 Opening invoice URL:', fullUrl);
            window.open(fullUrl, '_blank');
        }
    }, [invoiceInfo]);

    const handleDownload = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminAPI.downloadInvoice(userId);
            const body = response.data;
            if (!body?.success || !body?.url) throw new Error('Failed to get download URL');
            // Create a temp anchor to force download
            const link = document.createElement('a');
            link.href = body.url;
            link.setAttribute('download', body.fileName || `invoice_${userId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download invoice');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const {icon: FileTypeIcon, color: fileColor, soft: fileSoft} = getFileConfig(invoiceInfo?.mime_type);

    const ActionBtn = ({onClick, icon: Icon, label, primary, disabled}) => (
        <Box component="button" type="button" onClick={onClick} disabled={disabled}
             sx={{
                 display: 'flex', alignItems: 'center', gap: 0.7,
                 px: 1.8, py: 0.9, border: `1.5px solid ${primary ? T.accent : T.border}`,
                 borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
                 bgcolor: primary ? T.accent : T.surface, color: primary ? '#fff' : T.text,
                 fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem',
                 boxShadow: primary ? `0 3px 10px ${T.accent}33` : 'none', transition: 'all 0.15s ease',
                 '&:hover': {bgcolor: disabled ? undefined : primary ? '#1641B8' : T.bg},
             }}>
            {disabled && primary ? <CircularProgress size={13} sx={{color: 'rgba(255,255,255,0.6)'}}/> :
                <Icon sx={{fontSize: 14}}/>}
            {disabled && primary ? 'Loading…' : label}
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        bgcolor: T.bg,
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 20px 60px rgba(15,31,61,0.15)',
                        overflow: 'hidden'
                    }
                }}>

            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                bgcolor: T.surface,
                borderBottom: `1px solid ${T.border}`
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Box sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        bgcolor: T.accentSoft,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ReceiptIcon sx={{fontSize: 20, color: T.accent}}/>
                    </Box>
                    <Box>
                        <Typography sx={{
                            fontWeight: 700,
                            fontSize: '0.97rem',
                            color: T.text,
                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}>Invoice</Typography>
                        <Typography sx={{
                            fontSize: '0.72rem',
                            color: T.muted,
                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}>{userName}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"
                            sx={{
                                color: T.muted,
                                bgcolor: T.bg,
                                border: `1px solid ${T.border}`,
                                borderRadius: '8px',
                                '&:hover': {bgcolor: T.roseSoft, color: T.rose, borderColor: T.rose}
                            }}>
                    <CloseIcon sx={{fontSize: 16}}/>
                </IconButton>
            </Box>

            {/* Content */}
            <DialogContent sx={{p: 3}}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 6,
                        gap: 2
                    }}>
                        <CircularProgress size={36} sx={{color: T.accent}}/>
                        <Typography
                            sx={{fontSize: '0.82rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>Loading
                            invoice…</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{p: 2.5, borderRadius: '12px', bgcolor: T.amberSoft, border: `1px solid ${T.amber}22`}}>
                        <Typography sx={{
                            fontSize: '0.85rem',
                            color: T.amber,
                            fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}>{error}</Typography>
                    </Box>
                ) : invoiceInfo ? (
                    <Box>
                        {/* File info card */}
                        <Box sx={{
                            p: 2.5,
                            borderRadius: '12px',
                            bgcolor: T.surface,
                            border: `1px solid ${T.border}`,
                            mb: 2.5
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
                                <Box sx={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '10px',
                                    bgcolor: fileSoft,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <FileTypeIcon sx={{fontSize: 20, color: fileColor}}/>
                                </Box>
                                <Box>
                                    <Typography sx={{
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        color: T.text,
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>{invoiceInfo.file_name}</Typography>
                                    <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        mt: 0.3,
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: '20px',
                                        bgcolor: T.greenSoft,
                                        border: `1px solid ${T.green}28`
                                    }}>
                                        <Box sx={{width: 6, height: 6, borderRadius: '50%', bgcolor: T.green}}/>
                                        <Typography sx={{
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            color: T.green,
                                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                                        }}>Available</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{height: 1, bgcolor: T.border, mb: 2}}/>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12}><InfoItem label="File Type"
                                                             value={invoiceInfo.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}/></Grid>
                            </Grid>
                        </Box>

                        {/* Preview */}
                        {invoiceInfo.mime_type?.includes('image') ? (
                            <Box>
                                <Typography sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: T.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    mb: 1.2,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                }}>Preview</Typography>
                                <Box sx={{
                                    border: `1px solid ${T.border}`,
                                    borderRadius: '12px',
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    bgcolor: T.surface,
                                    maxHeight: 400,
                                    overflow: 'auto'
                                }}>
                                    <img src={invoiceInfo.url} alt="Invoice preview" style={{
                                        maxWidth: '100%',
                                        maxHeight: '380px',
                                        objectFit: 'contain',
                                        borderRadius: '8px'
                                    }}/>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{
                                p: 3,
                                borderRadius: '12px',
                                bgcolor: '#0F1F3D',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                <Box sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '14px',
                                    bgcolor: 'rgba(220,38,38,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <PdfIcon sx={{fontSize: 30, color: '#ef4444'}}/>
                                </Box>
                                <Box sx={{textAlign: 'center'}}>
                                    <Typography sx={{
                                        fontWeight: 700,
                                        fontSize: '0.92rem',
                                        color: '#fff',
                                        mb: 0.5,
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>{invoiceInfo.file_name}</Typography>
                                    <Typography sx={{
                                        fontSize: '0.78rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>Click below to open in a new tab</Typography>
                                </Box>
                                <Box component="button" type="button" onClick={handleView}
                                     sx={{
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: 0.8,
                                         px: 2.5,
                                         py: 1.1,
                                         borderRadius: '10px',
                                         bgcolor: T.accent,
                                         color: '#fff',
                                         border: 'none',
                                         cursor: 'pointer',
                                         fontFamily: 'Plus Jakarta Sans, sans-serif',
                                         fontWeight: 700,
                                         fontSize: '0.83rem',
                                         boxShadow: `0 4px 14px ${T.accent}44`
                                     }}>
                                    <OpenInNewIcon sx={{fontSize: 15}}/>
                                    Open in new tab
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : fetchAttempted ? (
                    <Box sx={{p: 2.5, borderRadius: '12px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22`}}>
                        <Typography sx={{
                            fontSize: '0.83rem',
                            color: T.accent,
                            fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}>No invoice has been uploaded for this user yet.</Typography>
                    </Box>
                ) : null}
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{px: 3, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1}}>
                <Box component="button" type="button" onClick={onClose}
                     sx={{
                         border: `1.5px solid ${T.border}`,
                         borderRadius: '10px',
                         px: 1.8,
                         py: 0.9,
                         cursor: 'pointer',
                         bgcolor: T.bg,
                         color: T.muted,
                         mr: 'auto',
                         fontFamily: 'Plus Jakarta Sans, sans-serif',
                         fontWeight: 600,
                         fontSize: '0.82rem',
                         '&:hover': {bgcolor: T.border},
                         transition: 'background-color 0.15s'
                     }}>
                    Close
                </Box>
                {invoiceInfo && (
                    <>
                        <ActionBtn onClick={handleView} icon={OpenInNewIcon} label="Open in tab" disabled={loading}/>
                        <ActionBtn onClick={handleDownload} icon={DownloadIcon} label="Download" primary
                                   disabled={loading}/>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default InvoiceViewer;