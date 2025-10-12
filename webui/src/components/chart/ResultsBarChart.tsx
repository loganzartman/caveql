import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colorScale } from "../../lib/colorScale";
import type { VirtualArray } from "../../lib/VirtualArray";
import { ValView } from "../ValView";

const MAX_COUNT = 100;

export function ResultsBarChart({
  results,
}: {
  results: VirtualArray<Record<string, unknown>>;
}) {
  const head = useMemo(() => results.items.slice(0, MAX_COUNT), [results]);
  const keys = useMemo(() => Array.from(results.fieldSet), [results]);
  const xAxisKey = useMemo(() => keys[0], [keys]);
  const barKeys = useMemo(() => keys.slice(1), [keys]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={head}>
        <XAxis dataKey={xAxisKey} stroke="var(--color-stone-300)" />
        <YAxis width="auto" stroke="var(--color-stone-300)" />
        <Legend />
        <Tooltip
          cursor={{
            fill: "var(--color-stone-700)",
          }}
          content={({ active, payload }) =>
            active &&
            payload &&
            payload.length && (
              <div className="flex flex-col bg-stone-800 p-2 ring-2 ring-amber-400/50">
                {Object.entries(payload[0].payload).map(([k, v]) => (
                  <div key={k} className="flex flex-row gap-2">
                    <div>{k}:</div>
                    <ValView val={v} />
                  </div>
                ))}
              </div>
            )
          }
          isAnimationActive={false}
        />
        {barKeys.map((key, i) => (
          <Bar key={key} fill={colorScale(i, barKeys.length)} dataKey={key} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
