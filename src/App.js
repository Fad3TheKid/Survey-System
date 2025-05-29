import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, CircularProgress } from '@mui/material';
import Navbar from './components/Navbar';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FormBuilder = lazy(() => import('./pages/FormBuilder'));
const FormView = lazy(() => import('./pages/FormView'));
const FormResponse = lazy(() => import('./pages/FormResponse'));
const ResponseView = lazy(() => import('./pages/ResponseView'));

function Loading() {
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}
    >
      <CircularProgress />
    </Box>
  );
}

function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', mt: 10 }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </Box>
  );
}

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<FormBuilder />} />
            <Route path="/edit/:formId" element={<FormBuilder />} />
            <Route path="/form/:formId" element={<FormView />} />
            <Route path="/response/:formId" element={<FormResponse />} />
            <Route path="/responses/:formId" element={<ResponseView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Container>
    </Box>
  );
}

export default App;
