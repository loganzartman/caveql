import { TabGroup as HTabGroup } from "@headlessui/react";

export function TabGroup({ children }: { children: React.ReactNode }) {
	return (
		<HTabGroup className="w-full h-full flex flex-col">{children}</HTabGroup>
	);
}
