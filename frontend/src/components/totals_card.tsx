import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, CircularProgress } from "@mui/material";
import TotalsChart from "./totals_chart";
import TotalsHeader from "./totals_header";
import SalesProfitDialog from "./sales_profit_dialog";
import { PORTFOLIO_CHANGED_EVENT } from "../portfolio_events";

export type TotalPortfolioValues = {
  total_cost: number;
  total_value: number;
  total_profit: number;
  total_profit_percentage: number;
  realised_sales_profit: number;
};

export type PortfolioHistoryPoint = {
  date: string;
  total: number;
  cost: number;
  profit: number;
};

export type RealisedSalePoint = {
  date: string;
  investment_key: string;
  symbol: string;
  units: number;
  profit: number;
  cumulative_profit: number;
};

type PortfolioResponse = {
  portfolio_totals: TotalPortfolioValues;
  portfolio_history: PortfolioHistoryPoint[];
  realised_sales: RealisedSalePoint[];
};

export default function TotalsCard() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);

  useEffect(() => {
    const loadPortfolio = () => {
      axios
      .get<PortfolioResponse>("/api/v1/portfolio")
      .then((response) => {
        setPortfolio(response.data);
        setError(false);
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(true);
      });
    };
    loadPortfolio();
    window.addEventListener(PORTFOLIO_CHANGED_EVENT, loadPortfolio);
    return () => {
      window.removeEventListener(PORTFOLIO_CHANGED_EVENT, loadPortfolio);
    };
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 1 }}>
        Unable to load portfolio totals.
      </Alert>
    );
  }

  if (!portfolio) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      component="section"
      sx={{
        mx: 0.5,
        mt: 1,
        mb: 1,
        overflow: "hidden",
        borderRadius: 2.5,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 12px 30px rgba(8,31,47,0.24)",
      }}
    >
      <TotalsHeader
        totalPortfolioValues={portfolio.portfolio_totals}
        historyStart={portfolio.portfolio_history[0]?.date}
        onShowSales={() => setSalesOpen(true)}
      />
      <Box sx={{ height: { xs: 290, md: 340 }, backgroundColor: "#143449" }}>
        <TotalsChart portfolioHistory={portfolio.portfolio_history} />
      </Box>
      <SalesProfitDialog
        open={salesOpen}
        sales={portfolio.realised_sales}
        onClose={() => setSalesOpen(false)}
      />
    </Box>
  );
}
