"use client"

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center dark bg-background">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          InfraGuard encountered an error. This may be a temporary issue.
        </p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
