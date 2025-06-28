import { TabPanels as HTabPanels } from "@headlessui/react";

export function TabPanels({ children }: { children: React.ReactNode }) {
	return <HTabPanels className="w-full h-full">{children}</HTabPanels>;
}
