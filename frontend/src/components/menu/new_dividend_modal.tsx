import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./popup_styles.css";

type NewDividendModalProps = {
  endpoint: string;
  onClose: () => void;
};


function NewDividendModal({ endpoint, onClose }: NewDividendModalProps) {
  const [symbol, setSymbol] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState("");

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal new_investment_modal">
        <h2 className="popup_heading">New Dividend Payment</h2>
        <p>
          Record dividends paid for shares that are not re-invested.
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
          <button
            type="button"
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();

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
          </button>
          <button
            type="button"
            className="cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            Cancel
        </button>
      </div>
    </div>
  );
}

export default NewDividendModal;
