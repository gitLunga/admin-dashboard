import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Block as RejectedIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import StatusUpdateModal from './StatusUpdateModal';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      // Try to fetch as client user first
      try {
        const response = await adminAPI.getClientUserById(id);
        setUser({ ...response.data.data.user, user_type: 'client' });
      } catch (clientError) {
        // If not found as client, try as operational user
        const response = await adminAPI.getOperationalUserById(id);
        setUser({ ...response.data.data.user, user_type: 'operational' });
      }
    } catch (err) {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status, notes) => {
    try {
      await adminAPI.updateUserStatus(id, { status, notes });
      fetchUserDetails();
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <VerifiedIcon color="success" />;
      case 'Pending':
        return <PendingIcon color="warning" />;
      case 'Rejected':
        return <RejectedIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'User not found'}
      </Alert>
    );
  }

  const isClientUser = user.user_type === 'client';

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          User Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - User Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    bgcolor: isClientUser ? 'primary.main' : 'secondary.main',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 48 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.title} {user.first_name} {user.last_name}
                </Typography>
                <Chip
                  label={isClientUser ? 'Client User' : 'Operational User'}
                  color={isClientUser ? 'primary' : 'secondary'}
                  sx={{ mb: 1 }}
                />
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusIcon(user.registration_status)}
                  <Chip
                    label={user.registration_status || 'Active'}
                    color={getStatusColor(user.registration_status)}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={user.email} />
                </ListItem>

                {user.phone_number && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText primary="Phone" secondary={user.phone_number} />
                  </ListItem>
                )}

                {user.region && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText primary="Region" secondary={user.region} />
                  </ListItem>
                )}

                {isClientUser ? (
                  <>
                    {user.persal_id && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText primary="Persal ID" secondary={user.persal_id} />
                      </ListItem>
                    )}

                    {user.department_id && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText primary="Department" secondary={user.department_id} />
                      </ListItem>
                    )}
                  </>
                ) : (
                  <ListItem>
                    <ListItemIcon>
                      <WorkIcon />
                    </ListItemIcon>
                    <ListItemText primary="Role" secondary={user.user_role} />
                  </ListItem>
                )}

                {user.created_at && (
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Registered" 
                      secondary={formatDate(user.created_at)} 
                    />
                  </ListItem>
                )}
              </List>

              {isClientUser && (
                <Box mt={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setModalOpen(true)}
                  >
                    Update Status
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Tabs and Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Overview" />
              <Tab label="Activity" />
              <Tab label="Documents" />
              {isClientUser && <Tab label="Contract Details" />}
            </Tabs>
          </Paper>

          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Grid container spacing={2}>
                  {isClientUser && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          User Type
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {user.user_type || 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Network Provider
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {user.network_provider || 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Contract Duration
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {user.contract_duration_months || '0'} months
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Contract End Date
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {user.contract_end_date ? formatDate(user.contract_end_date) : 'N/A'}
                        </Typography>
                      </Grid>

                      {user.verification_notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Verification Notes
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                              {user.verification_notes}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Typography color="textSecondary">
                  Activity history will be displayed here
                </Typography>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <Typography color="textSecondary">
                  Uploaded documents will be displayed here
                </Typography>
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && isClientUser && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Contract Status
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Active
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Last Renewal Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {user.contract_end_date ? formatDate(user.contract_end_date) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {isClientUser && (
        <StatusUpdateModal
          open={modalOpen}
          user={user}
          onClose={() => setModalOpen(false)}
          onSubmit={handleStatusUpdate}
        />
      )}
    </Box>
  );
};

export default UserDetail;