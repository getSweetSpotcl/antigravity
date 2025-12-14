import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-slate-400 selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white! px-3 py-1 text-base text-slate-900 shadow-sm transition-[color,box-shadow,border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-blue-500 focus-visible:ring-blue-500/20 focus-visible:ring-[3px]",
        "dark:bg-slate-800! dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500",
        "aria-invalid:border-red-500 aria-invalid:bg-red-50 aria-invalid:text-red-900 aria-invalid:placeholder:text-red-300",
        "aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-500/30 aria-invalid:focus-visible:ring-[3px]",
        "dark:aria-invalid:bg-red-950/20 dark:aria-invalid:border-red-500 dark:aria-invalid:text-red-100",
        className
      )}
      {...props}
    />
  )
}

export { Input }
