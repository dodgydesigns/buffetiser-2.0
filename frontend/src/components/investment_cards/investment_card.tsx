import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import InvestmentCharts from "./investment_charts";
import InvestmentSummary from "./investment_summary_panel";
import type { Investment, InvestmentModalConstants } from "./types";

function PositiveColour(comparisonValue: number) {
  return comparisonValue > 0 ? "#55ff55" : "#ff4444";
}

type InvestmentCardProps = Investment & {
  constants?: InvestmentModalConstants;
};

/*
This component holds all the details of an Investment:
 - Current pricing
 - Daily changes
 - Price/Volume history chart and
 - Buttons to buy (add), sell (remove) and delete Investments
*/
function InvestmentCard({ constants, ...investment }: InvestmentCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState(investment.history);
  const [historyLoaded, setHistoryLoaded] = useState(
    investment.history.length > 0
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const toggleOpen = async () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (
      opening &&
      !historyLoaded &&
      !historyLoading &&
      investment.id !== undefined
    ) {
      setHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/v1/investments/${encodeURIComponent(
            String(investment.id)
          )}/history`
        );
        if (!response.ok) {
          throw new Error(`History request failed (${response.status})`);
        }
        setHistory(await response.json());
        setHistoryLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  return (
    <div key={investment.symbol}>
      {/* The 'title bar' of each Investment showing daily details of an Investment. 
          Click to show/hide the chart and summary panel */}
      <table className="card_header">
        <tbody>
          <tr onClick={toggleOpen}>
            <td>
              <table>
                <tbody>
                  <tr>
                    <td width="40%"></td>
                    <td className="header_header" width="5%">
                      Last
                    </td>
                    <td className="header_header" width="3%">
                      +/-
                    </td>
                    <td className="header_header" width="3%">
                      %
                    </td>
                    <td className="header_header"></td>
                  </tr>
                  <tr>
                    <td>
                      <table>
                        <tbody>
                          <tr>
                            <td className="investment_symbol" width="100rem">
                              {investment.symbol}
                            </td>
                            <td className="investment_name" width="1500rem">
                              {investment.name}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="header_header">
                      {investment.last_price.toFixed(2)}
                    </td>
                    <td
                      style={{ color: PositiveColour(investment.daily_change) }}
                    >
                      {investment.daily_change.toFixed(2)}
                    </td>
                    <td
                      style={{
                        color: PositiveColour(investment.daily_change_percent),
                      }}
                    >
                      {investment.daily_change_percent.toFixed(2)}
                    </td>
                    <td
                      style={{
                        paddingLeft: "5rem",
                        paddingBottom: "1rem",
                        color: PositiveColour(investment.profit_percent),
                        fontSize: "1.3rem",
                      }}
                    >
                      {investment.profit_percent.toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              {isOpen && (
                <div className="investment_summary">
                  {/* The chart showing the price/volume history */}
                  <div className="chart">
                    {historyLoading ? (
                      <CircularProgress sx={{ m: 4 }} />
                    ) : (
                      <InvestmentCharts investment_history={history} />
                    )}
                  </div>
                  {/* The panel on the RHS with details of the investment and the buttons */}
                  <div className="summary">
                    <InvestmentSummary investment={investment} constants={constants}/>
                  </div>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default InvestmentCard;
