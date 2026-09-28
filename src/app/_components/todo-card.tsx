import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { DeleteTodoButton } from "./delete-todo-button";
import { TodoCheckbox } from "./todo-checkbox";

export type Todo = Pick<
  Tables<"todos">,
  "id" | "title" | "is_completed"
>;

type TodoCardProps = {
  todo: Todo;
};

export function TodoCard({ todo }: TodoCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Label className="min-w-0 flex-1">
          <TodoCheckbox id={todo.id} isCompleted={todo.is_completed} />
          <span
            className={cn(
              "break-words",
              todo.is_completed && "text-muted-foreground line-through",
            )}
          >
            {todo.title}
          </span>
        </Label>
        <DeleteTodoButton id={todo.id} />
      </CardContent>
    </Card>
  );
}
