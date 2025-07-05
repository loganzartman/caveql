import clsx from "clsx";
import { useCallback, useMemo } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { impossible } from "../../../src/impossible";
import { colorScale } from "../../colorScale";
import { ValView } from "../ValView";

export function ResultsChart({
  type,
  results,
}: {
  type: "bar";
  results: Record<string, unknown>[];
}) {
  const keys = useMemo(
    () => [...new Set(Object.values(results).flatMap(Object.keys))],
    [results],
  );
  const xAxisKey = useMemo(() => keys[0], [keys]);
  const barKeys = useMemo(() => keys.slice(1), [keys]);

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={results}>
          <XAxis dataKey={xAxisKey} stroke="var(--color-stone-300)" />
          <YAxis stroke="var(--color-stone-300)" />
          <Legend />
          <Tooltip
            cursor={{
              fill: "var(--color-stone-700)",
            }}
            content={({ active, payload, label }) =>
              active &&
              payload &&
              payload.length && (
                <div className="flex flex-col bg-stone-800 p-2 ring-2 ring-amber-400/50">
                  {Object.entries(payload[0].payload).map(([k, v]) => (
                    <div key={k}>
                      {k}: <ValView val={v} />
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
  impossible(type);
}
