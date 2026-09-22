import * as React from "react";
import { cn } from "@/lib/utils";
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />;
});
Textarea.displayName = "Textarea";
export {
  Textarea
};
