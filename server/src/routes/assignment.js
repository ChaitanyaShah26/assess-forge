import express from 'express';
import multer from 'multer';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { addAssignmentJob } from '../queue/assessmentQueue.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { 
      dueDate, 
      configs, 
      totalQuestions, 
      totalMarks, 
      additionalInstructions 
    } = req.body;

    if (!dueDate || !totalQuestions || !totalMarks) {
      return res.status(400).json({ error: 'Missing mandatory configuration values.' });
    }

    let fileId = null;

    if (req.file) {
      const newUpload = new Upload({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      });
      const savedUpload = await newUpload.save();
      fileId = savedUpload._id;
    }

    let parsedConfigs = [];
    if (configs) {
      try {
        parsedConfigs = JSON.parse(configs);
      } catch (e) {
        return res.status(400).json({ error: 'Configs schema must be valid JSON.' });
      }
    }

    const assignment = new Assignment({
      status: 'PENDING',
      fileId,
      dueDate: new Date(dueDate),
      configs: parsedConfigs,
      totalQuestions: parseInt(totalQuestions, 10),
      totalMarks: parseInt(totalMarks, 10),
      additionalInstructions: additionalInstructions || ''
    });

    const savedAssignment = await assignment.save();

    const job = await addAssignmentJob(savedAssignment._id.toString());

    return res.status(201).json({
      success: true,
      message: 'Assignment queued for generation.',
      assignmentId: savedAssignment._id,
      jobId: job.id
    });

  } catch (error) {
    console.error('Error creating assignment request:', error);
    return res.status(500).json({ error: 'Internal system generation failure.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate({ path: 'fileId', select: '-data' }) 
      .sort({ createdAt: -1 });

    return res.json(assignments);
  } catch (error) {
    console.error('Failed to list assignments:', error);
    return res.status(500).json({ error: 'Internal server query failure.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({ path: 'fileId', select: '-data' });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    return res.json(assignment);
  } catch (error) {
    console.error('Failed to retrieve assignment detailed data:', error);
    return res.status(500).json({ error: 'Internal database read error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    if (assignment.fileId) {
      await Upload.findByIdAndDelete(assignment.fileId);
    }

    await Assignment.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Assignment successfully deleted.' });
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    return res.status(500).json({ error: 'Internal delete operation failure.' });
  }
});

router.post('/parse-preview', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    let extractedText = '';

    if (req.file.mimetype === 'text/plain') {
      extractedText = req.file.buffer.toString('utf-8');
    } else if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const parsedData = await pdfParse(req.file.buffer);
        extractedText = parsedData.text;
      } catch (pdfErr) {
        console.error('Internal PDF parser failure:', pdfErr);
        return res.status(500).json({ error: 'Failed to extract text from PDF document.' });
      }
    } else {
      extractedText = req.file.buffer.toString('utf-8');
    }

    return res.json({
      success: true,
      filename: req.file.originalname,
      extractedText: extractedText
    });

  } catch (error) {
    console.error('Error parsing file preview:', error);
    return res.status(500).json({ error: 'Internal server parser error.' });
  }
});

export default router;