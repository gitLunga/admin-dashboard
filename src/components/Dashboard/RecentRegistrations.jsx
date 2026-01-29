import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Block as RejectedIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const RecentRegistrations = ({ data = [] }) => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(5);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <VerifiedIcon fontSize="small" color="success" />;
      case 'Pending':
        return <PendingIcon fontSize="small" color="warning" />;
      case 'Rejected':
        return <RejectedIcon fontSize="small" color="error" />;
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

  const getUserTypeColor = (userType) => {
    return userType === 'client' ? 'primary' : 'secondary';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleViewUser = (user) => {
    if (user.user_type === 'client') {
      navigate(`/client-users/${user.id}`);
    } else {
      navigate(`/operational-users/${user.id}`);
    }
  };

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, data.length));
  };

    if (data.length === 0) {
        return (
            <Box textAlign="center" py={6}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                    No recent registrations
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Users registered in the last 7 days will appear here
                </Typography>
            </Box>
        );
    }

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, visibleCount).map((user) => (
              <TableRow key={`${user.user_type}-${user.id}`} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.user_type === 'client' ? 'Client' : 'Operational'}
                    size="small"
                    color={getUserTypeColor(user.user_type)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {getStatusIcon(user.registration_status)}
                    <Chip
                      label={user.registration_status}
                      size="small"
                      color={getStatusColor(user.registration_status)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" display="flex" alignItems="center">
                      <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {user.email}
                    </Typography>
                    {user.phone_number && (
                      <Typography variant="caption" display="flex" alignItems="center" color="textSecondary">
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5, fontSize: 12 }} />
                        {user.phone_number}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(user.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="View details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewUser(user)}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {data.length > visibleCount && (
        <Box textAlign="center" mt={2}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={loadMore}
          >
            Load {Math.min(5, data.length - visibleCount)} more
          </Typography>
        </Box>
      )}
    </>
  );
};

export default RecentRegistrations;