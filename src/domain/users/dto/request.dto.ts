import z from 'zod';

export const UserRequest = z.object({
  question: z.string().describe('The user queston'),
});
