import express from 'express';
import { ClassGroup } from '../models/ClassGroup.js';
import { Assignment } from '../models/Assignment.js'; // Import assignment model for verification

const router = express.Router();

/**
 * GET /api/class-groups
 * Lists all active classes
 */
router.get('/', async (req, res) => {
  try {
    const groups = await ClassGroup.find()
      .populate('assignedPapers')
      .sort({ createdAt: -1 });
    return res.json(groups);
  } catch (error) {
    console.error('Failed to query class groups:', error);
    return res.status(500).json({ error: 'Internal server query failure.' });
  }
});

/**
 * POST /api/class-groups
 * Creates a new student classroom directory
 */
router.post('/', async (req, res) => {
  try {
    const { name, grade, subject, studentCount } = req.body;

    if (!name || !grade || !subject) {
      return res.status(400).json({ error: 'Missing required configuration keys.' });
    }

    const newGroup = new ClassGroup({
      name,
      grade,
      subject,
      studentCount: parseInt(studentCount, 10) || 0
    });

    const savedGroup = await newGroup.save();
    return res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Failed to create class group:', error);
    return res.status(500).json({ error: 'Internal server insertion failure.' });
  }
});

/**
 * POST /api/class-groups/:id/assign
 * Dispatches an existing completed exam paper to a specific section
 */
router.post('/:id/assign', async (req, res) => {
  try {
    const { paperId } = req.body;
    if (!paperId) {
      return res.status(400).json({ error: 'paperId is mandatory.' });
    }

    // 1. Verify that the assignment paper actually exists in the database
    const assignment = await Assignment.findById(paperId);
    if (!assignment) {
      return res.status(444).json({ error: 'Assessment paper was not found in the system registry.' });
    }

    // 2. Prevent dispatching failed or incomplete paper drafts
    if (assignment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Only successfully generated papers with active question sheets can be deployed.' });
    }

    const group = await ClassGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Class group not found.' });
    }

    // 3. Robust duplicate check: Converts BSON ObjectIds to strings before comparing
    const isAlreadyAssigned = group.assignedPapers.some(id => id.toString() === paperId);
    if (isAlreadyAssigned) {
      return res.status(400).json({ error: 'This paper has already been dispatched to this class.' });
    }

    group.assignedPapers.push(paperId);
    await group.save();

    return res.json({ success: true, message: 'Paper successfully dispatched.', group });
  } catch (error) {
    console.error('Failed to dispatch paper:', error);
    return res.status(500).json({ error: 'Internal database dispatch error.' });
  }
});

export default router;