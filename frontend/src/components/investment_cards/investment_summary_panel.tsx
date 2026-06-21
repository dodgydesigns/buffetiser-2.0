/* 
Provides a panel to the right of the investment price/volume chart that shows
specific information about an Investment:
 - Total units held
 - Average cost over all purchases
 - Total cost of all purchases
 - Total value
 - Profit info

Does not include profit/loss due to sales. (maybe it should???)
*/
import { useState } from "react";
import "../../index.css";
import type { Investment, InvestmentModalConstants } from "./types";
import PurchaseModal from "./purchase_modal";
import SaleModal from "./sale_modal";
import RemoveModal from "./remove_modal";

const baseURL = "/api/v1";


type InvestmentSummaryProps = {
  investment: Investment;
  constants?: InvestmentModalConstants;
};

export default function InvestmentSummary(props: InvestmentSummaryProps) {
  
  const investment = props.investment;
  const constants = props.constants

  const [showBuyInvestment, setShowBuyInvestment] = useState(false);
  const [showSellInvestment, setShowSellInvestment] = useState(false);
  const [showRemoveInvestment, setShowRemoveInvestment] = useState(false);
  
  const handleBuyInvestmentClose = (isOpen: boolean) => {
    setShowBuyInvestment(false);
    if (isOpen) {
      window.location.reload();
    }
  };
  const handleSellInvestmentClose = (isOpen: boolean) => {
    setShowSellInvestment(false);
    if (isOpen) {
      window.location.reload();
    }
  };
  const handleRemoveInvestmentClose = (isOpen: boolean) => {
    setShowRemoveInvestment(false);
    if (isOpen) {
      window.location.reload();
    }
  };

  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>Units</td>
            <td>{investment.units}</td>
          </tr>
          <tr>
            <td>Average</td>
            <td>${investment.average_cost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total</td>
            <td>${investment.total_cost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Value</td>
            <td>${(investment.units * investment.last_price).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Profit</td>
            <td
              style={
                investment.profit < 0 ? { color: "#ff4444" } : { color: "#82ca9d" }
              }
            >
              {investment.profit > 0
                ? "$" + investment.profit.toFixed(2)
                : "-$" + investment.profit.toFixed(2).replace("-", "")}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="summary_buttons">
        <button onClick={() => {
        setShowBuyInvestment(true);
        }}>
        {showBuyInvestment && (
        <PurchaseModal className="buy"
          investment={investment} 
          constants={constants}
          endpoint={baseURL + "/purchase"}
          onClose={handleBuyInvestmentClose}
        ></PurchaseModal>
      )}
        Buy</button>
        <button onClick={() => {
        setShowSellInvestment(true);
        }}>
        {showSellInvestment && (
        <SaleModal
          investment={investment} 
          constants={constants}
          endpoint={baseURL + "/sale"}
          onClose={handleSellInvestmentClose}
        ></SaleModal>
      )}
        Sell</button>
      </div>
      <button className="remove" onClick={() => {
        setShowRemoveInvestment(true);
        }}>
        {showRemoveInvestment && (
          <RemoveModal
          investment={investment} 
          endpoint={baseURL + "/investments"}
          onClose={handleRemoveInvestmentClose}
          ></RemoveModal>
        )}
        Remove</button>
    </>
  );
}
