import { z } from "zod";

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルを入力してください")
    .max(100, "100文字以内で入力してください"),
});

export type TodoInput = z.infer<typeof todoSchema>;
