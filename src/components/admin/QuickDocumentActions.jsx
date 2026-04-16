import React, {useState} from 'react';
import {Box, Typography, CircularProgress} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import {adminAPI} from '../../services/api';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

const Toast = ({msg, type, onClose}) => {
    const colors = {
        success: {bg: T.greenSoft, color: T.green},
        error: {bg: T.roseSoft, color: T.rose},
        info: {bg: T.accentSoft, color: T.accent},
    };
    const {bg, color} = colors[type] || colors.info;
    return (
        <Box sx={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            p: 1.8, borderRadius: '12px', bgcolor: bg,
            border: `1px solid ${color}28`,
            boxShadow: '0 8px 24px rgba(15,31,61,0.12)',
            display: 'flex', alignItems: 'center', gap: 1.5,
            animation: 'fadeUp 0.25s ease-out', minWidth: 240,
        }}>
            <Typography sx={{
                flex: 1, fontSize: '0.82rem', fontWeight: 600, color,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{msg}</Typography>
            <Box component="button" type="button" onClick={onClose} sx={{
                border: 'none', bgcolor: 'transparent', cursor: 'pointer', color,
                fontSize: '0.8rem', p: 0,
            }}>✕</Box>
        </Box>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   Props:
     documentId    — real document_id for regular docs; -1 for invoices
     fileName      — display name
     documentType  — e.g. 'ID', 'Payslip', 'Invoice'
     documentStatus
     isInvoice     — boolean; true when this row is an invoice
     userId        — required when isInvoice=true
     userName      — optional display name
───────────────────────────────────────────────────────────────────────── */
const QuickDocumentActions = ({
                                  documentId, fileName, documentType, documentStatus,
                                  isInvoice, userId, userName,
                              }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3000);
    };

    const handleMenuOpen = (e) => {
        setMenuAnchor(e.currentTarget);
        setMenuOpen(true);
    };
    const handleMenuClose = () => setMenuOpen(false);

    // ── View — open window BEFORE the await so browser treats it as a direct
    //           user-gesture and doesn't block it as a popup.
    const handleView = async () => {
        handleMenuClose();

        // ✅ Open the tab synchronously inside the click handler (before any await)
        const newTab = window.open('', '_blank');
        if (!newTab) {
            showToast('Popup blocked — please allow popups for this site.', 'error');
            return;
        }

        // Show a simple loading message while the blob loads
        newTab.document.write(
            '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;' +
            'height:100vh;font-family:sans-serif;background:#0F1F3D;color:#fff;font-size:1rem;">' +
            'Loading document…</body></html>'
        );

        try {
            setLoading(true);
            // api.js already unwraps .data — we get a Blob directly
            const blob = isInvoice
                ? await adminAPI.viewInvoice(userId)
                : await adminAPI.viewDocument(documentId);

            const url = URL.createObjectURL(blob);
            newTab.location.href = url; // ✅ Navigate the already-open tab to the blob
        } catch (error) {
            newTab.close();
            showToast(error?.response?.data?.message || 'Failed to open document.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Download
    const handleDownload = async () => {
        handleMenuClose();
        try {
            setLoading(true);
            // api.js already unwraps .data — we get a Blob directly
            const blob = isInvoice
                ? await adminAPI.downloadInvoice(userId)
                : await adminAPI.downloadDocument(documentId);

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `document_${documentId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            showToast('Downloaded successfully', 'success');
        } catch (error) {
            showToast(error?.response?.data?.message || 'Failed to download.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
            `}</style>

            {/* Trigger button */}
            <Box
                component="button" type="button"
                onClick={handleMenuOpen} disabled={loading}
                sx={{
                    width: 30, height: 30,
                    border: `1px solid ${T.border}`,
                    borderRadius: '8px', bgcolor: T.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: isInvoice ? T.accent : T.muted,
                    transition: 'all 0.15s ease',
                    '&:hover': {bgcolor: T.accentSoft, color: T.accent, borderColor: T.accent},
                }}
            >
                {loading
                    ? <CircularProgress size={13} sx={{color: T.accent}}/>
                    : <MoreVertIcon sx={{fontSize: 16}}/>
                }
            </Box>

            {/* Dropdown menu */}
            {menuOpen && menuAnchor && (
                <>
                    <Box onClick={handleMenuClose}
                         sx={{position: 'fixed', inset: 0, zIndex: 998}}/>
                    <Box sx={{
                        position: 'fixed',
                        top: menuAnchor.getBoundingClientRect().bottom + 6,
                        left: menuAnchor.getBoundingClientRect().left,
                        zIndex: 999,
                        bgcolor: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: '12px', overflow: 'hidden',
                        boxShadow: '0 12px 32px rgba(15,31,61,0.12)',
                        minWidth: 180, animation: 'fadeUp 0.18s ease-out',
                    }}>
                        {[
                            {
                                icon: ViewIcon,
                                label: `View ${isInvoice ? 'Invoice' : 'Document'}`,
                                onClick: handleView,
                            },
                            {
                                icon: DownloadIcon,
                                label: `Download ${isInvoice ? 'Invoice' : 'Document'}`,
                                onClick: handleDownload,
                            },
                        ].map(({icon: Icon, label, onClick}) => (
                            <Box
                                key={label}
                                component="button" type="button"
                                onClick={onClick}
                                sx={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 1.2,
                                    px: 1.8, py: 1.1, border: 'none', bgcolor: 'transparent',
                                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: '0.83rem', fontWeight: 600, color: T.text,
                                    '&:hover': {bgcolor: T.bg},
                                    transition: 'background-color 0.1s',
                                }}
                            >
                                <Icon sx={{fontSize: 15, color: T.muted}}/>
                                {label}
                            </Box>
                        ))}
                    </Box>
                </>
            )}

            {toast && (
                <Toast msg={toast.message} type={toast.type} onClose={() => setToast(null)}/>
            )}
        </>
    );
};

export default QuickDocumentActions;