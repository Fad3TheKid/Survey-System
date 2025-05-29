import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { formService } from '../services/api';

function Dashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await formService.getForms();
      setForms(data);
      setError(null);
    } catch (err) {
      setError('Failed to load forms');
      console.error('Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await formService.deleteForm(id);
        setForms(forms.filter(form => form.id !== id));
      } catch (err) {
        console.error('Error deleting form:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="error.main" mt={4}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" gutterBottom>
          My Forms
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/create"
        >
          Create New Form
        </Button>
      </Box>

      <Grid container spacing={3}>
        {forms.map((form) => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" noWrap gutterBottom>
                  {form.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {form.description || 'No description'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Created: {new Date(form.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  component={RouterLink}
                  to={`/form/${form.id}`}
                  size="small"
                  title="View Form"
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  component={RouterLink}
                  to={`/edit/${form.id}`}
                  size="small"
                  title="Edit Form"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  component={RouterLink}
                  to={`/responses/${form.id}`}
                  size="small"
                  title="View Responses"
                >
                  <StatsIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(form.id)}
                  size="small"
                  color="error"
                  title="Delete Form"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {forms.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No forms created yet
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/create"
            sx={{ mt: 2 }}
          >
            Create Your First Form
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Dashboard;