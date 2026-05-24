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
  },
  
  options: [
    { 
      type: String 
    }
  ], 
  
  diagramSvg: { 
    type: String 
  } 
});
const sectionSchema = new mongoose.Schema({
  sectionName: { type: String, required: true },
  instruction: { type: String },
  questions: [questionSchema]
});

const answerKeySchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  answer: { type: String, required: true }
});

const assessmentPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  timeAllowed: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  sections: [sectionSchema],
  answerKey: [answerKeySchema]
});

const questionTypeConfigSchema = new mongoose.Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true },
  marksPerQuestion: { type: Number, required: true }
});

const assignmentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'FAILED', 'COMPLETED'],
      default: 'PENDING'
    },
    assignmentType: {
      type: String,
      enum: ['ASSIGNMENT', 'EXAM'],
      default: 'ASSIGNMENT'
    },
    academicYear: {
      type: String,
      required: true
    },
    classLevel: {
      type: String,
      required: true
    },
    subjectName: {
      type: String,
      required: true
    },
    
    // Conditional Assignment Fields
    assignmentTitle: {
      type: String,
      required: function() { return this.assignmentType === 'ASSIGNMENT'; }
    },
    dueDate: {
      type: Date,
      required: function() { return this.assignmentType === 'ASSIGNMENT'; }
    },

    // Conditional Exam Fields
    examDate: {
      type: Date,
      required: function() { return this.assignmentType === 'EXAM'; }
    },
    examTiming: {
      type: String,
      required: function() { return this.assignmentType === 'EXAM'; }
    },

    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      default: null
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