"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <p>Todo の取得に失敗しました</p>
      <Button type="button" onClick={retry}>
        再試行
      </Button>
    </main>
  );
}
