const mongoose = require('mongoose');
const Form = require('./models/Form'); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/formsdb';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // Remove all old forms
    await Form.deleteMany({});

    const sampleForm = new Form({
      title: 'Customer Satisfaction Survey',
      description: 'Please fill out this survey to help us improve our services.',
      createdBy: 'admin-user-123',
      isPublished: true,
      questions: [
        {
          type: 'multiple',
          title: 'How satisfied are you with our service?',
          required: true,
          options: [
            { text: 'Very satisfied', value: 'very_satisfied' },
            { text: 'Satisfied', value: 'satisfied' },
            { text: 'Neutral', value: 'neutral' },
            { text: 'Dissatisfied', value: 'dissatisfied' },
            { text: 'Very dissatisfied', value: 'very_dissatisfied' },
          ],
          settings: {
            shuffleOptions: false,
          },
        },
        {
          type: 'paragraph',
          title: 'Please provide additional comments',
          required: false,
        },
        {
          type: 'linear',
          title: 'Rate the quality of our products',
          required: true,
          settings: {
            linearScale: {
              min: 1,
              max: 10,
              minLabel: 'Poor',
              maxLabel: 'Excellent',
            },
          },
        },
      ],
    });

    await sampleForm.save();

    console.log('Sample form created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
