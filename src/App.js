import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';

// Layout
import MainLayout from './components/Layout/MainLayout';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import Dashboard from './components/Dashboard/Dashboard';
import UserList from './components/Users/UserList';
import ClientUsers from './components/Users/ClientUsers';
import OperationalUsers from './components/Users/OperationalUsers';
import UserDetail from './components/Users/UserDetail';
import Statistics from './components/Dashboard/Statistics';
import SearchPage from './components/Users/SearchPage';

// Common
import { PageLoader } from './components/Common/LoadingSpinner';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth pages (just normal pages for now) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* App pages */}
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                }
              />

              <Route
                path="/users"
                element={
                  <MainLayout>
                    <UserList />
                  </MainLayout>
                }
              />

              <Route
                path="/client-users"
                element={
                  <MainLayout>
                    <ClientUsers />
                  </MainLayout>
                }
              />

              <Route
                path="/client-users/:id"
                element={
                  <MainLayout>
                    <UserDetail />
                  </MainLayout>
                }
              />

              <Route
                path="/operational-users"
                element={
                  <MainLayout>
                    <OperationalUsers />
                  </MainLayout>
                }
              />

              <Route
                path="/operational-users/:id"
                element={
                  <MainLayout>
                    <UserDetail />
                  </MainLayout>
                }
              />

              <Route
                path="/statistics"
                element={
                  <MainLayout>
                    <Statistics />
                  </MainLayout>
                }
              />

              <Route
                path="/search"
                element={
                  <MainLayout>
                    <SearchPage />
                  </MainLayout>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </React.Suspense>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
