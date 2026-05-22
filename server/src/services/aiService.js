import dotenv from 'dotenv';

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';

if (!MISTRAL_API_KEY) {
  console.warn('WARNING: MISTRAL_API_KEY is missing. AI generation will fail until it is added.');
}

const cleanJSONString = (raw) => {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

export const generateAssessmentPaper = async ({
  configs,
  totalQuestions,
  totalMarks,
  additionalInstructions,
  sourceText
}) => {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API Key is missing on the server config.');
  }

  const configSummary = configs.map(cfg => 
    `- Type: "${cfg.type}", count: ${cfg.count}, marks per question: ${cfg.marksPerQuestion}`
  ).join('\n');

  const systemPrompt = `You are an expert curriculum designer and academic evaluation builder.
Your task is to generate a comprehensive, structured exam assessment paper based on provided configuration details and optional reference texts.

CRITICAL RULES:
1. You MUST generate exactly the requested number of questions of each type.
2. The total sum of all questions across sections must equal exactly ${totalQuestions}.
3. The total marks of all questions must sum up to exactly ${totalMarks}.
4. Map each requested "question type" into its own logical section (e.g. Section A: Multiple Choice Questions, Section B: Short Questions, etc.).
5. For difficulty, assign each question one of these strict values: "Easy", "Moderate", or "Challenging".
6. If reference text is provided, you MUST construct the questions factually and strictly from that content alone.
7. You MUST return your output in strict JSON format matching the schema details. Do not include extra conversational text outside the JSON block.

REQUIRED SCHEMA SPECIFICATION:
{
  "title": "Mumbai High School",
  "subject": "<Determine or infer the main subject, e.g. English, Science, Physics, Chemistry>",
  "class": "<Infer the appropriate class level from text or instructions, default to Class 8th>",
  "timeAllowed": "45 minutes",
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "sectionName": "Section A: Multiple Choice Questions",
      "instruction": "Attempt all questions in this section.",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "The question content string goes here.",
          "difficulty": "Easy",
          "marks": 1
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": "Detailed correct explanation or answer string goes here."
    }
  ]
}`;

  const userPrompt = `Generate an assessment paper matching the parameters:

### Core Configuration:
- Target Total Questions: ${totalQuestions}
- Target Total Marks: ${totalMarks}

### Question Allocation Details:
${configSummary}

### Optional User Guidelines / Specific Chapters:
${additionalInstructions || 'None provided.'}

### Uploaded Reference Source Material:
${sourceText ? `--- BEGIN CONTENT ---\n${sourceText}\n--- END CONTENT ---` : 'No file content uploaded. Use standard, high-quality grade-appropriate content matching instructions.'}

Generate and populate the output matching the schema rules completely. Ensure the answerKey corresponds matching the questionNumbers.`;

  try {
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
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }, 
        temperature: 0.2 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const cleanedContent = cleanJSONString(rawContent);

    const parsedData = JSON.parse(cleanedContent);

    if (!parsedData.sections || !parsedData.answerKey || !parsedData.title) {
      throw new Error('LLM output parsed successfully but lacks required schema fields.');
    }

    return parsedData;

  } catch (error) {
    console.error('Error in aiService during parsing or API query:', error);
    throw new Error(`AI Paper Generation Failed: ${error.message}`);
  }
};