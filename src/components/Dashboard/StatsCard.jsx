import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, Equalizer, Info as InfoIcon } from '@mui/icons-material';

/* ── Shared tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    green: '#059669', rose: '#DC2626',
};

const StatsCard = ({ title, value, icon: Icon, color, soft, change, changeText, description, delay = 0 }) => {
    const formatValue = (val) => typeof val === 'number' ? val.toLocaleString() : val;

    const trendUp   = change > 0;
    const trendDown = change < 0;
    const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Equalizer;
    const trendColor = trendUp ? T.green : trendDown ? T.rose : T.muted;

    return (
        <Box sx={{
            p: 2.5, borderRadius: '14px', bgcolor: T.surface,
            border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden',
            animation: `fadeUp 0.45s ease-out ${delay}s both`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 10px 28px ${color}20`,
                borderColor: `${color}44`,
            },
        }}>
            {/* Colored top accent bar */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, borderRadius: '14px 14px 0 0' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 0.9 }}>
                        {title}
                    </Typography>
                    <Typography sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '2rem', fontWeight: 500, lineHeight: 1,
                        color, mb: 0.7,
                    }}>
                        {formatValue(value)}
                    </Typography>

                    {change !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendIcon sx={{ fontSize: 13, color: trendColor }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: trendColor }}>
                                {trendUp ? '+' : ''}{change}%
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>
                                {changeText || 'from last month'}
                            </Typography>
                        </Box>
                    )}

                    {description && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <Tooltip title={description} arrow>
                                <InfoIcon sx={{ fontSize: 12, color: T.muted, cursor: 'help' }} />
                            </Tooltip>
                            <Typography sx={{ fontSize: '0.69rem', color: T.muted }}>{description}</Typography>
                        </Box>
                    )}
                </Box>

                {Icon && (
                    <Box sx={{
                        width: 40, height: 40, borderRadius: '11px',
                        bgcolor: soft || `${color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, ml: 1.5,
                    }}>
                        <Icon sx={{ fontSize: 20, color }} />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default StatsCard;