import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Clear, professional input style
        "w-full min-w-0 rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-base shadow-sm",
        "transition-colors outline-none",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
