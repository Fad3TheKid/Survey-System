const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: String,
  type: String,
  value: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

const responseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  answers: [answerSchema],
  respondentEmail: String,
  ipAddress: String,
  userAgent: String,
  startTime: Date,
  endTime: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Response', responseSchema);
