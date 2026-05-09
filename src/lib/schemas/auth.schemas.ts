import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name is too short").max(80),
    email: z.string().trim().email("Enter a valid email"),
    phoneCountry: z.string().min(1, "Required"),
    phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const inviteSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name is too short").max(80),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type InviteInput = z.infer<typeof inviteSchema>;

export const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});
export type ForgotInput = z.infer<typeof forgotSchema>;
