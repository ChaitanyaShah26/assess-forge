import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { emitToRoom } from '../socket.js';

const extractTextFromUpload = async (upload) => {
  if (!upload) return '';
  
  if (upload.mimetype === 'text/plain') {
    return upload.data.toString('utf-8');
  }
  
  if (upload.mimetype === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const parsedData = await pdfParse(upload.data);
      return parsedData.text;
    } catch (err) {
      console.warn('PDF parsing fell back to string coercion due to an import error:', err.message);
      return upload.data.toString('binary').replace(/[\x00-\x1f\x7f-\xff]/g, ' ');
    }
  }
  
  return upload.data.toString('utf-8');
};

export const startWorker = () => {
  const worker = new Worker(
    'assessment-queue',
    async (job) => {
      const { assignmentId } = job.data;
      console.log(`Processing assignment task: ${assignmentId}`);

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment with ID ${assignmentId} was not found.`);
      }

      try {
        assignment.status = 'PROCESSING';
        await assignment.save();
        emitToRoom(assignmentId, 'status:update', { status: 'PROCESSING', progress: 20 });

        let sourceText = '';
        if (assignment.fileId) {
          emitToRoom(assignmentId, 'status:update', { status: 'PARSING_FILE', progress: 40 });
          const upload = await Upload.findById(assignment.fileId);
          if (upload) {
            sourceText = await extractTextFromUpload(upload);
          }
        }

        emitToRoom(assignmentId, 'status:update', { status: 'GENERATING_PAPER', progress: 60 });
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const mockGeneratedPaper = {
          title: "Mumbai High School",
          subject: "Science",
          class: "Class 8th",
          timeAllowed: "45 minutes",
          maxMarks: assignment.totalMarks || 20,
          sections: [
            {
              sectionName: "Section A",
              instruction: "Attempt all questions. Each question carries 2 marks.",
              questions: [
                {
                  questionNumber: 1,
                  questionText: "Define electroplating. Explain its purpose in consumer products.",
                  difficulty: "Easy",
                  marks: 2
                },
                {
                  questionNumber: 2,
                  questionText: "What is the role of a conductor in the process of electrolysis?",
                  difficulty: "Moderate",
                  marks: 2
                }
              ]
            }
          ],
          answerKey: [
            {
              questionNumber: 1,
              answer: "Electroplating is the process of depositing a thin layer of metal onto a surface using electrolysis."
            },
            {
              questionNumber: 2,
              answer: "A conductor allows the electric current to flow through the electrolyte, driving chemical changes."
            }
          ]
        };

        assignment.status = 'COMPLETED';
        assignment.generatedPaper = mockGeneratedPaper;
        await assignment.save();

        emitToRoom(assignmentId, 'status:update', { 
          status: 'COMPLETED', 
          progress: 100,
          paper: mockGeneratedPaper 
        });

        console.log(`Task ${assignmentId} successfully processed.`);
        return { success: true };

      } catch (err) {
        console.error(`Task processing error for ${assignmentId}:`, err);
        assignment.status = 'FAILED';
        assignment.errorMessage = err.message;
        await assignment.save();

        emitToRoom(assignmentId, 'status:update', { 
          status: 'FAILED', 
          error: err.message 
        });
        
        throw err;
      }
    },
    { 
      connection: redisConnection,
      concurrency: 1 
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ID ${job?.id} failed with error:`, err.message);
  });

  return worker;
};