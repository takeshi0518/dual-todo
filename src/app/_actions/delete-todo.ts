'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteTodoSchema } from '../_lib/todo-schema';

// クライアントからの入力は信頼できないため unknown で受け取り、サーバーでも検証する。
export async function deleteTodo(input: unknown) {
  const parsed = deleteTodoSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('入力が不正です');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', parsed.data.id);

  if (error) {
    throw new Error('Todo の削除に失敗しました', { cause: error });
  }

  revalidatePath('/');
}
