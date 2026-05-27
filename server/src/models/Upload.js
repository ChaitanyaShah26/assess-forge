import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number, 
      required: true
    },
    data: {
      type: Buffer, 
      required: true
    },
    isLibraryFile: {
      type: Boolean,
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

export const Upload = mongoose.model('Upload', uploadSchema);