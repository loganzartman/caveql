import { TabList as HTabList } from "@headlessui/react";

export function TabList({ children }: { children: React.ReactNode }) {
  return <HTabList className="shrink-0 flex flex-row">{children}</HTabList>;
}
