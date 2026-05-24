import express from 'express';
import { ClassGroup } from '../models/ClassGroup.js';

const router = express.Router();

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

router.post('/:id/assign', async (req, res) => {
  try {
    const { paperId } = req.body;
    if (!paperId) {
      return res.status(400).json({ error: 'paperId is mandatory.' });
    }

    const group = await ClassGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Class group not found.' });
    }

    if (group.assignedPapers.includes(paperId)) {
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