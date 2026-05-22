import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";
import {
  getConstantOptionValue,
  normaliseModalConstants,
  type Investment,
  type InvestmentModalConstants,
} from "./types";

registerLocale('enAU', enAU);

type PurchaseModalProps = {
  className?: string;
  investment: Pick<Investment, "symbol" | "name">;
  constants?: InvestmentModalConstants;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function PurchaseModal({ investment, constants, endpoint, onClose }: PurchaseModalProps) {
  const modalConstants = normaliseModalConstants(constants);
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const [currency, setCurrency] = useState("");
  const [exchange, setExchange] = useState("");
  const [platform, setPlatform] = useState("");
  const [units, setUnits] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState(new Date());
  const endpoint_string = endpoint;

  const handleClose = (button: "ok" | "cancel") => {
    if (button === "ok") {
      onClose(true);
      return;
    }
    onClose(false);
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal purchase_modal">
        <h2 className="popup_heading">New Purchase</h2>
        <p>
          If you have purchased shares in an existing investment, use this dialog
          to add the details of the purchase to your portfolio.
        </p>
        <table className="popup_modal_table">
          <tbody>
            <tr>
              <td className="popup_modal_table_label">Symbol</td>
              <td className="popup_modal_table_value_label">
                <label
                  className="popup_modal_table_text"
                  id={symbol}
                >{symbol}</label>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Name</td>
              <td className="popup_modal_table_value_label">
                <label
                >{name}</label>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Currency</td>
              <td className="popup_modal_table_input">
                <select
                  className="popup_modal_table_text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="">Select...</option>
                  {modalConstants.currency.map((x) => {
                    const value = getConstantOptionValue(x);
                    return <option key={value} value={value}>{value}</option>;
                  })}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Exchange</td>
              <td className="popup_modal_table_input">
                <select
                  className="popup_modal_table_text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                >
                  <option value="">Select...</option>
                  {modalConstants.exchange.map((x) => {
                    const value = getConstantOptionValue(x);
                    return <option key={value} value={value}>{value}</option>;
                  })}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Platform</td>
              <td className="popup_modal_table_input">
                <select
                  className="popup_modal_table_text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="">Select...</option>
                  {modalConstants.platform.map((x) => {
                    const value = getConstantOptionValue(x);
                    return <option key={value} value={value}>{value}</option>;
                  })}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Units</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
                ></input>
              </td>
            </tr>
            
            <tr>
              <td className="popup_modal_table_label">Price/Unit</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                ></input>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Fee</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
                ></input>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Date</td>
              <td className="popup_modal_table_input">
                <DatePicker
                  locale="enAU"
                  dateFormat="dd/MM/yyyy"
                  selected={date}
                  onChange={(d: Date | null) => d && setDate(d)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <button
            type="button"
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              handleClose("ok");

              const result = {
                symbol: symbol,
                currency: currency,
                exchange: exchange,
                platform: platform,
                units: units,
                pricePerUnit: pricePerUnit,
                fee: fee,
                date: date,
              };
              fetch(endpoint_string, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(result),
              });
              console.log(JSON.stringify(result));
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose("cancel");
            }}
          >
            Cancel
          </button>
      </div>
    </div>
  </div>);
}

export default PurchaseModal;
