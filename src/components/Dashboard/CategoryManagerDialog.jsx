import React, { useState } from 'react';
import {
    Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControlLabel, IconButton, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4', text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF', green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7', rose: '#DC2626', roseSoft: '#FEE2E2',
};

const BLANK = { name: '', description: '', requires_hardware_details: true, sort_order: '' };

// Admins group the catalogue into categories here. A category with items cannot be deleted (switch it off
// instead: it, and its items, disappear for clients). "Needs model and manufacturer" decides whether items in it
// must have those details (phones, laptops) or not (a data package, a service).
const CategoryManagerDialog = ({ open, categories, onClose, onChanged }) => {
    const { success, error: toastError } = useToast();
    const [form, setForm] = useState(null);          // null = not editing; { id?, name, ... } = adding or editing
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const fail = (err, fallback) => toastError(err.response?.data?.message || fallback, 'Categories');

    const startAdd = () => setForm({ ...BLANK });
    const startEdit = (c) => setForm({
        id: c.category_id, name: c.name, description: c.description || '',
        requires_hardware_details: c.requires_hardware_details, sort_order: c.sort_order,
    });

    const save = async () => {
        if (!form.name.trim()) { toastError('Please give the category a name.', 'Name Required'); return; }
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(), description: form.description.trim() || null,
                requires_hardware_details: form.requires_hardware_details,
                ...(form.sort_order === '' ? {} : { sort_order: parseInt(form.sort_order, 10) }),
            };
            const res = form.id ? await deviceAPI.updateCategory(form.id, body) : await deviceAPI.createCategory(body);
            success(res.data?.message || 'Saved.', 'Category Saved');
            setForm(null);
            onChanged();
        } catch (err) {
            fail(err, 'The category could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (c) => {
        setBusyId(c.category_id);
        try {
            await deviceAPI.updateCategory(c.category_id, { is_active: !c.is_active });
            success(c.is_active ? `"${c.name}" is now hidden from clients.` : `"${c.name}" is visible to clients again.`, 'Category Updated');
            onChanged();
        } catch (err) { fail(err, 'The category could not be updated.'); } finally { setBusyId(null); }
    };

    const remove = async (c) => {
        if (!window.confirm(`Delete the category "${c.name}"?`)) return;
        setBusyId(c.category_id);
        try {
            const res = await deviceAPI.deleteCategory(c.category_id);
            success(res.data?.message || 'Deleted.', 'Category Deleted');
            onChanged();
        } catch (err) { fail(err, 'The category could not be deleted.'); } finally { setBusyId(null); }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}` }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: T.text }}>Manage categories</Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: T.bg, pt: 2.5 }}>
                <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 2, lineHeight: 1.6 }}>
                    Categories group what clients can apply for: phones, tablets, laptops, data packages and any other service.
                    Switch a category off to hide it and its items from clients without deleting anything.
                </Typography>

                {form && (
                    <Box sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: T.surface, border: `1.5px solid ${T.accent}55` }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', mb: 1.4, color: T.text }}>
                            {form.id ? 'Edit category' : 'New category'}
                        </Typography>
                        <TextField label="Name" size="small" fullWidth required value={form.name} autoFocus
                                   onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mb: 1.5 }} />
                        <TextField label="Description" size="small" fullWidth value={form.description}
                                   onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mb: 1.5 }} />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControlLabel
                                control={<Switch checked={form.requires_hardware_details}
                                                 onChange={(e) => setForm({ ...form, requires_hardware_details: e.target.checked })} />}
                                label={<Typography sx={{ fontSize: '0.8rem' }}>Items need a model and manufacturer</Typography>} />
                            <TextField label="Order" size="small" type="number" value={form.sort_order} sx={{ width: 100 }}
                                       onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
                            <Button onClick={() => setForm(null)} disabled={saving} sx={{ textTransform: 'none', color: T.muted }}>Cancel</Button>
                            <Button onClick={save} variant="contained" disabled={saving}
                                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: T.accent, boxShadow: 'none' }}>
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        </Box>
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {categories.map((c) => (
                        <Box key={c.category_id} data-testid={`category-${c.category_id}`} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.2, p: 1.4, borderRadius: '12px',
                            bgcolor: T.surface, border: `1px solid ${T.border}`, opacity: c.is_active ? 1 : 0.65,
                        }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.text }}>{c.name}</Typography>
                                    <Chip size="small" label={`${c.total_items} item${c.total_items === 1 ? '' : 's'}`}
                                          sx={{ height: 20, fontSize: '0.68rem', bgcolor: T.accentSoft, color: T.accent, fontWeight: 700 }} />
                                    {!c.requires_hardware_details && (
                                        <Chip size="small" label="No hardware details" sx={{ height: 20, fontSize: '0.68rem', bgcolor: T.greenSoft, color: T.green }} />
                                    )}
                                    {!c.is_active && (
                                        <Chip size="small" label="Hidden from clients" sx={{ height: 20, fontSize: '0.68rem', bgcolor: T.amberSoft, color: T.amber }} />
                                    )}
                                </Box>
                                {c.description && <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 0.2 }}>{c.description}</Typography>}
                            </Box>
                            {busyId === c.category_id ? <CircularProgress size={18} /> : (
                                <>
                                    <Tooltip title={c.is_active ? 'Hide from clients' : 'Show to clients'}>
                                        <Switch size="small" checked={c.is_active} onChange={() => toggleActive(c)}
                                                slotProps={{ input: { role: 'switch', 'aria-label': `${c.name} visible to clients` } }} />
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                                    </Tooltip>
                                    <Tooltip title={c.total_items > 0 ? 'Move or remove its items first' : 'Delete'}>
                                        <span>
                                            <IconButton size="small" disabled={c.total_items > 0} onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${T.border}`, justifyContent: 'space-between' }}>
                <Button startIcon={<AddIcon />} onClick={startAdd} disabled={!!form} sx={{ textTransform: 'none', fontWeight: 700, color: T.accent }}>
                    Add category
                </Button>
                <Button onClick={onClose} sx={{ textTransform: 'none', color: T.muted }}>Done</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CategoryManagerDialog;
