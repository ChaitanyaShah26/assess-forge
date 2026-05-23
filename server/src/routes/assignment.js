import express from 'express';
import { createRequire } from 'module';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { addAssignmentJob } from '../queue/assessmentQueue.js';

const router = express.Router();

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse'); // Dynamic loader

const storage = express.urlencoded({ extended: true }); // Standard multer memory storage fallback
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Strict 10MB limit
  }
});

/**
 * Universal PDF Text Extractor Helper.
 * Handles both v1 (function) and v2 (PDFParse class) variants seamlessly.
 */
const parsePDFBuffer = async (buffer) => {
  // Case 1: Standard legacy v1 function export (CJS direct function)
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer);
    return data.text;
  }
  
  // Case 2: ES Module wrapped v1 function (default function export)
  if (pdfModule && typeof pdfModule.default === 'function') {
    const data = await pdfModule.default(buffer);
    return data.text;
  }
  
  // Case 3: Modern v2 TypeScript/ESM export class (PDFParse)
  if (pdfModule && typeof pdfModule.PDFParse === 'function') {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === 'function') {
      await parser.destroy(); // Releases memory streams
    }
    return result.text;
  }

  throw new Error('Unsupported pdf-parse library structure or version.');
};

/**
 * POST /api/assignments/parse-preview
 */
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
        extractedText = await parsePDFBuffer(req.file.buffer);
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

/**
 * POST /api/assignments
 */
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

/**
 * GET /api/assignments
 */
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

/**
 * GET /api/assignments/:id
 */
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

/**
 * DELETE /api/assignments/:id
 */
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

export default router;