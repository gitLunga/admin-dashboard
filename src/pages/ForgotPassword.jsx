import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Link,
  InputAdornment,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, you would call:
      // await authAPI.post('/auth/forgot-password', { email });
      
      setSuccess(true);
      setSubmittedEmail(email);
      setEmail('');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Back to Login */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToLogin}
            sx={{ mb: 3 }}
          >
            Back to Login
          </Button>

          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <EmailIcon fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {success ? 'Check Your Email' : 'Forgot Password'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
              {success
                ? `We've sent password reset instructions to:`
                : 'Enter your email address and we\'ll send you instructions to reset your password.'}
            </Typography>
          </Box>

          {success ? (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Reset Email Sent!
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  We've sent password reset instructions to:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 3 }}>
                  {submittedEmail}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Please check your inbox and follow the instructions to reset your password.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Didn't receive the email?
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSuccess(false);
                    setEmail(submittedEmail);
                  }}
                  sx={{ mr: 2 }}
                >
                  Resend Email
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBackToLogin}
                >
                  Return to Login
                </Button>
              </Box>
            </>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Reset Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Enter the email address associated with your admin account"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>
              </Box>

              {/* Additional Info */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Note:</strong> The reset link will expire in 1 hour for security reasons.
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Need help? Contact your system administrator.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;