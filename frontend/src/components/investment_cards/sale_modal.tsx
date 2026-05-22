import { useState } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';
import {
  getConstantOptionValue,
  normaliseModalConstants,
  type Investment,
  type InvestmentModalConstants,
} from "./types";

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";

registerLocale('enAU', enAU);

type SaleModalProps = {
  investment: Pick<Investment, "symbol" | "name">;
  constants?: InvestmentModalConstants;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function SaleModal({ investment, constants, endpoint, onClose }: SaleModalProps) {
  const modalConstants = normaliseModalConstants(constants);
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const [currency, setCurrency] = useState("");
  const [exchange, setExchange] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [units, setUnits] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [date, setDate] = useState(new Date());
  const endpoint_string = endpoint;

  const handleClose = (saved: boolean) => {
    onClose(saved);
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal sale_modal">
        <h2 className="popup_heading">New Sale</h2>
        <p>
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
                <DatePicker locale="enAU" 
                            dateFormat="dd/MM/yyyy" 
                            selected={date} 
                            onChange={(e: Date | null) => e && setDate(e)} />
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
              handleClose(true);

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
              handleClose(false);
            }}
          >
            Cancel
        </button>
      </div>
    </div>
  </div>);
}

export default SaleModal;
