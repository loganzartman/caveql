import { Tab as HTab } from "@headlessui/react";

export function Tab({ children }: { children: React.ReactNode }) {
	return (
		<HTab className="bg-stone-800 transition-colors data-selected:bg-stone-700 data-hover:bg-stone-600 data-hover:text-stone-50 data-hover:transition-none shadow-inner px-4 py-1.5">
			{children}
		</HTab>
	);
}
