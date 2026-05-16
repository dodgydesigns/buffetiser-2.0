import React, { PureComponent } from "react";
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
import "../../index.css";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-desc" style={{ color: `${payload[1].color}` }}>
          ${payload[1].value}
        </p>
        <p className="tooltip-desc" style={{ color: `${payload[2].color}` }}>
          ${payload[2].value}
        </p>
        <p className="tooltip-desc" style={{ color: `${payload[3].color}` }}>
          ${payload[3].value}
        </p>
      </div>
    );
  }

  return null;
};

export default class InvestmentCharts extends PureComponent {
  render() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={this.props.investment_history}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#0f4c75"
            fill="#1b262c"
          />
          <XAxis
            dataKey="date"
            stroke="#ffffff"
            fontSize="10"
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#ffffff"
            fontSize="10"
            domain={["dataMin", "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ffffff"
            fontSize="10"
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
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="high"
            stroke="#82ca9d"
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="close"
            stroke="#f5e642"
            activeDot={{ r: 8 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
}
