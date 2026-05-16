import { useState, React } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./popup_styles.css";

function NewDividendModal({ props, endpoint, onClose }) {
  const [symbol, setSymbol] = useState(props?.value ?? "");
  const [date, setDate] = useState(props?.value ?? "");
  const [amount, setAmount] = useState(props?.value ?? "");

  const HandleClose = () => {
    onClose();
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal new_investment_modal">
        <h2 className="popup_heading">New Dividend Payment</h2>
        <p>
          Record dividends paid for shares that aren't re-invested.
        </p>
        <table className="popup_modal_table">
          <tbody>
            <tr>
              <td className="popup_modal_table_label">Symbol</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  id={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Date</td>
              <td className="popup_modal_table_input">
              <DatePicker selected={date} onChange={(date) => setDate(date)} />
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Amount</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  id={symbol}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
          <div
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();

              const result = {
                symbol: symbol,
                date: date,
                amount: amount,
              };
              fetch(endpoint, {
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
  );
}

export default NewDividendModal;
