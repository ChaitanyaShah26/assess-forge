import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const assessmentQueue = new Queue('assessment-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 
    },
    removeOnComplete: true, 
    removeOnFail: false    
  }
});

export const addAssignmentJob = async (assignmentId) => {
  return await assessmentQueue.add('generate-paper', { assignmentId });
};