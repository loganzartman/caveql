export function ProgressBar({
  progress,
  max = 1,
}: {
  progress: number;
  max?: number;
}) {
  const scale = progress / max;

  return (
    <div className="w-full bg-stone-900 h-4 relative">
      <div
        className="absolute inset-0 w-full bg-amber-400 transition-transform origin-left"
        style={{ transform: `scaleX(${scale.toFixed(2)})` }}
      ></div>
    </div>
  );
}
