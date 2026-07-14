import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-100 text-primary-800",
        secondary: "border-transparent bg-secondary-100 text-secondary-800",
        gold: "border-gold-200 bg-gold-50 text-gold-800",
        success: "border-transparent bg-success-50 text-success-700",
        warning: "border-warning-100 bg-warning-50 text-warning-700",
        orange: "border-orange-100 bg-orange-100 text-orange-700",
        danger: "border-transparent bg-danger-50 text-danger-700",
        neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
        outline: "border-neutral-300 text-neutral-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
