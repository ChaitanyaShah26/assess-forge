import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { Assignment } from '../models/Assignment.js';
import { Upload } from '../models/Upload.js';
import { emitToRoom } from '../socket.js';
import { generateAssessmentPaper } from '../services/aiService.js';

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
      console.warn('PDF parsing fell back to string coercion:', err.message);
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
        emitToRoom(assignmentId, 'status:update', { status: 'PROCESSING', progress: 15 });

        let sourceText = '';
        if (assignment.fileId) {
          emitToRoom(assignmentId, 'status:update', { status: 'PARSING_FILE', progress: 35 });
          const upload = await Upload.findById(assignment.fileId);
          if (upload) {
            sourceText = await extractTextFromUpload(upload);
          }
        }

        emitToRoom(assignmentId, 'status:update', { status: 'GENERATING_PAPER', progress: 60 });
        
        const generatedPaper = await generateAssessmentPaper({
          configs: assignment.configs,
          totalQuestions: assignment.totalQuestions,
          totalMarks: assignment.totalMarks,
          additionalInstructions: assignment.additionalInstructions,
          sourceText: sourceText || null
        });

        assignment.status = 'COMPLETED';
        assignment.generatedPaper = generatedPaper;
        assignment.errorMessage = null;
        await assignment.save();

        emitToRoom(assignmentId, 'status:update', { 
          status: 'COMPLETED', 
          progress: 100,
          paper: generatedPaper 
        });

        console.log(`Task ${assignmentId} successfully processed by Mistral AI.`);
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