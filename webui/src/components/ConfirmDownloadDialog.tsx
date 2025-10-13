import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { CloudArrowDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";

export function ConfirmDownloadDialog({
  isOpen,
  onClose,
  onConfirm,
  progress,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  progress: number | null;
}) {
  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-10 focus:outline-none"
      onClose={onClose}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 data-closed:opacity-0 transition-opacity"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md bg-stone-800 ring-1 ring-amber-500/50 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[perspective(12in)_rotateX(15deg)_translateZ(-100px)] data-closed:opacity-0"
          >
            <DialogTitle as="h3" className="text-base/7 font-medium text-white">
              Download local AI model
            </DialogTitle>
            <div className="mt-2 text-sm/6 text-stone-300">
              <p>
                To generate queries, we'll download an AI model to your device.
                We'll cache the model locally so you can skip this step in the
                future.
              </p>
              <p>This will transfer approximately 2GB of data.</p>
            </div>
            {progress !== null ? (
              <div className="w-full mt-2">
                <ProgressBar progress={progress} max={1} />
              </div>
            ) : (
              <div className="mt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="filled-2"
                  onClick={() => onClose()}
                  icon={<XMarkIcon />}
                >
                  cancel
                </Button>
                <Button
                  variant="filled-2"
                  onClick={() => onConfirm()}
                  icon={<CloudArrowDownIcon />}
                >
                  load model
                </Button>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
