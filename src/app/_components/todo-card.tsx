import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

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
          <Checkbox checked={todo.is_completed} readOnly />
          <span
            className={cn(
              "break-words",
              todo.is_completed && "text-muted-foreground line-through",
            )}
          >
            {todo.title}
          </span>
        </Label>
        <Button
          aria-label="削除"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </CardContent>
    </Card>
  );
}
