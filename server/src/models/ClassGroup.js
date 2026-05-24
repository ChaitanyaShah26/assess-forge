import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNo: { 
    type: String, 
    required: true, 
    trim: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true
  }
});

const dispatchLogSchema = new mongoose.Schema({
  paperId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: true 
  },
  dispatchedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['SENT', 'DELIVERED', 'OPENED', 'FAILED'], 
    default: 'DELIVERED' 
  }
});

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
    students: [studentSchema], // Complete student directory
    dispatches: [dispatchLogSchema] // Complete simulated dispatch history log
  },
  { 
    timestamps: true 
  }
);

export const ClassGroup = mongoose.model('ClassGroup', classGroupSchema);