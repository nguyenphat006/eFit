import { z } from 'zod';

// Define Validation Schema using Zod for Login form
export const loginSchema = z.object({
  email: z.string().min(1, { message: "required_field" }).email({ message: "invalid_email" }),
  password: z.string().min(6, { message: "password_min" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Define Validation Schema using Zod for Register form
export const registerSchema = z.object({
  fullName: z.string().min(1, { message: "required_field" }),
  email: z.string().min(1, { message: "required_field" }).email({ message: "invalid_email" }),
  password: z.string().min(6, { message: "password_min" }),
  fitnessGoal: z.string().min(1, { message: "required_field" }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
