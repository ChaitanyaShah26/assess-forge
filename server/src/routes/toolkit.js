import express from 'express';
import dotenv from 'dotenv';
import { jsonrepair } from 'jsonrepair';

dotenv.config();

const router = express.Router();
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';

if (!MISTRAL_API_KEY) {
  console.warn('WARNING: MISTRAL_API_KEY is missing on toolkit router.');
}

/**
 * POST /api/toolkit/rewrite-question
 * Rewrites a draft question to match a specific Bloom's Taxonomy cognitive level.
 */
router.post('/rewrite-question', async (req, res) => {
  try {
    const { questionText, cognitiveLevel } = req.body;
    if (!questionText || !cognitiveLevel) {
      return res.status(400).json({ error: 'questionText and cognitiveLevel parameters are mandatory.' });
    }

    if (!MISTRAL_API_KEY) {
      return res.status(500).json({ error: 'Mistral API key is missing on the server.' });
    }

    const systemPrompt = `You are an academic evaluation expert specialized in Bloom's Taxonomy.
Your task is to rewrite the provided question so that it strictly evaluates the student's cognitive capability at this specific level: "${cognitiveLevel}".
Provide the rewritten question, and a short explanation of how the changes target this specific cognitive level.

You MUST return your output in strict JSON format matching this schema:
{
  "rewrittenQuestion": "The newly drafted, high-quality question string.",
  "explanation": "Brief 1-2 sentence explanation of how this matches the target taxonomy."
}
Do not write any conversational text before or after the JSON block.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Original Question: "${questionText}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: `Mistral API Failure: ${errorText}` });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const repaired = jsonrepair(rawContent.trim());
    const parsedData = JSON.parse(repaired);

    return res.json({ success: true, result: parsedData });

  } catch (error) {
    console.error('Error in question rewriter endpoint:', error);
    return res.status(500).json({ error: 'Internal server processing failure.' });
  }
});

/**
 * POST /api/toolkit/generate-rubric
 * Generates a structured 4-level grading rubric table.
 */
router.post('/generate-rubric', async (req, res) => {
  try {
    const { topic, criteria } = req.body;
    if (!topic || !criteria) {
      return res.status(400).json({ error: 'topic and criteria parameters are mandatory.' });
    }

    const systemPrompt = `You are an expert curriculum coordinator.
Your task is to generate a comprehensive 4-level grading rubric table for the topic: "${topic}".
Evaluate the work across these specified criteria columns: "${criteria}".

For each criterion, provide detailed descriptor cells for:
- "excellent" (Score: 4)
- "good" (Score: 3)
- "fair" (Score: 2)
- "poor" (Score: 1)

You MUST return your output in strict JSON format matching this schema:
{
  "rubric": [
    {
      "criterion": "Name of the evaluating criterion (e.g., Code Efficiency, Grammar)",
      "excellent": "Descriptor for excellent execution.",
      "good": "Descriptor for good execution.",
      "fair": "Descriptor for fair execution.",
      "poor": "Descriptor for poor execution."
    }
  ]
}
Do not write any conversational text before or after the JSON block.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate rubric for topic: "${topic}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: `Mistral API Failure: ${errorText}` });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const repaired = jsonrepair(rawContent.trim());
    const parsedData = JSON.parse(repaired);

    return res.json({ success: true, rubric: parsedData.rubric });

  } catch (error) {
    console.error('Error in rubric generator endpoint:', error);
    return res.status(500).json({ error: 'Internal server processing failure.' });
  }
});

/**
 * POST /api/toolkit/generate-activity
 * Generates an active learning group exercise.
 */
router.post('/generate-activity', async (req, res) => {
  try {
    const { subjectTopic, groupSize } = req.body;
    if (!subjectTopic || !groupSize) {
      return res.status(400).json({ error: 'subjectTopic and groupSize parameters are mandatory.' });
    }

    const systemPrompt = `You are a progressive educational designer.
Your task is to design an active, engaging, highly interactive classroom group activity for the topic: "${subjectTopic}".
Assume students are grouped in sizes of: "${groupSize}".

Provide:
- "title": A catchy, professional name for the activity.
- "setup": Clear instructions on how the teacher should configure the classroom.
- "duration": Target time allocation (e.g. 45 minutes).
- "steps": A chronological array of instructions for the students.
- "prompt": A central debate prompt or challenge question to drive the exercise.

You MUST return your output in strict JSON format matching this schema:
{
  "title": "Name of Activity",
  "setup": "Setup instructions for the teacher.",
  "duration": "Duration in minutes",
  "steps": ["Step 1 description", "Step 2 description", "Step 3 description"],
  "prompt": "Central debate/challenge question"
}
Do not write any conversational text before or after the JSON block.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Design group activity for: "${subjectTopic}" with group sizes: "${groupSize}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: `Mistral API Failure: ${errorText}` });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const repaired = jsonrepair(rawContent.trim());
    const parsedData = JSON.parse(repaired);

    return res.json({ success: true, result: parsedData });

  } catch (error) {
    console.error('Error in activity designer endpoint:', error);
    return res.status(500).json({ error: 'Internal server processing failure.' });
  }
});

export default router;