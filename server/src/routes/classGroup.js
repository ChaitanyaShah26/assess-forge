import express from 'express';
import { ClassGroup } from '../models/ClassGroup.js';
import { Assignment } from '../models/Assignment.js';

const router = express.Router();

/**
 * GET /api/class-groups
 * Lists all active classes
 */
router.get('/', async (req, res) => {
  try {
    const groups = await ClassGroup.find()
      .populate('dispatches.paperId')
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
    const { name, grade, subject } = req.body;
    if (!name || !grade || !subject) {
      return res.status(400).json({ error: 'Missing required configuration keys.' });
    }

    const newGroup = new ClassGroup({ name, grade, subject, students: [], dispatches: [] });
    const savedGroup = await newGroup.save();
    return res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Failed to create class group:', error);
    return res.status(500).json({ error: 'Internal server insertion failure.' });
  }
});

/**
 * PUT /api/class-groups/:id
 * Updates class metadata
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, grade, subject } = req.body;
    const updated = await ClassGroup.findByIdAndUpdate(
      req.params.id,
      { name, grade, subject },
      { new: true }
    ).populate('dispatches.paperId');
    return res.json(updated);
  } catch (error) {
    console.error('Failed to update group:', error);
    return res.status(500).json({ error: 'Internal server update failure.' });
  }
});

/**
 * DELETE /api/class-groups/:id
 * Deletes class group
 */
router.delete('/:id', async (req, res) => {
  try {
    await ClassGroup.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Class group deleted.' });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return res.status(500).json({ error: 'Internal server deletion failure.' });
  }
});

/**
 * POST /api/class-groups/:id/students
 * Handles manual additions and bulk CSV arrays uploads
 */
router.post('/:id/students', async (req, res) => {
  try {
    const { studentsList } = req.body; // Expects array of { rollNo, name, email }
    if (!studentsList || !Array.isArray(studentsList)) {
      return res.status(400).json({ error: 'studentsList array is mandatory.' });
    }

    const group = await ClassGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Class not found.' });

    // Append students cleanly
    group.students.push(...studentsList);
    await group.save();

    return res.json({ success: true, group });
  } catch (error) {
    console.error('Failed to save students:', error);
    return res.status(500).json({ error: 'Internal database insertion failure.' });
  }
});

/**
 * POST /api/class-groups/:id/dispatch
 * Simulates email dispatch delivery status
 */
router.post('/:id/dispatch', async (req, res) => {
  try {
    const { paperId } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is mandatory.' });

    const assignment = await Assignment.findById(paperId);
    if (!assignment) return res.status(404).json({ error: 'Assessment not found.' });

    const group = await ClassGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Class not found.' });

    // Prevent duplicate dispatch logs
    const isAlreadySent = group.dispatches.some(d => d.paperId.toString() === paperId);
    if (isAlreadySent) {
      return res.status(400).json({ error: 'This assessment has already been dispatched to this class.' });
    }

    // Append new dispatch record
    group.dispatches.push({ paperId, status: 'DELIVERED' });
    await group.save();

    return res.json({ success: true, message: 'Assessment dispatched successfully.', group });
  } catch (error) {
    console.error('Failed to dispatch paper:', error);
    return res.status(500).json({ error: 'Internal dispatch loop error.' });
  }
});

export default router;