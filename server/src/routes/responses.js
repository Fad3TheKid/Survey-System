const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Form = require('../models/Form');

// Get all responses for a form
router.get('/form/:formId', async (req, res) => {
  try {
    const responses = await Response.find({ formId: req.params.formId });
    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
});

// Get a single response by ID
router.get('/:id', async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ message: 'Response not found' });
    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ message: 'Failed to fetch response' });
  }
});

// Submit a new response
router.post('/', async (req, res) => {
  try {
    const { formId, answers, respondentEmail, startTime } = req.body;

    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    if (!form.isPublished) return res.status(403).json({ message: 'Form is not accepting responses' });

    // Check limitOneResponse if enabled
    if (form.settings?.limitOneResponse && respondentEmail) {
      const existing = await Response.findOne({ formId, respondentEmail });
      if (existing) {
        return res.status(400).json({ message: 'You have already submitted a response' });
      }
    }

    // Add metadata
    const newResponse = new Response({
      formId,
      answers: answers.map((ans, idx) => ({
        questionId: ans.questionId || ans.id || `q${idx}`,
        type: ans.type,
        value: ans.value,
        timestamp: ans.timestamp || new Date(),
      })),
      respondentEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      startTime,
      endTime: new Date(),
    });

    await newResponse.save();
    res.status(201).json(newResponse);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(400).json({ message: 'Failed to submit response' });
  }
});

// Delete a response
router.delete('/:id', async (req, res) => {
  try {
    const response = await Response.findByIdAndDelete(req.params.id);
    if (!response) return res.status(404).json({ message: 'Response not found' });
    res.json({ message: 'Response deleted' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ message: 'Failed to delete response' });
  }
});

// Get response statistics for a form
router.get('/form/:formId/stats', async (req, res) => {
  try {
    const responses = await Response.find({ formId: req.params.formId });

    const stats = {
      totalResponses: responses.length,
      averageDuration: 0,
      questionStats: {},
    };

    if (responses.length > 0) {
      const totalDuration = responses.reduce((acc, curr) => {
        const start = curr.startTime || new Date();
        const end = curr.endTime || new Date();
        return acc + (end - start);
      }, 0);
      stats.averageDuration = totalDuration / responses.length;
    }

    responses.forEach(response => {
      response.answers.forEach(answer => {
        if (!stats.questionStats[answer.questionId]) {
          stats.questionStats[answer.questionId] = {
            totalAnswers: 0,
            answerDistribution: {},
          };
        }
        const stat = stats.questionStats[answer.questionId];
        stat.totalAnswers++;

        if (Array.isArray(answer.value)) {
          answer.value.forEach(val => {
            stat.answerDistribution[val] = (stat.answerDistribution[val] || 0) + 1;
          });
        } else {
          stat.answerDistribution[answer.value] = (stat.answerDistribution[answer.value] || 0) + 1;
        }
      });
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching response statistics:', error);
    res.status(500).json({ message: 'Failed to fetch response statistics' });
  }
});

module.exports = router;
