import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Link, // Add this
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

function Navbar() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Link
          component={RouterLink}
          to="/"
          underline="none"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">FormFlow</Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <DashboardIcon />
        </IconButton>

        <Button
          color="inherit"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/create"
        >
          Create Form
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
