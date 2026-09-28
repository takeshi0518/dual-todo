'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createTodo } from '../_actions/create-todo';
import { todoSchema, type TodoInput } from '../_lib/todo-schema';

export function TodoForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: '' },
  });

  function onSubmit(data: TodoInput) {
    // transition 内で呼ぶことで、Server Action の throw が error.tsx に届く。
    startTransition(async () => {
      await createTodo(data);
      form.reset();
      form.setFocus('title');
    });
  }

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <Field className="flex-1" data-invalid={fieldState.invalid}>
            <FieldLabel className="sr-only" htmlFor="todo-title">
              タイトル
            </FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              autoComplete="off"
              id="todo-title"
              placeholder="新しいTodo"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button disabled={isPending} type="submit">
        追加
      </Button>
    </form>
  );
}
