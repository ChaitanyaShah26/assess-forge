import dotenv from 'dotenv';

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';

if (!MISTRAL_API_KEY) {
  console.warn('WARNING: MISTRAL_API_KEY is missing. AI generation will fail until it is added.');
}

/**
 * Defensive string sanitizer to clean up LLM markdown blocks, trailing commas,
 * and weird unescaped control characters before parsing.
 */
const sanitizeJSONString = (raw) => {
  let cleaned = raw.trim();
  
  // 1. Remove Markdown JSON code block wraps if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // 2. Fix trailing commas in objects or arrays (common LLM syntax error)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // 3. Remove raw, unescaped control characters (such as tab spaces) inside strings
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
    if (match === '\n') return '\\n';
    if (match === '\r') return '\\r';
    if (match === '\t') return '\\t';
    return '';
  });

  return cleaned;
};

/**
 * Queries Mistral AI to build a structured, syntactically valid question paper
 */
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

  // SYSTEM PROMPT: Enforces strict single-quote rules for inline text to protect JSON boundaries
  const systemPrompt = `You are an expert curriculum designer and academic evaluation builder.
Your task is to generate a comprehensive, structured exam assessment paper based on provided configurations.

CRITICAL JSON SYNTAX RULES:
1. You MUST return your output in strict JSON format matching the schema details.
2. Under no circumstances should you write raw, unescaped double-quotes (") inside a JSON string value. If you need to quote a term or phrase inside a sentence (e.g., 'Mixture of Experts', 'MoE', 'DeepSeek-V2', or 'Knowledge Distillation'), you MUST use single quotes (') instead. This is non-negotiable.
3. Make sure all paragraph breaks inside string values are properly escaped as '\\n'.
4. Do not include trailing commas in your JSON structure.
5. Do not write any conversational text before or after the JSON block.

CORE EXAM RULES:
1. You MUST generate exactly the requested number of questions of each type.
2. The total sum of all questions across sections must equal exactly ${totalQuestions}.
3. The total marks of all questions must sum up to exactly ${totalMarks}.
4. Map each requested "question type" into its own logical section (e.g. Section A: Multiple Choice Questions, Section B: Short Questions, etc.).
5. For difficulty, assign each question one of these strict values: "Easy", "Moderate", or "Challenging".
6. If reference text is provided, you MUST construct the questions factually and strictly from that content alone.

REQUIRED SCHEMA SPECIFICATION:
{
  "title": "Delhi Public School, Sector-4, Bokaro",
  "subject": "<Determine or infer the main subject, e.g. English, Science, Computer Science>",
  "class": "<Infer class level, default to Class 8th>",
  "timeAllowed": "45 minutes",
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "sectionName": "Section A: Multiple Choice Questions",
      "instruction": "Attempt all questions in this section.",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "The question text goes here.",
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

### Optional User Guidelines:
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
        response_format: { type: 'json_object' }, // Forces JSON Mode output
        temperature: 0.1 // Lower temp for more deterministic, fact-driven outputs
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const cleanedContent = sanitizeJSONString(rawContent);

    try {
      const parsedData = JSON.parse(cleanedContent);

      // Validate root schema components are present
      if (!parsedData.sections || !parsedData.answerKey || !parsedData.title) {
        throw new Error('LLM output parsed successfully but lacks required schema fields.');
      }

      return parsedData;
    } catch (parseError) {
      console.error('JSON Parse failed on cleaned content. Raw text snippet:', rawContent.substring(0, 500));
      throw parseError;
    }

  } catch (error) {
    console.error('Error in aiService during parsing or API query:', error);
    throw new Error(`AI Paper Generation Failed: ${error.message}`);
  }
};