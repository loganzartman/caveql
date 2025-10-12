import { TabPanel as HTabPanel } from "@headlessui/react";

export function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <HTabPanel className="flex-1 flex flex-col bg-stone-800">
      {children}
    </HTabPanel>
  );
}
