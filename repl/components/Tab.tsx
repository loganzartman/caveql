import { Tab as HTab } from "@headlessui/react";

export function Tab({
	children,
	icon,
}: {
	children: React.ReactNode;
	icon: React.ReactNode;
}) {
	return (
		<HTab className="flex flex-row items-center gap-2 bg-stone-800 transition-colors data-selected:bg-stone-700 data-selected:z-10 data-hover:bg-stone-600 data-hover:text-stone-50 data-hover:transition-none shadow-inner px-4 py-1.5">
			<div className="w-[1em]">{icon}</div>
			{children}
		</HTab>
	);
}
