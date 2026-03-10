import React, {useState} from 'react';
import {Box, Typography} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    Visibility as ViewIcon,
    PersonOff as EmptyIcon,
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {format} from 'date-fns';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const StatusBadge = ({status}) => {
    const map = {
        Verified: {color: T.green, soft: T.greenSoft, label: 'Verified'},
        Profile_Completed: {color: T.accent, soft: T.accentSoft, label: 'Completed'},
        Pending: {color: T.amber, soft: T.amberSoft, label: 'Pending'},
        Rejected: {color: T.rose, soft: T.roseSoft, label: 'Rejected'},
    };
    const {color, soft, label = status} = map[status] || {color: T.muted, soft: T.bg, label: status};
    return (
        <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.3,
            borderRadius: '20px',
            bgcolor: soft,
            border: `1px solid ${color}28`
        }}>
            <Box sx={{width: 5, height: 5, borderRadius: '50%', bgcolor: color}}/>
            <Typography sx={{fontSize: '0.68rem', fontWeight: 700, color, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
                {label}
            </Typography>
        </Box>
    );
};

const TypeChip = ({type}) => {
    const isClient = type === 'client';
    // Shorten 'Operational' label to avoid overflow
    const label = isClient ? 'Client' : 'Ops';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center',
            px: 1, py: 0.3, borderRadius: '6px',
            bgcolor: isClient ? T.accentSoft : T.purpleSoft,
            border: `1px solid ${isClient ? T.accent : T.purple}22`,
            maxWidth: '100%',
        }}>
            <Typography sx={{
                fontSize: '0.67rem', fontWeight: 700,
                color: isClient ? T.accent : T.purple,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                textTransform: 'uppercase', letterSpacing: 0.5,
                whiteSpace: 'nowrap',
            }}>
                {label}
            </Typography>
        </Box>
    );
};

const Avatar = ({firstName, lastName, type}) => {
    const isClient = type === 'client';
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    return (
        <Box sx={{
            width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
            bgcolor: isClient ? T.accentSoft : T.purpleSoft,
            border: `1px solid ${isClient ? T.accent : T.purple}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Typography sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                color: isClient ? T.accent : T.purple,
                fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
                {initials || '?'}
            </Typography>
        </Box>
    );
};

const formatDate = (dateString) => {
    try {
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
        return 'Invalid date';
    }
};

const RecentRegistrations = ({data = []}) => {
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(5);

    const handleViewUser = (user) => {
        if (user.user_type === 'client') {
            navigate(`/client-users/${user.id}`);
        } else {
            navigate(`/operational-users/${user.id}`);
        }
    };

    const loadMore = () => setVisibleCount(prev => Math.min(prev + 5, data.length));

    if (data.length === 0) {
        return (
            <Box sx={{textAlign: 'center', py: 6}}>
                <Box sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    bgcolor: T.bg,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5
                }}>
                    <EmptyIcon sx={{fontSize: 24, color: T.muted}}/>
                </Box>
                <Typography sx={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: T.text,
                    mb: 0.5,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                    No recent registrations
                </Typography>
                <Typography sx={{fontSize: '0.8rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
                    Users registered in the last 7 days will appear here
                </Typography>
            </Box>
        );
    }

    // Fixed column widths — type column wider to fit "Operational" chip
    const COL = {user: '27%', type: '10%', status: '13%', contact: '27%', date: '18%', actions: '5%'};

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: `${COL.user} ${COL.type} ${COL.status} ${COL.contact} ${COL.date} ${COL.actions}`,
                px: 2, py: 1.1, bgcolor: T.bg, borderRadius: '10px', mb: 0.5,
            }}>
                {['User', 'Type', 'Status', 'Contact', 'Registered', ''].map((h, i) => (
                    <Typography key={i} sx={{
                        fontSize: '0.67rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}>
                        {h}
                    </Typography>
                ))}
            </Box>

            {/* Rows */}
            {data.slice(0, visibleCount).map((user) => (
                <Box key={`${user.user_type}-${user.id}`} sx={{
                    display: 'grid',
                    gridTemplateColumns: `${COL.user} ${COL.type} ${COL.status} ${COL.contact} ${COL.date} ${COL.actions}`,
                    px: 2, py: 1.4, borderRadius: '10px', mb: 0.5,
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    '&:hover': {bgcolor: T.bg},
                }}>
                    {/* User */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, pr: 1}}>
                        <Avatar firstName={user.first_name} lastName={user.last_name} type={user.user_type}/>
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={{
                                fontWeight: 700,
                                fontSize: '0.83rem',
                                color: T.text,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user.first_name} {user.last_name}
                            </Typography>
                            <Typography sx={{
                                fontSize: '0.71rem',
                                color: T.muted,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user.email}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Type */}
                    <Box sx={{overflow: 'hidden'}}><TypeChip type={user.user_type}/></Box>

                    {/* Status */}
                    <Box><StatusBadge status={user.registration_status}/></Box>

                    {/* Contact */}
                    <Box sx={{minWidth: 0, pr: 1}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                            <EmailIcon sx={{fontSize: 11, color: T.muted, flexShrink: 0}}/>
                            <Typography sx={{
                                fontSize: '0.75rem',
                                color: T.text,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {user.email}
                            </Typography>
                        </Box>
                        {user.phone_number && (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3}}>
                                <PhoneIcon sx={{fontSize: 11, color: T.muted, flexShrink: 0}}/>
                                <Typography sx={{
                                    fontSize: '0.71rem',
                                    color: T.muted,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                }}>
                                    {user.phone_number}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Date */}
                    <Typography sx={{fontSize: '0.75rem', color: T.muted, fontFamily: 'JetBrains Mono, monospace'}}>
                        {formatDate(user.created_at)}
                    </Typography>

                    {/* Action */}
                    <Box component="button" type="button" onClick={() => handleViewUser(user)}
                         sx={{
                             width: 28,
                             height: 28,
                             border: `1px solid ${T.border}`,
                             borderRadius: '8px',
                             bgcolor: T.bg,
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             cursor: 'pointer',
                             color: T.muted,
                             transition: 'all 0.15s',
                             '&:hover': {bgcolor: T.accentSoft, color: T.accent, borderColor: T.accent}
                         }}>
                        <ViewIcon sx={{fontSize: 14}}/>
                    </Box>
                </Box>
            ))}

            {/* Load more */}
            {data.length > visibleCount && (
                <Box sx={{textAlign: 'center', mt: 1.5}}>
                    <Box component="button" type="button" onClick={loadMore}
                         sx={{
                             border: `1.5px solid ${T.border}`,
                             borderRadius: '9px',
                             px: 2,
                             py: 0.8,
                             bgcolor: T.bg,
                             cursor: 'pointer',
                             fontFamily: 'Plus Jakarta Sans, sans-serif',
                             fontWeight: 600,
                             fontSize: '0.78rem',
                             color: T.muted,
                             '&:hover': {bgcolor: T.accentSoft, color: T.accent, borderColor: T.accent},
                             transition: 'all 0.15s'
                         }}>
                        Load {Math.min(5, data.length - visibleCount)} more
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RecentRegistrations;