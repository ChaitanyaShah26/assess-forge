import mongoose from 'mongoose';

const classGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    }, 
    grade: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    studentCount: {
      type: Number,
      required: true,
      default: 0
    },
    assignedPapers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
      }
    ]
  },
  { 
    timestamps: true 
  }
);

export const ClassGroup = mongoose.model('ClassGroup', classGroupSchema);