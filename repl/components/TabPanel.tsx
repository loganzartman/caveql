import { TabPanel as HTabPanel } from "@headlessui/react";

export function TabPanel({ children }: { children: React.ReactNode }) {
	return <HTabPanel>{children}</HTabPanel>;
}
