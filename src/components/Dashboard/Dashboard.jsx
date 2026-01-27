import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { adminAPI } from '../../services/api';
import StatsCard from './StatsCard';
import RecentRegistrations from './RecentRegistrations';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardData();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const { statistics, recent_registrations, activity_summary } = dashboardData;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={statistics.total_users}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Client Users"
            value={statistics.client_users.total}
            icon={<PersonIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Operational Users"
            value={statistics.operational_users.total}
            icon={<GroupIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Contracts"
            value={activity_summary.active_contracts}
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>

        {/* Recent Registrations */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Registrations (Last 7 Days)
            </Typography>
            <RecentRegistrations data={recent_registrations} />
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Status Distribution
            </Typography>
            {statistics.client_users.stats.map((stat) => (
              <Box key={stat.registration_status} sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  {stat.registration_status}
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box flexGrow={1} mr={1}>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: '#e0e0e0',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(stat.count / statistics.client_users.total) * 100}%`,
                          height: '100%',
                          backgroundColor: getStatusColor(stat.registration_status),
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2">{stat.count}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Verified':
      return '#4caf50';
    case 'Pending':
      return '#ff9800';
    case 'Rejected':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

export default Dashboard;