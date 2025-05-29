// routes/forms.js
const express = require('express');
const router = express.Router();
const Form = require('../models/Form'); // Ensure this path is correct

// POST /api/forms — create a new form
router.post('/', async (req, res) => {
  console.log('[POST] /api/forms hit'); // Debug log

  try {
    const formData = req.body;

    // Basic validation
    if (!formData.title || !formData.createdBy) {
      return res.status(400).json({ message: 'Title and creator ID are required' });
    }

    // Log the incoming data
    console.log('Incoming form data:', formData);

    const form = new Form(formData);
    const savedForm = await form.save();
    console.log('Saved form:', savedForm); // Debug log
    res.status(201).json(savedForm);
  } catch (err) {
    console.error('Error saving form:', err.message);
    console.error('Stack trace:', err.stack); // Log the stack trace for more details
    console.error('Full error object:', err);
    console.error('Request body:', req.body);

    // Check for specific Mongoose validation errors
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      res.status(400).json({ message: 'Validation failed', errors: err.errors });
    } else {
      res.status(400).json({ message: 'Failed to save form', error: err.message });
    }
  }
});

// GET /api/forms — fetch all forms
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find();
    res.status(200).json(forms);
  } catch (err) {
    console.error('Error fetching forms:', err.message);
    res.status(500).json({ message: 'Failed to fetch forms' });
  }
});

module.exports = router;
