import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RealisedSalePoint } from "./totals_card";

type SalesProfitDialogProps = {
  open: boolean;
  sales: RealisedSalePoint[];
  onClose: () => void;
};

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export default function SalesProfitDialog({
  open,
  sales,
  onClose,
}: SalesProfitDialogProps) {
  const total = sales.at(-1)?.cumulative_profit ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      slotProps={{
        paper: {
          sx: {
            width: "min(92vw, 1400px)",
            height: "min(88vh, 900px)",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 0.5, fontWeight: 800 }}>
        Realised profit from share sales
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Net profit after sale fees:{" "}
          <Box
            component="span"
            sx={{ fontWeight: 800, color: total >= 0 ? "success.main" : "error.main" }}
          >
            {money.format(total)}
          </Box>
        </Typography>

        {sales.length === 0 ? (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              minHeight: 280,
              borderRadius: 2,
              backgroundColor: "#f4f8fb",
            }}
          >
            <Typography color="text.secondary">
              Sales will appear here once shares have been sold.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", flex: 1, minHeight: 500 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={sales}
                margin={{ top: 20, right: 25, left: 20, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#d8e4ec" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(`${value}T00:00:00`).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })
                  }
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
                <Tooltip
                  labelFormatter={(_, payload) => {
                    const sale = payload?.[0]?.payload as RealisedSalePoint | undefined;
                    return sale
                      ? `${sale.symbol} · ${sale.units} units · ${sale.date}`
                      : "";
                  }}
                  formatter={(value, name) => [
                    money.format(Number(value)),
                    name === "profit" ? "Sale profit" : "Cumulative profit",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "profit" ? "Profit per sale" : "Cumulative profit"
                  }
                />
                <Bar
                  dataKey="profit"
                  fill="#3282b8"
                  radius={[5, 5, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative_profit"
                  stroke="#143449"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
