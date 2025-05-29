const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  value: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['short', 'paragraph', 'multiple', 'checkbox', 'dropdown', 'linear', 'grid', 'email', 'number', 'phone', 'url'],
  },
  title: { 
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [500, 'Question title max length is 500 characters'],
  },
  description: { 
    type: String, 
    trim: true, 
    default: '', 
    maxlength: [1000, 'Question description max length is 1000 characters'] 
  },
  required: { type: Boolean, default: false },
  options: {
    type: [optionSchema],
    default: [],
    // Optionally, add validation for options presence if question type needs it
  },
  settings: {
    shuffleOptions: { type: Boolean, default: false },
    linearScale: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 5 },
      minLabel: { type: String, default: '' },
      maxLabel: { type: String, default: '' },
    },
    grid: {
      rows: { type: [String], default: [] },
      columns: { type: [String], default: [] },
    },
  },
});

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Form title is required'],
      default: 'Untitled form',
      trim: true,
      maxlength: [200, 'Form title max length is 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description max length is 1000 characters'],
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Form must contain at least one question',
      },
    },
    theme: {
      header: {
        type: String,
        default: '#1976d2',
        match: [/^#([0-9A-F]{3}){1,2}$/i, 'Header color must be a valid hex code'],
      },
      background: {
        type: String,
        default: '#ffffff',
        match: [/^#([0-9A-F]{3}){1,2}$/i, 'Background color must be a valid hex code'],
      },
    },
    settings: {
      collectEmail: { type: Boolean, default: false },
      limitOneResponse: { type: Boolean, default: false },
      showProgress: { type: Boolean, default: true },
    },
    createdBy: {
      type: String,
      required: [true, 'Form creator ID is required'],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: trim title & description
formSchema.pre('save', function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (this.description) {
    this.description = this.description.trim();
  }
  next();
});

module.exports = mongoose.model('Form', formSchema);
