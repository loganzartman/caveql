import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const formatter = new Intl.NumberFormat(undefined, {});

export function ValView({ val }: { val: unknown }) {
  if (val === null || val === undefined) {
    return <div className="grow-1">{String(val)}</div>;
  }
  if (typeof val === "string") {
    return <div className="grow-1 text-stone-200">{val}</div>;
  }
  if (typeof val === "number" || typeof val === "bigint") {
    return (
      <div className="grow-1 text-purple-300 tabular-nums text-right">
        {formatter.format(val)}
      </div>
    );
  }
  if (typeof val === "boolean") {
    return <div className="grow-1 text-red-300">{String(val)}</div>;
  }
  if (typeof val !== "object") {
    throw new Error(`Unsupported type: ${typeof val}`);
  }
  return <ObjectView val={val} />;
}

function ObjectView({ val }: { val: object }) {
  return (
    <Disclosure as="div" className="grow-1 flex flex-col gap-1 font-mono">
      <DisclosureButton>
        {({ open }) => (
          <div className="flex flex-row gap-1 items-center cursor-pointer">
            {open ? (
              <ChevronDownIcon className="w-[1em]" />
            ) : (
              <ChevronRightIcon className="w-[1em]" />
            )}
            <div>{Array.isArray(val) ? "Array" : "Object"}</div>
          </div>
        )}
      </DisclosureButton>
      <DisclosurePanel>
        <div className="flex flex-col gap-1 pl-4">
          {Object.entries(val).map(([key, value]) => (
            <div key={key} className="flex flex-row gap-2">
              <span className="text-red-300">{key}:</span>
              <ValView val={value} />
            </div>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
