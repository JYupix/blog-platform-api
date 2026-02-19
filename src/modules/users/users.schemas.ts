import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;