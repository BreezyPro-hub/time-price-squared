import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:bg-fg",
        secondary: "bg-raised text-fg hover:bg-raised/80 shadow-[var(--shadow-border)]",
        ghost: "text-muted hover:text-fg hover:bg-raised",
        outline: "shadow-[var(--shadow-border)] text-fg hover:shadow-[var(--shadow-border-hover)] bg-transparent",
        danger: "bg-bear/15 text-bear hover:bg-bear/25",
      },
      size: {
        default: "h-10 px-4 rounded-md text-sm",
        sm: "h-8 px-3 rounded-sm text-xs",
        lg: "h-11 px-5 rounded-md text-sm",
        icon: "size-10 rounded-md",
        "icon-sm": "size-8 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
