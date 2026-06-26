import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { InvestmentHistoryPoint } from "./types";

type TooltipPayload = {
  color?: string;
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

const formatTooltipValue = (value: TooltipPayload["value"]) =>
  typeof value === "number" ? value.toFixed(23) : value;

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ color: payload[2].color }}>
            <span style={{ display: "inline-block", width: "50px" }}>High:</span>
            ${formatTooltipValue(payload[2].value)}
          </li>
          <li style={{ color: payload[1].color }}>
            <span style={{ display: "inline-block", width: "50px" }}>Low:</span>
            ${formatTooltipValue(payload[1].value)}
          </li>
        </ul>
      </div>
    );
  }

  return null;
};

type InvestmentChartsProps = {
  investment_history: InvestmentHistoryPoint[];
};

export default function InvestmentCharts({ investment_history }: InvestmentChartsProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={investment_history}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#0f4c75"
            fill="#1b262c"
          />
          <XAxis
            dataKey="date"
            stroke="#ffffff"
            fontSize="1"
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#ffffff"
            fontSize="10"
            padding={{ bottom: 5 }}
            domain={["dataMin", "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ffffff"
            fontSize="10"
            padding={{ bottom: 5 }}
            domain={["dataMin", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="volume"
            fill="#8884d855"
            stroke="#8884d8"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="low"
            stroke="#ff3333"
            dot={{ r: 1 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="high"
            stroke="#82ca9d"
            dot={{ r: 1 }}
          />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
