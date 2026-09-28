'use client';

import { Trash2Icon } from 'lucide-react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteTodo } from '../_actions/delete-todo';

type DeleteTodoButtonProps = {
  id: string;
};

export function DeleteTodoButton({ id }: DeleteTodoButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      aria-label="削除"
      disabled={isPending}
      onClick={() => {
        // transition 内で呼ぶことで、Server Action の throw が error.tsx に届く。
        startTransition(async () => {
          await deleteTodo({ id });
        });
      }}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <Trash2Icon />
    </Button>
  );
}
