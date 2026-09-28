import { createClient } from "@/lib/supabase/server";
import { TodoList } from "./_components/todo-list";

export default async function Home() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase
    .from("todos")
    .select("id, title, is_completed")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Todo の取得に失敗しました", { cause: error });
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1>Todo</h1>
      <TodoList todos={todos} />
    </main>
  );
}
