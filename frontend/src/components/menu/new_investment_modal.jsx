import { useState, React } from "react";
import "./popup_styles.css";

function NewInvestmentModal({ props, endpoint, onClose }) {
  const [symbol, setSymbol] = useState(props?.value ?? "");
  const [name, setName] = useState(props?.value ?? "");

  const HandleClose = () => {
    onClose();
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal new_investment_modal">
        <h2 className="popup_heading">New Investment Purchase</h2>
        <p>
          If you need to add a new investment to your portfolio, use this
          dialog. It will incorporate a new investment and purchase (of 0) and
          add to the investment list.
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
              <td className="popup_modal_table_label">Name</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  id={name}
                  onChange={(e) => setName(e.target.value)}
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
                name: name,
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

export default NewInvestmentModal;
