'use client';

import { useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleTodo } from '../_actions/toggle-todo';

type TodoCheckboxProps = {
  id: string;
  isCompleted: boolean;
};

export function TodoCheckbox({ id, isCompleted }: TodoCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Checkbox
      checked={isCompleted}
      disabled={isPending}
      onCheckedChange={(checked) => {
        // transition 内で呼ぶことで、Server Action の throw が error.tsx に届く。
        startTransition(async () => {
          await toggleTodo({ id, isCompleted: checked });
        });
      }}
    />
  );
}
