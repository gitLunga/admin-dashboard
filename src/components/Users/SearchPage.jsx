import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const SearchPage = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userType: 'all',
    status: 'all',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }
  }, [location]);

  const performSearch = async (term) => {
    if (term.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.searchUsers(term);
      setUsers(response.data.data.users);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    setUsers([]);
    setFilters({ userType: 'all', status: 'all' });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      if (filters.userType !== 'all' && user.user_type !== filters.userType) return false;
      if (filters.status !== 'all' && user.registration_status !== filters.status) return false;
      return true;
    });
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

  const filteredUsers = getFilteredUsers();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Search Users
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, phone, or Persal ID..."
            variant="outlined"
            size="medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searchTerm.trim().length < 2}
          >
            Search
          </Button>
          <IconButton onClick={handleClear} title="Clear search">
            <ClearIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            Filters:
          </Typography>
          <Chip
            label="All Types"
            size="small"
            variant={filters.userType === 'all' ? 'filled' : 'outlined'}
            onClick={() => handleFilterChange('userType', 'all')}
            color="primary"
          />
          <Chip
            label="Client Users"
            size="small"
            variant={filters.userType === 'client' ? 'filled' : 'outlined'}
            onClick={() => handleFilterChange('userType', 'client')}
            color="primary"
          />
          <Chip
            label="Operational Users"
            size="small"
            variant={filters.userType === 'operational' ? 'filled' : 'outlined'}
            onClick={() => handleFilterChange('userType', 'operational')}
            color="secondary"
          />
          
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip
              label="All Status"
              size="small"
              variant={filters.status === 'all' ? 'filled' : 'outlined'}
              onClick={() => handleFilterChange('status', 'all')}
            />
            <Chip
              label="Verified"
              size="small"
              variant={filters.status === 'Verified' ? 'filled' : 'outlined'}
              onClick={() => handleFilterChange('status', 'Verified')}
              color="success"
            />
            <Chip
              label="Pending"
              size="small"
              variant={filters.status === 'Pending' ? 'filled' : 'outlined'}
              onClick={() => handleFilterChange('status', 'Pending')}
              color="warning"
            />
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Search Results ({filteredUsers.length} users found)
            </Typography>
            {searchTerm && (
              <Typography variant="body2" color="textSecondary">
                Search term: "{searchTerm}"
              </Typography>
            )}
          </Box>

          {filteredUsers.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? 'Try a different search term or adjust your filters' : 'Enter a search term to find users'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredUsers.map((user) => (
                <Grid item xs={12} md={6} lg={4} key={`${user.user_type}-${user.id}`}>
                  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                    <CardContent>
                      <Box display="flex" alignItems="flex-start" mb={2}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            mr: 2,
                            bgcolor: user.user_type === 'client' ? 'primary.main' : 'secondary.main',
                          }}
                        >
                          {user.user_type === 'client' ? <PersonIcon /> : <BusinessIcon />}
                        </Avatar>
                        <Box flex={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6">
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Chip
                              label={user.registration_status || 'Active'}
                              size="small"
                              color={getStatusColor(user.registration_status)}
                            />
                          </Box>
                          <Chip
                            label={user.user_type === 'client' ? 'Client User' : 'Operational User'}
                            size="small"
                            color={getUserTypeColor(user.user_type)}
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {user.email}
                        </Typography>
                        
                        {user.phone_number && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {user.phone_number}
                          </Typography>
                        )}
                        
                        {user.region && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {user.region}
                          </Typography>
                        )}
                        
                        {user.persal_id && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            Persal ID: {user.persal_id}
                        </Typography>
                        )}
                      </Box>

                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (user.user_type === 'client') {
                              window.location.href = `/client-users/${user.id}`;
                            } else {
                              window.location.href = `/operational-users/${user.id}`;
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default SearchPage;