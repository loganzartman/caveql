import { TabPanel as HTabPanel } from "@headlessui/react";

export function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <HTabPanel className="grow bg-stone-800 p-2 pt-4">{children}</HTabPanel>
  );
}
