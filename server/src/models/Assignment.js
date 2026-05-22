import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionNumber: { 
    type: Number, 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Moderate', 'Challenging'], 
    required: true 
  },
  marks: { 
    type: Number, 
    required: true 
  }
});

const sectionSchema = new mongoose.Schema({
  sectionName: { 
    type: String, 
    required: true 
  }, // e.g. "Section A"
  instruction: { 
    type: String 
  }, // e.g. "Attempt all questions."
  questions: [questionSchema]
});

const answerKeySchema = new mongoose.Schema({
  questionNumber: { 
    type: Number, 
    required: true 
  },
  answer: { 
    type: String, 
    required: true 
  }
});

const assessmentPaperSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  class: { 
    type: String, 
    required: true 
  },
  timeAllowed: { 
    type: String, 
    required: true 
  },
  maxMarks: { 
    type: Number, 
    required: true 
  },
  sections: [sectionSchema],
  answerKey: [answerKeySchema]
});

const questionTypeConfigSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true 
  }, // e.g. "Multiple Choice Questions"
  count: { 
    type: Number, 
    required: true 
  },
  marksPerQuestion: { 
    type: Number, 
    required: true 
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'FAILED', 'COMPLETED'],
      default: 'PENDING'
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      default: null
    },
    dueDate: {
      type: Date,
      required: true
    },
    configs: [questionTypeConfigSchema], 
    totalQuestions: {
      type: Number,
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    additionalInstructions: {
      type: String,
      default: ''
    },
    generatedPaper: {
      type: assessmentPaperSchema,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);