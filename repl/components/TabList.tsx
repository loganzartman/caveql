import { TabList as HTabList } from "@headlessui/react";

export function TabList({ children }: { children: React.ReactNode }) {
	return <HTabList className="w-full flex flex-row">{children}</HTabList>;
}
