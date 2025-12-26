import os from "node:os";

export function getHardwareConcurrency(): number {
  if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  }
  const cpus = os?.cpus()?.length;
  if (cpus > 0) {
    return cpus;
  }
  return 1;
}
