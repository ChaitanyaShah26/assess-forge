import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { addAssignmentJob } from '../queue/assessmentQueue.js';

const router = express.Router();
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse'); // Dynamic version loader

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * Universal PDF Text Extractor Helper.
 * Handles both v1 (function) and v2 (PDFParse class) variants seamlessly.
 */
const parsePDFBuffer = async (buffer) => {
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer);
    return data.text;
  }
  if (pdfModule && typeof pdfModule.default === 'function') {
    const data = await pdfModule.default(buffer);
    return data.text;
  }
  if (pdfModule && typeof pdfModule.PDFParse === 'function') {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
    return result.text;
  }
  throw new Error('Unsupported pdf-parse library structure or version.');
};

/* ==========================================================================
   1. STATIC SUB-ROUTES (Must be defined first to prevent parameter hijacking)
   ========================================================================== */

/**
 * POST /api/assignments/parse-preview
 * Direct in-memory buffer parsing.
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
 * GET /api/assignments/dashboard-metrics
 * Aggregates real-time statistics from MongoDB collections.
 */
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const assignmentsCount = await Assignment.countDocuments({ assignmentType: 'ASSIGNMENT' });
    const examsCount = await Assignment.countDocuments({ assignmentType: 'EXAM' });
    const totalCreated = assignmentsCount + examsCount;

    const groups = await ClassGroup.find();
    const totalStudents = groups.reduce((sum, g) => {
      const count = g.students ? g.students.length : 0;
      return sum + count;
    }, 0);

    const recentActivity = await Assignment.find()
      .populate({ path: 'fileId', select: '-data' })
      .sort({ createdAt: -1 })
      .limit(4);

    return res.json({
      totalCreated,
      assignmentsCount,
      examsCount,
      totalStudents,
      totalGroups: groups.length,
      recentActivity
    });
  } catch (error) {
    console.error('Error generating aggregate dashboard metrics:', error);
    return res.status(500).json({ error: 'Internal aggregation pipeline failure.' });
  }
});

/**
 * GET /api/assignments/library
 * Lists all documents uploaded into the My Library repository.
 */
router.get('/library', async (req, res) => {
  try {
    const libraryFiles = await Upload.find({ isLibraryFile: true })
      .select('-data')
      .sort({ createdAt: -1 });
    return res.json(libraryFiles);
  } catch (error) {
    console.error('Failed to query library:', error);
    return res.status(500).json({ error: 'Internal server query failure.' });
  }
});

/**
 * POST /api/assignments/library
 * Uploads a document directly to the My Library vault.
 */
router.post('/library', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const newLibraryDoc = new Upload({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      isLibraryFile: true
    });

    const savedDoc = await newLibraryDoc.save();
    
    const responseDoc = savedDoc.toObject();
    delete responseDoc.data;

    return res.status(201).json(responseDoc);
  } catch (error) {
    console.error('Failed to save library document:', error);
    return res.status(500).json({ error: 'Internal server insertion failure.' });
  }
});

/**
 * GET /api/assignments/library/:id/text
 * RESOLVED: Retrieves and parses the actual text of a specific library document.
 * Placed above dynamic parameters to prevent route hijacking.
 */
router.get('/library/:id/text', async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Library document not found.' });
    }

    let extractedText = '';
    if (upload.mimetype === 'text/plain') {
      extractedText = upload.data.toString('utf-8');
    } else if (upload.mimetype === 'application/pdf') {
      try {
        extractedText = await parsePDFBuffer(upload.data);
      } catch (pdfErr) {
        console.error('Failed parsing library PDF binary stream:', pdfErr);
        return res.status(500).json({ error: 'Failed to extract text from PDF document.' });
      }
    } else {
      extractedText = upload.data.toString('utf-8');
    }

    return res.json({ success: true, text: extractedText });
  } catch (error) {
    console.error('Failed to retrieve library file text:', error);
    return res.status(500).json({ error: 'Internal server query error.' });
  }
});

/**
 * DELETE /api/assignments/library/:id
 * Deletes a document from the My Library repository.
 */
router.delete('/library/:id', async (req, res) => {
  try {
    const deleted = await Upload.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    return res.json({ success: true, message: 'Library document successfully deleted.' });
  } catch (error) {
    console.error('Failed to delete library document:', error);
    return res.status(500).json({ error: 'Internal server deletion failure.' });
  }
});

/* ==========================================================================
   2. GENERAL ROUTING ENDPOINTS
   ========================================================================== */

/**
 * POST /api/assignments
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { 
      assignmentType,
      academicYear,
      classLevel,
      subjectName,
      assignmentTitle,
      dueDate,
      examDate,
      examTiming,
      configs, 
      totalQuestions, 
      totalMarks, 
      additionalInstructions,
      libraryFileId
    } = req.body;

    if (!assignmentType || !academicYear || !classLevel || !subjectName || !totalQuestions || !totalMarks) {
      return res.status(400).json({ error: 'Missing global mandatory configuration parameters.' });
    }

    if (assignmentType === 'ASSIGNMENT' && (!dueDate || !assignmentTitle)) {
      return res.status(400).json({ error: 'Due Date and Assignment Title are required for assignments.' });
    }
    if (assignmentType === 'EXAM' && (!examDate || !examTiming)) {
      return res.status(400).json({ error: 'Exam Date and Exam Timings are required for exam papers.' });
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
    } else if (libraryFileId && libraryFileId !== 'undefined' && libraryFileId !== '') {
      fileId = libraryFileId;
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
      assignmentType,
      academicYear,
      classLevel,
      subjectName,
      assignmentTitle: assignmentType === 'ASSIGNMENT' ? assignmentTitle : undefined,
      dueDate: assignmentType === 'ASSIGNMENT' ? new Date(dueDate) : undefined,
      examDate: assignmentType === 'EXAM' ? new Date(examDate) : undefined,
      examTiming: assignmentType === 'EXAM' ? examTiming : undefined,
      fileId,
      configs: parsedConfigs,
      totalQuestions: parseInt(totalQuestions, 10),
      totalMarks: parseInt(totalMarks, 10),
      additionalInstructions: additionalInstructions || ''
    });

    const savedAssignment = await assignment.save();
    const job = await addAssignmentJob(savedAssignment._id.toString());

    return res.status(201).json({
      success: true,
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

/* ==========================================================================
   3. DYNAMIC DUAL-VERB PARAMETER WILDCARDS (Must be defined last)
   ========================================================================== */

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