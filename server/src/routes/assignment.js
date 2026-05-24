import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { addAssignmentJob } from '../queue/assessmentQueue.js';

const router = express.Router();
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

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


router.get('/dashboard-metrics', async (req, res) => {
  try {
    const assignmentsCount = await Assignment.countDocuments({ assignmentType: 'ASSIGNMENT' });
    const examsCount = await Assignment.countDocuments({ assignmentType: 'EXAM' });
    const totalCreated = assignmentsCount + examsCount;

    const groups = await ClassGroup.find();
    const totalStudents = groups.reduce((sum, g) => sum + g.studentCount, 0);

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
      additionalInstructions 
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

export default router;