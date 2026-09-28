import { TodoCard, type Todo } from "./todo-card";

type TodoListProps = {
  todos: Todo[];
};

export function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="text-muted-foreground">Todoがありません</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoCard todo={todo} />
        </li>
      ))}
    </ul>
  );
}
