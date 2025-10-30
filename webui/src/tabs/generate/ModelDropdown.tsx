import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as webllm from "@mlc-ai/web-llm";

const appConfig: webllm.AppConfig = webllm.prebuiltAppConfig;
const availableModels = appConfig.model_list
  .filter((model) => model.model_type !== 1)
  .sort((a, b) => a.model_id.localeCompare(b.model_id));

export function ModelDropdown({
  modelID,
  onChange,
}: {
  modelID: string;
  onChange: (modelID: string) => void;
}) {
  return (
    <Listbox value={modelID} onChange={onChange}>
      <div className="flex flex-row items-start">
        <ListboxButton className="w-full flex flex-row items-center gap-2 px-4 py-1.5 bg-stone-700 hover:bg-stone-600 transition-colors hover:transition-none">
          <ChevronDownIcon className="w-5 h-5 text-stone-400" />
          {modelID}
        </ListboxButton>
      </div>
      <ListboxOptions anchor="bottom end" className="ring-1 ring-stone-500/50">
        {availableModels.map((model) => (
          <ListboxOption
            autoFocus
            key={model.model_id}
            value={model.model_id}
            className="cursor-pointer px-2 py-1 bg-stone-800 data-[selected]:bg-stone-700 hover:bg-stone-600 transition-colors hover:transition-none"
          >
            {model.model_id} (
            {((model.vram_required_MB ?? 0) / 1024).toLocaleString(undefined, {
              maximumFractionDigits: 1,
              style: "unit",
              unit: "gigabyte",
            })}
            &nbsp;VRAM)
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
