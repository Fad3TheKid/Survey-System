import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Alert,
  LinearProgress,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { formService } from '../services/api';

const LOCAL_STORAGE_KEY = 'formResponseAutosave';

function FormResponse() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Load form and init answers + restore autosave
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const data = await formService.getForm(formId);
        if (!data.questions) data.questions = [];

        setForm(data);

        // Init answers
        const initialAnswers = {};
        data.questions.forEach((q, idx) => {
          switch (q.type) {
            case 'checkbox':
              initialAnswers[idx] = [];
              break;
            case 'grid':
              initialAnswers[idx] = {};
              break;
            case 'file':
              initialAnswers[idx] = null;
              break;
            case 'linear':
              initialAnswers[idx] = 3;
              break;
            default:
              initialAnswers[idx] = '';
          }
        });

        // Load autosaved data if present
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.formId === formId) {
            // Merge answers and email carefully
            Object.entries(parsed.answers || {}).forEach(([key, val]) => {
              initialAnswers[key] = val;
            });
            if (parsed.email) setEmail(parsed.email);
          }
        }

        setAnswers(initialAnswers);
        setError(null);
      } catch (err) {
        setError('Failed to load form. Please try again later.');
        console.error('Error loading form:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  // Autosave answers and email to localStorage
  useEffect(() => {
    if (!form) return;
    const saveData = {
      formId,
      answers,
      email,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
  }, [answers, email, formId, form]);

  // Clear autosave data (after submission or manual reset)
  const clearAutosave = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Handle changes for answers and clear validation error on change
  const handleAnswerChange = (index, value) => {
    setAnswers(prev => ({
      ...prev,
      [index]: value,
    }));
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleCheckboxChange = (index, optionValue) => {
    setAnswers(prev => {
      const current = prev[index] || [];
      let newArr;
      if (current.includes(optionValue)) {
        newArr = current.filter(v => v !== optionValue);
      } else {
        newArr = [...current, optionValue];
      }
      return {
        ...prev,
        [index]: newArr,
      };
    });
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  // Remove selected file for a file question
  const removeFile = (index) => {
    handleAnswerChange(index, null);
  };

  // Validation helper
  const validateAnswers = () => {
    if (!form) return false;
    const newErrors = {};

    form.questions.forEach((q, idx) => {
      const answer = answers[idx];
      if (q.required) {
        if (q.type === 'checkbox' && (!answer || answer.length === 0)) {
          newErrors[idx] = `Please answer the required question: "${q.title}"`;
        } else if (q.type === 'grid') {
          // All rows must be answered
          const answeredRows = Object.keys(answer || {}).length;
          if (answeredRows !== (q.rows?.length || 0)) {
            newErrors[idx] = `Please answer all rows for the required question: "${q.title}"`;
          }
        } else if (
          q.type !== 'checkbox' &&
          q.type !== 'grid' &&
          (answer === undefined || answer === '' || answer === null)
        ) {
          newErrors[idx] = `Please answer the required question: "${q.title}"`;
        }
      }
    });

    if (form.settings?.collectEmail && !email) {
      newErrors.email = 'Please provide your email address';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateAnswers()) return;

    try {
      // Prepare answers for submission (handle file if any)
      const submittedAnswers = await Promise.all(
        Object.entries(answers).map(async ([index, value]) => {
          const question = form.questions[index];
          if (question.type === 'file' && value instanceof File) {
            // Simulate upload or prepare file (here we just send the filename)
            // You can extend this to upload files to server or cloud storage
            return {
              questionId: question.id,
              value: value.name,
            };
          } else {
            return {
              questionId: question.id,
              value,
            };
          }
        })
      );

      const response = {
        formId,
        answers: submittedAnswers,
        respondentEmail: email || undefined,
        submittedAt: new Date().toISOString(),
      };

      await formService.submitResponse(response);

      setSubmitted(true);
      setError(null);
      clearAutosave();
    } catch (err) {
      setError('Failed to submit response. Please try again later.');
      console.error('Error submitting response:', err);
    }
  };

  // Reset form handler
  const handleReset = () => {
    if (!form) return;

    const clearedAnswers = {};
    form.questions.forEach((q, idx) => {
      switch (q.type) {
        case 'checkbox':
          clearedAnswers[idx] = [];
          break;
        case 'grid':
          clearedAnswers[idx] = {};
          break;
        case 'file':
          clearedAnswers[idx] = null;
          break;
        case 'linear':
          clearedAnswers[idx] = 3;
          break;
        default:
          clearedAnswers[idx] = '';
      }
    });
    setAnswers(clearedAnswers);
    setEmail('');
    setValidationErrors({});
    setError(null);
    setSubmitted(false);
    clearAutosave();
  };

  // For file previews
  const renderFilePreview = (file) => {
    if (!file) return null;

    if (file instanceof File) {
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const url = URL.createObjectURL(file);
        return <Avatar src={url} alt={file.name} variant="rounded" sx={{ width: 56, height: 56, mr: 1 }} />;
      }
      return <Typography>{file.name}</Typography>;
    } else if (typeof file === 'string') {
      // Already uploaded or filename string
      return <Typography>{file}</Typography>;
    }

    return null;
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !submitted) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {error}
      </Alert>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Thank you for your response!
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
        <Button sx={{ ml: 2 }} color="secondary" onClick={handleReset}>
          Submit Another Response
        </Button>
      </Box>
    );
  }

  const renderQuestion = (question, index) => {
    const errorText = validationErrors[index];
    switch (question.type) {
      case 'short':
        return (
          <>
            <TextField
              fullWidth
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              required={question.required}
              error={!!errorText}
              helperText={errorText}
            />
          </>
        );
      case 'paragraph':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            required={question.required}
            error={!!errorText}
            helperText={errorText}
          />
        );
      case 'multiple':
        return (
          <RadioGroup
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          >
            {question.options?.map((option, i) => (
              <FormControlLabel
                key={i}
                value={option}
                control={<Radio required={question.required} />}
                label={option}
              />
            ))}
            {errorText && (
              <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                {errorText}
              </Typography>
            )}
          </RadioGroup>
        );
      case 'checkbox':
        return (
          <>
            <FormGroup>
              {question.options?.map((option, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      checked={(answers[index] || []).includes(option)}
                      onChange={() => handleCheckboxChange(index, option)}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
            {errorText && (
              <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                {errorText}
              </Typography>
            )}
          </>
        );
      case 'file':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                handleAnswerChange(index, file);
              }}
              required={question.required}
            />
            {answers[index] && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {renderFilePreview(answers[index])}
                <Tooltip title="Remove file">
                  <IconButton size="small" onClick={() => removeFile(index)}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {errorText && (
              <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                {errorText}
              </Typography>
            )}
          </Box>
        );
      case 'dropdown':
        return (
          <>
            <TextField
              select
              SelectProps={{ native: true }}
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              required={question.required}
              error={!!errorText}
              helperText={errorText}
            >
              <option value="" disabled>
                Select...
              </option>
              {question.options?.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </TextField>
          </>
        );
      case 'linear':
        return (
          <>
            <Slider
              value={answers[index] || 3}
              min={question.scaleMin || 1}
              max={question.scaleMax || 5}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(e, value) => handleAnswerChange(index, value)}
              aria-labelledby="linear-scale-slider"
            />
            {errorText && (
              <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                {errorText}
              </Typography>
            )}
          </>
        );
      case 'grid':
        return (
          <>
            <Table size="small" sx={{ maxWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  {question.columns?.map((col, i) => (
                    <TableCell key={i} align="center">
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {question.rows?.map((row, rIdx) => (
                  <TableRow key={rIdx}>
                    <TableCell>{row}</TableCell>
                    {question.columns.map((col, cIdx) => (
                      <TableCell key={cIdx} align="center">
                        <Radio
                          checked={answers[index]?.[row] === col}
                          onChange={() => {
                            const updated = { ...(answers[index] || {}) };
                            updated[row] = col;
                            handleAnswerChange(index, updated);
                          }}
                          value={col}
                          name={`grid-${index}-${row}`}
                          required={question.required}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errorText && (
              <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                {errorText}
              </Typography>
            )}
          </>
        );
      default:
        return <Typography>Unsupported question type: {question.type}</Typography>;
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {form.title || 'Form'}
        </Typography>
        {form.settings?.description && (
          <Typography variant="body1" sx={{ mb: 3 }}>
            {form.settings.description}
          </Typography>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {form.settings?.collectEmail && (
            <TextField
              label="Your Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors(prev => {
                  const copy = { ...prev };
                  delete copy.email;
                  return copy;
                });
              }}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              sx={{ mb: 3 }}
            />
          )}

          {form.questions.map((q, idx) => (
            <Box key={idx} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {q.title} {q.required && '*'}
              </Typography>
              {renderQuestion(q, idx)}
            </Box>
          ))}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">
              Submit
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleReset}>
              Reset Form
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default FormResponse;
