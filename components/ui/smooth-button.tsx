"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import type { ButtonHTMLAttributes } from "react";

const smoothButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-mono text-xs uppercase tracking-wider ring-offset-background transition-all duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97757] focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#D97757] text-[#08080B] font-semibold hover:bg-[#E08A6C]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-white/10 bg-[#0c0c12] text-[#EDE8DF] hover:border-[#D97757]/60 hover:text-white hover:bg-[#14141c]",
        secondary:
          "bg-white/10 text-white hover:bg-white/15",
        ghost: "hover:bg-white/5 hover:text-white",
        link: "text-[#D97757] underline-offset-4 hover:underline",
        candy:
          "border border-white/20 bg-gradient-to-b from-[#D97757] to-[#B35338] text-white shadow-md hover:brightness-110",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-4 py-1.5",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

export type SmoothButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof smoothButtonVariants> & {
    asChild?: boolean;
    ref?: React.Ref<HTMLButtonElement>;
  };

function SmoothButton({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ref,
  ...props
}: SmoothButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(smoothButtonVariants({ variant, size, shape, className }))}
      ref={ref}
      {...props}
    />
  );
}

export default SmoothButton;
export { smoothButtonVariants };
