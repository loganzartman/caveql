import {
  Button as HButton,
  type ButtonProps as HButtonProps,
} from "@headlessui/react";
import clsx from "clsx";

const variantClasses = {
  "filled-2":
    "bg-stone-700 text-stone-100 hover:bg-stone-600 focus:ring-stone-500",
  filled: "bg-stone-800 text-stone-100 hover:bg-stone-700 focus:ring-stone-600",
  quiet:
    "bg-transparent text-amber-400 hover:bg-amber-400/20 hover:text-amber-200 focus:ring-1 focus:ring-amber-400",
};

export type ButtonProps = HButtonProps & {
  variant?: keyof typeof variantClasses;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function Button({
  variant = "filled",
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <HButton
      {...rest}
      className={clsx(
        "flex flex-row gap-2 items-center px-4 py-1.5 transition-colors text-base",
        variantClasses[variant],
        className,
      )}
    >
      {icon && <div className="w-[1em] shrink-0">{icon}</div>}
      {children}
    </HButton>
  );
}
