import { Box, Button, Stack, Typography } from "@mui/material";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import type { TotalPortfolioValues } from "./totals_card";

type TotalsHeaderProps = {
  totalPortfolioValues: TotalPortfolioValues;
  historyStart?: string;
  onShowSales: () => void;
};

function Metric({
  label,
  value,
  colour,
}: {
  label: string;
  value: string;
  colour?: string;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ display: "block", opacity: 0.68, textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: colour }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function TotalsHeader({
  totalPortfolioValues,
  historyStart,
  onShowSales,
}: TotalsHeaderProps) {
  const profitColour =
    totalPortfolioValues.total_profit >= 0 ? "#82ca9d" : "#ff6b6b";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: { xs: "stretch", lg: "center" },
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 2, md: 3 },
        py: 2,
        color: "white",
        background:
          "linear-gradient(110deg, #163599 0%, #0f4c75 65%, #143449 100%)",
      }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Portfolio
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {historyStart
            ? `Value and cost since ${new Date(
                `${historyStart}T00:00:00`
              ).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : "One-year value and cost history"}
        </Typography>
      </Box>

      <Stack
        direction="row"
        useFlexGap
        spacing={{ xs: 2.5, md: 5 }}
        sx={{
          flex: 1,
          flexWrap: "wrap",
          justifyContent: { xs: "flex-start", lg: "center" },
        }}
      >
        <Metric
          label="Cost basis"
          value={`$${totalPortfolioValues.total_cost.toFixed(2)}`}
        />
        <Metric
          label="Current value"
          value={`$${totalPortfolioValues.total_value.toFixed(2)}`}
        />
        <Metric
          label="Unrealised profit"
          value={`$${totalPortfolioValues.total_profit.toFixed(2)}`}
          colour={profitColour}
        />
        <Metric
          label="Return"
          value={`${totalPortfolioValues.total_profit_percentage.toFixed(2)}%`}
          colour={profitColour}
        />
      </Stack>

      <Button
        variant="contained"
        startIcon={<ShowChartRoundedIcon />}
        onClick={onShowSales}
        sx={{
          flexShrink: 0,
          color: "#143449",
          backgroundColor: "white",
          "&:hover": { backgroundColor: "#e8f3fa" },
        }}
      >
        Sales profit
      </Button>
    </Box>
  );
}
