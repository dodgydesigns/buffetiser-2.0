import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioHistoryPoint } from "./totals_card";

type TotalsChartProps = {
  portfolioHistory: PortfolioHistoryPoint[];
};

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export default function TotalsChart({
  portfolioHistory,
}: TotalsChartProps) {
  const showDots = portfolioHistory.length <= 7;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={portfolioHistory}
        margin={{ top: 22, right: 30, left: 20, bottom: 12 }}
      >
        <CartesianGrid strokeDasharray="4 5" stroke="rgba(255,255,255,0.12)" />
        <XAxis
          dataKey="date"
          stroke="#adcde2"
          tickFormatter={shortDate}
          minTickGap={48}
          fontSize={11}
        />
        <YAxis
          stroke="#adcde2"
          tickFormatter={(value) => currency.format(Number(value))}
          fontSize={11}
          width={78}
          domain={["auto", "auto"]}
        />
        <Tooltip
          labelFormatter={(label) =>
            new Date(`${label}T00:00:00`).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          }
          formatter={(value, name) => [
            currency.format(Number(value)),
            name === "total" ? "Portfolio value" : "Cost basis",
          ]}
          contentStyle={{
            color: "#143449",
            borderRadius: 10,
            border: 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        />
        <Legend
          formatter={(value) =>
            value === "total" ? "Portfolio value" : "Cost basis"
          }
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#f5e642"
          strokeWidth={2.5}
          dot={showDots ? { r: 5, fill: "#f5e642" } : false}
          activeDot={{ r: 5 }}
        />
        <Line
          type="stepAfter"
          dataKey="cost"
          stroke="#6fa7cd"
          strokeWidth={2}
          dot={showDots ? { r: 4, fill: "#6fa7cd" } : false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
