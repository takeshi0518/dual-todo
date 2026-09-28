'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { toggleTodoSchema } from '../_lib/todo-schema';

// クライアントからの入力は信頼できないため unknown で受け取り、サーバーでも検証する。
// 反転後の値を受け取るので、同じ値を 2 回送っても結果は変わらない。
export async function toggleTodo(input: unknown) {
  const parsed = toggleTodoSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('入力が不正です');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('todos')
    .update({ is_completed: parsed.data.isCompleted })
    .eq('id', parsed.data.id);

  if (error) {
    throw new Error('Todo の更新に失敗しました', { cause: error });
  }

  revalidatePath('/');
}
