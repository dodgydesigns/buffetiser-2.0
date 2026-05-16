function PositiveColour(comparisonValue) {
  return comparisonValue >= 0 ? "#55ff55" : "#ff4444";
}

/*  Show the total value of the portfolio and percentage gain. */
export default function TotalsHeader({ totalPortfolioValues }) {
  const valueColour = PositiveColour(totalPortfolioValues.total_profit);
  return (
    <>
      <table className="totals_header_table">
        <tbody>
          <tr>
            <td width="200rem">PORTFOLIO</td>
            <td width="10%" padding-left="5rem">
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
