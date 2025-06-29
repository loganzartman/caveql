import { clsx } from "clsx";

export function Highlight({
	children,
	enabled,
}: {
	children: React.ReactNode;
	enabled?: boolean;
}) {
	return (
		<div
			className={clsx(
				"p-[2px] m-[-2px] z-20",
				enabled ? "highlight-bg" : "bg-amber-900",
			)}
		>
			{children}
		</div>
	);
}
