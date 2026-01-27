import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

export const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
        }}
      >
        <CircularProgress color="inherit" />
        {message && (
          <Typography variant="h6" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Backdrop>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
    >
      <CircularProgress />
      {message && (
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export const PageLoader = () => <LoadingSpinner fullScreen message="Loading application..." />;

export const TableLoader = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="200px"
  >
    <CircularProgress size={40} />
  </Box>
);

export const ButtonLoader = ({ size = 20 }) => (
  <CircularProgress size={size} color="inherit" />
);

export default LoadingSpinner;