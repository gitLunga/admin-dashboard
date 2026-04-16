import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Grid, Typography, CircularProgress,
    IconButton, Divider,
} from '@mui/material';
import {
    Download as DownloadIcon, Close as CloseIcon,
    PictureAsPdf as PdfIcon, Image as ImageIcon,
    Description as DocIcon, InsertDriveFile as FileIcon,
    CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
    Schedule as ScheduleIcon, OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyan: '#0891B2', cyanSoft: '#CFFAFE',
};

const getFileConfig = (mimeType) => {
    if (!mimeType) return { icon: FileIcon, color: T.muted, soft: T.border };
    if (mimeType.includes('pdf'))   return { icon: PdfIcon,   color: T.rose,   soft: T.roseSoft   };
    if (mimeType.includes('image')) return { icon: ImageIcon,  color: T.cyan,   soft: T.cyanSoft   };
    if (mimeType.includes('word'))  return { icon: DocIcon,    color: T.purple, soft: T.purpleSoft };
    return { icon: FileIcon, color: T.accent, soft: T.accentSoft };
};

const statusCfg = {
    Pending:  { icon: ScheduleIcon,    color: T.amber, soft: T.amberSoft, label: 'Pending'  },
    Approved: { icon: CheckCircleIcon, color: T.green, soft: T.greenSoft, label: 'Approved' },
    Rejected: { icon: CancelIcon,      color: T.rose,  soft: T.roseSoft,  label: 'Rejected' },
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

// ─────────────────────────────────────────────────────────────────────────────
const DocumentViewer = ({ open, documentId, documentInfo: docMeta, onClose, onStatusChange }) => {
    const [loading,       setLoading]       = useState(false);
    const [docInfo,       setDocInfo]       = useState(null);   // { file_name, mime_type, url (blob) }
    const [error,         setError]         = useState(null);
    const [fetchAttempted,setFetchAttempted]= useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    // Fetch document blob and create a local object URL for preview
    const fetchDocument = useCallback(async () => {
        if (!documentId || !open) return;
        setLoading(true);
        setError(null);
        setFetchAttempted(false);

        try {
            // api.js already unwraps .data — we get a Blob directly
            const blob      = await adminAPI.viewDocument(documentId);
            const objectUrl = URL.createObjectURL(blob);

            setDocInfo({
                file_name: docMeta?.file_name || `document_${documentId}`,
                mime_type: blob.type || docMeta?.mime_type || 'application/octet-stream',
                url:       objectUrl,
            });
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load document');
        } finally {
            setLoading(false);
            setFetchAttempted(true);
        }
    }, [documentId, open, docMeta]);

    useEffect(() => {
        if (open && documentId) fetchDocument();
        return () => {
            setDocInfo(null);
            setError(null);
            setFetchAttempted(false);
        };
    }, [open, documentId, fetchDocument]);

    // ── Open in new tab ──────────────────────────────────────────────────────
    // If we already have the blob URL (from the preview fetch), use it directly.
    // Otherwise fetch again using the same popup-before-await pattern.
    const handleView = useCallback(() => {
        if (docInfo?.url) {
            // ✅ Blob URL already available — open directly (synchronous, no popup risk)
            window.open(docInfo.url, '_blank');
            return;
        }

        // Fallback: blob not yet ready — open tab first, then load
        const newTab = window.open('', '_blank');
        if (!newTab) return;

        newTab.document.write(
            '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;' +
            'height:100vh;font-family:sans-serif;background:#0F1F3D;color:#fff;font-size:1rem;">' +
            'Loading document…</body></html>'
        );

        setLoading(true);
        adminAPI.viewDocument(documentId)
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                newTab.location.href = url;
            })
            .catch(() => newTab.close())
            .finally(() => setLoading(false));
    }, [docInfo, documentId]);

    // ── Download ─────────────────────────────────────────────────────────────
    const handleDownload = useCallback(async () => {
        try {
            setLoading(true);
            // api.js already unwraps .data — we get a Blob directly
            const blob = await adminAPI.downloadDocument(documentId);
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', docMeta?.file_name || `document_${documentId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download document');
        } finally {
            setLoading(false);
        }
    }, [documentId, docMeta]);

    const handleStatusChange = useCallback(async (newStatus) => {
        try {
            setStatusLoading(true);
            await adminAPI.updateDocumentStatus(documentId, newStatus, '');
            if (onStatusChange) onStatusChange(documentId, newStatus);
        } catch (err) {
            setError('Failed to update document status');
        } finally {
            setStatusLoading(false);
        }
    }, [documentId, onStatusChange]);

    const { icon: FileTypeIcon, color: fileColor, soft: fileSoft } = getFileConfig(docInfo?.mime_type);
    const status  = docMeta?.status || 'Pending';
    const statusC = statusCfg[status] || statusCfg.Pending;
    const StatusIcon = statusC.icon;

    const ActionBtn = ({ onClick, icon: Icon, label, primary, danger, disabled }) => {
        const bg    = primary ? T.accent : danger ? T.rose : T.surface;
        const color = primary || danger ? '#fff' : T.text;
        return (
            <Box component="button" type="button" onClick={onClick} disabled={disabled}
                 sx={{
                     display: 'flex', alignItems: 'center', gap: 0.7,
                     px: 1.8, py: 0.9,
                     border: `1.5px solid ${primary ? T.accent : danger ? T.rose : T.border}`,
                     borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
                     bgcolor: bg, color, opacity: disabled ? 0.6 : 1,
                     fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem',
                     transition: 'all 0.15s ease',
                 }}>
                {disabled
                    ? <CircularProgress size={13} sx={{ color: primary || danger ? 'rgba(255,255,255,0.6)' : T.accent }} />
                    : <Icon sx={{ fontSize: 14 }} />
                }
                {disabled ? 'Loading…' : label}
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px', bgcolor: T.bg,
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 20px 60px rgba(15,31,61,0.15)',
                        overflow: 'hidden',
                    },
                }}>

            {/* Header */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: '10px',
                        bgcolor: fileSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileTypeIcon sx={{ fontSize: 20, color: fileColor }} />
                    </Box>
                    <Box>
                        <Typography sx={{
                            fontWeight: 700, fontSize: '0.95rem', color: T.text,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>
                            {docMeta?.document_type || 'Document'} Viewer
                        </Typography>
                        <Typography sx={{
                            fontSize: '0.75rem', color: T.muted,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>
                            {docMeta?.file_name || `Document #${documentId}`}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"
                            sx={{ color: T.muted, '&:hover': { bgcolor: T.bg } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3, bgcolor: T.bg }}>
                {loading && !docInfo ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', py: 6, gap: 2,
                    }}>
                        <CircularProgress sx={{ color: T.accent }} size={36} />
                        <Typography sx={{
                            fontSize: '0.85rem', color: T.muted,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>Loading document…</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{
                        p: 2.5, borderRadius: '12px', bgcolor: T.roseSoft,
                        border: `1px solid ${T.rose}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Typography sx={{
                            fontSize: '0.83rem', color: T.rose, fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>{error}</Typography>
                        <Box component="button" type="button" onClick={fetchDocument}
                             sx={{
                                 display: 'flex', alignItems: 'center', gap: 0.5,
                                 px: 1.5, py: 0.6, border: `1px solid ${T.rose}44`,
                                 borderRadius: '8px', bgcolor: 'transparent', cursor: 'pointer',
                                 color: T.rose, fontSize: '0.78rem', fontWeight: 600,
                                 fontFamily: 'Plus Jakarta Sans, sans-serif',
                             }}>
                            <RefreshIcon sx={{ fontSize: 14 }} /> Retry
                        </Box>
                    </Box>
                ) : docInfo ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                        {/* Document info card */}
                        <Box sx={{
                            p: 2.5, borderRadius: '14px', bgcolor: T.surface,
                            border: `1px solid ${T.border}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: '10px', bgcolor: fileSoft,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <FileTypeIcon sx={{ fontSize: 22, color: fileColor }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{
                                            fontWeight: 700, fontSize: '0.9rem', color: T.text,
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        }}>{docInfo.file_name}</Typography>
                                        <Box sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                            mt: 0.3, px: 1, py: 0.25, borderRadius: '20px',
                                            bgcolor: T.greenSoft, border: `1px solid ${T.green}28`,
                                        }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.green }} />
                                            <Typography sx={{
                                                fontSize: '0.68rem', fontWeight: 700, color: T.green,
                                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            }}>Available</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Status badge */}
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.6,
                                    px: 1.2, py: 0.5, borderRadius: '20px',
                                    bgcolor: statusC.soft, border: `1px solid ${statusC.color}28`,
                                }}>
                                    <StatusIcon sx={{ fontSize: 13, color: statusC.color }} />
                                    <Typography sx={{
                                        fontSize: '0.72rem', fontWeight: 700, color: statusC.color,
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    }}>{statusC.label}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2.5}>
                                <Grid item xs={6}>
                                    <InfoItem label="Document Type" value={docMeta?.document_type} />
                                </Grid>
                                <Grid item xs={6}>
                                    <InfoItem
                                        label="File Type"
                                        value={docInfo.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                                    />
                                </Grid>
                                {docMeta?.uploaded_at && (
                                    <Grid item xs={6}>
                                        <InfoItem
                                            label="Uploaded"
                                            value={new Date(docMeta.uploaded_at).toLocaleDateString()}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        {/* Status actions — only for Pending docs */}
                        {status === 'Pending' && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                <ActionBtn
                                    onClick={() => handleStatusChange('Approved')}
                                    icon={CheckCircleIcon} label="Approve"
                                    primary disabled={statusLoading}
                                />
                                <ActionBtn
                                    onClick={() => handleStatusChange('Rejected')}
                                    icon={CancelIcon} label="Reject"
                                    danger disabled={statusLoading}
                                />
                            </Box>
                        )}

                        {/* Preview area */}
                        {docInfo.mime_type?.includes('image') ? (
                            <Box>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>Preview</Typography>
                                <Box sx={{
                                    border: `1px solid ${T.border}`, borderRadius: '12px',
                                    p: 2, display: 'flex', justifyContent: 'center',
                                    bgcolor: T.surface, maxHeight: 420, overflow: 'auto',
                                }}>
                                    <img
                                        src={docInfo.url}
                                        alt={docInfo.file_name}
                                        style={{
                                            maxWidth: '100%', maxHeight: '400px',
                                            objectFit: 'contain', borderRadius: '8px',
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            /* PDF / other — show open-in-tab card */
                            <Box sx={{
                                p: 3, borderRadius: '12px', bgcolor: '#0F1F3D',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            }}>
                                <Box sx={{
                                    width: 56, height: 56, borderRadius: '14px',
                                    bgcolor: 'rgba(220,38,38,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <PdfIcon sx={{ fontSize: 30, color: '#ef4444' }} />
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{
                                        fontWeight: 700, fontSize: '0.92rem', color: '#fff', mb: 0.5,
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    }}>{docInfo.file_name}</Typography>
                                    <Typography sx={{
                                        fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    }}>Click below to open in a new tab</Typography>
                                </Box>
                                <Box
                                    component="button" type="button"
                                    onClick={handleView}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.8,
                                        px: 2.5, py: 1.1, borderRadius: '10px',
                                        bgcolor: T.accent, color: '#fff',
                                        border: 'none', cursor: 'pointer',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        fontWeight: 700, fontSize: '0.83rem',
                                        boxShadow: `0 4px 14px ${T.accent}44`,
                                    }}>
                                    <OpenInNewIcon sx={{ fontSize: 15 }} />
                                    Open in new tab
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : fetchAttempted ? (
                    <Box sx={{
                        p: 2.5, borderRadius: '12px', bgcolor: T.accentSoft,
                        border: `1px solid ${T.accent}22`,
                    }}>
                        <Typography sx={{
                            fontSize: '0.83rem', color: T.accent, fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>No file has been uploaded for this document yet.</Typography>
                    </Box>
                ) : null}
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{
                px: 3, py: 2, bgcolor: T.surface,
                borderTop: `1px solid ${T.border}`, gap: 1,
            }}>
                <Box component="button" type="button" onClick={onClose}
                     sx={{
                         border: `1.5px solid ${T.border}`, borderRadius: '10px',
                         px: 1.8, py: 0.9, cursor: 'pointer', bgcolor: T.bg, color: T.muted,
                         mr: 'auto', fontFamily: 'Plus Jakarta Sans, sans-serif',
                         fontWeight: 600, fontSize: '0.82rem',
                         '&:hover': { bgcolor: T.border }, transition: 'background-color 0.15s',
                     }}>
                    Close
                </Box>
                {docInfo && (
                    <>
                        <ActionBtn
                            onClick={handleView} icon={OpenInNewIcon}
                            label="Open in tab" disabled={loading}
                        />
                        <ActionBtn
                            onClick={handleDownload} icon={DownloadIcon}
                            label="Download" primary disabled={loading}
                        />
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DocumentViewer;