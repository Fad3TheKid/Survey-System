import React from 'react';
import {
  Paper,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';

const questionTypes = [
  { value: 'short', label: 'Short Answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'linear', label: 'Linear Scale' },
  { value: 'grid', label: 'Grid' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'file', label: 'File Upload' },
];

function QuestionCard({ question, index, onUpdate, onDelete, onDuplicate }) {
  const handleChange = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const handleNestedChange = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const renderOptions = () => {
    if (!['multiple', 'checkbox', 'dropdown'].includes(question.type)) return null;

    const addOption = () => handleChange('options', [...(question.options || []), '']);
    const updateOption = (i, val) => handleChange('options', question.options.map((o, idx) => idx === i ? val : o));
    const deleteOption = (i) => handleChange('options', question.options.filter((_, idx) => idx !== i));

    return (
      <Box sx={{ mt: 2 }}>
        {question.options?.map((option, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ mr: 2 }}>{question.type === 'multiple' ? '○' : '□'}</Typography>
            <TextField
              value={option}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              fullWidth
              size="small"
            />
            <Tooltip title="Delete Option"><IconButton size="small" onClick={() => deleteOption(i)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={addOption} size="small" sx={{ mt: 1 }}>Add Option</Button>
      </Box>
    );
  };

  const renderLinearScale = () => {
    if (question.type !== 'linear') return null;
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Min value"
            type="number"
            value={question.min || 1}
            onChange={(e) => handleChange('min', e.target.value)}
            size="small"
          />
          <TextField
            label="Max value"
            type="number"
            value={question.max || 5}
            onChange={(e) => handleChange('max', e.target.value)}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            label="Min label"
            value={question.minLabel || ''}
            onChange={(e) => handleChange('minLabel', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Max label"
            value={question.maxLabel || ''}
            onChange={(e) => handleChange('maxLabel', e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
      </Box>
    );
  };

  const renderGrid = () => {
    if (question.type !== 'grid') return null;

    const addRow = () => handleNestedChange('rows', [...(question.rows || []), `Row ${question.rows?.length + 1 || 1}`]);
    const addColumn = () => handleNestedChange('columns', [...(question.columns || []), `Column ${question.columns?.length + 1 || 1}`]);
    const updateRow = (i, val) => handleNestedChange('rows', question.rows.map((r, idx) => idx === i ? val : r));
    const updateColumn = (i, val) => handleNestedChange('columns', question.columns.map((c, idx) => idx === i ? val : c));
    const deleteRow = (i) => handleNestedChange('rows', question.rows.filter((_, idx) => idx !== i));
    const deleteColumn = (i) => handleNestedChange('columns', question.columns.filter((_, idx) => idx !== i));

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Grid Rows and Columns</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button onClick={addRow} variant="outlined" size="small" startIcon={<AddIcon />}>Add Row</Button>
          <Button onClick={addColumn} variant="outlined" size="small" startIcon={<AddIcon />}>Add Column</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {question.columns?.map((col, colIndex) => (
                <TableCell key={colIndex}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      value={col}
                      onChange={(e) => updateColumn(colIndex, e.target.value)}
                      size="small"
                      variant="standard"
                    />
                    <Tooltip title="Delete Column"><IconButton size="small" onClick={() => deleteColumn(colIndex)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {question.rows?.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      value={row}
                      onChange={(e) => updateRow(rowIndex, e.target.value)}
                      size="small"
                      variant="standard"
                    />
                    <Tooltip title="Delete Row"><IconButton size="small" onClick={() => deleteRow(rowIndex)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </TableCell>
                {question.columns?.map((_, colIndex) => (
                  <TableCell key={colIndex}><input type="radio" disabled /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DragIcon sx={{ color: 'text.secondary', mr: 1, cursor: 'move' }} />
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{index + 1}</Typography>
        <Select
          value={question.type}
          onChange={(e) => handleChange('type', e.target.value)}
          size="small"
          sx={{ minWidth: 150, mr: 2 }}
        >
          {questionTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
          ))}
        </Select>
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Duplicate Question">
            <IconButton size="small" onClick={onDuplicate} sx={{ mr: 1 }}>
              <DuplicateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Question">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TextField
        fullWidth
        label="Question"
        value={question.title}
        onChange={(e) => handleChange('title', e.target.value)}
        sx={{ mb: 1 }}
      />
      <TextField
        fullWidth
        label="Description"
        value={question.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        size="small"
        sx={{ mb: 2 }}
        multiline
        maxRows={3}
      />

      {renderOptions()}
      {renderLinearScale()}
      {renderGrid()}

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={question.required}
              onChange={(e) => handleChange('required', e.target.checked)}
              size="small"
            />
          }
          label="Required"
        />
      </Box>
    </Paper>
  );
}

export default QuestionCard;
