import React, { useState, useEffect, useRef } from 'react';
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
  LinearProgress,
  Alert,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormHelperText,
} from '@mui/material';
import { formService } from '../services/api';

function FormView() {
  const { formId } = useParams();
  const navigate = useNavigate();

  // Main state
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Track validation errors per question index, also for email
  const [validationErrors, setValidationErrors] = useState({});

  // Refs for file inputs to reset them
  const fileInputRefs = useRef({});

  useEffect(() => {
    loadForm();
  }, [formId]);

  // Load form and initialize answers and try loading saved answers from localStorage
  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formService.getForm(formId);
      if (!data.questions) data.questions = [];
      setForm(data);

      // Initialize answers with saved if any
      const saved = localStorage.getItem(`form_${formId}_answers`);
      const savedEmail = localStorage.getItem(`form_${formId}_email`);

      let initialAnswers = {};
      if (saved) {
        try {
          initialAnswers = JSON.parse(saved);
        } catch {
          initialAnswers = {};
        }
      }

      // Fill missing answers with initial structure if needed
      data.questions.forEach((q, i) => {
        if (!(i in initialAnswers)) {
          if (q.type === 'checkbox') {
            initialAnswers[i] = [];
          } else if (q.type === 'grid') {
            initialAnswers[i] = {};
            const rows = q.settings?.grid?.rows || [];
            rows.forEach(row => {
              initialAnswers[i][row] = '';
            });
          } else {
            initialAnswers[i] = '';
          }
        }
      });

      setAnswers(initialAnswers);
      setEmail(savedEmail || '');
      setValidationErrors({});
      setError(null);
    } catch (err) {
      setError('Failed to load form');
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save answers and email to localStorage on changes
  useEffect(() => {
    if (form) {
      localStorage.setItem(`form_${formId}_answers`, JSON.stringify(answers));
      localStorage.setItem(`form_${formId}_email`, email);
    }
  }, [answers, email, form, formId]);

  const handleAnswerChange = (index, value, rowKey = null) => {
    setAnswers(prev => {
      if (rowKey !== null) {
        return {
          ...prev,
          [index]: {
            ...prev[index],
            [rowKey]: value,
          },
        };
      }
      return {
        ...prev,
        [index]: value,
      };
    });
  };

  const validateForm = () => {
    const errors = {};

    form.questions.forEach((question, i) => {
      const answer = answers[i];

      if (question.required) {
        if (question.type === 'grid') {
          const missing = Object.values(answer || {}).some(val => !val);
          if (missing) errors[i] = 'Please answer all rows.';
        } else if (question.type === 'checkbox') {
          if (!answer || answer.length === 0) errors[i] = 'Please select at least one option.';
        } else if (
          answer === '' ||
          answer === null ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          errors[i] = 'This field is required.';
        }
      }

      // Extra email format check for email questions
      if (question.type === 'email' && answer) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(answer)) {
          errors[i] = 'Please enter a valid email address.';
        }
      }
    });

    if (form.settings?.collectEmail) {
      if (!email) {
        errors.email = 'Please provide your email address.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.email = 'Please enter a valid email address.';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the errors before submitting.');
      return;
    }

    try {
      const response = {
        formId,
        answers: Object.entries(answers).map(([index, value]) => {
          if (form.questions[index].type === 'file' && value instanceof File) {
            return {
              questionId: form.questions[index]._id,
              type: form.questions[index].type,
              value: value.name,
            };
          }
          return {
            questionId: form.questions[index]._id,
            type: form.questions[index].type,
            value,
          };
        }),
        respondentEmail: email || undefined,
        startTime: new Date(),
      };

      await formService.submitResponse(response);
      setSubmitted(true);
      setError(null);

      // Clear saved answers/email on successful submit
      localStorage.removeItem(`form_${formId}_answers`);
      localStorage.removeItem(`form_${formId}_email`);

      // Reset file inputs
      Object.values(fileInputRefs.current).forEach(input => {
        if (input) input.value = '';
      });
    } catch (err) {
      setError('Failed to submit form');
      console.error('Error submitting form:', err);
    }
  };

  const renderQuestion = (question, index) => {
    const errorMsg = validationErrors[index];
    const commonProps = {
      fullWidth: true,
      required: question.required,
      error: Boolean(errorMsg),
      helperText: errorMsg,
    };

    switch (question.type) {
      case 'short':
      case 'paragraph':
      case 'email':
      case 'number':
      case 'phone':
      case 'url':
        return (
          <TextField
            {...commonProps}
            multiline={question.type === 'paragraph'}
            rows={question.type === 'paragraph' ? 4 : 1}
            type={
              question.type === 'number'
                ? 'number'
                : question.type === 'email'
                ? 'email'
                : question.type === 'url'
                ? 'url'
                : 'text'
            }
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder={question.description || ''}
          />
        );

      case 'multiple':
        return (
          <FormControl error={Boolean(errorMsg)} required={question.required}>
            <RadioGroup
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            >
              {question.options?.map((option, i) => {
                const optionValue =
                  typeof option === 'string' ? option : option.value || option.text;
                const optionLabel =
                  typeof option === 'string' ? option : option.text || option.value;
                return (
                  <FormControlLabel
                    key={i}
                    value={optionValue}
                    control={<Radio />}
                    label={optionLabel}
                  />
                );
              })}
            </RadioGroup>
            {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl error={Boolean(errorMsg)} required={question.required}>
            <FormGroup>
              {question.options?.map((option, i) => {
                const optionValue =
                  typeof option === 'string' ? option : option.value || option.text;
                const optionLabel =
                  typeof option === 'string' ? option : option.text || option.value;
                return (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={answers[index]?.includes(optionValue)}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...(answers[index] || []), optionValue]
                            : answers[index].filter((v) => v !== optionValue);
                          handleAnswerChange(index, newValue);
                        }}
                      />
                    }
                    label={optionLabel}
                  />
                );
              })}
            </FormGroup>
            {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
          </FormControl>
        );

      case 'dropdown':
        return (
          <FormControl fullWidth required={question.required} error={Boolean(errorMsg)}>
            <Select
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>Select an option</em>
              </MenuItem>
              {question.options?.map((option, i) => {
                const optionValue =
                  typeof option === 'string' ? option : option.value || option.text;
                const optionLabel =
                  typeof option === 'string' ? option : option.text || option.value;
                return (
                  <MenuItem key={i} value={optionValue}>
                    {optionLabel}
                  </MenuItem>
                );
              })}
            </Select>
            {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
          </FormControl>
        );

      case 'linear':
        const { min, max, minLabel, maxLabel } = question.settings?.linearScale || {};
        return (
          <Box sx={{ px: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">{minLabel || min}</Typography>
              <Typography variant="caption">{maxLabel || max}</Typography>
            </Box>
            <FormControl error={Boolean(errorMsg)} required={question.required}>
              <RadioGroup
                row
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                sx={{ justifyContent: 'space-between' }}
              >
                {Array.from({ length: max - min + 1 }, (_, i) => (
                  <FormControlLabel
                    key={i}
                    value={(min + i).toString()}
                    control={<Radio />}
                    label={min + i}
                    labelPlacement="top"
                  />
                ))}
              </RadioGroup>
              {errorMsg && <FormHelperText>{errorMsg}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 'grid':
        return (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    {question.settings.grid.columns.map((col, i) => (
                      <TableCell key={i} align="center">
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {question.settings.grid.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell component="th" scope="row">
                        {row}
                      </TableCell>
                      {question.settings.grid.columns.map((col, colIndex) => (
                        <TableCell key={colIndex} align="center">
                          <Radio
                            name={`grid-${index}-${row}`} // Group radios per row
                            checked={answers[index]?.[row] === col}
                            onChange={() => handleAnswerChange(index, col, row)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {errorMsg && (
              <Typography variant="body2" color="error" sx={{ mt: -2, mb: 2 }}>
                {errorMsg}
              </Typography>
            )}
          </>
        );

      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'time':
        return (
          <TextField
            {...commonProps}
            type="time"
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'file':
        return (
          <>
            <input
              type="file"
              ref={(el) => (fileInputRefs.current[index] = el)}
              onChange={(e) => {
                const file = e.target.files[0];
                handleAnswerChange(index, file);
              }}
              required={question.required}
              style={{ marginTop: 8 }}
            />
            {errorMsg && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errorMsg}
              </Typography>
            )}
          </>
        );

      default:
        return (
          <Typography color="error">Unsupported question type: {question.type}</Typography>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Form not found</Alert>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Thank you for your response!
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {form.title || 'Untitled Form'}
        </Typography>
        {form.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {form.description}
          </Typography>
        )}
        {form.settings?.collectEmail && (
          <TextField
            fullWidth
            label="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={Boolean(validationErrors.email)}
            helperText={validationErrors.email}
            sx={{ mt: 2 }}
          />
        )}
      </Paper>

      <form onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {form.questions.map((question, index) => (
          <Paper key={index} sx={{ p: 4, mb: 2 }}>
            <FormControl fullWidth required={question.required}>
              <FormLabel sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {question.title}
                  {question.required && ' *'}
                </Typography>
                {question.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {question.description}
                  </Typography>
                )}
              </FormLabel>
              {renderQuestion(question, index)}
            </FormControl>
          </Paper>
        ))}

        <Box sx={{ mt: 4 }}>
          <Button type="submit" variant="contained" size="large">
            Submit
          </Button>
        </Box>
      </form>
    </Box>
  );
}

export default FormView;
