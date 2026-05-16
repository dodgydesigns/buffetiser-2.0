import { useState, React } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";

registerLocale('enAU', enAU);

function SaleModal({ investment, constants, endpoint, onClose }) {
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const [currency, setCurrency] = useState();
  const [exchange, setExchange] = useState();
  const [platform, setPlatform] = useState();
  const [units, setUnits] = useState();
  const [pricePerUnit, setPricePerUnit] = useState();
  const [fee, setFee] = useState();
  const [date, setDate] = useState(new Date());
  const endpoint_string = endpoint;

  const HandleClose = () => {
    onClose();
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
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option>Select...</option>
                  {constants["currency"].map((x) => (
                    <option key={x[0]}>{x[0]}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Exchange</td>
              <td className="popup_modal_table_input">
                <select
                  className="popup_modal_table_text"
                  defaultValue={0}
                  onChange={(e) => setExchange(e.target.value)}
                >
                  <option>Select...</option>
                  {constants["exchange"].map((x) => (
                    <option key={x[0]}>{x[0]}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Platform</td>
              <td className="popup_modal_table_input">
                <select
                  className="popup_modal_table_text"
                  defaultValue={0}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option>Select...</option>
                  {constants["platform"].map((x) => (
                    <option key={x[0]}>{x[0]}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Units</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setUnits(e.target.value)}
                ></input>
              </td>
            </tr>
            
            <tr>
              <td className="popup_modal_table_label">Price/Unit</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setPricePerUnit(e.target.value)}
                ></input>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Fee</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  type="number"
                  onChange={(e) => setFee(e.target.value)}
                ></input>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Date</td>
              <td className="popup_modal_table_input">
                <DatePicker locale="enAU" 
                            dateFormat="dd/MM/yyyy" 
                            selected={date} 
                            onChange={(e) => setDate(e)} />
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <div
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();

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
        </div>
        <div
            className="cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();
            }}
          >
            Cancel
        </div>
      </div>
    </div>
  </div>);
}

export default SaleModal;
