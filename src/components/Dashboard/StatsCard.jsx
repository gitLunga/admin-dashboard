import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Equalizer,
  Info as InfoIcon,
} from '@mui/icons-material';

const StatsCard = ({ title, value, icon, color, change, changeText, description }) => {
  const getTrendIcon = () => {
    if (!change) return <Equalizer sx={{ color: 'text.secondary', fontSize: 16 }} />;
    return change > 0 ? (
      <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
    ) : (
      <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />
    );
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
              {formatValue(value)}
            </Typography>
            
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {getTrendIcon()}
                <Typography
                  variant="body2"
                  sx={{
                    ml: 0.5,
                    color: change > 0 ? '#4caf50' : change < 0 ? '#f44336' : 'text.secondary',
                    fontWeight: 'medium',
                  }}
                >
                  {change > 0 ? '+' : ''}{change}%
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                  {changeText || 'from last month'}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
          </Box>
        </Box>
        
        {description && (
          <Box mt={2} display="flex" alignItems="center">
            <Tooltip title={description}>
              <IconButton size="small" sx={{ p: 0, mr: 0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              {description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;