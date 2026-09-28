'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { todoSchema } from '../_lib/todo-schema';

// クライアントからの入力は信頼できないため unknown で受け取り、サーバーでも検証する。
export async function createTodo(input: unknown) {
  const parsed = todoSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('入力が不正です');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('todos')
    .insert({ title: parsed.data.title });

  if (error) {
    throw new Error('Todo の追加に失敗しました', { cause: error });
  }

  revalidatePath('/');
}
