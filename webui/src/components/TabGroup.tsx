import { TabGroup as HTabGroup } from "@headlessui/react";
import { clsx } from "clsx";

export function TabGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <HTabGroup className={clsx("flex flex-col", className)}>
      {children}
    </HTabGroup>
  );
}
