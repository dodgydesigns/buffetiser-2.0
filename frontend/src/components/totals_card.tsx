import { useState, useEffect } from "react";
import axios from "axios";
import TotalsChart from "./totals_chart";
import TotalsHeader from "./totals_header";

type TotalPortfolioValues = {
  total_cost: number;
  total_value: number;
  total_profit: number;
  total_profit_percentage: number;
};

type PortfolioHistoryPoint = {
  date: string;
  total: number;
};

/*
This hold the details showing overall changes of the portfolio over time. This 
includes a chart showing date vs (purchases and sales) and combined value of the 
whole portfolio.
*/
export default function TotalsCard() {
  const [totalPortfolioValues, setTotalPortfolioValues] =
    useState<TotalPortfolioValues | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);

  useEffect(() => {
    axios
      .get("/api/v1/portfolio")
      .then((response) => {
        setTotalPortfolioValues(response.data.portfolio_totals);
        setPortfolioHistory(response.data.portfolio_history);
      })
      .catch((error) => {
        console.log(error.response);
      });
  }, []);

  // Make sure the data has been received.
  if (!totalPortfolioValues || portfolioHistory.length === 0) {
    return null;
  }

  return (
    <>
      <TotalsHeader
        className="totals_header"
        totalPortfolioValues={totalPortfolioValues}
      />
      <div className="totals_card_container">
        <div className="totals_chart">
          <TotalsChart portfolioHistory={portfolioHistory} />
        </div>
      </div>
    </>
  );
}
