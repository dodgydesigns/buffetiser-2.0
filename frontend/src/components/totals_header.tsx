type TotalPortfolioValues = {
  total_cost: number;
  total_value: number;
  total_profit: number;
  total_profit_percentage: number;
};

type TotalsHeaderProps = {
  className?: string;
  totalPortfolioValues: TotalPortfolioValues;
};

function PositiveColour(comparisonValue: number) {
  return comparisonValue >= 0 ? "#55ff55" : "#ff4444";
}

/*  Show the total value of the portfolio and percentage gain. */
export default function TotalsHeader({ totalPortfolioValues }: TotalsHeaderProps) {
  const valueColour = PositiveColour(totalPortfolioValues.total_profit);
  return (
    <>
      <table className="totals_header_table">
        <tbody>
          <tr>
            <td width="200rem">PORTFOLIO</td>
            <td width="10%" style={{ paddingLeft: "5rem" }}>
              Cost
            </td>
            <td width="10%">Total Value</td>
            <td width="10%">Profit</td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td>${totalPortfolioValues.total_cost.toFixed(2)}</td>
            <td style={{ color: valueColour }}>
              ${totalPortfolioValues.total_value.toFixed(2)}
            </td>
            <td style={{ color: valueColour }}>
              ${totalPortfolioValues.total_profit.toFixed(2)}
            </td>
            <td style={{ color: valueColour }}>
              {totalPortfolioValues.total_profit_percentage.toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
