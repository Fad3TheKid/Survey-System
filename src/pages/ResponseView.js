import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
// import { formService } from '../services/api'; // Uncomment when ready for real API

const COLORS = ['#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4'];

const mockForm = {
  title: 'Sample Survey',
  questions: [
    { id: 'q1', title: 'Favorite Color', type: 'multiple' },
    { id: 'q2', title: 'Upload your file', type: 'file' },
    { id: 'q3', title: 'Rate our service', type: 'linear' },
  ],
};

const mockResponses = [
  {
    createdAt: '2025-05-27T10:00:00Z',
    respondentEmail: 'user1@example.com',
    answers: [
      { questionId: 'q1', value: 'Blue' },
      { questionId: 'q2', value: [{ value: 'file1.pdf' }, { value: 'file2.jpg' }] },
      { questionId: 'q3', value: 4 },
    ],
  },
  {
    createdAt: '2025-05-27T11:00:00Z',
    respondentEmail: 'user2@example.com',
    answers: [
      { questionId: 'q1', value: 'Red' },
      { questionId: 'q2', value: 'singlefile.docx' },
      { questionId: 'q3', value: 5 },
    ],
  },
];

function ResponseView() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Temporary mock data load for testing
    setForm(mockForm);
    setResponses(mockResponses);
    setStats({
      totalResponses: mockResponses.length,
      averageDuration: 180, // seconds
      questionStats: {
        q1: { answerDistribution: { Blue: 1, Red: 1 } },
        q2: { answerDistribution: { 'file1.pdf': 1, 'file2.jpg': 1, 'singlefile.docx': 1 } },
        q3: { answerDistribution: { 4: 1, 5: 1 } },
      },
    });
    setLoading(false);

    // Real API loading code example:
    /*
    if (!formId) return;
    loadData();
    */
  }, [formId]);

  /*
  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, responsesData, statsData] = await Promise.all([
        formService.getForm(formId),
        formService.getResponses(formId),
        formService.getResponseStats(formId),
      ]);
      setForm(formData);
      setResponses(responsesData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to load responses');
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  };
  */

  const renderSummary = () => {
    if (!stats || !form) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Responses</Typography>
              <Typography variant="h3">{stats.totalResponses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Average Duration</Typography>
              <Typography variant="h3">{Math.round(stats.averageDuration / 60)} min</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          {form.questions.map((question) => (
            <Paper key={question.id} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {question.title}
              </Typography>
              {renderQuestionStats(question, stats.questionStats[question.id])}
            </Paper>
          ))}
        </Grid>
      </Grid>
    );
  };

  const renderQuestionStats = (question, questionStats) => {
    if (!questionStats) return <Typography>No data</Typography>;

    const data = Object.entries(questionStats.answerDistribution).map(([name, value]) => ({
      name,
      value,
    }));

    switch (question.type) {
      case 'multiple':
      case 'checkbox':
      case 'linear':
        return (
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#673AB7" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        );

      default:
        return (
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        );
    }
  };

  const renderResponses = () => {
    if (!form || !responses.length) return <Typography>No responses found.</Typography>;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Email</TableCell>
              {form.questions.map((question) => (
                <TableCell key={question.id}>{question.title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {responses.map((response, idx) => (
              <TableRow key={idx}>
                <TableCell>{new Date(response.createdAt).toLocaleString()}</TableCell>
                <TableCell>{response.respondentEmail || '-'}</TableCell>
                {form.questions.map((question) => {
                  const answer = response.answers.find((a) => a.questionId === question.id);
                  return <TableCell key={question.id}>{renderResponseValue(answer?.value, question.type)}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderResponseValue = (value, questionType) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return '-';

    if (questionType === 'file') {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && 'value' in value[0]) {
          return value.map((fileObj) => fileObj.value).join(', ');
        }
        return value.join(', ');
      }
      if (typeof value === 'string') {
        return value;
      }
      if (value instanceof File) {
        return value.name;
      }
    }

    if (questionType === 'grid' && typeof value === 'object') {
      return Object.entries(value)
        .map(([row, column]) => `${row}: ${column}`)
        .join(', ');
    }

    if (Array.isArray(value)) return value.join(', ');

    return value.toString();
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Form not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {form.title} - Responses
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Summary" />
          <Tab label="Individual Responses" />
        </Tabs>
      </Box>

      {activeTab === 0 ? renderSummary() : renderResponses()}
    </Box>
  );
}

export default ResponseView;
