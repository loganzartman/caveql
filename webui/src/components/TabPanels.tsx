import { TabPanels as HTabPanels } from "@headlessui/react";
import clsx from "clsx";

export function TabPanels({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <HTabPanels className={clsx("flex-1 flex flex-col", className)}>
      {children}
    </HTabPanels>
  );
}
