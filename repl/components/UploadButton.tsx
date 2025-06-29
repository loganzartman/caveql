import { Button, Input } from "@headlessui/react";
import { ArrowUpTrayIcon } from "@heroicons/react/20/solid";
import { useRef } from "react";

export function UploadButton({
	label,
	onChange,
}: {
	label: string;
	onChange?: (params: { files: FileList }) => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleButtonClick = () => {
		inputRef.current?.click();
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files?.length) {
			onChange?.({ files });
		}
	};

	return (
		<>
			<Input
				ref={inputRef}
				type="file"
				accept="application/json"
				className="hidden"
				onChange={handleChange}
			/>
			<Button aria-hidden onClick={handleButtonClick}>
				<div className="flex flex-row items-center gap-2 px-2 py-1.5 transition-colors bg-stone-800 hover:bg-amber-900">
					<ArrowUpTrayIcon className="w-[1em]" />
					{label}
				</div>
			</Button>
		</>
	);
}
