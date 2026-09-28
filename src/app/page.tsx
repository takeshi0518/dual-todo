import { createClient } from "@/lib/supabase/server";
import { TodoForm } from "./_components/todo-form";
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
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1>Todo</h1>
      <TodoForm />
      <TodoList todos={todos} />
    </main>
  );
}
