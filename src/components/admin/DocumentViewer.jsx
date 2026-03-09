import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Grid, Typography, CircularProgress, IconButton,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    Image as ImageIcon,
    Description,
    OpenInNew as OpenInNewIcon,
    InsertDriveFile as FileIcon,
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

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
    const map = {
        Verified: { color: T.green, soft: T.greenSoft },
        Rejected: { color: T.rose,  soft: T.roseSoft  },
        Pending:  { color: T.amber, soft: T.amberSoft  },
    };
    const { color, soft } = map[status] || { color: T.muted, soft: T.bg };
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6,
            px: 1.1, py: 0.35, borderRadius: '20px',
            bgcolor: soft, border: `1px solid ${color}28`,
        }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {status || 'Unknown'}
            </Typography>
        </Box>
    );
};

/* ── Info row ── */
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
            fontFamily: value && /^\d/.test(String(value)) ? 'JetBrains Mono, monospace' : 'Plus Jakarta Sans, sans-serif',
        }}>
            {value || '—'}
        </Typography>
    </Box>
);

/* ── File type config ── */
const getFileConfig = (fileName) => {
    if (!fileName) return { icon: FileIcon, color: T.muted, soft: T.bg, label: 'File' };
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')                                   return { icon: PdfIcon,   color: T.rose,   soft: T.roseSoft,   label: 'PDF'   };
    if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return { icon: ImageIcon, color: T.accent, soft: T.accentSoft, label: 'Image' };
    if (['doc','docx'].includes(ext))                    return { icon: DocIcon,   color: T.purple, soft: T.purpleSoft, label: 'Word'  };
    return { icon: Description, color: T.muted, soft: T.bg, label: 'File' };
};

/* ── Helpers ── */
const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const formatDocumentType = (type) => {
    if (!type) return 'Document';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

/* ═══════════════════════════════ COMPONENT ═══════════════════════════════ */
const DocumentViewer = ({ open, documentId, fileName, documentType, documentStatus, onClose }) => {

    /* ── All state & refs unchanged ── */
    const [loading,        setLoading]        = useState(false);
    const [documentInfo,   setDocumentInfo]   = useState(null);
    const [error,          setError]          = useState(null);
    const [blobUrl,        setBlobUrl]        = useState(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const urlRef = useRef(null);

    /* ── fetchDocument — API call unchanged ── */
    const fetchDocument = useCallback(async () => {
        if (!documentId || !open) return null;
        try {
            setLoading(true); setError(null); setFetchAttempted(false);
            console.log('📄 Fetching document:', documentId);

            const response = await adminAPI.viewDocument(documentId, { responseType: 'blob' });

            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream',
            });
            const url = URL.createObjectURL(blob);
            if (urlRef.current) { try { URL.revokeObjectURL(urlRef.current); } catch {} }
            urlRef.current = url;
            setBlobUrl(url);
            setDocumentInfo({
                file_name:       fileName || 'document.pdf',
                document_type:   documentType,
                document_status: documentStatus,
                mime_type:       response.headers['content-type'] || 'application/octet-stream',
                file_size:       response.headers['content-length'] || blob.size,
            });
            console.log('✅ Document loaded successfully');
            return url;
        } catch (err) {
            console.error('❌ Error fetching document:', err);
            setError(err.message || 'Failed to load document');
            return null;
        } finally { setLoading(false); setFetchAttempted(true); }
    }, [documentId, open, fileName, documentType, documentStatus]);

    useEffect(() => {
        if (open && documentId) { fetchDocument(); }
        return () => {
            if (urlRef.current) { try { URL.revokeObjectURL(urlRef.current); } catch {} urlRef.current = null; }
            setBlobUrl(null); setDocumentInfo(null); setError(null); setFetchAttempted(false);
        };
    }, [open, documentId, fetchDocument]);

    /* ── handleDownload — API call unchanged ── */
    const handleDownload = async () => {
        try {
            setLoading(true);
            if (blobUrl) {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', fileName || 'document.pdf');
                document.body.appendChild(link); link.click(); link.remove();
            } else {
                const response = await adminAPI.downloadDocument(documentId, { responseType: 'blob' });
                const url  = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href  = url;
                link.setAttribute('download', fileName || 'document.pdf');
                document.body.appendChild(link); link.click(); link.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download document');
        } finally { setLoading(false); }
    };

    const handleView = () => {
        if (blobUrl) { window.open(blobUrl, '_blank'); }
        else         { setError('Document not ready for viewing'); }
    };

    /* ─── Render ─── */
    const { icon: FileTypeIcon, color: fileColor, soft: fileSoft } = getFileConfig(fileName);

    const ActionBtn = ({ onClick, icon: Icon, label, primary, disabled }) => (
        <Box
            component="button" type="button"
            onClick={onClick} disabled={disabled}
            sx={{
                display: 'flex', alignItems: 'center', gap: 0.7,
                px: 1.8, py: 0.9, border: `1.5px solid ${primary ? T.accent : T.border}`,
                borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
                bgcolor: primary ? T.accent : T.surface,
                color:   primary ? '#fff'    : T.text,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 600, fontSize: '0.82rem',
                boxShadow: primary ? `0 3px 10px ${T.accent}33` : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: disabled ? undefined : primary ? '#1641B8' : T.bg,
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
            open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px', bgcolor: T.bg,
                    border: `1px solid ${T.border}`,
                    boxShadow: '0 20px 60px rgba(15,31,61,0.15)',
                    overflow: 'hidden',
                },
            }}
        >
            {/* ── Custom title bar ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: fileSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTypeIcon sx={{ fontSize: 20, color: fileColor }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.97rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {formatDocumentType(documentType)}
                        </Typography>
                        {fileName && (
                            <Typography sx={{ fontSize: '0.72rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {fileName}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton
                    onClick={onClose} size="small"
                    sx={{ color: T.muted, bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', '&:hover': { bgcolor: T.roseSoft, color: T.rose, borderColor: T.rose } }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                        <CircularProgress size={36} sx={{ color: T.accent }} />
                        <Typography sx={{ fontSize: '0.82rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Loading document…
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}22` }}>
                        <Typography sx={{ fontSize: '0.85rem', color: T.rose, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {error}
                        </Typography>
                        <Box component="button" type="button" onClick={() => setError(null)}
                             sx={{ mt: 1, border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontSize: '0.76rem', color: T.rose, fontFamily: 'Plus Jakarta Sans, sans-serif', p: 0, textDecoration: 'underline' }}>
                            Dismiss
                        </Box>
                    </Box>
                ) : documentInfo ? (
                    <Box>
                        {/* File info card */}
                        <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.surface, border: `1px solid ${T.border}`, mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.87rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    File Information
                                </Typography>
                                <StatusBadge status={documentInfo.document_status} />
                            </Box>
                            <Box sx={{ height: 1, bgcolor: T.border, mb: 2 }} />
                            <Grid container spacing={2.5}>
                                <Grid item xs={6} sm={4}>
                                    <InfoItem label="Document Type" value={formatDocumentType(documentInfo.document_type)} />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <InfoItem label="File Size" value={formatFileSize(documentInfo.file_size)} />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <InfoItem label="File Type" value={documentInfo.mime_type?.split('/')[1]?.toUpperCase()} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Preview area */}
                        {blobUrl && documentInfo.mime_type?.includes('image') ? (
                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Preview
                                </Typography>
                                <Box sx={{
                                    border: `1px solid ${T.border}`, borderRadius: '12px',
                                    p: 2, display: 'flex', justifyContent: 'center',
                                    bgcolor: T.surface, maxHeight: 400, overflow: 'auto',
                                }}>
                                    <img
                                        src={blobUrl} alt="Document preview"
                                        style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                </Box>
                            </Box>
                        ) : blobUrl && documentInfo.mime_type?.includes('pdf') ? (
                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    PDF Preview
                                </Typography>
                                <Box sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', height: 420, overflow: 'hidden' }}>
                                    <iframe
                                        src={`${blobUrl}#toolbar=0&navpanes=0`}
                                        title="PDF Preview" width="100%" height="100%"
                                        style={{ border: 'none' }}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22` }}>
                                <Typography sx={{ fontSize: '0.83rem', color: T.accent, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    This file type cannot be previewed inline. Use "View" to open in a new tab.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : fetchAttempted ? (
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.amberSoft, border: `1px solid ${T.amber}22` }}>
                        <Typography sx={{ fontSize: '0.83rem', color: T.amber, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            No document information available.
                        </Typography>
                    </Box>
                ) : null}
            </DialogContent>

            {/* ── Actions ── */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1 }}>
                <Box
                    component="button" type="button" onClick={onClose}
                    sx={{
                        border: `1.5px solid ${T.border}`, borderRadius: '10px',
                        px: 1.8, py: 0.9, cursor: 'pointer',
                        bgcolor: T.bg, color: T.muted,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem',
                        mr: 'auto',
                        '&:hover': { bgcolor: T.border }, transition: 'background-color 0.15s',
                    }}
                >
                    Close
                </Box>

                {documentInfo && blobUrl && (
                    <>
                        <ActionBtn onClick={handleView}     icon={OpenInNewIcon}  label="Open in tab" disabled={loading} />
                        <ActionBtn onClick={handleDownload} icon={DownloadIcon}   label="Download"    primary disabled={loading} />
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DocumentViewer;